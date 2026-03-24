import { pgPool } from "../db/postgres";
import { mysqlPool } from "../db/mysql";
import mapping from "../config/mapping.json";

export interface SyncResult {
    table: string;
    inserted: number;
    updated: number;
    errors: string[];
}

export async function runSyncIn(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const orderedTables = [
        "language", "country", "city", "address",
        "actor", "category", "film", "film_actor",
        "film_category", "store", "staff", "inventory"
    ];
    const conn = await mysqlPool.getConnection();
    try {
        for (const tableName of orderedTables) {
            const tableMap = mapping.in_tables.find(t => t.master_table === tableName);
            if (!tableMap) continue;
            const result: SyncResult = { table: tableName, inserted: 0, updated: 0, errors: [] };
            try {
                // Obtiene registros del MASTER
                const fieldsClause = tableMap.fields
                    .map(f => {
                        // Convierte array de PostgreSQL a JSON string
                        if (tableMap.transform && (tableMap.transform as Record<string, string>)[f] === "array_to_json")
                            return `array_to_json(${f}::text[]) as ${f}`;
                        return f;
                    })
                    .join(", ");
                const pgResult = await pgPool.query(
                    `SELECT ${fieldsClause} FROM ${tableMap.master_table}`
                );
                if (pgResult.rows.length === 0) {
                    results.push(result);
                    continue;
                }
                await conn.beginTransaction();
                for (const row of pgResult.rows) {
                    const cols = tableMap.fields.join(", ");
                    const placeholders = tableMap.fields.map(() => "?").join(", ");
                    // Construye los valores en el orden de fields
                    const values = tableMap.fields.map(f => {
                        const val = row[f];
                        // Serializa los arrays/objetos como JSON string para MySQL
                        if (val !== null && typeof val === "object" && !Buffer.isBuffer(val))
                            return JSON.stringify(val);
                        return val ?? null;
                    });
                    // Construye el UPDATE SET clause excluyendo la PK
                    const pks = Array.isArray(tableMap.pk) ? tableMap.pk : [tableMap.pk];
                    const updateFields = tableMap.fields
                        .filter(f => !pks.includes(f))
                        .map(f => `${f} = VALUES(${f})`)
                        .join(", ");
                    const sql = `
                            INSERT INTO ${tableMap.slave_table} (${cols})
                            VALUES (${placeholders})
                            ON DUPLICATE KEY UPDATE ${updateFields}
                        `;
                    try {
                        const [res] = await conn.execute(sql, values) as any[];
                        if (res.affectedRows === 1) result.inserted++;
                        else if (res.affectedRows === 2) result.updated++;
                    } catch (rowErr: any) {
                        result.errors.push(`Row PK ${JSON.stringify(pks.map(pk => row[pk]))}: ${rowErr.message}`);
                    }
                }
                await conn.commit();
            } catch (tableErr: any) {
                await conn.rollback();
                result.errors.push(`Table error: ${tableErr.message}`);
            }
            results.push(result);
        }
    } finally {
        conn.release();
    }
    return results;
}