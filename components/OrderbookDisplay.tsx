'use client';

import React from 'react';
import { Orderbook, OrderbookLevel, SimulatedOrder } from '@/types/orderbook';
import { OrderImpactCalculator } from '@/services/orderImpactCalculator';
import { MAX_ORDERBOOK_LEVELS } from '@/config/exchanges';
import classNames from 'classnames';

interface OrderbookDisplayProps {
  orderbook: Orderbook | null;
  simulatedOrder: SimulatedOrder | null;
  isLoading?: boolean;
}

interface OrderRowProps {
  level: OrderbookLevel;
  index: number;
  side: 'bid' | 'ask';
  maxTotal: number;
  isSimulatedOrder?: boolean;
  simulatedQuantity?: number;
}

const OrderRow: React.FC<OrderRowProps> = ({
  level,
  index,
  side,
  maxTotal,
  isSimulatedOrder = false,
  simulatedQuantity = 0,
}) => {
  const fillPercentage = (level.total / maxTotal) * 100;
  
  return (
    <div
      className={classNames(
        'orderbook-row relative',
        {
          'bid-row': side === 'bid',
          'ask-row': side === 'ask',
          'simulated-order': isSimulatedOrder,
        }
      )}
    >
      {/* Background fill bar */}
      <div
        className={classNames(
          'absolute inset-y-0 right-0 opacity-20',
          {
            'bg-green-500': side === 'bid',
            'bg-red-500': side === 'ask',
          }
        )}
        style={{ width: `${fillPercentage}%` }}
      />
      
      {/* Order data */}
      <div className="relative z-10 grid grid-cols-3 gap-4">
        <div className={classNames(
          'orderbook-cell text-right',
          {
            'text-green-400': side === 'bid',
            'text-red-400': side === 'ask',
          }
        )}>
          {level.price.toFixed(2)}
        </div>
        <div className="orderbook-cell text-right text-slate-300">
          {isSimulatedOrder 
            ? `${level.quantity.toFixed(4)} (+${simulatedQuantity.toFixed(4)})`
            : level.quantity.toFixed(4)
          }
        </div>
        <div className="orderbook-cell text-right text-slate-400">
          {level.total.toFixed(4)}
        </div>
      </div>
      
      {/* Simulated order indicator */}
      {isSimulatedOrder && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 animate-pulse" />
      )}
    </div>
  );
};

const OrderbookDisplay: React.FC<OrderbookDisplayProps> = ({
  orderbook,
  simulatedOrder,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded mb-4"></div>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-800 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!orderbook) {
    return (
      <div className="bg-slate-900 rounded-lg p-6 text-center">
        <p className="text-slate-400">No orderbook data available</p>
        <p className="text-sm text-slate-500 mt-2">
          Please select a venue and symbol to view orderbook
        </p>
      </div>
    );
  }

  const { bids, asks } = orderbook;
  
  // Limit to MAX_ORDERBOOK_LEVELS
  const displayBids = bids.slice(0, MAX_ORDERBOOK_LEVELS);
  const displayAsks = asks.slice(0, MAX_ORDERBOOK_LEVELS).reverse(); // Reverse for display
  
  // Calculate max total for scaling the fill bars
  const maxBidTotal = Math.max(...displayBids.map(b => b.total), 0);
  const maxAskTotal = Math.max(...displayAsks.map(a => a.total), 0);
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  // Find where the simulated order would sit
  let simulatedOrderPosition: { side: 'bid' | 'ask'; position: number } | null = null;
  if (simulatedOrder && orderbook.venue === simulatedOrder.venue) {
    const { position, isMarketPrice } = OrderImpactCalculator.findOrderPosition(orderbook, simulatedOrder);
    
    if (!isMarketPrice) {
      simulatedOrderPosition = {
        side: simulatedOrder.side === 'buy' ? 'bid' : 'ask',
        position,
      };
    }
  }

  // Calculate spread
  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0;

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">
          Orderbook - {orderbook.venue.toUpperCase()} - {orderbook.symbol}
        </h3>
        <div className="text-sm text-slate-400">
          <span>Spread: {spread.toFixed(2)} ({spreadPercentage.toFixed(3)}%)</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm font-medium text-slate-400 border-b border-slate-700 pb-2">
        <div className="text-right">Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (sells) - displayed top to bottom */}
      <div className="mb-4">
        <div className="text-xs text-red-400 mb-2 font-medium">ASKS</div>
        {displayAsks.map((ask, index) => {
          const actualIndex = displayAsks.length - 1 - index;
          const isSimulated = simulatedOrderPosition?.side === 'ask' && simulatedOrderPosition.position === actualIndex;
          
          return (
            <OrderRow
              key={`ask-${ask.price}-${index}`}
              level={ask}
              index={actualIndex}
              side="ask"
              maxTotal={maxTotal}
              isSimulatedOrder={isSimulated}
              simulatedQuantity={isSimulated ? simulatedOrder?.quantity || 0 : 0}
            />
          );
        })}
      </div>

      {/* Market spread indicator */}
      <div className="flex items-center justify-center py-3 my-4 bg-slate-800 rounded">
        <div className="text-center">
          <div className="text-xs text-slate-500">Market Spread</div>
          <div className="text-sm font-mono">
            <span className="text-green-400">{bestBid.toFixed(2)}</span>
            <span className="text-slate-400 mx-2">|</span>
            <span className="text-red-400">{bestAsk.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Bids (buys) - displayed top to bottom */}
      <div>
        <div className="text-xs text-green-400 mb-2 font-medium">BIDS</div>
        {displayBids.map((bid, index) => {
          const isSimulated = simulatedOrderPosition?.side === 'bid' && simulatedOrderPosition.position === index;
          
          return (
            <OrderRow
              key={`bid-${bid.price}-${index}`}
              level={bid}
              index={index}
              side="bid"
              maxTotal={maxTotal}
              isSimulatedOrder={isSimulated}
              simulatedQuantity={isSimulated ? simulatedOrder?.quantity || 0 : 0}
            />
          );
        })}
      </div>

      {/* Footer info */}
      <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-slate-500">
        <div className="flex justify-between">
          <span>Last updated: {new Date(orderbook.timestamp).toLocaleTimeString()}</span>
          <span>Levels: {Math.min(bids.length, asks.length, MAX_ORDERBOOK_LEVELS)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderbookDisplay; 