import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  if (err.stack) {
    logger.debug(err.stack);
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
