import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { syncIn } from '../services/syncInService';
import { syncOut } from '../services/syncOutService';

export const runSyncIn = async (req: Request, res: Response) => {
    try {
        await syncIn();
        res.json({ success: true, message: 'Sync-IN completed' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const runSyncOut = async (req: Request, res: Response) => {
    try {
        await syncOut();
        res.json({ success: true, message: 'Sync-OUT completed' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getLogs = async (req: Request, res: Response) => {
    const logPath = path.join(__dirname, '../../logs/sync.log');
    try {
        if (fs.existsSync(logPath)) {
            const logs = fs.readFileSync(logPath, 'utf-8');
            res.type('text/plain').send(logs);
        } else {
            res.type('text/plain').send('No logs yet.');
        }
    } catch (error) {
        res.status(500).send('Error reading logs');
    }
};