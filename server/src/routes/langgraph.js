import express from 'express';
import {
  runGraphSession,
  resumeGraphSession,
  skipGraphSession,
  fetchActiveGraphSession,
  fetchGraphState,
  fetchGraphTimeline,
  fetchGraphTopology
} from '../controllers/langgraphController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Active User Session & Control
router.get('/session/active', fetchActiveGraphSession);
router.post('/start-session', runGraphSession);
router.post('/run', runGraphSession);
router.post('/resume', resumeGraphSession);
router.post('/session/:sessionId/resume', resumeGraphSession);
router.post('/session/:sessionId/skip', skipGraphSession);
router.get('/session/:sessionId', fetchGraphState);
router.get('/session/:sessionId/timeline', fetchGraphTimeline);
router.get('/state/:sessionId', fetchGraphState);
router.get('/timeline/:sessionId', fetchGraphTimeline);
router.get('/topology', fetchGraphTopology);

export default router;
