import express from 'express';
import { 
  getArticles, 
  getArticle, 
  createArticle, 
  updateArticle, 
  deleteArticle 
} from '../controllers/articleController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Routes
router.route('/')
  .get(protect, getArticles)
  .post(protect, createArticle);

router.route('/:id')
  .get(protect, getArticle)
  .put(protect, updateArticle)
  .delete(protect, deleteArticle);

export default router; 