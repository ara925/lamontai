import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/errorHandler';
import { generateToken } from '../utils/auth';
import User from '../models/User';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ where: { email } });

  if (userExists) {
    throw new ApiError(400, 'User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: 'user',
    lastLogin: null,
    isActive: true
  });

  if (user) {
    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } else {
    throw new ApiError(400, 'Invalid user data');
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Check if password matches
  const isMatch = await user.verifyPassword(password);

  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Update last login time
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    }
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Update fields
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  
  // Only update password if it's provided
  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    }
  });
}); 