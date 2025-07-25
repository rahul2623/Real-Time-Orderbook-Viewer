import { BaseApiService } from './baseApi';
import { Orderbook, OrderbookLevel, ApiResponse, WebSocketConnection } from '@/types/orderbook';
import { EXCHANGE_CONFIGS, SYMBOL_MAPPING } from '@/config/exchanges';

interface BybitOrderbookResponse {
  retCode: number;
  retMsg: string;
  result: {
    s: string; // symbol
    b: string[][]; // bids
    a: string[][]; // asks
    ts: number;
    u: number; // update id
  };
  retExtInfo: any;
  time: number;
}

export class BybitApiService extends BaseApiService {
  constructor() {
    super('bybit');
  }

  async fetchOrderbook(symbol: string): Promise<ApiResponse<Orderbook>> {
    try {
      const bybitSymbol = SYMBOL_MAPPING.bybit[symbol];
      if (!bybitSymbol) {
        return {
          success: false,
          error: `Symbol ${symbol} not supported on Bybit`,
          timestamp: Date.now(),
        };
      }

      const response = await this.makeRequest<BybitOrderbookResponse>(
        '/market/orderbook',
        {
          category: 'spot',
          symbol: bybitSymbol,
          limit: 15,
        }
      );

      if (!response.success || !response.data) {
        return response as ApiResponse<Orderbook>;
      }

      const data = response.data.result;
      if (!data) {
        return {
          success: false,
          error: 'No orderbook data received',
          timestamp: Date.now(),
        };
      }

      const orderbook: Orderbook = {
        symbol,
        venue: 'bybit',
        bids: this.parseLevels(data.b),
        asks: this.parseLevels(data.a),
        timestamp: data.ts,
        lastUpdateId: data.u,
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
      const bybitSymbol = SYMBOL_MAPPING.bybit[symbol];
      const key = this.createWebSocketKey(symbol);
      const config = EXCHANGE_CONFIGS.bybit;

      // Clean up existing connection
      this.cleanupWebSocket(key);

      const ws = new WebSocket(config.wsUrl);
      let connectionResolved = false;

      const connection: WebSocketConnection = {
        venue: 'bybit',
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
          args: [`orderbook.1.${bybitSymbol}`],
        }));

        if (!connectionResolved) {
          connectionResolved = true;
          resolve(connection);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle pong messages for heartbeat
          if (message.op === 'pong') {
            connection.lastHeartbeat = Date.now();
            return;
          }

          // Handle subscription success
          if (message.success && message.op === 'subscribe') {
            return;
          }

          // Handle orderbook data
          if (message.topic && message.topic.includes('orderbook') && message.data) {
            const data = message.data;
            
            const orderbook: Orderbook = {
              symbol,
              venue: 'bybit',
              bids: this.parseLevels(data.b || []),
              asks: this.parseLevels(data.a || []),
              timestamp: data.ts || Date.now(),
              lastUpdateId: data.u,
            };

            onUpdate(orderbook);
          }
        } catch (error: any) {
          onError(`Failed to parse Bybit message: ${error.message}`);
        }
      };

      ws.onerror = (error) => {
        connection.connected = false;
        onError(`Bybit WebSocket error: ${error}`);
        
        if (!connectionResolved) {
          connectionResolved = true;
          resolve(connection);
        }
      };

      ws.onclose = () => {
        connection.connected = false;
        this.wsConnections.delete(key);
      };

      // Set up heartbeat
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ op: 'ping' }));
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 20000); // 20 seconds

      this.wsConnections.set(key, ws);
    });
  }

  async unsubscribeFromOrderbook(symbol: string): Promise<void> {
    const key = this.createWebSocketKey(symbol);
    const ws = this.wsConnections.get(key);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      const bybitSymbol = SYMBOL_MAPPING.bybit[symbol];
      
      ws.send(JSON.stringify({
        op: 'unsubscribe',
        args: [`orderbook.1.${bybitSymbol}`],
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