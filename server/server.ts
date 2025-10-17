import dotenv from 'dotenv';
import express from 'express';
import { Request, Response } from 'express';
import basicRoutes from './routes/index';
import authRoutes from './routes/authRoutes';
import alpacaRoutes from './routes/alpacaRoutes';
import strategyRoutes from './routes/strategyRoutes';
import riskRoutes from './routes/riskRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import monitoringRoutes from './routes/monitoringRoutes';
import { connectDB } from './config/database';
import { autoTradingJob } from './jobs/autoTradingJob';
import portfolioSyncJob from './jobs/portfolioSyncJob';
import cors from 'cors';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

app.use(cors({}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

app.on("error", (error: Error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Basic Routes
app.use(basicRoutes);
// Authentication Routes
app.use('/api/auth', authRoutes);
// Alpaca Routes
app.use('/api/alpaca', alpacaRoutes);
// Strategy Routes
app.use('/api/strategy', strategyRoutes);
// Risk Management Routes
app.use('/api/risk', riskRoutes);
// Analytics Routes
app.use('/api/analytics', analyticsRoutes);
// Monitoring Routes
app.use('/api/monitoring', monitoringRoutes);

// If no routes handled the request, it's a 404
app.use((req: Request, res: Response) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err: Error, req: Request, res: Response) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);

  // Start auto trading background job
  try {
    console.log('[Server] Starting auto trading background job...');
    await autoTradingJob.start();
    console.log('[Server] Auto trading background job started successfully');
  } catch (error) {
    console.error('[Server] Failed to start auto trading job:', error);
    // Don't exit - server can still run without the trading job
  }

  // Start portfolio sync background job
  try {
    console.log('[Server] Starting portfolio sync background job...');
    portfolioSyncJob.startPortfolioSyncJob();
    console.log('[Server] Portfolio sync background job started successfully');
  } catch (error) {
    console.error('[Server] Failed to start portfolio sync job:', error);
    // Don't exit - server can still run without the portfolio sync job
  }
});