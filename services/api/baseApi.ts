import axios, { AxiosInstance } from 'axios';
import { Venue, Orderbook, ApiResponse, WebSocketConnection } from '@/types/orderbook';
import { EXCHANGE_CONFIGS } from '@/config/exchanges';

export abstract class BaseApiService {
  protected venue: Venue;
  protected apiClient: AxiosInstance;
  protected wsConnections: Map<string, WebSocket> = new Map();
  protected rateLimitTracker: Map<string, number[]> = new Map();

  constructor(venue: Venue) {
    this.venue = venue;
    const config = EXCHANGE_CONFIGS[venue];
    
    this.apiClient = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for rate limiting
    this.apiClient.interceptors.request.use(
      (config) => {
        if (this.isRateLimited()) {
          return Promise.reject(new Error('Rate limit exceeded'));
        }
        this.trackRequest();
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private isRateLimited(): boolean {
    const config = EXCHANGE_CONFIGS[this.venue];
    const now = Date.now();
    const windowStart = now - config.rateLimit.window;
    
    const requests = this.rateLimitTracker.get(this.venue) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    return recentRequests.length >= config.rateLimit.requests;
  }

  private trackRequest(): void {
    const now = Date.now();
    const requests = this.rateLimitTracker.get(this.venue) || [];
    requests.push(now);
    this.rateLimitTracker.set(this.venue, requests);
  }

  protected createWebSocketKey(symbol: string): string {
    return `${this.venue}-${symbol}`;
  }

  protected async makeRequest<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.apiClient.get(endpoint, { params });
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  // Abstract methods to be implemented by exchange-specific services
  abstract fetchOrderbook(symbol: string): Promise<ApiResponse<Orderbook>>;
  abstract subscribeToOrderbook(
    symbol: string,
    onUpdate: (orderbook: Orderbook) => void,
    onError: (error: string) => void
  ): Promise<WebSocketConnection>;
  abstract unsubscribeFromOrderbook(symbol: string): Promise<void>;
  
  // Common WebSocket cleanup
  protected cleanupWebSocket(key: string): void {
    const ws = this.wsConnections.get(key);
    if (ws) {
      ws.close();
      this.wsConnections.delete(key);
    }
  }

  // Cleanup all connections
  public cleanup(): void {
    this.wsConnections.forEach((ws) => {
      ws.close();
    });
    this.wsConnections.clear();
  }
} 