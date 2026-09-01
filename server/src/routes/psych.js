import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendMessage,
  getLatestSession,
  logMood,
  getMoodHistory,
  addJournalEntry,
  addGoal
} from '../controllers/psychController.js';

const router = express.Router();

router.post('/session', protect, sendMessage);
router.get('/session/latest', protect, getLatestSession);
router.post('/mood', protect, logMood);
router.get('/mood/history', protect, getMoodHistory);
router.post('/journal', protect, addJournalEntry);
router.post('/goal', protect, addGoal);

export default router;
