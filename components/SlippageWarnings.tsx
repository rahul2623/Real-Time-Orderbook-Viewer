'use client';

import React, { useMemo } from 'react';
import { OrderImpactMetrics, SimulatedOrder, Orderbook } from '@/types/orderbook';
import { AlertTriangle, AlertCircle, Shield, TrendingDown, Info } from 'lucide-react';
import classNames from 'classnames';

interface SlippageWarningsProps {
  metrics: OrderImpactMetrics | null;
  simulatedOrder: SimulatedOrder | null;
  orderbook: Orderbook | null;
}

interface Warning {
  type: 'critical' | 'warning' | 'info';
  icon: React.ReactNode;
  title: string;
  message: string;
  recommendation?: string;
}

const SlippageWarnings: React.FC<SlippageWarningsProps> = ({
  metrics,
  simulatedOrder,
  orderbook,
}) => {
  const warnings = useMemo((): Warning[] => {
    const warningList: Warning[] = [];

    if (!metrics || !simulatedOrder || !orderbook) {
      return warningList;
    }

    // Critical slippage warning
    if (metrics.slippage > 1.0) {
      warningList.push({
        type: 'critical',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'High Slippage Risk',
        message: `Your order may experience ${metrics.slippage.toFixed(2)}% slippage, significantly above the 1% threshold.`,
        recommendation: 'Consider reducing order size or using limit orders to control execution price.',
      });
    } else if (metrics.slippage > 0.5) {
      warningList.push({
        type: 'warning',
        icon: <AlertCircle className="w-4 h-4" />,
        title: 'Moderate Slippage Expected',
        message: `Expected slippage of ${metrics.slippage.toFixed(2)}% is above normal market conditions.`,
        recommendation: 'Monitor market depth and consider smaller order sizes.',
      });
    }

    // Market impact warning
    if (metrics.marketImpact > 2.0) {
      warningList.push({
        type: 'critical',
        icon: <TrendingDown className="w-4 h-4" />,
        title: 'Significant Market Impact',
        message: `Your order will likely move the market price by ${metrics.marketImpact.toFixed(2)}%.`,
        recommendation: 'Consider breaking the order into smaller chunks or using TWAP strategies.',
      });
    } else if (metrics.marketImpact > 1.0) {
      warningList.push({
        type: 'warning',
        icon: <TrendingDown className="w-4 h-4" />,
        title: 'Notable Market Impact',
        message: `Market price may move by ${metrics.marketImpact.toFixed(2)}% due to your order.`,
        recommendation: 'Consider timing your order or splitting into multiple transactions.',
      });
    }

    // Partial fill warning
    if (metrics.estimatedFillPercentage < 100) {
      const unfillablePercentage = 100 - metrics.estimatedFillPercentage;
      
      if (unfillablePercentage > 50) {
        warningList.push({
          type: 'critical',
          icon: <AlertTriangle className="w-4 h-4" />,
          title: 'Insufficient Liquidity',
          message: `Only ${metrics.estimatedFillPercentage.toFixed(1)}% of your order can be filled at current market depth.`,
          recommendation: 'Reduce order size or wait for better market conditions.',
        });
      } else if (unfillablePercentage > 20) {
        warningList.push({
          type: 'warning',
          icon: <AlertCircle className="w-4 h-4" />,
          title: 'Limited Liquidity',
          message: `${unfillablePercentage.toFixed(1)}% of your order may remain unfilled.`,
          recommendation: 'Consider adjusting order size or using limit orders.',
        });
      }
    }

    // Time to fill warning
    if (metrics.timeToFill && metrics.timeToFill > 30) {
      warningList.push({
        type: 'warning',
        icon: <AlertCircle className="w-4 h-4" />,
        title: 'Slow Fill Expected',
        message: `Your order may take approximately ${metrics.timeToFill} seconds to complete.`,
        recommendation: 'Consider market volatility risk during execution period.',
      });
    }

    // Large order vs available liquidity
    if (orderbook && simulatedOrder) {
      const relevantSide = simulatedOrder.side === 'buy' ? orderbook.asks : orderbook.bids;
      const totalLiquidity = relevantSide.reduce((sum, level) => sum + level.quantity, 0);
      const orderPercentage = (simulatedOrder.quantity / totalLiquidity) * 100;

      if (orderPercentage > 50) {
        warningList.push({
          type: 'critical',
          icon: <AlertTriangle className="w-4 h-4" />,
          title: 'Order Size vs Liquidity',
          message: `Your order represents ${orderPercentage.toFixed(1)}% of available ${simulatedOrder.side === 'buy' ? 'ask' : 'bid'} liquidity.`,
          recommendation: 'This large order relative to market depth will likely cause significant price impact.',
        });
      } else if (orderPercentage > 20) {
        warningList.push({
          type: 'warning',
          icon: <Info className="w-4 h-4" />,
          title: 'Large Order Alert',
          message: `Your order is ${orderPercentage.toFixed(1)}% of available liquidity on the ${simulatedOrder.side === 'buy' ? 'ask' : 'bid'} side.`,
          recommendation: 'Monitor execution carefully for price movement.',
        });
      }
    }

    // Worst case scenario warning
    if (metrics.worstCase.slippage > 2.0) {
      warningList.push({
        type: 'critical',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Worst Case Scenario',
        message: `In worst case, you could experience ${metrics.worstCase.slippage.toFixed(2)}% slippage.`,
        recommendation: 'Set strict stop-loss limits or use limit orders for protection.',
      });
    }

    // Positive scenarios
    if (warningList.length === 0) {
      warningList.push({
        type: 'info',
        icon: <Shield className="w-4 h-4" />,
        title: 'Optimal Execution Conditions',
        message: 'Your order shows minimal slippage and market impact risk.',
        recommendation: 'Current market conditions are favorable for execution.',
      });
    }

    return warningList;
  }, [metrics, simulatedOrder, orderbook]);

  const getWarningColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-900/20';
      default:
        return 'border-blue-500 bg-blue-900/20';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const getTitleColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-300';
      case 'warning':
        return 'text-yellow-300';
      default:
        return 'text-blue-300';
    }
  };

  if (!metrics || !simulatedOrder) {
    return (
      <div className="bg-slate-900 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Slippage & Risk Warnings</h3>
        </div>
        <div className="text-center text-slate-400">
          <p>Create an order simulation to see risk warnings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Risk Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={classNames('w-3 h-3 rounded-full', {
            'bg-red-500': warnings.some(w => w.type === 'critical'),
            'bg-yellow-500': warnings.some(w => w.type === 'warning') && !warnings.some(w => w.type === 'critical'),
            'bg-green-500': !warnings.some(w => w.type === 'critical' || w.type === 'warning'),
          })} />
          <span className="text-sm text-slate-400">
            {warnings.some(w => w.type === 'critical') ? 'High Risk' : 
             warnings.some(w => w.type === 'warning') ? 'Medium Risk' : 'Low Risk'}
          </span>
        </div>
      </div>

      {/* Warnings List */}
      <div className="space-y-4">
        {warnings.map((warning, index) => (
          <div
            key={index}
            className={classNames(
              'p-4 border rounded-lg',
              getWarningColor(warning.type)
            )}
          >
            <div className="flex items-start gap-3">
              <div className={classNames('mt-0.5', getIconColor(warning.type))}>
                {warning.icon}
              </div>
              <div className="flex-1">
                <h4 className={classNames('font-medium text-sm mb-1', getTitleColor(warning.type))}>
                  {warning.title}
                </h4>
                <p className="text-sm text-slate-300 mb-2">
                  {warning.message}
                </p>
                {warning.recommendation && (
                  <div className="text-xs text-slate-400 bg-slate-800/50 rounded p-2">
                    <strong>Recommendation:</strong> {warning.recommendation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Summary */}
      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Risk Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Slippage Risk:</span>
            <span className={classNames('ml-2 font-mono', {
              'text-red-400': metrics.slippage > 1.0,
              'text-yellow-400': metrics.slippage > 0.5,
              'text-green-400': metrics.slippage <= 0.5,
            })}>
              {metrics.slippage.toFixed(3)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400">Market Impact:</span>
            <span className={classNames('ml-2 font-mono', {
              'text-red-400': metrics.marketImpact > 2.0,
              'text-yellow-400': metrics.marketImpact > 1.0,
              'text-green-400': metrics.marketImpact <= 1.0,
            })}>
              {metrics.marketImpact.toFixed(3)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400">Fill Rate:</span>
            <span className={classNames('ml-2 font-mono', {
              'text-red-400': metrics.estimatedFillPercentage < 50,
              'text-yellow-400': metrics.estimatedFillPercentage < 80,
              'text-green-400': metrics.estimatedFillPercentage >= 80,
            })}>
              {metrics.estimatedFillPercentage.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400">Execution Time:</span>
            <span className="ml-2 font-mono text-slate-300">
              {metrics.timeToFill ? `${metrics.timeToFill}s` : 'Instant'}
            </span>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-md">
        <p className="text-xs text-slate-400">
          💡 Risk warnings help you understand potential execution challenges. 
          Consider market conditions, timing, and order size when making trading decisions.
        </p>
      </div>
    </div>
  );
};

export default SlippageWarnings; 