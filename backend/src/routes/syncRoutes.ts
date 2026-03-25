import { Router } from 'express';
import { runSyncIn, runSyncOut, getLogs } from '../controllers/syncController';

const router = Router();

router.post('/in', runSyncIn);
router.post('/out', runSyncOut);
router.get('/logs', getLogs);

export default router;