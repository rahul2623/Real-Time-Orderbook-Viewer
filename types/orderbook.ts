export interface OrderbookLevel {
  price: number;
  quantity: number;
  total: number;
}

export interface Orderbook {
  symbol: string;
  venue: Venue;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: number;
  lastUpdateId?: number;
}

export type Venue = 'okx' | 'bybit' | 'deribit';

export type OrderType = 'market' | 'limit';

export type OrderSide = 'buy' | 'sell';

export interface SimulatedOrder {
  venue: Venue;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  price?: number;
  quantity: number;
  timing: number; // delay in seconds
}

export interface OrderImpactMetrics {
  estimatedFillPercentage: number;
  marketImpact: number;
  slippage: number;
  timeToFill?: number;
  averageFillPrice: number;
  worstCase: {
    price: number;
    slippage: number;
  };
}

export interface WebSocketConnection {
  venue: Venue;
  symbol: string;
  ws: WebSocket | null;
  connected: boolean;
  reconnectAttempts: number;
  lastHeartbeat: number;
}

export interface ExchangeConfig {
  name: string;
  baseUrl: string;
  wsUrl: string;
  supportedSymbols: string[];
  rateLimit: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface MarketDepth {
  price: number;
  cumulativeVolume: number;
  percentage: number;
} 