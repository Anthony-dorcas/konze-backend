import express from 'express';
// import cors from 'cors';
import { config } from './config/config.js';
import { connectDB } from './config/database.js';
import {
  securityMiddleware,
  configureCors,
  limiter,
  requestLogger,
  responseTime,
} from './middleware/security.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import cookieParser from 'cookie-parser';
import compression from 'compression';

// Import routes
import authRoutes from './routes/auth.routes.js';
import investmentRoutes from './routes/investment.routes.js';
import serviceRoutes from './routes/service.routes.js';
import contactRoutes from './routes/contact.routes.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Apply middleware

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(configureCors);
app.use(requestLogger);
app.use(responseTime);

// Apply security middleware
securityMiddleware.forEach(middleware => app.use(middleware));

// Apply rate limiting to API routes
app.use('/api/', limiter);


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
  console.log(`📡 API URL: ${config.baseUrl}`);
  console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;