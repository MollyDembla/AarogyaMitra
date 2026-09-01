import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  const primaryUri = env.MONGODB_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/aarogyamitra';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`Primary MongoDB connection failed (${error.message}). Trying fallback local database...`);
    try {
      const conn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000
      });
      logger.info(`Fallback MongoDB Connected: ${conn.connection.host}`);
    } catch (fallbackError) {
      logger.error(`Database Connection Failure (Primary & Fallback): ${fallbackError.message}`);
      // Do not exit process immediately so server stays up and returns informative errors
    }
  }
};
