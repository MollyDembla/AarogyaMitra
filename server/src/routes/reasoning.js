import express from 'express';
import { getNextAction } from '../controllers/reasoningController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/next-action', getNextAction);

export default router;
