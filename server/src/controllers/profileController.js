import UserProfile from '../models/UserProfile.js';
import User from '../models/User.js';
import { apiResponse } from '../utils/apiResponse.js';

export const getProfile = async (req, res, next) => {
  try {
    let profile = await UserProfile.findOne({ user: req.user.id }).populate('user', 'firstName lastName email');
    if (!profile) {
      profile = await UserProfile.create({ user: req.user.id });
    }
    return apiResponse.success(res, 'Profile retrieved', profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { age, gender, height, weight, education, occupation, workPattern } = req.body;
    
    let profile = await UserProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new UserProfile({ user: req.user.id });
    }

    if (age !== undefined) profile.age = age;
    if (gender !== undefined) profile.gender = gender;
    if (height !== undefined) profile.height = height;
    if (weight !== undefined) profile.weight = weight;
    if (education !== undefined) profile.education = education;
    if (occupation !== undefined) profile.occupation = occupation;
    if (workPattern !== undefined) profile.workPattern = workPattern;

    await profile.save();
    return apiResponse.success(res, 'Profile updated successfully', profile);
  } catch (error) {
    next(error);
  }
};
