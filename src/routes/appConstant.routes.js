import express from 'express';
import { getAppConstantStepById } from '../controllers/appConstants.controller.js';

const router = express.Router();

router.get('/app-constants/:type/:stepId', getAppConstantStepById);


export default router;
