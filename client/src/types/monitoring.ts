export interface WatchlistStock {
  _id?: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  status: 'monitoring' | 'buy_signal' | 'analyzing';
  indicators?: {
    rsi?: number;
    macd?: number;
    movingAverage?: number;
    [key: string]: number | undefined;
  };
  lastAnalyzed: string;
  addedAt: string;
  isActive: boolean;
}

export interface ActiveOrder {
  _id?: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  status: 'pending' | 'accepted' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected' | 'expired';
  filledQty: number;
  filledAvgPrice?: number;
  submittedAt: string;
  filledAt?: string;
  cancelledAt?: string;
  extendedHours: boolean;
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  notes?: string;
}

export interface ActivityLogItem {
  _id?: string;
  type: 'analysis' | 'trade' | 'signal' | 'risk' | 'system';
  action: string;
  symbol?: string;
  details?: {
    [key: string]: any;
  };
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}

export interface Alert {
  _id?: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  symbol?: string;
  relatedData?: {
    [key: string]: any;
  };
  isRead: boolean;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
  expiresAt?: string;
}
