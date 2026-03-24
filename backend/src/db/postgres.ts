import { Pool } from "pg";

export const pgPool = new Pool({
    host: process.env.PG_HOST || "localhost",
    port: 5432,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DB,
    max: 10,
    idleTimeoutMillis: 30000,
});

pgPool.on("error", (err) => {
    console.error("[BD PostgreSQL] Error Inesperado:", err.message);
});

export async function testPgConnection(): Promise<boolean> {
    try {
        const client = await pgPool.connect();
        await client.query("SELECT 1");
        client.release();
        return true;
    } catch {
        return false;
    }
}