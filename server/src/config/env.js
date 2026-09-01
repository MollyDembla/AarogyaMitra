import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Always resolve to the monorepo root .env (3 levels up from server/src/config/)
const ROOT_ENV = path.resolve(__dirname, '..', '..', '..', '.env');
const result = dotenv.config({ path: ROOT_ENV });

// Fallback: try cwd-relative .env (works when server is started from root via npm workspaces)
if (result.error) {
  dotenv.config();
}

const getEnv = (key, defaultValue = '') => process.env[key] || defaultValue;

export const env = {
  PORT:          parseInt(getEnv('PORT', '5000'), 10),
  MONGODB_URI:   getEnv('MONGODB_URI', 'mongodb://localhost:27017/aarogya_mitra'),
  JWT_SECRET:    getEnv('JWT_SECRET', 'aarogyamitra_default_jwt_secret_key_12345'),
  JWT_EXPIRES_IN:getEnv('JWT_EXPIRES_IN', '7d'),
  CLIENT_URL:    getEnv('CLIENT_URL', 'http://localhost:5173'),
  ML_SERVICE_URL:getEnv('ML_SERVICE_URL', 'http://localhost:8000'),
  GEMINI_API_KEY:getEnv('GEMINI_API_KEY', ''),
};
