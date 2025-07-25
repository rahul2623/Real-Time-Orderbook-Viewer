import { BaseApiService } from './baseApi';
import { Orderbook, OrderbookLevel, ApiResponse, WebSocketConnection } from '@/types/orderbook';
import { EXCHANGE_CONFIGS, SYMBOL_MAPPING } from '@/config/exchanges';

interface OKXOrderbookResponse {
  code: string;
  msg: string;
  data: Array<{
    asks: string[][];
    bids: string[][];
    ts: string;
    checksum: number;
  }>;
}

export class OKXApiService extends BaseApiService {
  constructor() {
    super('okx');
  }

  async fetchOrderbook(symbol: string): Promise<ApiResponse<Orderbook>> {
    try {
      const okxSymbol = SYMBOL_MAPPING.okx[symbol];
      if (!okxSymbol) {
        return {
          success: false,
          error: `Symbol ${symbol} not supported on OKX`,
          timestamp: Date.now(),
        };
      }

      const response = await this.makeRequest<OKXOrderbookResponse>(
        '/market/books',
        {
          instId: okxSymbol,
          sz: '15', // 15 levels
        }
      );

      if (!response.success || !response.data) {
        return response as ApiResponse<Orderbook>;
      }

      const data = response.data.data[0];
      if (!data) {
        return {
          success: false,
          error: 'No orderbook data received',
          timestamp: Date.now(),
        };
      }

      const orderbook: Orderbook = {
        symbol,
        venue: 'okx',
        bids: this.parseLevels(data.bids),
        asks: this.parseLevels(data.asks),
        timestamp: parseInt(data.ts),
      };

      return {
        success: true,
        data: orderbook,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  async subscribeToOrderbook(
    symbol: string,
    onUpdate: (orderbook: Orderbook) => void,
    onError: (error: string) => void
  ): Promise<WebSocketConnection> {
    return new Promise((resolve) => {
      const okxSymbol = SYMBOL_MAPPING.okx[symbol];
      const key = this.createWebSocketKey(symbol);
      const config = EXCHANGE_CONFIGS.okx;

      // Clean up existing connection
      this.cleanupWebSocket(key);

      const ws = new WebSocket(config.wsUrl);
      let connectionResolved = false;

      const connection: WebSocketConnection = {
        venue: 'okx',
        symbol,
        ws,
        connected: false,
        reconnectAttempts: 0,
        lastHeartbeat: Date.now(),
      };

      ws.onopen = () => {
        connection.connected = true;
        connection.lastHeartbeat = Date.now();

        // Subscribe to orderbook
        ws.send(JSON.stringify({
          op: 'subscribe',
          args: [{
            channel: 'books',
            instId: okxSymbol,
          }],
        }));

        if (!connectionResolved) {
          connectionResolved = true;
          resolve(connection);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.event === 'subscribe') {
            // Subscription confirmation
            return;
          }

          if (message.data && message.data.length > 0) {
            const data = message.data[0];
            
            const orderbook: Orderbook = {
              symbol,
              venue: 'okx',
              bids: this.parseLevels(data.bids || []),
              asks: this.parseLevels(data.asks || []),
              timestamp: parseInt(data.ts) || Date.now(),
            };

            onUpdate(orderbook);
          }
        } catch (error: any) {
          onError(`Failed to parse OKX message: ${error.message}`);
        }
      };

      ws.onerror = (error) => {
        connection.connected = false;
        onError(`OKX WebSocket error: ${error}`);
        
        if (!connectionResolved) {
          connectionResolved = true;
          resolve(connection);
        }
      };

      ws.onclose = () => {
        connection.connected = false;
        this.wsConnections.delete(key);
      };

      this.wsConnections.set(key, ws);
    });
  }

  async unsubscribeFromOrderbook(symbol: string): Promise<void> {
    const key = this.createWebSocketKey(symbol);
    const ws = this.wsConnections.get(key);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      const okxSymbol = SYMBOL_MAPPING.okx[symbol];
      
      ws.send(JSON.stringify({
        op: 'unsubscribe',
        args: [{
          channel: 'books',
          instId: okxSymbol,
        }],
      }));
    }
    
    this.cleanupWebSocket(key);
  }

  private parseLevels(levels: string[][]): OrderbookLevel[] {
    let total = 0;
    return levels.map(([price, quantity]) => {
      const qty = parseFloat(quantity);
      total += qty;
      return {
        price: parseFloat(price),
        quantity: qty,
        total,
      };
    });
  }
} 