'use client';

import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { Orderbook, OrderbookLevel, SimulatedOrder, MarketDepth } from '@/types/orderbook';
import { TrendingUp } from 'lucide-react';

interface MarketDepthChartProps {
  orderbook: Orderbook | null;
  simulatedOrder: SimulatedOrder | null;
  height?: number;
}

interface DepthChartData {
  price: number;
  bidDepth: number;
  askDepth: number;
  bidVolume: number;
  askVolume: number;
  totalBidVolume: number;
  totalAskVolume: number;
}

const MarketDepthChart: React.FC<MarketDepthChartProps> = ({
  orderbook,
  simulatedOrder,
  height = 400,
}) => {
  const depthData = useMemo(() => {
    if (!orderbook || !orderbook.bids.length || !orderbook.asks.length) {
      return [];
    }

    const { bids, asks } = orderbook;
    
    // Get price range for visualization
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    const priceRange = bestAsk - bestBid;
    const priceStep = priceRange / 50; // 50 data points
    
    // Create price levels
    const minPrice = bestBid - (priceRange * 0.05);
    const maxPrice = bestAsk + (priceRange * 0.05);
    
    const data: DepthChartData[] = [];
    
    // Calculate cumulative depths
    for (let price = minPrice; price <= maxPrice; price += priceStep) {
      let bidDepth = 0;
      let askDepth = 0;
      let bidVolume = 0;
      let askVolume = 0;
      
      // Calculate bid depth (cumulative volume for prices >= current price)
      for (const bid of bids) {
        if (bid.price >= price) {
          bidDepth += bid.quantity;
          bidVolume = bidDepth;
        }
      }
      
      // Calculate ask depth (cumulative volume for prices <= current price)
      for (const ask of asks) {
        if (ask.price <= price) {
          askDepth += ask.quantity;
          askVolume = askDepth;
        }
      }
      
      data.push({
        price,
        bidDepth,
        askDepth,
        bidVolume,
        askVolume,
        totalBidVolume: bidDepth,
        totalAskVolume: askDepth,
      });
    }
    
    return data;
  }, [orderbook]);

  const simulatedOrderPrice = useMemo(() => {
    if (!simulatedOrder || simulatedOrder.type === 'market') {
      return null;
    }
    return simulatedOrder.price;
  }, [simulatedOrder]);

  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(2);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm">{`Price: ${formatPrice(label)}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === 'bidDepth' 
                ? `Bid Volume: ${formatVolume(entry.value)}`
                : `Ask Volume: ${formatVolume(entry.value)}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!orderbook || depthData.length === 0) {
    return (
      <div className="bg-slate-900 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Market Depth Chart</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-slate-400">
          <p>No orderbook data available for depth visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Market Depth Chart</h3>
        </div>
        <div className="text-sm text-slate-400">
          {orderbook.venue.toUpperCase()} • {orderbook.symbol}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={depthData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="price" 
              tickFormatter={formatPrice}
              stroke="#9ca3af"
              fontSize={12}
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis 
              tickFormatter={formatVolume}
              stroke="#9ca3af"
              fontSize={12}
              tick={{ fill: '#9ca3af' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Bid depth area (green) */}
            <Area
              type="stepAfter"
              dataKey="bidDepth"
              stackId="1"
              stroke="#22c55e"
              fill="url(#bidGradient)"
              strokeWidth={2}
            />
            
            {/* Ask depth area (red) */}
            <Area
              type="stepBefore"
              dataKey="askDepth"
              stackId="2"
              stroke="#ef4444"
              fill="url(#askGradient)"
              strokeWidth={2}
            />
            
            {/* Simulated order price line */}
            {simulatedOrderPrice && (
              <ReferenceLine 
                x={simulatedOrderPrice} 
                stroke="#fbbf24" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ 
                  value: "Order Price", 
                  position: "top",
                  fill: "#fbbf24",
                  fontSize: 12
                }}
              />
            )}
            
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Information */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Legend */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-slate-300">Bid Depth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-slate-300">Ask Depth</span>
          </div>
          {simulatedOrderPrice && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-yellow-500 rounded"></div>
              <span className="text-sm text-slate-300">Order Price</span>
            </div>
          )}
        </div>

        {/* Market Info */}
        <div className="text-sm text-slate-400">
          <div className="flex justify-between">
            <span>Total Bid Volume:</span>
            <span className="text-green-400">
              {formatVolume(depthData.reduce((sum, d) => Math.max(sum, d.bidDepth), 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Ask Volume:</span>
            <span className="text-red-400">
              {formatVolume(depthData.reduce((sum, d) => Math.max(sum, d.askDepth), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-md">
        <p className="text-xs text-slate-400">
          💡 The depth chart shows cumulative volume at different price levels. 
          Steeper curves indicate less liquidity, while flatter areas show deeper markets.
        </p>
      </div>
    </div>
  );
};

export default MarketDepthChart; 