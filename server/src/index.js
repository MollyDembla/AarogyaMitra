import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Route imports
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import assessmentRoutes from './routes/assessment.js';
import wellnessRoutes from './routes/wellness.js';
import reasoningRoutes from './routes/reasoning.js';
import journeyRoutes from './routes/journey.js';
import agentsRoutes from './routes/agents.js';
import recoveryRoutes from './routes/recovery.js';
import psychRoutes from './routes/psych.js';
import langgraphRoutes from './routes/langgraph.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Middleware
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routing mappings
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/reports', wellnessRoutes);
app.use('/api/reasoning', reasoningRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/psych', psychRoutes);
app.use('/api/langgraph', langgraphRoutes);
app.use('/api/agentic', langgraphRoutes);
app.use('/api/physical-activity', agentsRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'AarogyaMitra Express Server running successfully.' });
});

// Error handling middleware
app.use(errorHandler);

// Establish database and listen on port
const startServer = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    logger.info(`Express Server running on port ${env.PORT}`);
  });
};

startServer();
