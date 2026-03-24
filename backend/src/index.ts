import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testPgConnection } from "./db/postgres";
import { testMysqlConnection } from "./db/mysql";
import { syncRouter } from "./routes/sync";
import { statusRouter } from "./routes/status";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/sync", syncRouter);
app.use("/api/status", statusRouter);

// Funcion auxiliar para verificar status de la conexion
app.get("/health", async (_req, res) => {
    const pg = await testPgConnection();
    const my = await testMysqlConnection();
    res.json({
        status: pg && my ? "ok" : "degradado",
        postgres: pg ? "conectado" : "error",
        mysql: my ? "conectado" : "error",
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});