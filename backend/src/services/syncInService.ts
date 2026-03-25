import { pgPool, mysqlPool } from '../config/db';
import { mapping } from '../config/mapping';
import { syncInOrder } from '../utils/order';
import { logInfo, logError } from '../utils/logger';

export async function syncIn() {
    logInfo('Starting Sync-IN');
    const connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    try {
        for (const table of syncInOrder) {
            const map = mapping.tables[table];
            if (!map) {
                logInfo(`No mapping for table ${table}, skipping`);
                continue;
            }

            // Obtener datos de PostgreSQL
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
                // Mapear valores según el orden de los campos MySQL
                const values = map.mysql_fields.map(field => {
                    let val = row[field];
                    // Convertir tipos si es necesario
                    if (field === 'activebool' && table === 'customer') {
                        val = val === true ? 1 : 0;
                    }
                    return val;
                });
                await connection.query(query, values);
            }
        }

        await connection.commit();
        logInfo('Sync-IN completed successfully');
    } catch (error: any) {
        await connection.rollback();
        logError(`Sync-IN failed: ${error.message}`);
        throw error;
    } finally {
        connection.release();
    }
}