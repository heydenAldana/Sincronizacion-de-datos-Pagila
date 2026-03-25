import { pgPool, mysqlPool } from '../config/db';
import { mapping } from '../config/mapping';
import { logInfo, logError } from '../utils/logger';

const OUT_TABLES = ['customer', 'rental', 'payment'];

export async function syncOut() {
  logInfo('Starting Sync-OUT');

  for (const table of OUT_TABLES) {
    const logTable = `${table}_log`;
    const map = mapping.tables[table];
    if (!map) {
      logInfo(`No mapping for table ${table}, skipping`);
      continue;
    }

    const [rows] = await mysqlPool.query(`SELECT * FROM ${logTable} WHERE synced = 0 ORDER BY log_id`);

    for (const logRow of rows as any[]) {
      const operation = logRow.operation;
      const data: any = {};

      for (let i = 0; i < map.mysql_fields.length; i++) {
        const mysqlField = map.mysql_fields[i];
        const postgresField = map.postgres_fields[i];
        data[postgresField] = logRow[mysqlField];
      }

      try {
        if (operation === 'INSERT') {
          const fields = Object.keys(data).join(', ');
          const values = Object.values(data);
          const placeholders = values.map(() => '?').join(', ');
          const query = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`;
          await pgPool.query(query, values);
        } else if (operation === 'UPDATE') {
          const pkField = map.postgres_fields[0];
          const pkValue = data[pkField];
          delete data[pkField];
          const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
          const values = Object.values(data);
          values.push(pkValue);
          const query = `UPDATE ${table} SET ${setClause} WHERE ${pkField} = ?`;
          await pgPool.query(query, values);
        } else if (operation === 'DELETE') {
          const pkField = map.postgres_fields[0];
          const pkValue = data[pkField];
          const query = `DELETE FROM ${table} WHERE ${pkField} = ?`;
          await pgPool.query(query, [pkValue]);
        }

        await mysqlPool.query(`UPDATE ${logTable} SET synced = 1 WHERE log_id = ?`, [logRow.log_id]);
        logInfo(`Sync-OUT: ${operation} on ${table} with id ${logRow[map.mysql_fields[0]]} succeeded`);
      } catch (error: any) {
        logError(`Sync-OUT failed for ${table} log_id ${logRow.log_id}: ${error.message}`);
      }
    }
  }

  logInfo('Sync-OUT completed');
}