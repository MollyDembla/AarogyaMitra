import express from 'express';
import { evaluateWellness, getLatestWellness } from '../controllers/wellnessController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/evaluate', evaluateWellness);
router.get('/latest', getLatestWellness);

export default router;
