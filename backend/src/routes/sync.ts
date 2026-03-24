import { Router, Request, Response } from "express";
import { runSyncIn } from "../services/syncIn";
import { runSyncOut } from "../services/syncOut";

export const syncRouter = Router();

const syncLog: { timestamp: string; type: string; results: any }[] = [];

syncRouter.post("/in", async (_req: Request, res: Response) => {
    try {
        const results = await runSyncIn();
        const entry = { timestamp: new Date().toISOString(), type: "IN", results };
        syncLog.unshift(entry);
        if (syncLog.length > 50) syncLog.pop();
        res.json({ success: true, ...entry });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

syncRouter.post("/out", async (_req: Request, res: Response) => {
    try {
        const results = await runSyncOut();
        const entry = { timestamp: new Date().toISOString(), type: "OUT", results };
        syncLog.unshift(entry);
        if (syncLog.length > 50) syncLog.pop();
        res.json({ success: true, ...entry });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

syncRouter.get("/history", (_req: Request, res: Response) => {
    res.json(syncLog);
});