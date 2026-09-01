import express from 'express';
import {
  evaluatePhysicalActivity,
  generatePhysicalActivityReport,
  getPhysicalActivityHistory,
  sessionPsychologicalSupport,
  evaluateProfessionalSupport,
  planRecoveryWellness
} from '../controllers/agentsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/physical-activity/evaluate', evaluatePhysicalActivity);
router.post('/physical-activity/report', generatePhysicalActivityReport);
router.get('/physical-activity/history', getPhysicalActivityHistory);
router.post('/psychological-support/session', sessionPsychologicalSupport);
router.post('/professional-support/evaluate', evaluateProfessionalSupport);
router.post('/recovery-wellness/plan', planRecoveryWellness);

export default router;
