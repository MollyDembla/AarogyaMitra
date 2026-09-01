import express from 'express';
import { getCurrentJourney, updateJourney } from '../controllers/journeyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/current', getCurrentJourney);
router.post('/update', updateJourney);

export default router;
