import mysql from "mysql2/promise";

export const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    port: 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "+00:00",
});

export async function testMysqlConnection(): Promise<boolean> {
    try {
        const conn = await mysqlPool.getConnection();
        await conn.query("SELECT 1");
        conn.release();
        return true;
    } catch {
        return false;
    }
}