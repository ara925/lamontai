import express from 'express';
import {
  getSubscriptions,
  getSubscription,
  getUserSubscription,
  subscribe,
  cancelSubscription
} from '../controllers/subscriptionController';
import { authenticate } from '../utils/auth';

const router = express.Router();

// Public routes
router.get('/', getSubscriptions);
router.get('/:id', getSubscription);

// Protected routes
router.get('/me', authenticate, getUserSubscription);
router.post('/:id/subscribe', authenticate, subscribe);
router.put('/cancel', authenticate, cancelSubscription);

export default router; 