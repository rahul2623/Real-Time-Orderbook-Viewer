# API Integration Documentation

## 📡 **Exchange API Integration Overview**

This document details how the Real-Time Orderbook Viewer integrates with **OKX**, **Bybit**, and **Deribit** APIs for real-time market data and orderbook information.

---

## 🏗️ **Architecture Overview**

### **Base API Service Pattern**
All exchange integrations follow a consistent pattern using the `BaseApiService` abstract class:

```typescript
// services/api/baseApi.ts
export abstract class BaseApiService {
  protected axiosClient: AxiosInstance;
  protected wsConnection: WebSocket | null = null;
  protected lastRequestTime: number = 0;
  protected readonly rateLimit: number;

  // Abstract methods implemented by each exchange
  abstract fetchOrderbook(symbol: string): Promise<Orderbook>;
  abstract subscribeToOrderbook(symbol: string, callback: (data: Orderbook) => void): Promise<void>;
  abstract unsubscribeFromOrderbook(symbol: string): Promise<void>;
}
```

### **API Service Manager**
The `ApiServiceManager` singleton manages all exchange connections:

```typescript
// services/api/index.ts
class ApiServiceManager {
  private okxService: OkxApiService;
  private bybitService: BybitApiService;
  private deribitService: DeribitApiService;

  async fetchOrderbook(venue: Venue, symbol: string): Promise<Orderbook>
  async subscribeToOrderbook(venue: Venue, symbol: string, callback: (data: Orderbook) => void): Promise<void>
  async healthCheck(): Promise<Record<Venue, boolean>>
}
```

---

## 🔗 **OKX API Integration**

### **API Endpoints**
- **Base URL**: `https://www.okx.com`
- **WebSocket URL**: `wss://ws.okx.com:8443/ws/v5/public`
- **Rate Limit**: 20 requests per 2 seconds

### **REST API Implementation**

#### **Orderbook Endpoint**
```typescript
// GET /api/v5/market/books
async fetchOrderbook(symbol: string): Promise<Orderbook> {
  const response = await this.axiosClient.get('/api/v5/market/books', {
    params: {
      instId: symbol,
      sz: 20 // Request 20 levels
    }
  });
  
  return this.parseOrderbookResponse(response.data);
}
```

#### **Response Format**
```json
{
  "code": "0",
  "msg": "",
  "data": [{
    "asks": [
      ["41006.8", "0.60038921", "0", "1"],
      ["41007.4", "0.30178218", "0", "2"]
    ],
    "bids": [
      ["41006.7", "2.18139815", "0", "5"],
      ["41006.6", "0.24998673", "0", "1"]
    ],
    "ts": "1629966436396"
  }]
}
```

### **WebSocket Implementation**

#### **Connection & Subscription**
```typescript
async subscribeToOrderbook(symbol: string, callback: (data: Orderbook) => void): Promise<void> {
  const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');
  
  ws.onopen = () => {
    // Subscribe to orderbook channel
    ws.send(JSON.stringify({
      op: "subscribe",
      args: [{
        channel: "books5",
        instId: symbol
      }]
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.data) {
      const orderbook = this.parseWebSocketData(data.data[0]);
      callback(orderbook);
    }
  };
}
```

#### **Data Parsing**
```typescript
private parseOrderbookResponse(data: any): Orderbook {
  const rawData = data.data[0];
  
  return {
    venue: 'OKX',
    symbol: rawData.instId || this.currentSymbol,
    timestamp: parseInt(rawData.ts),
    bids: rawData.bids.map(([price, size]: [string, string]) => ({
      price: parseFloat(price),
      size: parseFloat(size),
      total: 0 // Calculated separately
    })),
    asks: rawData.asks.map(([price, size]: [string, string]) => ({
      price: parseFloat(price),
      size: parseFloat(size),
      total: 0 // Calculated separately
    }))
  };
}
```

---

## 🔗 **Bybit API Integration**

### **API Endpoints**
- **Base URL**: `https://api.bybit.com`
- **WebSocket URL**: `wss://stream.bybit.com/v5/public/spot`
- **Rate Limit**: 120 requests per minute

### **REST API Implementation**

#### **Orderbook Endpoint**
```typescript
// GET /v5/market/orderbook
async fetchOrderbook(symbol: string): Promise<Orderbook> {
  const response = await this.axiosClient.get('/v5/market/orderbook', {
    params: {
      category: 'spot',
      symbol: symbol,
      limit: 25 // Request 25 levels
    }
  });
  
  return this.parseOrderbookResponse(response.data);
}
```

#### **Response Format**
```json
{
  "retCode": 0,
  "retMsg": "OK",
  "result": {
    "s": "BTCUSDT",
    "b": [
      ["40000.00", "0.001"],
      ["39999.00", "0.002"]
    ],
    "a": [
      ["40001.00", "0.001"],
      ["40002.00", "0.002"]
    ],
    "ts": 1672765737733,
    "u": 2717286
  }
}
```

### **WebSocket Implementation**

#### **Connection & Subscription**
```typescript
async subscribeToOrderbook(symbol: string, callback: (data: Orderbook) => void): Promise<void> {
  const ws = new WebSocket('wss://stream.bybit.com/v5/public/spot');
  
  ws.onopen = () => {
    // Subscribe to orderbook channel
    ws.send(JSON.stringify({
      op: "subscribe",
      args: [`orderbook.25.${symbol}`]
    }));
  };

  // Implement heartbeat for connection stability
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: "ping" }));
    }
  }, 30000);
}
```

#### **Heartbeat Handling**
```typescript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Handle heartbeat
  if (data.op === 'pong') {
    console.log('Bybit heartbeat received');
    return;
  }
  
  // Handle orderbook data
  if (data.topic && data.topic.includes('orderbook')) {
    const orderbook = this.parseWebSocketData(data.data);
    callback(orderbook);
  }
};
```

---

## 🔗 **Deribit API Integration**

### **API Endpoints**
- **Base URL**: `https://www.deribit.com`
- **WebSocket URL**: `wss://www.deribit.com/ws/api/v2`
- **Rate Limit**: 100 requests per minute

### **REST API Implementation**

#### **Orderbook Endpoint**
```typescript
// GET /api/v2/public/get_order_book
async fetchOrderbook(symbol: string): Promise<Orderbook> {
  const response = await this.axiosClient.get('/api/v2/public/get_order_book', {
    params: {
      instrument_name: symbol,
      depth: 20
    }
  });
  
  return this.parseOrderbookResponse(response.data);
}
```

#### **Response Format**
```json
{
  "jsonrpc": "2.0",
  "id": 9344,
  "result": {
    "timestamp": 1550652954406,
    "stats": {
      "volume": null,
      "price_change": null,
      "low": null,
      "high": null
    },
    "state": "open",
    "settlement_price": 3960.14,
    "open_interest": 0.12759952124659,
    "min_price": 3943.21,
    "max_price": 4087.84,
    "mark_price": 4015.53,
    "last_price": 4015.5,
    "instrument_name": "BTC-PERPETUAL",
    "index_price": 4015.53,
    "funding_8h": 0.01520525,
    "current_funding": 0.00499954,
    "change_id": 297,
    "bids": [
      ["new", 4014.5, 40],
      ["new", 4013.5, 40]
    ],
    "best_bid_price": 4014.5,
    "best_bid_amount": 40,
    "best_ask_price": 4015.5,
    "best_ask_amount": 40,
    "asks": [
      ["new", 4015.5, 40],
      ["new", 4016.5, 40]
    ]
  }
}
```

### **WebSocket Implementation**

#### **JSON-RPC 2.0 Protocol**
```typescript
async subscribeToOrderbook(symbol: string, callback: (data: Orderbook) => void): Promise<void> {
  const ws = new WebSocket('wss://www.deribit.com/ws/api/v2');
  
  ws.onopen = () => {
    // Subscribe using JSON-RPC 2.0
    ws.send(JSON.stringify({
      jsonrpc: "2.0",
      id: 9929,
      method: "public/subscribe",
      params: {
        channels: [`book.${symbol}.100ms`]
      }
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Handle subscription confirmation
    if (data.id === 9929) {
      console.log('Deribit subscription confirmed');
      return;
    }
    
    // Handle orderbook updates
    if (data.params && data.params.channel.includes('book')) {
      const orderbook = this.parseWebSocketData(data.params.data);
      callback(orderbook);
    }
  };
}
```

---

## ⚠️ **Rate Limiting & Error Handling**

### **Rate Limiting Implementation**
```typescript
protected async makeRequest<T>(config: any): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - this.lastRequestTime;
  
  if (timeSinceLastRequest < this.rateLimit) {
    await this.delay(this.rateLimit - timeSinceLastRequest);
  }
  
  this.lastRequestTime = Date.now();
  return this.axiosClient.request(config);
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### **Error Handling Strategy**
```typescript
async fetchOrderbook(symbol: string): Promise<Orderbook> {
  try {
    const response = await this.makeRequest({
      url: this.getOrderbookEndpoint(),
      params: this.getOrderbookParams(symbol)
    });
    
    return this.parseOrderbookResponse(response.data);
  } catch (error) {
    console.error(`${this.venue} API error:`, error);
    
    // Implement fallback strategy
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      // Return cached data if available
      return this.getCachedOrderbook(symbol);
    }
    
    throw new Error(`Failed to fetch orderbook for ${symbol} from ${this.venue}`);
  }
}
```

### **WebSocket Reconnection Logic**
```typescript
private setupWebSocketReconnection(): void {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  
  const reconnect = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.pow(2, reconnectAttempts) * 1000; // Exponential backoff
      setTimeout(() => {
        reconnectAttempts++;
        this.connectWebSocket();
      }, delay);
    }
  };

  this.wsConnection.onclose = (event) => {
    console.log(`${this.venue} WebSocket closed:`, event.reason);
    reconnect();
  };

  this.wsConnection.onerror = (error) => {
    console.error(`${this.venue} WebSocket error:`, error);
    reconnect();
  };
}
```

---

## 📊 **Data Normalization**

### **Symbol Mapping**
```typescript
// config/exchanges.ts
export const SYMBOL_MAPPING: Record<Venue, Record<string, string>> = {
  'OKX': {
    'BTC-USDT': 'BTC-USDT',
    'ETH-USDT': 'ETH-USDT',
    'SOL-USDT': 'SOL-USDT'
  },
  'Bybit': {
    'BTC-USDT': 'BTCUSDT',
    'ETH-USDT': 'ETHUSDT',
    'SOL-USDT': 'SOLUSDT'
  },
  'Deribit': {
    'BTC-USDT': 'BTC-PERPETUAL',
    'ETH-USDT': 'ETH-PERPETUAL',
    'SOL-USDT': 'SOL-PERPETUAL'
  }
};
```

### **Orderbook Normalization**
```typescript
private normalizeOrderbook(rawData: any, venue: Venue): Orderbook {
  // Calculate cumulative totals for visualization
  const calculateCumulativeTotals = (levels: OrderbookLevel[]): OrderbookLevel[] => {
    let cumulative = 0;
    return levels.map(level => {
      cumulative += level.size;
      return { ...level, total: cumulative };
    });
  };

  const bids = calculateCumulativeTotals(this.parseBids(rawData));
  const asks = calculateCumulativeTotals(this.parseAsks(rawData));

  return {
    venue,
    symbol: this.currentSymbol,
    timestamp: this.parseTimestamp(rawData),
    bids: bids.slice(0, MAX_ORDERBOOK_LEVELS),
    asks: asks.slice(0, MAX_ORDERBOOK_LEVELS)
  };
}
```

---

## 🔧 **Configuration Management**

### **Exchange Configuration**
```typescript
// config/exchanges.ts
export const EXCHANGE_CONFIG: Record<Venue, ExchangeConfig> = {
  'OKX': {
    name: 'OKX',
    baseUrl: 'https://www.okx.com',
    wsUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    rateLimit: 100, // ms between requests
    supportedSymbols: ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'],
    maxOrderbookLevels: 20
  },
  'Bybit': {
    name: 'Bybit',
    baseUrl: 'https://api.bybit.com',
    wsUrl: 'wss://stream.bybit.com/v5/public/spot',
    rateLimit: 500,
    supportedSymbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    maxOrderbookLevels: 25
  },
  'Deribit': {
    name: 'Deribit',
    baseUrl: 'https://www.deribit.com',
    wsUrl: 'wss://www.deribit.com/ws/api/v2',
    rateLimit: 600,
    supportedSymbols: ['BTC-PERPETUAL', 'ETH-PERPETUAL'],
    maxOrderbookLevels: 20
  }
};
```

---

## 📈 **Performance Optimization**

### **Connection Pooling**
- Reuse WebSocket connections for multiple symbol subscriptions
- Implement connection health monitoring
- Automatic cleanup of stale connections

### **Data Caching**
- Cache recent orderbook data for fallback scenarios
- Implement intelligent cache invalidation
- Reduce API calls through smart caching

### **Memory Management**
- Proper cleanup of WebSocket event listeners
- Garbage collection of old orderbook data
- Efficient data structures for real-time updates

---

## 🛡️ **Security Considerations**

### **API Key Management**
- No API keys required for public market data endpoints
- Environment-based configuration for any authenticated endpoints
- Secure handling of sensitive data

### **CORS & Security Headers**
- Proper CORS configuration for cross-origin requests
- Security headers implemented in Next.js configuration
- XSS protection and content security policies

---

## 🧪 **Testing Strategy**

### **API Integration Tests**
```typescript
// __tests__/api/okx.test.ts
describe('OKX API Integration', () => {
  test('should fetch orderbook successfully', async () => {
    const okxService = new OkxApiService();
    const orderbook = await okxService.fetchOrderbook('BTC-USDT');
    
    expect(orderbook.venue).toBe('OKX');
    expect(orderbook.bids.length).toBeGreaterThan(0);
    expect(orderbook.asks.length).toBeGreaterThan(0);
  });

  test('should handle WebSocket subscription', async () => {
    const okxService = new OkxApiService();
    const mockCallback = jest.fn();
    
    await okxService.subscribeToOrderbook('BTC-USDT', mockCallback);
    
    // Wait for WebSocket data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### **Error Handling Tests**
```typescript
test('should handle API rate limiting gracefully', async () => {
  // Test rapid successive calls
  const promises = Array.from({ length: 10 }, () => 
    okxService.fetchOrderbook('BTC-USDT')
  );
  
  await expect(Promise.all(promises)).resolves.toBeDefined();
});
```

---

## 📋 **API Rate Limits Summary**

| Exchange | Rate Limit | WebSocket Connections | Notes |
|----------|------------|----------------------|-------|
| **OKX** | 20 req/2s | Multiple per connection | Stable, reliable |
| **Bybit** | 120 req/min | 1 per symbol | Requires heartbeat |
| **Deribit** | 100 req/min | JSON-RPC 2.0 protocol | Futures-focused |

---

## 🚀 **Production Considerations**

### **Monitoring & Logging**
- Comprehensive API response logging
- WebSocket connection health monitoring
- Performance metrics collection
- Error rate tracking and alerting

### **Scalability**
- Connection pooling for high-frequency updates
- Load balancing across multiple API endpoints
- Horizontal scaling support

### **Reliability**
- Circuit breaker pattern for failing APIs
- Graceful degradation when services unavailable
- Comprehensive fallback mechanisms

---

**Ready for production deployment with enterprise-grade API integration! 🚀** 