import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Article from '../models/Article';

// @desc    Get all articles
// @route   GET /api/articles
// @access  Private
export const getArticles = asyncHandler(async (req: Request, res: Response) => {
  const articles = await Article.find({ user: req.user._id });
  res.json(articles);
});

// @desc    Get single article
// @route   GET /api/articles/:id
// @access  Private
export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  // Make sure user owns the article
  if (article.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to access this article');
  }

  res.json(article);
});

// @desc    Create new article
// @route   POST /api/articles
// @access  Private
export const createArticle = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, keywords, status } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('Please provide title and content');
  }

  const article = await Article.create({
    user: req.user._id,
    title,
    content,
    keywords: keywords || [],
    status: status || 'draft'
  });

  res.status(201).json(article);
});

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private
export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, keywords, status } = req.body;
  
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  // Make sure user owns the article
  if (article.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this article');
  }

  article.title = title || article.title;
  article.content = content || article.content;
  article.keywords = keywords || article.keywords;
  article.status = status || article.status;
  article.updatedAt = new Date();

  const updatedArticle = await article.save();
  res.json(updatedArticle);
});

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private
export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  // Make sure user owns the article
  if (article.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this article');
  }

  await article.deleteOne();
  res.json({ message: 'Article removed' });
}); 