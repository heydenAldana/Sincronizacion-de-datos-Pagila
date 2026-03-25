import { pgPool, mysqlPool } from '../config/db';
import { mapping } from '../config/mapping';
import { syncInOrder } from '../utils/order';
import { logInfo, logError } from '../utils/logger';

export async function syncIn() {
    logInfo('Starting Sync-IN');
    const connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of syncInOrder) {
            const map = mapping.tables[table];
            if (!map) {
                logInfo(`No mapping for table ${table}, skipping`);
                continue;
            }

            const postgresFields = map.postgres_fields.join(', ');
            const { rows } = await pgPool.query(`SELECT ${postgresFields} FROM ${table}`);

            if (rows.length === 0) continue;

            const mysqlFields = map.mysql_fields.join(', ');
            const placeholders = map.mysql_fields.map(() => '?').join(', ');
            const updateClause = map.mysql_fields
                .map(field => `${field} = VALUES(${field})`)
                .join(', ');

            const query = `INSERT INTO ${table} (${mysqlFields}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;

            for (const row of rows) {
                const values = map.mysql_fields.map(field => row[field]);
                await connection.query(query, values);
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();
        logInfo('Sync-IN completed successfully');
    } catch (error: any) {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.rollback();
        logError(`Sync-IN failed: ${error.message}`);
        throw error;
    } finally {
        connection.release();
    }
}