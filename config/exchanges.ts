import { ExchangeConfig, Venue } from '@/types/orderbook';

export const EXCHANGE_CONFIGS: Record<Venue, ExchangeConfig> = {
  okx: {
    name: 'OKX',
    baseUrl: 'https://www.okx.com/api/v5',
    wsUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    supportedSymbols: ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'ADA-USDT', 'DOT-USDT'],
    rateLimit: {
      requests: 20,
      window: 2000, // 2 seconds
    },
  },
  bybit: {
    name: 'Bybit',
    baseUrl: 'https://api.bybit.com/v5',
    wsUrl: 'wss://stream.bybit.com/v5/public/spot',
    supportedSymbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT'],
    rateLimit: {
      requests: 10,
      window: 1000, // 1 second
    },
  },
  deribit: {
    name: 'Deribit',
    baseUrl: 'https://www.deribit.com/api/v2',
    wsUrl: 'wss://www.deribit.com/ws/api/v2',
    supportedSymbols: ['BTC-PERPETUAL', 'ETH-PERPETUAL', 'SOL-PERPETUAL'],
    rateLimit: {
      requests: 20,
      window: 1000, // 1 second
    },
  },
};

// Symbol mapping between exchanges (to normalize symbol names)
export const SYMBOL_MAPPING: Record<Venue, Record<string, string>> = {
  okx: {
    'BTC-USDT': 'BTC-USDT',
    'ETH-USDT': 'ETH-USDT',
    'SOL-USDT': 'SOL-USDT',
    'ADA-USDT': 'ADA-USDT',
    'DOT-USDT': 'DOT-USDT',
  },
  bybit: {
    'BTC-USDT': 'BTCUSDT',
    'ETH-USDT': 'ETHUSDT',
    'SOL-USDT': 'SOLUSDT',
    'ADA-USDT': 'ADAUSDT',
    'DOT-USDT': 'DOTUSDT',
  },
  deribit: {
    'BTC-USDT': 'BTC-PERPETUAL',
    'ETH-USDT': 'ETH-PERPETUAL',
    'SOL-USDT': 'SOL-PERPETUAL',
  },
};

export const AVAILABLE_SYMBOLS = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'ADA-USDT', 'DOT-USDT'];

export const TIMING_OPTIONS = [
  { label: 'Immediate', value: 0 },
  { label: '5 seconds', value: 5 },
  { label: '10 seconds', value: 10 },
  { label: '30 seconds', value: 30 },
];

export const MAX_ORDERBOOK_LEVELS = 15; 