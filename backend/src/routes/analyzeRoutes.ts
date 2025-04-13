import express from 'express';
import { analyzeContentSEO } from '../controllers/generationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Content analysis routes
router.post('/', analyzeContentSEO);

export default router; 