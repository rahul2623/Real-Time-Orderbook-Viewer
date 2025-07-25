'use client';

import React, { useState, useEffect } from 'react';
import { useOrderbookStore } from '@/store/orderbookStore';
import { useOrderbookData } from '@/hooks/useOrderbookData';
import { OrderImpactCalculator } from '@/services/orderImpactCalculator';
import { SimulatedOrder, OrderImpactMetrics } from '@/types/orderbook';

import OrderbookDisplay from '@/components/OrderbookDisplay';
import OrderSimulationForm from '@/components/OrderSimulationForm';
import OrderImpactMetricsComponent from '@/components/OrderImpactMetrics';
import VenueSelector from '@/components/VenueSelector';
import MarketDepthChart from '@/components/MarketDepthChart';
import OrderbookImbalance from '@/components/OrderbookImbalance';
import SlippageWarnings from '@/components/SlippageWarnings';
import TimingComparison from '@/components/TimingComparison';

import { TrendingUp, AlertCircle, Wifi, BarChart, Layers, Activity } from 'lucide-react';

export default function HomePage() {
  const store = useOrderbookStore();
  const {
    orderbook,
    selectedVenue,
    selectedSymbol,
    isLoading,
    error,
    connectionStatuses,
    switchMarket,
    refreshConnection,
  } = useOrderbookData();

  const [simulatedOrder, setSimulatedOrder] = useState<SimulatedOrder | null>(null);
  const [orderImpact, setOrderImpact] = useState<OrderImpactMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'advanced'>('overview');

  // Update store state when selections change
  const handleVenueChange = (venue: any) => {
    store.setSelectedVenue(venue);
    switchMarket(venue, selectedSymbol);
  };

  const handleSymbolChange = (symbol: string) => {
    store.setSelectedSymbol(symbol);
    switchMarket(selectedVenue, symbol);
  };

  // Handle order simulation changes
  const handleOrderChange = (order: SimulatedOrder | null) => {
    setSimulatedOrder(order);
    store.setSimulatedOrder(order);
    
    if (order && orderbook) {
      const impact = OrderImpactCalculator.calculateOrderImpact(orderbook, order);
      setOrderImpact(impact);
      store.setOrderImpact(impact);
    } else {
      setOrderImpact(null);
      store.setOrderImpact(null);
    }
  };

  // Recalculate impact when orderbook updates
  useEffect(() => {
    if (simulatedOrder && orderbook && orderbook.venue === simulatedOrder.venue) {
      const impact = OrderImpactCalculator.calculateOrderImpact(orderbook, simulatedOrder);
      setOrderImpact(impact);
      store.setOrderImpact(impact);
    } else {
      setOrderImpact(null);
      store.setOrderImpact(null);
    }
  }, [orderbook, simulatedOrder]);

  // Get current market price for the form
  const getCurrentPrice = () => {
    if (!orderbook || !orderbook.bids.length || !orderbook.asks.length) {
      return undefined;
    }
    
    const bestBid = orderbook.bids[0].price;
    const bestAsk = orderbook.asks[0].price;
    return (bestBid + bestAsk) / 2; // Mid price
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart className="w-4 h-4" /> },
    { id: 'analysis', label: 'Analysis', icon: <Activity className="w-4 h-4" /> },
    { id: 'advanced', label: 'Advanced', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary-500" />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Real-Time Orderbook Viewer
                </h1>
                <p className="text-sm text-slate-400">
                  Multi-venue order simulation and market impact analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection status */}
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">
                  {Object.values(connectionStatuses).filter(Boolean).length}/3 Connected
                </span>
              </div>
              
              {/* Current market */}
              <div className="text-sm text-slate-300">
                {selectedVenue.toUpperCase()} • {selectedSymbol}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/20 border-b border-red-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
              <button
                onClick={() => store.setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Section - Market Selection & Orderbook */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Market Selection & Order Form */}
              <div className="lg:col-span-1 space-y-6">
                {/* Venue Selector */}
                <VenueSelector
                  selectedVenue={selectedVenue}
                  selectedSymbol={selectedSymbol}
                  onVenueChange={handleVenueChange}
                  onSymbolChange={handleSymbolChange}
                  connectionStatus={connectionStatuses}
                  onRefresh={refreshConnection}
                  isLoading={isLoading}
                />

                {/* Order Simulation Form */}
                <OrderSimulationForm
                  onOrderChange={handleOrderChange}
                  currentVenue={selectedVenue}
                  currentSymbol={selectedSymbol}
                  currentPrice={getCurrentPrice()}
                />
              </div>

              {/* Right Section - Orderbook */}
              <div className="lg:col-span-2">
                <OrderbookDisplay
                  orderbook={orderbook}
                  simulatedOrder={simulatedOrder}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Bottom Section - Order Impact Analysis (Centered) */}
            <div className="max-w-4xl mx-auto">
              <OrderImpactMetricsComponent
                metrics={orderImpact}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-8">
            {/* Market Depth Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="xl:col-span-2">
                <MarketDepthChart
                  orderbook={orderbook}
                  simulatedOrder={simulatedOrder}
                  height={350}
                />
              </div>
            </div>

            {/* Imbalance and Warnings */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <OrderbookImbalance orderbook={orderbook} />
              <SlippageWarnings
                metrics={orderImpact}
                simulatedOrder={simulatedOrder}
                orderbook={orderbook}
              />
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-8">
            {/* Timing Comparison */}
            <TimingComparison
              simulatedOrder={simulatedOrder}
              orderbook={orderbook}
            />

            {/* Combined Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Enhanced Orderbook with Depth Chart */}
              <div className="space-y-6">
                <OrderbookDisplay
                  orderbook={orderbook}
                  simulatedOrder={simulatedOrder}
                  isLoading={isLoading}
                />
                <OrderbookImbalance orderbook={orderbook} />
              </div>

              {/* Right: Risk Analysis */}
              <div className="space-y-6">
                <OrderImpactMetricsComponent
                  metrics={orderImpact}
                  isLoading={isLoading}
                />
                <SlippageWarnings
                  metrics={orderImpact}
                  simulatedOrder={simulatedOrder}
                  orderbook={orderbook}
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional Information - Only shown in Overview */}
        {activeTab === 'overview' && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Market Information */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Market Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Venue:</span>
                  <span className="text-white">{selectedVenue.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Symbol:</span>
                  <span className="text-white">{selectedSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={connectionStatuses[selectedVenue] ? 'text-green-400' : 'text-red-400'}>
                    {connectionStatuses[selectedVenue] ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {orderbook && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Best Bid:</span>
                      <span className="text-green-400">
                        ${orderbook.bids[0]?.price?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Best Ask:</span>
                      <span className="text-red-400">
                        ${orderbook.asks[0]?.price?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Enhanced Features */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Enhanced Features</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Real-time market depth visualization</li>
                <li>• Orderbook imbalance analysis</li>
                <li>• Advanced slippage warnings</li>
                <li>• Timing scenario comparison</li>
                <li>• Risk assessment & recommendations</li>
                <li>• Multi-tab professional interface</li>
              </ul>
            </div>

            {/* Instructions */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Navigation Guide</h3>
              <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
                <li><strong>Overview:</strong> Basic orderbook and simulation</li>
                <li><strong>Analysis:</strong> Market depth and imbalance charts</li>
                <li><strong>Advanced:</strong> Timing comparison and risk analysis</li>
                <li>Switch between tabs to explore different features</li>
                <li>Create order simulations to see live analysis</li>
                <li>Monitor real-time data and connection status</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-400">
            <p>Enhanced Real-Time Orderbook Viewer with Advanced Analytics</p>
            <p className="mt-2 text-sm">
              Features: Market Depth Visualization • Imbalance Analysis • Risk Warnings • Timing Comparison
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 