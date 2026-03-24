import { Router, Request, Response } from "express";
import { pgPool } from "../db/postgres";
import { mysqlPool } from "../db/mysql";

export const statusRouter = Router();

statusRouter.get("/", async (_req: Request, res: Response) => {
    let pgStatus = "deconectado";
    let mysqlStatus = "deconectado";
    let logCounts: Record<string, number> = {};
    try {
        await pgPool.query("SELECT 1");
        pgStatus = "conectado";
    } catch (err: any) {
        console.error("Error de estado de PostgreSQL:", err);
    }
    try {
        const conn = await mysqlPool.getConnection();
        for (const table of ["customer_log", "rental_log", "payment_log"]) {
            const [rows] = await conn.query(
                `SELECT COUNT(*) as cnt FROM ${table} WHERE synced = 0`
            ) as any[];
            logCounts[table] = rows[0].cnt;
        }
        conn.release();
        mysqlStatus = "conectado";
    } catch (err: any) {
        console.error("Error de estado de MySQL:", err);
    }
    res.json({
        postgres: pgStatus,
        mysql: mysqlStatus,
        pending_logs: logCounts,
        timestamp: new Date().toISOString(),
    });
});