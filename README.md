# Real-Time Orderbook Viewer with Order Simulation

A comprehensive Next.js application that displays real-time orderbook data from multiple cryptocurrency exchanges and provides advanced order simulation capabilities with market impact analysis.

## 🚀 Features

### Core Functionality
- **Multi-Venue Orderbook Display**: Real-time orderbook data from OKX, Bybit, and Deribit
- **WebSocket Connections**: Live data streaming with automatic reconnection and fallback mechanisms
- **Order Simulation**: Comprehensive order simulation with market and limit order support
- **Market Impact Analysis**: Advanced calculations for slippage, market impact, and execution metrics
- **Market Depth Visualization**: Interactive charts showing cumulative volume at different price levels
- **Orderbook Imbalance Analysis**: Real-time sentiment analysis with visual indicators
- **Advanced Risk Warnings**: Intelligent slippage and market impact alerts
- **Timing Scenario Comparison**: Side-by-side analysis of different execution strategies
- **Multi-Tab Interface**: Professional navigation between Overview, Analysis, and Advanced features
- **Responsive Design**: Optimized for both desktop and mobile trading scenarios

### Technical Features
- **Real-Time Data Integration**: WebSocket connections with rate limiting and error handling
- **State Management**: Zustand for efficient state management and real-time updates
- **Order Impact Calculator**: Sophisticated algorithms for market impact analysis
- **Connection Management**: Automatic reconnection with exponential backoff
- **Error Handling**: Comprehensive error handling and user feedback
- **TypeScript**: Full type safety throughout the application

### Supported Exchanges
- **OKX**: Spot trading pairs with WebSocket streaming
- **Bybit**: Spot markets with real-time orderbook updates
- **Deribit**: Perpetual futures with advanced derivatives data

## 📋 Requirements

- Node.js 18.0 or higher
- npm, yarn, or pnpm package manager
- Modern web browser with WebSocket support

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd orderbook-viewer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
├── app/                    # Next.js 13+ app directory
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── OrderbookDisplay.tsx      # Orderbook visualization
│   ├── OrderSimulationForm.tsx   # Order simulation form
│   ├── OrderImpactMetrics.tsx    # Impact analysis display
│   └── VenueSelector.tsx         # Exchange selection
├── services/              # Business logic and API services
│   ├── api/              # Exchange API integrations
│   │   ├── baseApi.ts    # Base API service class
│   │   ├── okxApi.ts     # OKX API implementation
│   │   ├── bybitApi.ts   # Bybit API implementation
│   │   ├── deribitApi.ts # Deribit API implementation
│   │   └── index.ts      # API service manager
│   └── orderImpactCalculator.ts  # Market impact calculations
├── store/                 # State management
│   └── orderbookStore.ts  # Zustand store for orderbook data
├── hooks/                 # Custom React hooks
│   └── useOrderbookData.ts       # Orderbook data management
├── types/                 # TypeScript type definitions
│   └── orderbook.ts      # Core type definitions
├── config/               # Configuration files
│   └── exchanges.ts      # Exchange configurations
└── next.config.js        # Next.js configuration
```

## 🔧 Configuration

### Exchange Configuration

The application is configured to work with three exchanges. Each exchange has specific configuration in `config/exchanges.ts`:

```typescript
export const EXCHANGE_CONFIGS: Record<Venue, ExchangeConfig> = {
  okx: {
    name: 'OKX',
    baseUrl: 'https://www.okx.com/api/v5',
    wsUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    supportedSymbols: ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'],
    rateLimit: { requests: 20, window: 2000 }
  },
  // ... other exchanges
};
```

### Supported Trading Pairs

Currently supported symbols across all exchanges:
- BTC-USDT / BTCUSDT / BTC-PERPETUAL
- ETH-USDT / ETHUSDT / ETH-PERPETUAL  
- SOL-USDT / SOLUSDT / SOL-PERPETUAL
- ADA-USDT / ADAUSDT
- DOT-USDT / DOTUSDT

## 🚀 Usage

### Basic Navigation

1. **Select Exchange**: Choose from OKX, Bybit, or Deribit
2. **Choose Trading Pair**: Select from available cryptocurrency pairs
3. **View Orderbook**: Real-time orderbook with 15 levels of depth
4. **Simulate Orders**: Create market or limit orders to analyze impact

### Order Simulation

1. **Order Type**: Choose between Market or Limit orders
2. **Side**: Select Buy or Sell
3. **Price**: Set limit price (for limit orders)
4. **Quantity**: Enter order size
5. **Timing**: Select execution timing (immediate, 5s, 10s, 30s delay)

### Impact Analysis

The application provides comprehensive impact metrics:

- **Estimated Fill Percentage**: How much of your order can be filled
- **Market Impact**: Effect on market price
- **Slippage**: Price difference from expected execution
- **Average Fill Price**: Weighted average execution price
- **Time to Fill**: Estimated completion time
- **Worst Case Scenario**: Maximum possible slippage

## 🔌 API Integration

### REST API Endpoints

- **OKX**: `/api/v5/market/books`
- **Bybit**: `/v5/market/orderbook`
- **Deribit**: `/api/v2/public/get_order_book`

### WebSocket Connections

- **OKX**: `wss://ws.okx.com:8443/ws/v5/public`
- **Bybit**: `wss://stream.bybit.com/v5/public/spot`
- **Deribit**: `wss://www.deribit.com/ws/api/v2`

### Rate Limiting

Each exchange has configured rate limits:
- OKX: 20 requests per 2 seconds
- Bybit: 10 requests per 1 second  
- Deribit: 20 requests per 1 second

## 🏛️ Architecture

### State Management

The application uses Zustand for state management with the following structure:

- **Orderbook Data**: Real-time orderbook information
- **Selected Market**: Current venue and symbol
- **WebSocket Connections**: Connection status and management
- **Simulated Orders**: Order simulation state
- **UI State**: Loading states and error handling

### Real-Time Data Flow

1. **Initial Load**: Fetch orderbook via REST API
2. **WebSocket Connection**: Establish real-time data stream
3. **Data Processing**: Parse and normalize exchange-specific formats
4. **State Updates**: Update Zustand store with new data
5. **UI Rendering**: React components re-render with new data
6. **Impact Calculation**: Recalculate order impact on data changes

### Error Handling

- **Connection Failures**: Automatic reconnection with exponential backoff
- **Rate Limiting**: Request throttling and queue management
- **Data Validation**: Type checking and data integrity verification
- **User Feedback**: Clear error messages and status indicators

## 🎨 Styling

The application uses Tailwind CSS with a custom dark theme:

- **Colors**: Slate-based dark theme with accent colors
- **Typography**: System fonts with monospace for numerical data
- **Animations**: Smooth transitions and loading states
- **Responsive**: Mobile-first responsive design

### Custom CSS Classes

```css
.orderbook-row: Orderbook row styling with hover effects
.bid-row: Green-tinted styling for buy orders
.ask-row: Red-tinted styling for sell orders
.simulated-order: Highlighted styling for simulated orders
```

## 🔍 Monitoring & Debugging

### Connection Status

The application provides real-time connection status for all exchanges:
- Green indicator: Active WebSocket connection
- Red indicator: Disconnected or failed connection
- Automatic health checks every 60 seconds

### Console Logging

Debug information is logged to the browser console:
- WebSocket connection events
- API response status
- Error messages and stack traces
- Performance metrics

## 📱 Mobile Optimization

The application is fully responsive with mobile-specific optimizations:

- **Touch-Friendly**: Large touch targets for mobile interaction
- **Responsive Grid**: Adaptive layout for different screen sizes
- **Optimized Performance**: Efficient rendering for mobile devices
- **Gesture Support**: Swipe and touch gesture recognition

## ⚡ Performance Optimizations

- **WebSocket Pooling**: Efficient connection management
- **Data Throttling**: Limit update frequency to prevent UI lag
- **Memoization**: React.memo and useMemo for expensive calculations
- **Lazy Loading**: Components loaded on demand
- **Bundle Optimization**: Code splitting and tree shaking

## 🚦 Testing

### Manual Testing Checklist

- [ ] Exchange connection and data loading
- [ ] WebSocket real-time updates
- [ ] Order simulation accuracy
- [ ] Impact calculation correctness
- [ ] Responsive design on multiple devices
- [ ] Error handling and recovery

### Testing Different Scenarios

1. **Network Issues**: Test offline/online scenarios
2. **Exchange Outages**: Simulate API failures
3. **Large Orders**: Test with orders exceeding available liquidity
4. **Market Conditions**: Test during high/low volatility periods

## 🔒 Security Considerations

- **No API Keys Required**: Uses public endpoints only
- **Rate Limiting**: Respects exchange rate limits
- **Data Validation**: Sanitizes all external data
- **XSS Protection**: Secure handling of user inputs
- **CORS Handling**: Proper cross-origin request management

## 📊 Limitations & Assumptions

### Current Limitations

- **Demo Purpose**: Not suitable for actual trading
- **Limited Symbols**: Subset of available trading pairs
- **No Authentication**: Public data only
- **Simulated Orders**: Orders are not actually placed

### Assumptions Made

- **Stable Internet**: Assumes reliable internet connection
- **Exchange APIs**: Assumes exchange API availability
- **Browser Support**: Modern browser with WebSocket support
- **JavaScript Enabled**: Requires JavaScript for functionality

## 🎯 **Bonus Features Implemented**

### **Advanced Market Analysis**
- **📊 Market Depth Visualization**: Interactive depth charts showing cumulative volume at price levels using Recharts
- **⚖️ Orderbook Imbalance Indicators**: Real-time analysis of bid/ask pressure, volume imbalance, and market sentiment
- **⚠️ Advanced Slippage Warnings**: Intelligent risk assessment with color-coded alerts and actionable recommendations
- **⏱️ Timing Scenario Comparison**: Side-by-side analysis of different execution timing strategies with volatility simulation

### **Enhanced User Experience**
- **🗂️ Multi-Tab Interface**: Professional navigation between Overview, Analysis, and Advanced features
- **📈 Real-Time Risk Assessment**: Dynamic risk scoring with comprehensive warnings and recommendations
- **🎯 Order Position Visualization**: Clear visual indicators showing where simulated orders would execute in the orderbook
- **💡 Smart Recommendations**: Context-aware suggestions for optimal execution based on market conditions

### **Professional Trading Interface**
- **📊 Interactive Charts**: Market depth visualization with hover tooltips and real-time updates
- **🔄 Dynamic Analysis**: Real-time recalculation of all metrics as orderbook data changes
- **🎨 Color-Coded Risk Levels**: Intuitive visual feedback for risk assessment (green/yellow/red indicators)
- **📱 Responsive Design**: Optimized for both desktop trading and mobile analysis

## 🛣️ Future Enhancements

### Potential Features

- **Historical Data**: Price history and volume analysis over time
- **Portfolio Simulation**: Multi-asset portfolio tracking and risk management
- **Advanced Orders**: Stop-loss and take-profit order simulations
- **Machine Learning**: Predictive analysis for market movement
- **Social Trading**: Community insights and shared strategies

### Technical Improvements

- **Unit Testing**: Comprehensive test suite for all components
- **E2E Testing**: Automated browser testing across exchanges
- **Performance Monitoring**: Real-time performance metrics and optimization
- **Caching Strategy**: Intelligent data caching for improved performance
- **Database Integration**: Historical data storage and analysis

## 📄 License

This project is provided for educational and demonstration purposes. Please refer to individual exchange API terms of service for usage restrictions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or issues:
1. Check the GitHub issues page
2. Review the API documentation
3. Test with different browsers/devices
4. Check network connectivity

---

**Note**: This application is for educational purposes only and should not be used for actual trading without proper testing and risk management. #   R e a l - T i m e - O r d e r b o o k - V i e w e r 
 
 
