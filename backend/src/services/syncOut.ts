import { pgPool } from "../db/postgres";
import { mysqlPool } from "../db/mysql";
import mapping from "../config/mapping.json";
import { SyncResult } from "./syncIn";

export async function runSyncOut(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const conn = await mysqlPool.getConnection();
    try {
        for (const tableMap of mapping.out_tables) {
            const result: SyncResult = {
                table: tableMap.slave_table,
                inserted: 0,
                updated: 0,
                errors: [],
            };
            try {
                // Lee los registros pendientes del log
                const [logRows] = await conn.query(
                    `SELECT * FROM ${tableMap.log_table} WHERE synced = 0 ORDER BY log_id ASC`
                ) as any[];
                if (!logRows.length) {
                    results.push(result);
                    continue;
                }
                const pgClient = await pgPool.connect();
                try {
                    await pgClient.query("BEGIN");
                    for (const logRow of logRows) {
                        const { operation, log_id } = logRow;
                        if (operation === "INSERT" || operation === "UPDATE") {
                            const cols = tableMap.fields.join(", ");
                            const placeholders = tableMap.fields
                                .map((_, i) => `$${i + 1}`)
                                .join(", ");
                            const values = tableMap.fields.map(f => logRow[f] ?? null);
                            const pks = [tableMap.pk as string];
                            const conflictCols = pks.join(", ");
                            const updateSet = tableMap.fields
                                .filter(f => !pks.includes(f))
                                .map(f => `${f} = EXCLUDED.${f}`)
                                .join(", ");
                            const sql = `
                                INSERT INTO ${tableMap.master_table} (${cols})
                                VALUES (${placeholders})
                                ON CONFLICT (${conflictCols}) DO UPDATE SET ${updateSet}
                            `;
                            try {
                                await pgClient.query(sql, values);
                                if (operation === "INSERT") result.inserted++;
                                else result.updated++;
                            } catch (rowErr: any) {
                                result.errors.push(`Log #${log_id} ${operation}: ${rowErr.message}`);
                            }

                        } else if (operation === "DELETE") {
                            const pkVal = logRow[tableMap.pk as string];
                            try {
                                await pgClient.query(
                                    `DELETE FROM ${tableMap.master_table} WHERE ${tableMap.pk} = $1`,
                                    [pkVal]
                                );
                            } catch (delErr: any) {
                                result.errors.push(`Log #${log_id} DELETE: ${delErr.message}`);
                            }
                        }
                    }
                    await pgClient.query("COMMIT");
                    // limpia los logs procesados sin errores
                    if (result.errors.length === 0) {
                        const logIds = logRows.map((r: any) => r.log_id).join(",");
                        await conn.query(
                            `DELETE FROM ${tableMap.log_table} WHERE log_id IN (${logIds})`
                        );
                    } else {
                        // Marcar como sincronizados los que no fallaron
                        const logIds = logRows.map((r: any) => r.log_id).join(",");
                        await conn.query(
                            `UPDATE ${tableMap.log_table} SET synced = 1 WHERE log_id IN (${logIds})`
                        );
                    }

                } catch (pgErr: any) {
                    await pgClient.query("ROLLBACK");
                    result.errors.push(`Transaccion PostgreSQL: ${pgErr.message}`);
                } finally {
                    pgClient.release();
                }
            } catch (tableErr: any) {
                result.errors.push(`Error en tabla: ${tableErr.message}`);
            }
            results.push(result);
        }
    } finally {
        conn.release();
    }
    return results;
}