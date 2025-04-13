import express from 'express';
import { researchKeywordsForTopic } from '../controllers/generationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Keyword routes
router.post('/', researchKeywordsForTopic);

export default router; 