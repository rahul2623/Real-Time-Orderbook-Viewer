'use client';

import React, { useState, useEffect } from 'react';
import { SimulatedOrder, Venue, OrderType, OrderSide } from '@/types/orderbook';
import { AVAILABLE_SYMBOLS, TIMING_OPTIONS, EXCHANGE_CONFIGS } from '@/config/exchanges';
import { Calculator, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface OrderSimulationFormProps {
  onOrderChange: (order: SimulatedOrder | null) => void;
  currentVenue: Venue;
  currentSymbol: string;
  currentPrice?: number;
}

const OrderSimulationForm: React.FC<OrderSimulationFormProps> = ({
  onOrderChange,
  currentVenue,
  currentSymbol,
  currentPrice,
}) => {
  const [formData, setFormData] = useState({
    venue: currentVenue,
    symbol: currentSymbol,
    type: 'limit' as OrderType,
    side: 'buy' as OrderSide,
    price: '',
    quantity: '',
    timing: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEnabled, setIsEnabled] = useState(false);

  // Update form when external venue/symbol changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      venue: currentVenue,
      symbol: currentSymbol,
    }));
  }, [currentVenue, currentSymbol]);

  // Set default price when current price is available
  useEffect(() => {
    if (currentPrice && !formData.price) {
      setFormData(prev => ({
        ...prev,
        price: currentPrice.toFixed(2),
      }));
    }
  }, [currentPrice, formData.price]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Venue validation
    if (!formData.venue) {
      newErrors.venue = 'Please select a venue';
    }

    // Symbol validation
    if (!formData.symbol) {
      newErrors.symbol = 'Please select a symbol';
    }

    // Price validation for limit orders
    if (formData.type === 'limit') {
      if (!formData.price) {
        newErrors.price = 'Price is required for limit orders';
      } else {
        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) {
          newErrors.price = 'Please enter a valid price';
        }
      }
    }

    // Quantity validation
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else {
      const quantity = parseFloat(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        newErrors.quantity = 'Please enter a valid quantity';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const simulatedOrder: SimulatedOrder = {
      venue: formData.venue,
      symbol: formData.symbol,
      type: formData.type,
      side: formData.side,
      price: formData.type === 'limit' ? parseFloat(formData.price) : undefined,
      quantity: parseFloat(formData.quantity),
      timing: formData.timing,
    };

    onOrderChange(simulatedOrder);
    setIsEnabled(true);
  };

  const handleClear = () => {
    setFormData(prev => ({
      ...prev,
      price: '',
      quantity: '',
    }));
    setErrors({});
    setIsEnabled(false);
    onOrderChange(null);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-white">Order Simulation</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Venue Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Venue
          </label>
          <select
            value={formData.venue}
            onChange={(e) => handleInputChange('venue', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {Object.entries(EXCHANGE_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
          {errors.venue && (
            <p className="mt-1 text-sm text-red-400">{errors.venue}</p>
          )}
        </div>

        {/* Symbol Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Symbol
          </label>
          <select
            value={formData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {AVAILABLE_SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-400">{errors.symbol}</p>
          )}
        </div>

        {/* Order Type Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Order Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleInputChange('type', 'market')}
              className={`px-4 py-2 rounded-md border transition-colors ${
                formData.type === 'market'
                  ? 'bg-primary-600 border-primary-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('type', 'limit')}
              className={`px-4 py-2 rounded-md border transition-colors ${
                formData.type === 'limit'
                  ? 'bg-primary-600 border-primary-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Side Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Side
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleInputChange('side', 'buy')}
              className={`px-4 py-2 rounded-md border transition-colors flex items-center justify-center gap-2 ${
                formData.side === 'buy'
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Buy
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('side', 'sell')}
              className={`px-4 py-2 rounded-md border transition-colors flex items-center justify-center gap-2 ${
                formData.side === 'sell'
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              Sell
            </button>
          </div>
        </div>

        {/* Price Input (for limit orders) */}
        {formData.type === 'limit' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="Enter limit price"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-400">{errors.price}</p>
            )}
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantity
          </label>
          <input
            type="number"
            step="0.0001"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            placeholder="Enter quantity"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-400">{errors.quantity}</p>
          )}
        </div>

        {/* Timing Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Timing Simulation
          </label>
          <select
            value={formData.timing}
            onChange={(e) => handleInputChange('timing', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {TIMING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            Simulate Order
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!isEnabled}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-md transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Information */}
      <div className="mt-6 p-4 bg-slate-800/50 rounded-md">
        <p className="text-xs text-slate-400">
          💡 Tip: Market orders execute immediately at the best available price. 
          Limit orders will only execute at your specified price or better.
        </p>
      </div>
    </div>
  );
};

export default OrderSimulationForm; 