export interface WatchlistStock {
  symbol: string;
  price: number;
  change: number;
  signal: string;
}

export interface ActiveOrder {
  orderId: string;
  symbol: string;
  type: string;
  targetPrice: number;
  quantity: number;
  time: string;
}

export interface ActivityLogItem {
  time: string;
  message: string;
  type: string;
}

export interface Alert {
  id: string;
  time: string;
  message: string;
  severity: string;
}