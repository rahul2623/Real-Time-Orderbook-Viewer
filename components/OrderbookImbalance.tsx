'use client';

import React, { useMemo } from 'react';
import { Orderbook } from '@/types/orderbook';
import { Scale, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import classNames from 'classnames';

interface OrderbookImbalanceProps {
  orderbook: Orderbook | null;
}

interface ImbalanceMetrics {
  volumeImbalance: number; // Percentage (-100 to 100, positive = more bids)
  priceImbalance: number; // Price-weighted imbalance
  levelImbalance: number; // Count-based imbalance
  bidVolume: number;
  askVolume: number;
  bidLevels: number;
  askLevels: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: 'weak' | 'moderate' | 'strong';
}

const OrderbookImbalance: React.FC<OrderbookImbalanceProps> = ({ orderbook }) => {
  const imbalanceMetrics = useMemo((): ImbalanceMetrics | null => {
    if (!orderbook || !orderbook.bids.length || !orderbook.asks.length) {
      return null;
    }

    const { bids, asks } = orderbook;
    
    // Calculate total volumes
    const bidVolume = bids.reduce((sum, bid) => sum + bid.quantity, 0);
    const askVolume = asks.reduce((sum, ask) => sum + ask.quantity, 0);
    const totalVolume = bidVolume + askVolume;
    
    // Volume imbalance (-100 to 100)
    const volumeImbalance = totalVolume > 0 
      ? ((bidVolume - askVolume) / totalVolume) * 100 
      : 0;

    // Price-weighted imbalance (considers price levels)
    const bidWeightedVolume = bids.reduce((sum, bid) => sum + (bid.quantity * bid.price), 0);
    const askWeightedVolume = asks.reduce((sum, ask) => sum + (ask.quantity * ask.price), 0);
    const totalWeightedVolume = bidWeightedVolume + askWeightedVolume;
    
    const priceImbalance = totalWeightedVolume > 0
      ? ((bidWeightedVolume - askWeightedVolume) / totalWeightedVolume) * 100
      : 0;

    // Level count imbalance
    const bidLevels = bids.length;
    const askLevels = asks.length;
    const totalLevels = bidLevels + askLevels;
    
    const levelImbalance = totalLevels > 0
      ? ((bidLevels - askLevels) / totalLevels) * 100
      : 0;

    // Determine sentiment
    const avgImbalance = (volumeImbalance + priceImbalance + levelImbalance) / 3;
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength: 'weak' | 'moderate' | 'strong' = 'weak';

    if (Math.abs(avgImbalance) > 20) {
      strength = 'strong';
    } else if (Math.abs(avgImbalance) > 10) {
      strength = 'moderate';
    }

    if (avgImbalance > 5) {
      sentiment = 'bullish';
    } else if (avgImbalance < -5) {
      sentiment = 'bearish';
    }

    return {
      volumeImbalance,
      priceImbalance,
      levelImbalance,
      bidVolume,
      askVolume,
      bidLevels,
      askLevels,
      sentiment,
      strength,
    };
  }, [orderbook]);

  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const getImbalanceColor = (value: number) => {
    if (value > 10) return 'text-green-400';
    if (value < -10) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getImbalanceBarWidth = (value: number) => {
    return Math.min(Math.abs(value), 100);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Scale className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-400';
      case 'bearish':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  if (!imbalanceMetrics) {
    return (
      <div className="bg-slate-900 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Orderbook Imbalance</h3>
        </div>
        <div className="text-center text-slate-400">
          <p>No orderbook data available</p>
        </div>
      </div>
    );
  }

  const {
    volumeImbalance,
    priceImbalance,
    levelImbalance,
    bidVolume,
    askVolume,
    bidLevels,
    askLevels,
    sentiment,
    strength,
  } = imbalanceMetrics;

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Orderbook Imbalance</h3>
        </div>
        <div className="flex items-center gap-2">
          {getSentimentIcon(sentiment)}
          <span className={classNames('text-sm font-medium', getSentimentColor(sentiment))}>
            {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
          </span>
        </div>
      </div>

      {/* Overall Sentiment */}
      <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Market Sentiment</span>
          <div className="flex items-center gap-2">
            <span className={classNames('text-sm', getSentimentColor(sentiment))}>
              {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
            </span>
            <span className="text-xs text-slate-500">({strength})</span>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          {sentiment === 'bullish' && 'More buying pressure detected - bids outweigh asks'}
          {sentiment === 'bearish' && 'More selling pressure detected - asks outweigh bids'}
          {sentiment === 'neutral' && 'Balanced market - similar bid and ask pressure'}
        </div>
      </div>

      {/* Imbalance Metrics */}
      <div className="space-y-4">
        {/* Volume Imbalance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Volume Imbalance</span>
            <span className={classNames('text-sm font-mono', getImbalanceColor(volumeImbalance))}>
              {volumeImbalance > 0 ? '+' : ''}{volumeImbalance.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={classNames('absolute top-0 h-full transition-all duration-300', {
                'bg-green-500 left-1/2': volumeImbalance > 0,
                'bg-red-500 right-1/2': volumeImbalance < 0,
                'bg-yellow-500 left-1/2': volumeImbalance === 0,
              })}
              style={{
                width: `${getImbalanceBarWidth(volumeImbalance)}%`,
              }}
            />
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-600"></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Bids: {formatVolume(bidVolume)}</span>
            <span>Asks: {formatVolume(askVolume)}</span>
          </div>
        </div>

        {/* Price-Weighted Imbalance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-slate-300">Price-Weighted</span>
              <Info className="w-3 h-3 text-slate-500" />
            </div>
            <span className={classNames('text-sm font-mono', getImbalanceColor(priceImbalance))}>
              {priceImbalance > 0 ? '+' : ''}{priceImbalance.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={classNames('absolute top-0 h-full transition-all duration-300', {
                'bg-green-500 left-1/2': priceImbalance > 0,
                'bg-red-500 right-1/2': priceImbalance < 0,
                'bg-yellow-500 left-1/2': priceImbalance === 0,
              })}
              style={{
                width: `${getImbalanceBarWidth(priceImbalance)}%`,
              }}
            />
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-600"></div>
          </div>
        </div>

        {/* Level Count Imbalance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Level Count</span>
            <span className={classNames('text-sm font-mono', getImbalanceColor(levelImbalance))}>
              {levelImbalance > 0 ? '+' : ''}{levelImbalance.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={classNames('absolute top-0 h-full transition-all duration-300', {
                'bg-green-500 left-1/2': levelImbalance > 0,
                'bg-red-500 right-1/2': levelImbalance < 0,
                'bg-yellow-500 left-1/2': levelImbalance === 0,
              })}
              style={{
                width: `${getImbalanceBarWidth(levelImbalance)}%`,
              }}
            />
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-600"></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Bid Levels: {bidLevels}</span>
            <span>Ask Levels: {askLevels}</span>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Interpretation</h4>
        <div className="space-y-2 text-xs text-slate-400">
          {Math.abs(volumeImbalance) > 20 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>
                Strong {volumeImbalance > 0 ? 'buying' : 'selling'} pressure detected. 
                Consider market impact when placing large orders.
              </span>
            </div>
          )}
          {Math.abs(priceImbalance) > 15 && (
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
              <span>
                Price-weighted imbalance suggests {priceImbalance > 0 ? 'higher' : 'lower'} 
                value orders on the {priceImbalance > 0 ? 'bid' : 'ask'} side.
              </span>
            </div>
          )}
          {Math.abs(levelImbalance) > 10 && (
            <div className="flex items-start gap-2">
              <Scale className="w-3 h-3 text-primary-400 mt-0.5 flex-shrink-0" />
              <span>
                More order levels on the {levelImbalance > 0 ? 'bid' : 'ask'} side 
                indicates deeper {levelImbalance > 0 ? 'support' : 'resistance'}.
              </span>
            </div>
          )}
          {Math.abs(volumeImbalance) <= 10 && Math.abs(priceImbalance) <= 10 && (
            <div className="flex items-start gap-2">
              <Scale className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                Market appears well-balanced with relatively equal bid and ask pressure.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Information */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-md">
        <p className="text-xs text-slate-400">
          💡 Imbalance indicators help assess market sentiment. Positive values favor buying pressure, 
          negative values indicate selling pressure. Use with other indicators for better insights.
        </p>
      </div>
    </div>
  );
};

export default OrderbookImbalance; 