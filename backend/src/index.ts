import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import outRoutes from './routes/outRoutes';
import syncRoutes from './routes/syncRoutes';
import masterRoutes from './routes/masterRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/out', outRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/master', masterRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});