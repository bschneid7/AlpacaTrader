import { IRiskLimits } from '../models/RiskLimits';
import { IRiskMetrics } from '../models/RiskMetrics';
declare class RiskService {
    /**
     * Get or create risk limits for a user
     */
    getRiskLimits(userId: string): Promise<IRiskLimits>;
    /**
     * Update risk limits for a user
     */
    updateRiskLimits(userId: string, updates: Partial<IRiskLimits>): Promise<IRiskLimits>;
    /**
     * Calculate real-time risk metrics for a user
     */
    calculateRiskMetrics(userId: string): Promise<IRiskMetrics>;
    /**
     * Get latest risk metrics for a user
     */
    getRiskMetrics(userId: string): Promise<IRiskMetrics>;
    /**
     * Emergency stop - close all positions
     */
    emergencyStopAllPositions(userId: string): Promise<{
        success: boolean;
        message: string;
        closedPositions: number;
    }>;
    /**
     * Calculate sector concentration
     */
    private calculateSectorConcentration;
    /**
     * Calculate position concentration
     */
    private calculatePositionConcentration;
    /**
     * Calculate correlation matrix (simplified)
     */
    private calculateCorrelationMatrix;
    /**
     * Calculate volatility index (simplified)
     */
    private calculateVolatilityIndex;
    /**
     * Check if risk limits are breached
     */
    checkRiskLimitBreaches(userId: string): Promise<{
        breached: boolean;
        breaches: string[];
        shouldHaltTrading: boolean;
    }>;
}
declare const _default: RiskService;
export default _default;
//# sourceMappingURL=riskService.d.ts.map