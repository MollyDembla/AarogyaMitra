import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { apiResponse } from '../utils/apiResponse.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return apiResponse.error(res, 'User already exists with this email', null, 400);
    }

    const user = await User.create({ email, password, firstName, lastName });
    
    // Auto-create empty profile
    await UserProfile.create({ user: user._id });

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });

    return apiResponse.success(res, 'Registration successful', {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return apiResponse.error(res, 'Invalid credentials', null, 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return apiResponse.error(res, 'Invalid credentials', null, 401);
    }

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });

    return apiResponse.success(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const profile = await UserProfile.findOne({ user: req.user.id });
    return apiResponse.success(res, 'User details retrieved', { user, profile });
  } catch (error) {
    next(error);
  }
};
