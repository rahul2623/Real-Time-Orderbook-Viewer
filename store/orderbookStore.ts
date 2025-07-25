import { create } from 'zustand';
import { Orderbook, Venue, SimulatedOrder, OrderImpactMetrics, WebSocketConnection } from '@/types/orderbook';

interface OrderbookStore {
  // Orderbook data
  orderbooks: Record<string, Orderbook>; // key: `${venue}-${symbol}`
  
  // Selected state
  selectedVenue: Venue;
  selectedSymbol: string;
  
  // WebSocket connections
  connections: Record<string, WebSocketConnection>;
  
  // Simulated order
  simulatedOrder: SimulatedOrder | null;
  orderImpact: OrderImpactMetrics | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setOrderbook: (venue: Venue, symbol: string, orderbook: Orderbook) => void;
  setSelectedVenue: (venue: Venue) => void;
  setSelectedSymbol: (symbol: string) => void;
  setSimulatedOrder: (order: SimulatedOrder | null) => void;
  setOrderImpact: (impact: OrderImpactMetrics | null) => void;
  setConnection: (venue: Venue, symbol: string, connection: WebSocketConnection) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed getters
  getCurrentOrderbook: () => Orderbook | null;
  getConnectionStatus: (venue: Venue, symbol: string) => boolean;
}

export const useOrderbookStore = create<OrderbookStore>((set, get) => ({
  // Initial state
  orderbooks: {},
  selectedVenue: 'okx',
  selectedSymbol: 'BTC-USDT',
  connections: {},
  simulatedOrder: null,
  orderImpact: null,
  isLoading: false,
  error: null,

  // Actions
  setOrderbook: (venue, symbol, orderbook) =>
    set((state) => ({
      orderbooks: {
        ...state.orderbooks,
        [`${venue}-${symbol}`]: orderbook,
      },
    })),

  setSelectedVenue: (venue) => set({ selectedVenue: venue }),

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  setSimulatedOrder: (order) => set({ simulatedOrder: order }),

  setOrderImpact: (impact) => set({ orderImpact: impact }),

  setConnection: (venue, symbol, connection) =>
    set((state) => ({
      connections: {
        ...state.connections,
        [`${venue}-${symbol}`]: connection,
      },
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  // Computed getters
  getCurrentOrderbook: () => {
    const { orderbooks, selectedVenue, selectedSymbol } = get();
    return orderbooks[`${selectedVenue}-${selectedSymbol}`] || null;
  },

  getConnectionStatus: (venue, symbol) => {
    const { connections } = get();
    const connection = connections[`${venue}-${symbol}`];
    return connection?.connected || false;
  },
})); 