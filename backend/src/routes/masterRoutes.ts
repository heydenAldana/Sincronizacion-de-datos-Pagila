import { Router } from 'express';
import { getMasterTable } from '../controllers/masterController';

const router = Router();

router.get('/:table', getMasterTable);

export default router;