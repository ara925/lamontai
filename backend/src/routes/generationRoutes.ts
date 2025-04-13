import express from 'express';
import {
  generateArticleContent,
  researchKeywordsForTopic,
  analyzeContentSEO,
} from '../controllers/generationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Generation routes
router.post('/article', generateArticleContent);
router.post('/keywords', researchKeywordsForTopic);
router.post('/analyze', analyzeContentSEO);

export default router; 