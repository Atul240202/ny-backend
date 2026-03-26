import { Router } from 'express';
import { batchUploadGuardrailLogs } from '../controllers/guardrailLog.controller.js';

const router = Router();

router.post('/batch', batchUploadGuardrailLogs);

export default router;
