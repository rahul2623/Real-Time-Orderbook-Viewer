'use client';

import React, { useState, useMemo } from 'react';
import { SimulatedOrder, OrderImpactMetrics, Orderbook } from '@/types/orderbook';
import { OrderImpactCalculator } from '@/services/orderImpactCalculator';
import { TIMING_OPTIONS } from '@/config/exchanges';
import { Clock, TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import classNames from 'classnames';

interface TimingComparisonProps {
  simulatedOrder: SimulatedOrder | null;
  orderbook: Orderbook | null;
}

interface TimingScenario {
  timing: number;
  label: string;
  metrics: OrderImpactMetrics;
  volatilityAdjustment: number; // Simulated price movement over time
}

const TimingComparison: React.FC<TimingComparisonProps> = ({
  simulatedOrder,
  orderbook,
}) => {
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>([0, 5, 10, 30]);

  // Simulate market volatility over time (simplified model)
  const simulateVolatility = (delaySeconds: number): number => {
    // Simple volatility model: price can move ±0.1% per 10 seconds
    const volatilityRate = 0.001; // 0.1% per 10 seconds
    const timeEffect = delaySeconds / 10;
    return Math.random() * volatilityRate * timeEffect * 2 - volatilityRate * timeEffect;
  };

  const scenarios = useMemo((): TimingScenario[] => {
    if (!simulatedOrder || !orderbook) {
      return [];
    }

    return selectedScenarios.map(timing => {
      const timingOption = TIMING_OPTIONS.find(opt => opt.value === timing);
      const volatilityAdjustment = simulateVolatility(timing);
      
      // Create a modified orderbook to simulate market movement
      const modifiedOrderbook = { ...orderbook };
      
      if (volatilityAdjustment !== 0) {
        // Simulate price movement by adjusting order levels
        const adjustment = volatilityAdjustment;
        modifiedOrderbook.bids = orderbook.bids.map(bid => ({
          ...bid,
          price: bid.price * (1 + adjustment),
        }));
        modifiedOrderbook.asks = orderbook.asks.map(ask => ({
          ...ask,
          price: ask.price * (1 + adjustment),
        }));
      }

      const metrics = OrderImpactCalculator.calculateOrderImpact(modifiedOrderbook, simulatedOrder);

      return {
        timing,
        label: timingOption?.label || `${timing}s`,
        metrics,
        volatilityAdjustment: volatilityAdjustment * 100, // Convert to percentage
      };
    });
  }, [simulatedOrder, orderbook, selectedScenarios]);

  const handleScenarioToggle = (timing: number) => {
    setSelectedScenarios(prev => {
      if (prev.includes(timing)) {
        return prev.filter(t => t !== timing);
      } else if (prev.length < 4) {
        return [...prev, timing].sort((a, b) => a - b);
      }
      return prev;
    });
  };

  const formatMetric = (value: number, suffix: string = '%') => {
    return `${value.toFixed(2)}${suffix}`;
  };

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value > thresholds.critical) return 'text-red-400';
    if (value > thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getBestScenario = () => {
    if (scenarios.length === 0) return null;
    
    return scenarios.reduce((best, current) => {
      const bestScore = best.metrics.slippage + best.metrics.marketImpact;
      const currentScore = current.metrics.slippage + current.metrics.marketImpact;
      return currentScore < bestScore ? current : best;
    });
  };

  const getWorstScenario = () => {
    if (scenarios.length === 0) return null;
    
    return scenarios.reduce((worst, current) => {
      const worstScore = worst.metrics.slippage + worst.metrics.marketImpact;
      const currentScore = current.metrics.slippage + current.metrics.marketImpact;
      return currentScore > worstScore ? current : worst;
    });
  };

  if (!simulatedOrder || !orderbook) {
    return (
      <div className="bg-slate-900 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Timing Scenario Comparison</h3>
        </div>
        <div className="text-center text-slate-400">
          <p>Create an order simulation to compare timing scenarios</p>
        </div>
      </div>
    );
  }

  const bestScenario = getBestScenario();
  const worstScenario = getWorstScenario();

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-white">Timing Scenario Comparison</h3>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Scenario Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Select Timing Scenarios (up to 4)
        </label>
        <div className="flex flex-wrap gap-2">
          {TIMING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleScenarioToggle(option.value)}
              disabled={!selectedScenarios.includes(option.value) && selectedScenarios.length >= 4}
              className={classNames(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                {
                  'bg-primary-600 text-white': selectedScenarios.includes(option.value),
                  'bg-slate-800 text-slate-300 hover:bg-slate-700': !selectedScenarios.includes(option.value),
                  'opacity-50 cursor-not-allowed': !selectedScenarios.includes(option.value) && selectedScenarios.length >= 4,
                }
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenarios Comparison */}
      {scenarios.length > 0 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestScenario && (
              <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-300">Best Scenario</span>
                </div>
                <div className="text-lg font-bold text-green-400">{bestScenario.label}</div>
                <div className="text-xs text-green-300">
                  Lowest combined slippage & impact: {formatMetric(bestScenario.metrics.slippage + bestScenario.metrics.marketImpact)}
                </div>
              </div>
            )}
            
            {worstScenario && bestScenario && worstScenario.timing !== bestScenario.timing && (
              <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-300">Highest Risk</span>
                </div>
                <div className="text-lg font-bold text-red-400">{worstScenario.label}</div>
                <div className="text-xs text-red-300">
                  Highest combined slippage & impact: {formatMetric(worstScenario.metrics.slippage + worstScenario.metrics.marketImpact)}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Timing</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Slippage</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Market Impact</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Fill %</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Avg Price</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Price Movement</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario, index) => (
                  <tr 
                    key={scenario.timing}
                    className={classNames('border-b border-slate-800 hover:bg-slate-800/50', {
                      'bg-green-900/10': bestScenario && scenario.timing === bestScenario.timing,
                      'bg-red-900/10': worstScenario && scenario.timing === worstScenario.timing && scenario.timing !== bestScenario?.timing,
                    })}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{scenario.label}</span>
                        {bestScenario && scenario.timing === bestScenario.timing && (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        )}
                        {worstScenario && scenario.timing === worstScenario.timing && scenario.timing !== bestScenario?.timing && (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </td>
                    <td className={classNames('py-3 px-4 text-right font-mono', 
                      getMetricColor(scenario.metrics.slippage, { warning: 0.5, critical: 1.0 }))}>
                      {formatMetric(scenario.metrics.slippage)}
                    </td>
                    <td className={classNames('py-3 px-4 text-right font-mono', 
                      getMetricColor(scenario.metrics.marketImpact, { warning: 1.0, critical: 2.0 }))}>
                      {formatMetric(scenario.metrics.marketImpact)}
                    </td>
                    <td className={classNames('py-3 px-4 text-right font-mono', 
                      getMetricColor(100 - scenario.metrics.estimatedFillPercentage, { warning: 20, critical: 50 }))}>
                      {formatMetric(scenario.metrics.estimatedFillPercentage)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      ${scenario.metrics.averageFillPrice.toFixed(2)}
                    </td>
                    <td className={classNames('py-3 px-4 text-right font-mono', {
                      'text-green-400': scenario.volatilityAdjustment > 0,
                      'text-red-400': scenario.volatilityAdjustment < 0,
                      'text-slate-400': scenario.volatilityAdjustment === 0,
                    })}>
                      {scenario.volatilityAdjustment > 0 ? '+' : ''}{formatMetric(scenario.volatilityAdjustment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Analysis */}
          <div className="p-4 bg-slate-800/30 rounded-lg">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analysis & Recommendations
            </h4>
            <div className="space-y-2 text-sm text-slate-400">
              {scenarios.length > 1 && (
                <>
                  <div>
                    <strong>Timing Impact:</strong> Comparing scenarios shows how market timing affects execution quality.
                  </div>
                  {bestScenario && (
                    <div className="text-green-400">
                      <strong>Optimal Timing:</strong> {bestScenario.label} provides the best balance of low slippage and market impact.
                    </div>
                  )}
                  {worstScenario && bestScenario && worstScenario.timing !== bestScenario.timing && (
                    <div className="text-red-400">
                      <strong>Risk Alert:</strong> {worstScenario.label} shows higher execution costs due to simulated market movement.
                    </div>
                  )}
                  <div>
                    <strong>Market Movement:</strong> Delayed execution introduces price volatility risk, 
                    which can work for or against your order depending on market direction.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="mt-6 p-3 bg-slate-800/50 rounded-md">
        <p className="text-xs text-slate-400">
          💡 Timing comparison simulates how market volatility over time affects order execution. 
          Price movements are modeled based on typical market behavior patterns.
        </p>
      </div>
    </div>
  );
};

export default TimingComparison; 