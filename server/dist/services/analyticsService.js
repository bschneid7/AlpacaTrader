import mongoose from 'mongoose';
import PortfolioHistory from '../models/PortfolioHistory';
import Trade from '../models/Trade';
class AnalyticsService {
    /**
     * Get portfolio history for a given timeframe
     */
    async getPortfolioHistory(userId, timeframe = '1M') {
        try {
            console.log(`Fetching portfolio history for user ${userId}, timeframe: ${timeframe}`);
            const userObjectId = new mongoose.Types.ObjectId(userId);
            const endDate = new Date();
            let startDate = new Date();
            // Calculate start date based on timeframe
            switch (timeframe) {
                case '1W':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '1M':
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case '3M':
                    startDate.setMonth(endDate.getMonth() - 3);
                    break;
                case 'YTD':
                    startDate = new Date(endDate.getFullYear(), 0, 1);
                    break;
                case 'ALL':
                    startDate = new Date(0); // Beginning of time
                    break;
                default:
                    startDate.setMonth(endDate.getMonth() - 1);
            }
            console.log(`Querying portfolio history from ${startDate.toISOString()} to ${endDate.toISOString()}`);
            const portfolioData = await PortfolioHistory.find({
                userId: userObjectId,
                date: { $gte: startDate, $lte: endDate },
            })
                .sort({ date: 1 })
                .select('date portfolioValue')
                .lean();
            console.log(`Found ${portfolioData.length} portfolio history records`);
            return portfolioData.map((record) => ({
                date: record.date.toISOString().split('T')[0],
                value: Math.round(record.portfolioValue * 100) / 100,
            }));
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error fetching portfolio history:', error.message, error.stack);
                throw error;
            }
            throw new Error('Failed to fetch portfolio history');
        }
    }
    /**
     * Calculate monthly returns from trade data and portfolio history
     */
    async getMonthlyReturns(userId) {
        try {
            console.log(`Calculating monthly returns for user ${userId}`);
            const userObjectId = new mongoose.Types.ObjectId(userId);
            // Get portfolio history for the last 12 months
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1);
            const portfolioData = await PortfolioHistory.find({
                userId: userObjectId,
                date: { $gte: startDate, $lte: endDate },
            })
                .sort({ date: 1 })
                .lean();
            console.log(`Found ${portfolioData.length} portfolio records for monthly return calculation`);
            // Group by month and calculate returns
            const monthlyData = new Map();
            portfolioData.forEach((record) => {
                const monthKey = record.date.toISOString().substring(0, 7); // YYYY-MM format
                const existing = monthlyData.get(monthKey);
                if (!existing) {
                    monthlyData.set(monthKey, {
                        start: record.portfolioValue,
                        end: record.portfolioValue,
                    });
                }
                else {
                    existing.end = record.portfolioValue;
                }
            });
            // Calculate returns for each month
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const returns = [];
            // Sort months and calculate returns
            const sortedMonths = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]));
            sortedMonths.forEach(([monthKey, values]) => {
                const [year, month] = monthKey.split('-');
                const monthIndex = parseInt(month, 10) - 1;
                const monthName = monthNames[monthIndex];
                let monthReturn = 0;
                if (values.start > 0) {
                    monthReturn = ((values.end - values.start) / values.start) * 100;
                }
                returns.push({
                    month: monthName,
                    return: Math.round(monthReturn * 100) / 100,
                });
            });
            console.log(`Calculated returns for ${returns.length} months`);
            // Return last 12 months or all available
            return returns.slice(-12);
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error calculating monthly returns:', error.message, error.stack);
                throw error;
            }
            throw new Error('Failed to calculate monthly returns');
        }
    }
    /**
     * Calculate comprehensive performance metrics
     */
    async getPerformanceMetrics(userId) {
        try {
            console.log(`Calculating performance metrics for user ${userId}`);
            const userObjectId = new mongoose.Types.ObjectId(userId);
            // Get all closed trades
            const closedTrades = await Trade.find({
                userId: userObjectId,
                status: 'closed',
                profitLoss: { $exists: true },
            })
                .sort({ exitTime: 1 })
                .lean();
            console.log(`Found ${closedTrades.length} closed trades for metrics calculation`);
            // Get portfolio history for drawdown and Sharpe ratio
            const portfolioHistory = await PortfolioHistory.find({
                userId: userObjectId,
            })
                .sort({ date: 1 })
                .lean();
            console.log(`Found ${portfolioHistory.length} portfolio history records`);
            // Calculate total return
            const totalPL = closedTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
            // Calculate initial and current portfolio value
            const initialValue = portfolioHistory.length > 0 ? portfolioHistory[0].portfolioValue : 100000;
            const currentValue = portfolioHistory.length > 0
                ? portfolioHistory[portfolioHistory.length - 1].portfolioValue
                : initialValue;
            const totalReturnPercent = initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0;
            // Find best and worst trades
            let bestTrade = { symbol: 'N/A', pl: 0, plPercent: 0 };
            let worstTrade = { symbol: 'N/A', pl: 0, plPercent: 0 };
            if (closedTrades.length > 0) {
                const sortedByPL = [...closedTrades].sort((a, b) => (b.profitLoss || 0) - (a.profitLoss || 0));
                const best = sortedByPL[0];
                bestTrade = {
                    symbol: best.symbol,
                    pl: best.profitLoss || 0,
                    plPercent: best.profitLossPercentage || 0,
                };
                const worst = sortedByPL[sortedByPL.length - 1];
                worstTrade = {
                    symbol: worst.symbol,
                    pl: worst.profitLoss || 0,
                    plPercent: worst.profitLossPercentage || 0,
                };
            }
            // Calculate average win and loss
            const winningTrades = closedTrades.filter((t) => (t.profitLoss || 0) > 0);
            const losingTrades = closedTrades.filter((t) => (t.profitLoss || 0) < 0);
            const avgWin = winningTrades.length > 0
                ? winningTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / winningTrades.length
                : 0;
            const avgLoss = losingTrades.length > 0
                ? losingTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / losingTrades.length
                : 0;
            // Calculate Sharpe Ratio
            const sharpeRatio = this.calculateSharpeRatio(portfolioHistory);
            // Calculate Maximum Drawdown
            const maxDrawdown = this.calculateMaxDrawdown(portfolioHistory);
            console.log('Performance metrics calculated successfully');
            return {
                totalReturn: Math.round(totalPL * 100) / 100,
                totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
                bestTrade,
                worstTrade,
                avgWin: Math.round(avgWin * 100) / 100,
                avgLoss: Math.round(avgLoss * 100) / 100,
                sharpeRatio: Math.round(sharpeRatio * 100) / 100,
                maxDrawdown: Math.round(maxDrawdown * 100) / 100,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error calculating performance metrics:', error.message, error.stack);
                throw error;
            }
            throw new Error('Failed to calculate performance metrics');
        }
    }
    /**
     * Get trade history with formatted data
     */
    async getTradeHistory(userId) {
        try {
            console.log(`Fetching trade history for user ${userId}`);
            const userObjectId = new mongoose.Types.ObjectId(userId);
            const trades = await Trade.find({
                userId: userObjectId,
                status: 'closed',
                exitTime: { $exists: true },
            })
                .sort({ exitTime: -1 })
                .lean();
            console.log(`Found ${trades.length} closed trades`);
            return trades.map((trade) => {
                // Calculate duration
                let durationStr = 'N/A';
                if (trade.exitTime && trade.entryTime) {
                    const durationMs = trade.exitTime.getTime() - trade.entryTime.getTime();
                    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    if (days > 0) {
                        durationStr = `${days} day${days > 1 ? 's' : ''}`;
                    }
                    else if (hours > 0) {
                        durationStr = `${hours} hour${hours > 1 ? 's' : ''}`;
                    }
                    else {
                        const minutes = Math.floor(durationMs / (1000 * 60));
                        durationStr = `${minutes} min${minutes > 1 ? 's' : ''}`;
                    }
                }
                return {
                    date: trade.exitTime ? trade.exitTime.toISOString().split('T')[0] : trade.entryTime.toISOString().split('T')[0],
                    symbol: trade.symbol,
                    entryPrice: Math.round(trade.entryPrice * 100) / 100,
                    exitPrice: Math.round((trade.exitPrice || 0) * 100) / 100,
                    quantity: trade.filledQuantity,
                    duration: durationStr,
                    pl: Math.round((trade.profitLoss || 0) * 100) / 100,
                    plPercent: Math.round((trade.profitLossPercentage || 0) * 100) / 100,
                };
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error fetching trade history:', error.message, error.stack);
                throw error;
            }
            throw new Error('Failed to fetch trade history');
        }
    }
    /**
     * Calculate Sharpe Ratio
     * Sharpe Ratio = (Average Return - Risk-Free Rate) / Standard Deviation of Returns
     */
    calculateSharpeRatio(portfolioHistory) {
        try {
            if (portfolioHistory.length < 2) {
                return 0;
            }
            // Calculate daily returns
            const dailyReturns = [];
            for (let i = 1; i < portfolioHistory.length; i++) {
                const prevValue = portfolioHistory[i - 1].portfolioValue;
                const currentValue = portfolioHistory[i].portfolioValue;
                if (prevValue > 0) {
                    const dailyReturn = (currentValue - prevValue) / prevValue;
                    dailyReturns.push(dailyReturn);
                }
            }
            if (dailyReturns.length === 0) {
                return 0;
            }
            // Calculate average return
            const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
            // Calculate standard deviation
            const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
            const stdDev = Math.sqrt(variance);
            if (stdDev === 0) {
                return 0;
            }
            // Assume risk-free rate of 0.04 / 252 (4% annual, 252 trading days)
            const riskFreeRate = 0.04 / 252;
            // Calculate Sharpe Ratio (annualized)
            const sharpeRatio = ((avgReturn - riskFreeRate) / stdDev) * Math.sqrt(252);
            return sharpeRatio;
        }
        catch (error) {
            console.error('Error calculating Sharpe ratio:', error);
            return 0;
        }
    }
    /**
     * Calculate Maximum Drawdown
     * Maximum Drawdown = (Trough Value - Peak Value) / Peak Value
     */
    calculateMaxDrawdown(portfolioHistory) {
        try {
            if (portfolioHistory.length === 0) {
                return 0;
            }
            let maxDrawdown = 0;
            let peak = portfolioHistory[0].portfolioValue;
            for (const record of portfolioHistory) {
                const value = record.portfolioValue;
                // Update peak if current value is higher
                if (value > peak) {
                    peak = value;
                }
                // Calculate drawdown from peak
                const drawdown = peak > 0 ? ((peak - value) / peak) * 100 : 0;
                // Update max drawdown if current drawdown is larger
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            }
            return maxDrawdown;
        }
        catch (error) {
            console.error('Error calculating max drawdown:', error);
            return 0;
        }
    }
    /**
     * Record daily portfolio snapshot
     * This should be called daily (or can be called manually)
     */
    async recordPortfolioSnapshot(userId, portfolioData) {
        try {
            console.log(`Recording portfolio snapshot for user ${userId}`);
            const userObjectId = new mongoose.Types.ObjectId(userId);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize to start of day
            await PortfolioHistory.findOneAndUpdate({
                userId: userObjectId,
                date: today,
            }, {
                userId: userObjectId,
                date: today,
                portfolioValue: portfolioData.portfolioValue,
                equity: portfolioData.equity,
                cash: portfolioData.cash,
                longMarketValue: portfolioData.longMarketValue || 0,
                shortMarketValue: portfolioData.shortMarketValue || 0,
                buyingPower: portfolioData.buyingPower || 0,
            }, {
                upsert: true,
                new: true,
            });
            console.log('Portfolio snapshot recorded successfully');
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error recording portfolio snapshot:', error.message, error.stack);
                throw error;
            }
            throw new Error('Failed to record portfolio snapshot');
        }
    }
}
export default new AnalyticsService();
//# sourceMappingURL=analyticsService.js.map