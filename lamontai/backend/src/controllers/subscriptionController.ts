import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/errorHandler';
import Subscription from '../models/Subscription';
import UserSubscription from '../models/UserSubscription';
import { Op } from 'sequelize';

/**
 * @desc    Get all available subscription plans
 * @route   GET /api/subscriptions
 * @access  Public
 */
export const getSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const subscriptions = await Subscription.findAll({
    where: { isActive: true },
    order: [['price', 'ASC']]
  });

  res.json({
    success: true,
    data: subscriptions
  });
});

/**
 * @desc    Get single subscription plan
 * @route   GET /api/subscriptions/:id
 * @access  Public
 */
export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
  const subscription = await Subscription.findByPk(req.params.id);

  if (!subscription) {
    throw new ApiError(404, 'Subscription plan not found');
  }

  res.json({
    success: true,
    data: subscription
  });
});

/**
 * @desc    Get current user's subscription
 * @route   GET /api/subscriptions/me
 * @access  Private
 */
export const getUserSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userSubscription = await UserSubscription.findOne({
    where: {
      userId: req.user.id,
      status: 'active',
      endDate: {
        [Op.gte]: new Date()
      }
    },
    include: [{
      model: Subscription,
      as: 'subscription'
    }]
  });

  if (!userSubscription) {
    return res.json({
      success: true,
      data: null,
      message: 'No active subscription found'
    });
  }

  res.json({
    success: true,
    data: userSubscription
  });
});

/**
 * @desc    Subscribe to a plan
 * @route   POST /api/subscriptions/:id/subscribe
 * @access  Private
 */
export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const { paymentMethod, billingCycle } = req.body;
  const subscriptionId = req.params.id;

  // Check if subscription plan exists
  const subscription = await Subscription.findByPk(subscriptionId);

  if (!subscription || !subscription.isActive) {
    throw new ApiError(404, 'Subscription plan not found or inactive');
  }

  // Check if user already has an active subscription
  const existingSubscription = await UserSubscription.findOne({
    where: {
      userId: req.user.id,
      status: 'active',
      endDate: {
        [Op.gte]: new Date()
      }
    }
  });

  if (existingSubscription) {
    throw new ApiError(400, 'You already have an active subscription. Please cancel it first.');
  }

  // Calculate end date based on billing cycle
  const startDate = new Date();
  const endDate = new Date();
  
  if (billingCycle === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // Create user subscription
  const userSubscription = await UserSubscription.create({
    userId: req.user.id,
    subscriptionId: subscription.id,
    startDate,
    endDate,
    status: 'active',
    paymentStatus: 'paid', // This should be updated based on actual payment processing
    paymentMethod: paymentMethod || 'credit_card',
    paymentId: `payment_${Date.now()}`, // This should be updated with actual payment ID from payment processor
    autoRenew: true,
    articlesGenerated: 0,
    nextBillingDate: endDate
  });

  res.status(201).json({
    success: true,
    data: userSubscription,
    message: 'Successfully subscribed to plan'
  });
});

/**
 * @desc    Cancel subscription
 * @route   PUT /api/subscriptions/cancel
 * @access  Private
 */
export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userSubscription = await UserSubscription.findOne({
    where: {
      userId: req.user.id,
      status: 'active'
    }
  });

  if (!userSubscription) {
    throw new ApiError(404, 'No active subscription found');
  }

  userSubscription.status = 'canceled';
  userSubscription.autoRenew = false;
  await userSubscription.save();

  res.json({
    success: true,
    data: userSubscription,
    message: 'Subscription canceled successfully'
  });
}); 