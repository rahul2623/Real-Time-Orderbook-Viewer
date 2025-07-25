'use client';

import React from 'react';
import { OrderImpactMetrics as IMetrics } from '@/types/orderbook';
import { AlertTriangle, Info, TrendingUp, Clock, Target, Zap, Activity, DollarSign } from 'lucide-react';
import classNames from 'classnames';

interface OrderImpactMetricsProps {
  metrics: IMetrics | null;
  isLoading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: 'green' | 'yellow' | 'red' | 'primary' | 'neutral';
  tooltip?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  icon,
  color,
  tooltip,
  trend
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-600/10 border-green-600/20 hover:border-green-600/40';
      case 'yellow':
        return 'bg-yellow-600/10 border-yellow-600/20 hover:border-yellow-600/40';
      case 'red':
        return 'bg-red-600/10 border-red-600/20 hover:border-red-600/40';
      case 'primary':
        return 'bg-primary-600/10 border-primary-600/20 hover:border-primary-600/40';
      default:
        return 'bg-slate-800 border-slate-700 hover:border-slate-600';
    }
  };

  const getValueColor = () => {
    switch (color) {
      case 'green': return 'text-green-400';
      case 'yellow': return 'text-yellow-400';
      case 'red': return 'text-red-400';
      case 'primary': return 'text-primary-400';
      default: return 'text-white';
    }
  };

  const getIconColor = () => {
    switch (color) {
      case 'green': return 'text-green-500';
      case 'yellow': return 'text-yellow-500';
      case 'red': return 'text-red-500';
      case 'primary': return 'text-primary-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className={classNames(
      'p-4 rounded-lg border transition-all duration-200 group cursor-default overflow-hidden',
      getColorClasses()
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={classNames('transition-colors flex-shrink-0', getIconColor())}>
            {icon}
          </div>
          <span className="text-sm font-medium text-slate-300 truncate">{title}</span>
        </div>
        {tooltip && (
          <Info className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>
      
      <div className={classNames('text-xl font-bold transition-colors break-words', getValueColor())}>
        {value}
      </div>
      {subValue && (
        <div className="text-sm text-slate-400 mt-1 break-words">{subValue}</div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-xs whitespace-normal text-center">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

const getImpactSeverity = (percentage: number): { color: 'green' | 'yellow' | 'red'; level: string } => {
  if (percentage <= 0.1) return { color: 'green', level: 'Low' };
  if (percentage <= 0.5) return { color: 'yellow', level: 'Medium' };
  return { color: 'red', level: 'High' };
};

const getSlippageSeverity = (percentage: number): { color: 'green' | 'yellow' | 'red'; level: string } => {
  if (percentage <= 0.05) return { color: 'green', level: 'Minimal' };
  if (percentage <= 0.2) return { color: 'yellow', level: 'Moderate' };
  return { color: 'red', level: 'Significant' };
};

const OrderImpactMetrics: React.FC<OrderImpactMetricsProps> = ({
  metrics,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-primary-600/10 rounded-lg border border-primary-600/20 flex-shrink-0">
              <Activity className="w-5 h-5 text-primary-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white truncate">Order Impact Analysis</h3>
              <p className="text-sm text-slate-400 truncate">Real-time execution metrics</p>
            </div>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-primary-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-primary-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Analyzing Market Impact</p>
          <p className="text-sm text-slate-500 mt-1">Calculating execution metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-primary-600/10 rounded-lg border border-primary-600/20 flex-shrink-0">
              <Activity className="w-5 h-5 text-primary-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white truncate">Order Impact Analysis</h3>
              <p className="text-sm text-slate-400 truncate">Real-time execution metrics</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-md border border-slate-700 flex-shrink-0">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span className="text-xs text-slate-500 whitespace-nowrap">Waiting</span>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 inline-block mb-4">
            <Target className="w-12 h-12 mx-auto text-slate-500" />
          </div>
          <p className="text-slate-300 font-medium mb-2">No Order Simulation Active</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed break-words">
            Create an order simulation using the form above to see detailed impact metrics and execution analysis
          </p>
        </div>
      </div>
    );
  }

  const marketImpactSeverity = getImpactSeverity(metrics.marketImpact);
  const slippageSeverity = getSlippageSeverity(metrics.slippage);
  
  const fillPercentageColor = metrics.estimatedFillPercentage >= 100 
    ? 'green' 
    : metrics.estimatedFillPercentage >= 50 
      ? 'yellow' 
      : 'red';

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-primary-600/10 rounded-lg border border-primary-600/20 flex-shrink-0">
            <Activity className="w-5 h-5 text-primary-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-white truncate">Order Impact Analysis</h3>
            <p className="text-sm text-slate-400 truncate">Real-time execution metrics</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-md border border-slate-700 flex-shrink-0">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400 whitespace-nowrap">Live Analysis</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 min-w-0">
        {/* Fill Percentage */}
        <MetricCard
          title="Fill Probability"
          value={`${metrics.estimatedFillPercentage.toFixed(1)}%`}
          icon={<Target className="w-5 h-5" />}
          color={fillPercentageColor}
          tooltip="Percentage of your order that can be filled at current market depth"
        />

        {/* Market Impact */}
        <MetricCard
          title="Market Impact"
          value={`${metrics.marketImpact.toFixed(3)}%`}
          subValue={`${marketImpactSeverity.level} Impact`}
          icon={<Zap className="w-5 h-5" />}
          color={marketImpactSeverity.color as any}
          tooltip="How much your order will move the market price"
        />

        {/* Slippage */}
        <MetricCard
          title="Price Slippage"
          value={`${metrics.slippage.toFixed(3)}%`}
          subValue={`${slippageSeverity.level} Risk`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={slippageSeverity.color as any}
          tooltip="Price difference between expected and actual execution price"
        />

        {/* Average Fill Price */}
        <MetricCard
          title="Average Fill Price"
          value={`$${metrics.averageFillPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="primary"
          tooltip="Average price at which your order would be filled"
        />

        {/* Time to Fill */}
        <MetricCard
          title="Execution Time"
          value={metrics.timeToFill !== undefined ? `${metrics.timeToFill}s` : 'Instant'}
          icon={<Clock className="w-5 h-5" />}
          color={metrics.timeToFill === undefined || metrics.timeToFill === 0 ? 'green' : 'yellow'}
          tooltip="Estimated time for your order to be completely filled"
        />

        {/* Worst Case */}
        <MetricCard
          title="Worst Case Price"
          value={`$${metrics.worstCase.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue={`${metrics.worstCase.slippage.toFixed(3)}% slippage`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          tooltip="Worst possible execution price and slippage for your order"
        />
      </div>

      {/* Summary and Recommendations */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overall Assessment */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors min-w-0">
            <div className="flex items-center gap-2 mb-3 min-w-0">
              <div className="p-1.5 bg-primary-600/10 rounded border border-primary-600/20 flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-primary-500" />
              </div>
              <h4 className="text-sm font-semibold text-white truncate">Market Assessment</h4>
            </div>
            <div className="text-sm min-w-0">
              {metrics.estimatedFillPercentage >= 100 ? (
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-green-400 leading-relaxed break-words min-w-0">
                    Your order can be fully filled with {slippageSeverity.level.toLowerCase()} slippage.
                  </p>
                </div>
              ) : metrics.estimatedFillPercentage >= 50 ? (
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-yellow-400 leading-relaxed break-words min-w-0">
                    Your order can be partially filled ({metrics.estimatedFillPercentage.toFixed(1)}%). Consider reducing size or using limit orders.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-red-400 leading-relaxed break-words min-w-0">
                    Limited liquidity available. Only {metrics.estimatedFillPercentage.toFixed(1)}% of your order can be filled.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors min-w-0">
            <div className="flex items-center gap-2 mb-3 min-w-0">
              <div className="p-1.5 bg-blue-600/10 rounded border border-blue-600/20 flex-shrink-0">
                <Info className="w-4 h-4 text-blue-500" />
              </div>
              <h4 className="text-sm font-semibold text-white truncate">Smart Recommendations</h4>
            </div>
            <div className="space-y-3 text-sm min-w-0">
              {metrics.marketImpact > 0.5 && (
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-300 leading-relaxed break-words min-w-0">Consider splitting your order into smaller sizes to reduce market impact</p>
                </div>
              )}
              {metrics.slippage > 0.2 && (
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-300 leading-relaxed break-words min-w-0">High slippage detected - consider using limit orders instead of market orders</p>
                </div>
              )}
              {metrics.estimatedFillPercentage < 100 && (
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-300 leading-relaxed break-words min-w-0">Insufficient liquidity - consider reducing order size or waiting for better market conditions</p>
                </div>
              )}
              {metrics.timeToFill && metrics.timeToFill > 5 && (
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-300 leading-relaxed break-words min-w-0">Order may take time to fill - consider using timing delays to avoid detection</p>
                </div>
              )}
              {metrics.marketImpact <= 0.1 && metrics.slippage <= 0.05 && (
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-green-400 leading-relaxed break-words min-w-0">Excellent execution conditions - minimal market impact expected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderImpactMetrics; 