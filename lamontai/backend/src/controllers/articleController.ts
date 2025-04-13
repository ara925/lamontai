import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/errorHandler';
import Article from '../models/Article';
import User from '../models/User';
import Subscription from '../models/Subscription';
import UserSubscription from '../models/UserSubscription';
import { Op } from 'sequelize';

/**
 * @desc    Get all articles for current user
 * @route   GET /api/articles
 * @access  Private
 */
export const getArticles = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;
  const status = req.query.status as string;
  
  // Build query conditions
  const conditions: any = {
    authorId: req.user.id
  };
  
  // Add status filter if provided
  if (status && ['draft', 'published', 'archived'].includes(status)) {
    conditions.status = status;
  }
  
  // Add search filter if provided
  if (search) {
    conditions[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } },
      { keywords: { [Op.contains]: [search] } }
    ];
  }
  
  // Get articles with pagination
  const { count, rows: articles } = await Article.findAndCountAll({
    where: conditions,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
  
  // Calculate pagination info
  const totalPages = Math.ceil(count / limit);
  
  res.json({
    success: true,
    count,
    data: articles,
    pagination: {
      page,
      limit,
      totalPages,
      hasMore: page < totalPages
    }
  });
});

/**
 * @desc    Get single article
 * @route   GET /api/articles/:id
 * @access  Private
 */
export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await Article.findOne({
    where: {
      id: req.params.id,
      authorId: req.user.id
    }
  });
  
  if (!article) {
    throw new ApiError(404, 'Article not found');
  }
  
  res.json({
    success: true,
    data: article
  });
});

/**
 * @desc    Create new article
 * @route   POST /api/articles
 * @access  Private
 */
export const createArticle = asyncHandler(async (req: Request, res: Response) => {
  // Count user's articles this month
  const articlesThisMonth = await Article.count({
    where: {
      authorId: req.user.id,
      createdAt: {
        [Op.gte]: new Date(new Date().setDate(1)) // First day of current month
      }
    }
  });
  
  // Get user's active subscription
  const activeSubscription = await UserSubscription.findOne({
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
  }) as (UserSubscription & { subscription: Subscription }) | null;
  
  // Check if user has reached their limit
  if (activeSubscription && 
      activeSubscription.subscription?.articleLimit > 0 && 
      articlesThisMonth >= activeSubscription.subscription.articleLimit) {
    throw new ApiError(403, 'You have reached your monthly article limit. Please upgrade your plan.');
  }
  
  // Create article
  const article = await Article.create({
    ...req.body,
    authorId: req.user.id,
    status: req.body.status || 'draft'
  });
  
  // Update article count in user subscription
  if (activeSubscription) {
    activeSubscription.articlesGenerated += 1;
    await activeSubscription.save();
  }
  
  res.status(201).json({
    success: true,
    data: article
  });
});

/**
 * @desc    Update article
 * @route   PUT /api/articles/:id
 * @access  Private
 */
export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await Article.findOne({
    where: {
      id: req.params.id,
      authorId: req.user.id
    }
  });
  
  if (!article) {
    throw new ApiError(404, 'Article not found');
  }
  
  // Update fields
  const allowedFields = ['title', 'content', 'summary', 'keywords', 'metaTitle', 'metaDescription', 'status'] as const;
  type AllowedField = typeof allowedFields[number];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      (article as any)[field] = req.body[field];
    }
  });
  
  // Update publishedAt if status is changed to published
  if (req.body.status === 'published' && article.status !== 'published') {
    article.publishedAt = new Date();
  }
  
  await article.save();
  
  res.json({
    success: true,
    data: article
  });
});

/**
 * @desc    Delete article
 * @route   DELETE /api/articles/:id
 * @access  Private
 */
export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await Article.findOne({
    where: {
      id: req.params.id,
      authorId: req.user.id
    }
  });
  
  if (!article) {
    throw new ApiError(404, 'Article not found');
  }
  
  await article.destroy();
  
  res.json({
    success: true,
    data: {}
  });
}); 