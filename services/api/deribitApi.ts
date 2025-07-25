import { BaseApiService } from './baseApi';
import { Orderbook, OrderbookLevel, ApiResponse, WebSocketConnection } from '@/types/orderbook';
import { EXCHANGE_CONFIGS, SYMBOL_MAPPING } from '@/config/exchanges';

interface DeribitOrderbookResponse {
  jsonrpc: string;
  id: number;
  result: {
    asks: number[][];
    bids: number[][];
    timestamp: number;
    instrument_name: string;
    change_id: number;
  };
}

export class DeribitApiService extends BaseApiService {
  constructor() {
    super('deribit');
  }

  async fetchOrderbook(symbol: string): Promise<ApiResponse<Orderbook>> {
    try {
      const deribitSymbol = SYMBOL_MAPPING.deribit[symbol];
      if (!deribitSymbol) {
        return {
          success: false,
          error: `Symbol ${symbol} not supported on Deribit`,
          timestamp: Date.now(),
        };
      }

      const response = await this.makeRequest<DeribitOrderbookResponse>(
        '/public/get_order_book',
        {
          instrument_name: deribitSymbol,
          depth: 15,
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
        venue: 'deribit',
        bids: this.parseLevels(data.bids),
        asks: this.parseLevels(data.asks),
        timestamp: data.timestamp,
        lastUpdateId: data.change_id,
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
      const deribitSymbol = SYMBOL_MAPPING.deribit[symbol];
      const key = this.createWebSocketKey(symbol);
      const config = EXCHANGE_CONFIGS.deribit;

      // Clean up existing connection
      this.cleanupWebSocket(key);

      const ws = new WebSocket(config.wsUrl);
      let connectionResolved = false;
      let requestId = 1;

      const connection: WebSocketConnection = {
        venue: 'deribit',
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
          jsonrpc: '2.0',
          id: requestId++,
          method: 'public/subscribe',
          params: {
            channels: [`book.${deribitSymbol}.none.1.100ms`],
          },
        }));

        if (!connectionResolved) {
          connectionResolved = true;
          resolve(connection);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle subscription confirmation
          if (message.id && message.result) {
            return;
          }

          // Handle heartbeat/test requests
          if (message.method === 'heartbeat') {
            ws.send(JSON.stringify({
              jsonrpc: '2.0',
              id: message.id,
              method: 'public/test',
              params: {},
            }));
            connection.lastHeartbeat = Date.now();
            return;
          }

          // Handle orderbook data
          if (message.method === 'subscription' && message.params && message.params.data) {
            const data = message.params.data;
            
            const orderbook: Orderbook = {
              symbol,
              venue: 'deribit',
              bids: this.parseLevels(data.bids || []),
              asks: this.parseLevels(data.asks || []),
              timestamp: data.timestamp || Date.now(),
              lastUpdateId: data.change_id,
            };

            onUpdate(orderbook);
          }
        } catch (error: any) {
          onError(`Failed to parse Deribit message: ${error.message}`);
        }
      };

      ws.onerror = (error) => {
        connection.connected = false;
        onError(`Deribit WebSocket error: ${error}`);
        
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
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: requestId++,
            method: 'public/test',
            params: {},
          }));
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 seconds

      this.wsConnections.set(key, ws);
    });
  }

  async unsubscribeFromOrderbook(symbol: string): Promise<void> {
    const key = this.createWebSocketKey(symbol);
    const ws = this.wsConnections.get(key);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      const deribitSymbol = SYMBOL_MAPPING.deribit[symbol];
      
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'public/unsubscribe',
        params: {
          channels: [`book.${deribitSymbol}.none.1.100ms`],
        },
      }));
    }
    
    this.cleanupWebSocket(key);
  }

  private parseLevels(levels: number[][]): OrderbookLevel[] {
    let total = 0;
    return levels.map(([price, quantity]) => {
      total += quantity;
      return {
        price,
        quantity,
        total,
      };
    });
  }
} 