import { Request, Response } from 'express';
import { pgPool } from '../config/db';
import { mapping } from '../config/mapping';

// Obtener todos los registros de una tabla (PostgreSQL)
export const getMasterTable = async (req: Request, res: Response) => {
    const { table } = req.params;
    const map = mapping.tables[table];
    if (!map) {
        return res.status(400).json({ error: `Table ${table} not mapped` });
    }
    try {
        const fields = map.postgres_fields.join(', ');
        const { rows } = await pgPool.query(`SELECT ${fields} FROM ${table} ORDER BY ${map.postgres_fields[0]}`);
        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};