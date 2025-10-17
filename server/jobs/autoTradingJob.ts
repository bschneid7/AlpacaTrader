/**
 * Auto Trading Background Job
 * Runs continuously during market hours to execute automated trading
 */

import { tradingEngine } from '../services/tradingEngine.js';
import TradingPreferences from '../models/TradingPreferences.js';
import { connectDB } from '../config/database.js';

interface JobConfig {
  intervalMinutes: number;
  isRunning: boolean;
  intervalId?: NodeJS.Timeout;
}

const jobConfig: JobConfig = {
  intervalMinutes: 5, // Run every 5 minutes
  isRunning: false,
  intervalId: undefined
};

/**
 * Execute trading cycle for all users with auto-trading enabled
 */
async function executeTradingCycle(): Promise<void> {
  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`[Auto Trading Job] Starting trading cycle at ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Find all users with auto-trading enabled
    const activeUsers = await TradingPreferences.find({ autoTradingEnabled: true });

    console.log(`[Auto Trading Job] Found ${activeUsers.length} users with auto-trading enabled`);

    if (activeUsers.length === 0) {
      console.log('[Auto Trading Job] No active users, skipping cycle');
      return;
    }

    // Process each user sequentially to avoid overwhelming the system
    for (const userPrefs of activeUsers) {
      try {
        console.log(`[Auto Trading Job] Processing user: ${userPrefs.userId}`);
        await tradingEngine.processUserTrading(userPrefs.userId.toString());

        // Small delay between users to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[Auto Trading Job] Error processing user ${userPrefs.userId}:`, error);
        // Continue with next user even if one fails
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`[Auto Trading Job] Trading cycle completed at ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('[Auto Trading Job] Error in trading cycle:', error);
  }
}

/**
 * Start the auto trading job
 */
export async function startAutoTradingJob(): Promise<void> {
  try {
    if (jobConfig.isRunning) {
      console.log('[Auto Trading Job] Job is already running');
      return;
    }

    console.log('[Auto Trading Job] Starting auto trading job...');
    console.log(`[Auto Trading Job] Interval: ${jobConfig.intervalMinutes} minutes`);

    // Ensure database is connected
    await connectDB();

    // Execute initial cycle immediately
    await executeTradingCycle();

    // Schedule recurring execution
    const intervalMs = jobConfig.intervalMinutes * 60 * 1000;
    jobConfig.intervalId = setInterval(async () => {
      await executeTradingCycle();
    }, intervalMs);

    jobConfig.isRunning = true;

    console.log('[Auto Trading Job] Auto trading job started successfully');
  } catch (error) {
    console.error('[Auto Trading Job] Failed to start auto trading job:', error);
    throw error;
  }
}

/**
 * Stop the auto trading job
 */
export function stopAutoTradingJob(): void {
  try {
    if (!jobConfig.isRunning || !jobConfig.intervalId) {
      console.log('[Auto Trading Job] Job is not running');
      return;
    }

    console.log('[Auto Trading Job] Stopping auto trading job...');

    clearInterval(jobConfig.intervalId);
    jobConfig.intervalId = undefined;
    jobConfig.isRunning = false;

    console.log('[Auto Trading Job] Auto trading job stopped');
  } catch (error) {
    console.error('[Auto Trading Job] Error stopping auto trading job:', error);
  }
}

/**
 * Get job status
 */
export function getJobStatus(): {
  isRunning: boolean;
  intervalMinutes: number;
} {
  return {
    isRunning: jobConfig.isRunning,
    intervalMinutes: jobConfig.intervalMinutes
  };
}

/**
 * Update job interval (requires restart)
 */
export function setJobInterval(minutes: number): void {
  if (minutes < 1) {
    throw new Error('Interval must be at least 1 minute');
  }

  const wasRunning = jobConfig.isRunning;

  if (wasRunning) {
    stopAutoTradingJob();
  }

  jobConfig.intervalMinutes = minutes;
  console.log(`[Auto Trading Job] Interval updated to ${minutes} minutes`);

  if (wasRunning) {
    startAutoTradingJob();
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Auto Trading Job] SIGTERM received, stopping job...');
  stopAutoTradingJob();
});

process.on('SIGINT', () => {
  console.log('[Auto Trading Job] SIGINT received, stopping job...');
  stopAutoTradingJob();
});

export const autoTradingJob = {
  start: startAutoTradingJob,
  stop: stopAutoTradingJob,
  getStatus: getJobStatus,
  setInterval: setJobInterval,
  executeNow: executeTradingCycle
};
