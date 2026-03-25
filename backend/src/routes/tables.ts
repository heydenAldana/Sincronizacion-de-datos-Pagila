import { Router, Request, Response } from "express";
import { pgPool } from "../db/postgres";
import { mysqlPool } from "../db/mysql";
import mapping from "../config/mapping.json";
import { FieldPacket } from "mysql2";

export const tablesRouter = Router();

// --- Helpers

const IN_MASTER = mapping.in_tables.map((t) => t.master_table);
const OUT_MASTER = mapping.out_tables.map((t) => t.master_table);
const IN_SLAVE = mapping.in_tables.map((t) => t.slave_table);
const OUT_SLAVE = mapping.out_tables.map((t) => t.slave_table);

const ALL_MASTER = [...IN_MASTER, ...OUT_MASTER];
const ALL_SLAVE = [...IN_SLAVE, ...OUT_SLAVE];
// solo las tablas OUT en slave permiten CRUD
const CRUD_SLAVE = OUT_SLAVE;

function getPkField(tableName: string): string {
    const inMap = mapping.in_tables.find(
        (t) => t.master_table === tableName || t.slave_table === tableName
    );
    const outMap = mapping.out_tables.find(
        (t) => t.master_table === tableName || t.slave_table === tableName
    );
    const map = inMap || outMap;
    if (!map) return "id";
    return Array.isArray(map.pk) ? map.pk[0] : (map.pk as string);
}

// GET /api/tables/counts: Devuelve conteo de registros de todas las tablas en ambas BDs
tablesRouter.get("/counts", async (_req: Request, res: Response) => {
    const master: Record<string, number> = {};
    const slave: Record<string, number> = {};
    // PostgreSQL
    for (const tbl of ALL_MASTER) {
        try {
            const r = await pgPool.query(
                `SELECT COUNT(*)::int AS cnt FROM ${tbl}`
            );
            master[tbl] = r.rows[0].cnt;
        } catch {
            master[tbl] = -1;
        }
    }
    // MySQL
    const conn = await mysqlPool.getConnection();
    try {
        for (const tbl of ALL_SLAVE) {
            try {
                const [rows] = (await conn.query(
                    `SELECT COUNT(*) AS cnt FROM \`${tbl}\``
                )) as any[];
                slave[tbl] = Number(rows[0].cnt);
            } catch {
                slave[tbl] = -1;
            }
        }
    } finally {
        conn.release();
    }
    res.json({ master, slave });
});

// GET /api/tables/:table/rows
tablesRouter.get("/:table/rows", async (req: Request, res: Response) => {
    const { table } = req.params;
    const db = (req.query.db as string) || "master";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 25);
    const offset = (page - 1) * limit;
    try {
        if (db === "master") {
            if (!ALL_MASTER.includes(table))
                return res.status(400).json({ error: `Tabla '${table}' no permitida en master` });
            const cntRes = await pgPool.query(`SELECT COUNT(*)::int AS cnt FROM ${table}`);
            const total = cntRes.rows[0].cnt as number;
            const dataRes = await pgPool.query(
                `SELECT * FROM ${table} LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return res.json({
                columns: dataRes.fields.map((f) => f.name),
                rows: dataRes.rows,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            });
        } else {
            if (!ALL_SLAVE.includes(table))
                return res.status(400).json({ error: `Tabla '${table}' no permitida en slave` });
            const conn = await mysqlPool.getConnection();
            try {
                const [cntRows] = (await conn.query(
                    `SELECT COUNT(*) AS cnt FROM \`${table}\``
                )) as any[];
                const total = Number(cntRows[0].cnt);
                const [rows, fields] = (await conn.query(
                    `SELECT * FROM \`${table}\` LIMIT ? OFFSET ?`,
                    [limit, offset]
                )) as [any[], FieldPacket[]];
                return res.json({
                    columns: fields.map((f: any) => f.name),
                    rows,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                });
            } finally {
                conn.release();
            }
        }
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/tables/:table/last 
tablesRouter.get("/:table/last", async (req: Request, res: Response) => {
    const { table } = req.params;
    const db = (req.query.db as string) || "slave";
    const pk = getPkField(table);
    try {
        if (db === "master") {
            const r = await pgPool.query(
                `SELECT * FROM ${table} ORDER BY ${pk} DESC LIMIT 1`
            );
            return res.json({ row: r.rows[0] || null, pk });
        } else {
            const conn = await mysqlPool.getConnection();
            try {
                const [rows] = (await conn.query(
                    `SELECT * FROM \`${table}\` ORDER BY ${pk} DESC LIMIT 1`
                )) as any[];
                return res.json({ row: rows[0] || null, pk });
            } finally {
                conn.release();
            }
        }
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/tables/:table
tablesRouter.post("/:table", async (req: Request, res: Response) => {
    const { table } = req.params;
    if (!CRUD_SLAVE.includes(table)) {
        return res.status(403).json({
            error: "INSERT solo permitido en tablas OUT del slave (customer, rental, payment)",
        });
    }
    const body = req.body as Record<string, any>;
    const pk = getPkField(table);
    // Necesito excluir la PK (AUTO_INCREMENT) y campos vacíos
    const keys = Object.keys(body).filter(
        (k) => k !== pk && body[k] !== undefined && body[k] !== ""
    );
    if (keys.length === 0)
        return res.status(400).json({ error: "No se recibieron campos para insertar" });
    const placeholders = keys.map(() => "?").join(", ");
    const values = keys.map((k) => body[k]);
    const conn = await mysqlPool.getConnection();
    try {
        const [result] = (await conn.query(
            `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(", ")}) VALUES (${placeholders})`,
            values
        )) as any[];
        return res.status(201).json({ success: true, insertId: result.insertId });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// PUT /api/tables/:table/:pkVal
tablesRouter.put("/:table/:pkVal", async (req: Request, res: Response) => {
    const { table, pkVal } = req.params;
    if (!CRUD_SLAVE.includes(table))
        return res.status(403).json({ error: "UPDATE solo permitido en tablas OUT del slave" });
    const pk = getPkField(table);
    const body = req.body as Record<string, any>;
    const keys = Object.keys(body).filter(
        (k) => k !== pk && body[k] !== undefined && body[k] !== ""
    );
    if (keys.length === 0)
        return res.status(400).json({ error: "No se recibieron campos para actualizar" });
    const setClause = keys.map((k) => `\`${k}\` = ?`).join(", ");
    const values = [...keys.map((k) => body[k]), pkVal];
    const conn = await mysqlPool.getConnection();
    try {
        await conn.query(
            `UPDATE \`${table}\` SET ${setClause} WHERE \`${pk}\` = ?`,
            values
        );
        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// DELETE /api/tables/:table/:pkVal
tablesRouter.delete("/:table/:pkVal", async (req: Request, res: Response) => {
    const { table, pkVal } = req.params;
    if (!CRUD_SLAVE.includes(table))
        return res.status(403).json({ error: "DELETE solo permitido en tablas OUT del slave" });
    const pk = getPkField(table);
    const conn = await mysqlPool.getConnection();
    try {
        await conn.query(
            `DELETE FROM \`${table}\` WHERE \`${pk}\` = ?`,
            [pkVal]
        );
        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});