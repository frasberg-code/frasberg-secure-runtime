// Updated main entry point with all routes
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from 'dotenv';
import { initializeDatabase } from './db/client';
import { initializeTiers } from './services/tiers';
import { errorHandler } from './middleware/errorHandler';
import { createRealTimeUpdates } from './realtime/RealTimeUpdatesManager';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes - import all route modules
import acoRouter from './routes/aco';
import tiersRouter from './routes/tiers';
import billingRouter from './routes/billing';
import docsRouter from './routes/docs';
import partnersRouter from './routes/partners';
import statusRouter from './routes/status';
import federationRouter from './routes/federation';
import onboardingRouter from './routes/onboarding';
import launchRouter from './routes/launch';
import tenantsRouter from './routes/tenants';
import evolutionFiltersRouter from './api/evolution-filters/routes';
import dashboardRouter from './api/dashboard/routes';
import sieRouter from './api/sie/routes';
import alertsRouter from './api/alerts/routes';
import analyticsRouter from './api/analytics/routes';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API v1 routes
app.use('/api/v1/aco', acoRouter);
app.use('/api/v1/tiers', tiersRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/docs', docsRouter);
app.use('/api/v1/partners', partnersRouter);
app.use('/api/v1/status', statusRouter);
app.use('/api/v1/federation', federationRouter);
app.use('/api/v1/onboarding', onboardingRouter);
app.use('/api/v1/launch', launchRouter);
app.use('/api/v1/tenants', tenantsRouter);

// Governance API routes
app.use('/api/v1/evolution/filters', evolutionFiltersRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/sie', sieRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Global error handler
app.use(errorHandler);

// Initialize and start
async function start() {
  try {
    console.log('🔧 Initializing Frasberg Autonomous Cloud...');

    // Initialize database
    await initializeDatabase();

    // Initialize commercial tiers
    await initializeTiers();

    // Create HTTP server for WebSocket support
    const httpServer = createServer(app);

    // Initialize real-time updates
    const realtimeManager = createRealTimeUpdates(httpServer);

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Frasberg Autonomous Cloud API listening on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/api/v1/dashboard`);
      console.log(`📊 SIE: http://localhost:${PORT}/api/v1/sie`);
      console.log(`🚨 Alerts: http://localhost:${PORT}/api/v1/alerts`);
      console.log(`📈 Analytics: http://localhost:${PORT}/api/v1/analytics`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
