import api from './api';

// Description: Get Risk Metrics
// Endpoint: GET /api/risk/metrics
// Request: {}
// Response: { currentRiskExposure: number, dailyLoss: number, dailyLossPercent: number, portfolioDrawdown: number, sectorConcentration: object, positionConcentration: object }
export const getRiskMetrics = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        currentRiskExposure: 72,
        dailyLoss: -234.56,
        dailyLossPercent: -0.18,
        portfolioDrawdown: 5.2,
        sectorConcentration: {
          Technology: 45,
          Healthcare: 20,
          Finance: 15,
          Consumer: 12,
          Energy: 8
        },
        positionConcentration: [
          { symbol: 'MSFT', percentage: 11.77 },
          { symbol: 'NVDA', percentage: 11.56 },
          { symbol: 'AAPL', percentage: 7.15 },
          { symbol: 'TSLA', percentage: 4.68 }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/risk/metrics');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Risk Limits
// Endpoint: GET /api/risk/limits
// Request: {}
// Response: { dailyLossLimit: number, dailyLossLimitPercent: number, haltOnLimit: boolean, drawdownLimit: number }
export const getRiskLimits = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        dailyLossLimit: 2000,
        dailyLossLimitPercent: 1.5,
        haltOnLimit: true,
        drawdownLimit: 15
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/risk/limits');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Update Risk Limits
// Endpoint: PUT /api/risk/limits
// Request: { dailyLossLimit: number, dailyLossLimitPercent: number, haltOnLimit: boolean, drawdownLimit: number }
// Response: { success: boolean, message: string }
export const updateRiskLimits = (data: {
  dailyLossLimit: number;
  dailyLossLimitPercent: number;
  haltOnLimit: boolean;
  drawdownLimit: number;
}) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Risk limits updated successfully'
      });
    }, 500);
  });
  // try {
  //   return await api.put('/api/risk/limits', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Emergency Stop All Positions
// Endpoint: POST /api/risk/emergency-stop
// Request: { confirmation: string }
// Response: { success: boolean, message: string, closedPositions: number }
export const emergencyStopAll = (confirmation: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'All positions closed and trading halted',
        closedPositions: 4
      });
    }, 1500);
  });
  // try {
  //   return await api.post('/api/risk/emergency-stop', { confirmation });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};