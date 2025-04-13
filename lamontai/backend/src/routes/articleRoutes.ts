import express from 'express';
import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
} from '../controllers/articleController';
import { authenticate } from '../utils/auth';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.route('/')
  .get(getArticles)
  .post(createArticle);

router.route('/:id')
  .get(getArticle)
  .put(updateArticle)
  .delete(deleteArticle);

export default router; 