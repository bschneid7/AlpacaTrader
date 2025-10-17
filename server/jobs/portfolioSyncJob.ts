import TradingPreferences from '../models/TradingPreferences';
import PortfolioService from '../services/portfolioService';

let syncIntervalId: NodeJS.Timeout | null = null;
const SYNC_INTERVAL = 30000; // 30 seconds

/**
 * Sync portfolio data for all active trading users
 */
async function syncPortfoliosForActiveUsers() {
  console.log('[PortfolioSyncJob] Starting portfolio sync for active users...');

  try {
    // Get all users with auto-trading enabled or any active account
    const activePreferences = await TradingPreferences.find({
      autoTradingEnabled: true
    }).select('userId');

    if (activePreferences.length === 0) {
      console.log('[PortfolioSyncJob] No active trading users found');
      return;
    }

    console.log(`[PortfolioSyncJob] Found ${activePreferences.length} active users to sync`);

    // Sync each user's portfolio
    for (const pref of activePreferences) {
      try {
        console.log(`[PortfolioSyncJob] Syncing portfolio for user ${pref.userId}`);

        // Sync positions to database
        await PortfolioService.syncPositionsToDatabase(pref.userId.toString());

        // Record portfolio snapshot
        await PortfolioService.recordPortfolioSnapshot(pref.userId.toString());

        console.log(`[PortfolioSyncJob] Successfully synced portfolio for user ${pref.userId}`);
      } catch (error) {
        if (error instanceof Error) {
          // Don't stop the entire sync if one user fails
          console.error(`[PortfolioSyncJob] Error syncing portfolio for user ${pref.userId}:`, error.message);
        } else {
          console.error(`[PortfolioSyncJob] Unknown error syncing portfolio for user ${pref.userId}`);
        }
      }
    }

    console.log('[PortfolioSyncJob] Portfolio sync completed');
  } catch (error) {
    if (error instanceof Error) {
      console.error('[PortfolioSyncJob] Error in portfolio sync job:', error.message);
      console.error(error.stack);
    } else {
      console.error('[PortfolioSyncJob] Unknown error in portfolio sync job');
    }
  }
}

/**
 * Start the portfolio sync background job
 */
export function startPortfolioSyncJob() {
  if (syncIntervalId) {
    console.log('[PortfolioSyncJob] Job already running');
    return;
  }

  console.log(`[PortfolioSyncJob] Starting portfolio sync job (interval: ${SYNC_INTERVAL}ms)`);

  // Run immediately on start
  syncPortfoliosForActiveUsers();

  // Then run at regular intervals
  syncIntervalId = setInterval(async () => {
    await syncPortfoliosForActiveUsers();
  }, SYNC_INTERVAL);

  console.log('[PortfolioSyncJob] Portfolio sync job started successfully');
}

/**
 * Stop the portfolio sync background job
 */
export function stopPortfolioSyncJob() {
  if (syncIntervalId) {
    console.log('[PortfolioSyncJob] Stopping portfolio sync job');
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('[PortfolioSyncJob] Portfolio sync job stopped');
  } else {
    console.log('[PortfolioSyncJob] Job is not running');
  }
}

/**
 * Sync a specific user's portfolio immediately
 */
export async function syncUserPortfolio(userId: string) {
  console.log(`[PortfolioSyncJob] Syncing portfolio immediately for user ${userId}`);

  try {
    await PortfolioService.syncPositionsToDatabase(userId);
    await PortfolioService.recordPortfolioSnapshot(userId);
    console.log(`[PortfolioSyncJob] Successfully synced portfolio for user ${userId}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[PortfolioSyncJob] Error syncing portfolio for user ${userId}:`, error.message);
      throw error;
    } else {
      console.error(`[PortfolioSyncJob] Unknown error syncing portfolio for user ${userId}`);
      throw new Error('Failed to sync portfolio');
    }
  }
}

export default {
  startPortfolioSyncJob,
  stopPortfolioSyncJob,
  syncUserPortfolio,
};
