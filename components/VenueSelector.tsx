'use client';

import React from 'react';
import { Venue } from '@/types/orderbook';
import { EXCHANGE_CONFIGS, AVAILABLE_SYMBOLS } from '@/config/exchanges';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import classNames from 'classnames';

interface VenueSelectorProps {
  selectedVenue: Venue;
  selectedSymbol: string;
  onVenueChange: (venue: Venue) => void;
  onSymbolChange: (symbol: string) => void;
  connectionStatus: Record<Venue, boolean>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const VenueSelector: React.FC<VenueSelectorProps> = ({
  selectedVenue,
  selectedSymbol,
  onVenueChange,
  onSymbolChange,
  connectionStatus,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="bg-slate-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Market Selection</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <RefreshCw className={classNames('w-4 h-4 text-slate-400', {
              'animate-spin': isLoading,
            })} />
          </button>
        )}
      </div>

      {/* Venue Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Exchange
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(EXCHANGE_CONFIGS).map(([key, config]) => {
            const venue = key as Venue;
            const isSelected = selectedVenue === venue;
            const isConnected = connectionStatus[venue];

            return (
              <button
                key={venue}
                onClick={() => onVenueChange(venue)}
                className={classNames(
                  'p-4 rounded-lg border transition-all duration-200 text-left',
                  {
                    'bg-primary-900/50 border-primary-500 shadow-lg shadow-primary-500/10': isSelected,
                    'bg-slate-800 border-slate-700 hover:bg-slate-700': !isSelected,
                  }
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={classNames(
                    'font-medium',
                    {
                      'text-primary-300': isSelected,
                      'text-slate-300': !isSelected,
                    }
                  )}>
                    {config.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <Wifi className="w-4 h-4 text-green-400" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-slate-500">
                  <div>Rate: {config.rateLimit.requests} req/{config.rateLimit.window}ms</div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={classNames(
                      'w-2 h-2 rounded-full',
                      {
                        'bg-green-400': isConnected,
                        'bg-red-400': !isConnected,
                      }
                    )}></div>
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Symbol Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Trading Pair
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {AVAILABLE_SYMBOLS.map((symbol) => {
            const isSelected = selectedSymbol === symbol;
            
            return (
              <button
                key={symbol}
                onClick={() => onSymbolChange(symbol)}
                className={classNames(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  {
                    'bg-primary-600 text-white': isSelected,
                    'bg-slate-800 text-slate-300 hover:bg-slate-700': !isSelected,
                  }
                )}
              >
                {symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection Summary */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Connection Status:</span>
          <div className="flex items-center gap-4">
            {Object.entries(connectionStatus).map(([venue, status]) => (
              <div key={venue} className="flex items-center gap-1">
                <div className={classNames(
                  'w-2 h-2 rounded-full',
                  {
                    'bg-green-400': status,
                    'bg-red-400': !status,
                  }
                )}></div>
                <span className="text-xs text-slate-500 uppercase">
                  {venue}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-md">
        <p className="text-xs text-slate-400">
          💡 Switch between exchanges to compare orderbooks and liquidity. 
          Green indicators show active WebSocket connections for real-time data.
        </p>
      </div>
    </div>
  );
};

export default VenueSelector; 