import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Admin authorization token missing.'
    });
  }

  try {
    const jwtSecret = env.JWT_SECRET || 'aarogyamitra_default_jwt_secret_key_12345';
    const adminEmail = (env.ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@aarogyamitra.com').trim().toLowerCase();
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.role !== 'admin' && (decoded.email || '').trim().toLowerCase() !== adminEmail) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin privileges required.'
      });
    }


    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: 'admin'
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin session token. Please sign in again.'
    });
  }
};
