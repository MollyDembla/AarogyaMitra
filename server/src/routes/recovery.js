import express from 'express';
import {
  getLatestRecoveryProfile,
  submitRecoveryFeedback,
  getRecoveryHistory
} from '../controllers/recoveryProfileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/profile/latest', getLatestRecoveryProfile);
router.post('/feedback', submitRecoveryFeedback);
router.get('/history', getRecoveryHistory);

export default router;
