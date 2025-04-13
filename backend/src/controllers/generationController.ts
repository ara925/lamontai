import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorMiddleware';
import User from '../models/userModel';
import {
  generateArticle,
  researchKeywords,
  analyzeContent,
} from '../services/openaiService';

// @desc    Generate an article
// @route   POST /api/generate/article
// @access  Private
export const generateArticleContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { topic, keywords, options } = req.body;

    // Validate inputs
    if (!topic || !keywords || !Array.isArray(keywords)) {
      return next(
        new ApiError('Please provide a topic and an array of keywords', 400)
      );
    }

    // Get user from database to check credits
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Check if user has enough credits
    if (user.credits <= 0) {
      return next(
        new ApiError('You do not have enough credits to generate content', 403)
      );
    }

    // Check for article generation limit based on plan
    const planLimits: { [key: string]: number } = {
      free: 5,
      starter: 25,
      professional: 100,
      enterprise: 9999,
    };

    const plan = user.plan as keyof typeof planLimits;
    const limit = planLimits[plan] || 5;

    if (user.articlesGenerated >= limit) {
      return next(
        new ApiError(
          `You have reached your limit of ${limit} articles for your ${plan} plan`,
          403
        )
      );
    }

    // Generate the article
    const article = await generateArticle(
      topic,
      keywords,
      options as {
        tone?: string;
        length?: 'short' | 'medium' | 'long';
        style?: string;
      }
    );

    // Update user credits and article count
    user.credits -= 1;
    user.articlesGenerated += 1;
    await user.save();

    res.status(200).json({
      success: true,
      data: article,
      credits: user.credits,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Research keywords
// @route   POST /api/generate/keywords
// @access  Private
export const researchKeywordsForTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query, options } = req.body;

    // Validate inputs
    if (!query) {
      return next(new ApiError('Please provide a search query', 400));
    }

    // Get user from database to check credits
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Check if user has enough credits
    if (user.credits <= 0) {
      return next(
        new ApiError('You do not have enough credits to research keywords', 403)
      );
    }

    // Generate keywords
    const keywords = await researchKeywords(query, options);

    // Update user credits and keyword count
    user.credits -= 1;
    user.keywordsResearched += 1;
    await user.save();

    res.status(200).json({
      success: true,
      data: keywords,
      credits: user.credits,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze content
// @route   POST /api/generate/analyze
// @access  Private
export const analyzeContentSEO = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content, url, keywords } = req.body;

    // Validate inputs
    if ((!content && !url) || !keywords || !Array.isArray(keywords)) {
      return next(
        new ApiError(
          'Please provide either content or a URL, and an array of keywords',
          400
        )
      );
    }

    // Get user from database to check credits
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Check if user has enough credits
    if (user.credits <= 0) {
      return next(
        new ApiError('You do not have enough credits to analyze content', 403)
      );
    }

    // Analyze the content
    const analysis = await analyzeContent(content, keywords, url);

    // Update user credits
    user.credits -= 1;
    await user.save();

    res.status(200).json({
      success: true,
      data: analysis,
      credits: user.credits,
    });
  } catch (error) {
    next(error);
  }
}; 