import { Router } from 'express';
import { getUserSettings, upsertUserSettings } from '../controllers/userSettings.controller.js';

const router = Router();

router.get('/:userId', getUserSettings);
router.post('/:userId', upsertUserSettings);

export default router;
