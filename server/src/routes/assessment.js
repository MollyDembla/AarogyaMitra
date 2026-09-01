import express from 'express';
import { 
  startAssessment, 
  submitPersonalInfo, 
  submitPsychometric, 
  submitLifestyle, 
  submitMedical, 
  getAssessment, 
  getAssessmentHistory 
} from '../controllers/assessmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/start', startAssessment);
router.get('/history', getAssessmentHistory);

router.put('/:id/personal-info', submitPersonalInfo);
router.put('/:id/psychometric', submitPsychometric);
router.put('/:id/lifestyle', submitLifestyle);
router.put('/:id/medical', submitMedical);

router.get('/:id', getAssessment);

export default router;
