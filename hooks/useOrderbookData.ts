'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useOrderbookStore } from '@/store/orderbookStore';
import { apiServiceManager } from '@/services/api';
import { Venue, WebSocketConnection, Orderbook } from '@/types/orderbook';

export const useOrderbookData = () => {
  const store = useOrderbookStore();
  const connectionsRef = useRef<Map<string, WebSocketConnection>>(new Map());
  const reconnectTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const {
    selectedVenue,
    selectedSymbol,
    setOrderbook,
    setConnection,
    setError,
    setLoading,
    getConnectionStatus,
  } = store;

  // Create connection key
  const createConnectionKey = useCallback((venue: Venue, symbol: string) => {
    return `${venue}-${symbol}`;
  }, []);

  // Handle orderbook updates
  const handleOrderbookUpdate = useCallback((orderbook: Orderbook) => {
    setOrderbook(orderbook.venue, orderbook.symbol, orderbook);
    setError(null);
  }, [setOrderbook, setError]);

  // Handle connection errors
  const handleConnectionError = useCallback((venue: Venue, symbol: string, error: string) => {
    const key = createConnectionKey(venue, symbol);
    const connection = connectionsRef.current.get(key);
    
    if (connection) {
      connection.connected = false;
      setConnection(venue, symbol, connection);
    }

    console.error(`WebSocket error for ${venue}-${symbol}:`, error);
    setError(`Connection error: ${error}`);

    // Schedule reconnection
    scheduleReconnection(venue, symbol);
  }, [createConnectionKey, setConnection, setError]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnection = useCallback((venue: Venue, symbol: string) => {
    const key = createConnectionKey(venue, symbol);
    const connection = connectionsRef.current.get(key);
    
    if (!connection) return;

    const timeout = reconnectTimeoutsRef.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
    }

    const backoffDelay = Math.min(1000 * Math.pow(2, connection.reconnectAttempts), 30000);
    
    const newTimeout = setTimeout(async () => {
      connection.reconnectAttempts++;
      await connectToOrderbook(venue, symbol);
    }, backoffDelay);

    reconnectTimeoutsRef.current.set(key, newTimeout);
  }, [createConnectionKey]);

  // Connect to orderbook WebSocket
  const connectToOrderbook = useCallback(async (venue: Venue, symbol: string) => {
    const key = createConnectionKey(venue, symbol);
    
    // Clean up existing connection
    const existingConnection = connectionsRef.current.get(key);
    if (existingConnection?.ws) {
      existingConnection.ws.close();
    }

    try {
      setLoading(true);
      
      // First, try to fetch initial orderbook data
      const orderbookResponse = await apiServiceManager.fetchOrderbook(venue, symbol);
      if (orderbookResponse.success && orderbookResponse.data) {
        handleOrderbookUpdate(orderbookResponse.data);
      }

      // Then establish WebSocket connection
      const connection = await apiServiceManager.subscribeToOrderbook(
        venue,
        symbol,
        handleOrderbookUpdate,
        (error) => handleConnectionError(venue, symbol, error)
      );

      if (connection) {
        connection.reconnectAttempts = 0; // Reset on successful connection
        connectionsRef.current.set(key, connection);
        setConnection(venue, symbol, connection);
      }

    } catch (error: any) {
      handleConnectionError(venue, symbol, error.message);
    } finally {
      setLoading(false);
    }
  }, [
    createConnectionKey,
    setLoading,
    handleOrderbookUpdate,
    handleConnectionError,
    setConnection,
  ]);

  // Disconnect from orderbook WebSocket
  const disconnectFromOrderbook = useCallback(async (venue: Venue, symbol: string) => {
    const key = createConnectionKey(venue, symbol);
    
    // Clear reconnection timeout
    const timeout = reconnectTimeoutsRef.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      reconnectTimeoutsRef.current.delete(key);
    }

    // Disconnect WebSocket
    await apiServiceManager.unsubscribeFromOrderbook(venue, symbol);
    
    // Clean up local references
    connectionsRef.current.delete(key);
  }, [createConnectionKey]);

  // Switch to a different venue/symbol
  const switchMarket = useCallback(async (newVenue: Venue, newSymbol: string) => {
    // Disconnect from current market if different
    if (selectedVenue !== newVenue || selectedSymbol !== newSymbol) {
      await disconnectFromOrderbook(selectedVenue, selectedSymbol);
    }

    // Connect to new market
    await connectToOrderbook(newVenue, newSymbol);
  }, [selectedVenue, selectedSymbol, disconnectFromOrderbook, connectToOrderbook]);

  // Refresh current connection
  const refreshConnection = useCallback(async () => {
    await disconnectFromOrderbook(selectedVenue, selectedSymbol);
    await connectToOrderbook(selectedVenue, selectedSymbol);
  }, [selectedVenue, selectedSymbol, disconnectFromOrderbook, connectToOrderbook]);

  // Get connection status for all venues
  const getConnectionStatuses = useCallback((): Record<Venue, boolean> => {
    return {
      okx: getConnectionStatus('okx', selectedSymbol),
      bybit: getConnectionStatus('bybit', selectedSymbol),
      deribit: getConnectionStatus('deribit', selectedSymbol),
    };
  }, [getConnectionStatus, selectedSymbol]);

  // Initial connection and cleanup
  useEffect(() => {
    connectToOrderbook(selectedVenue, selectedSymbol);

    return () => {
      // Cleanup all connections on unmount
      connectionsRef.current.forEach(async (connection, key) => {
        if (connection.ws) {
          connection.ws.close();
        }
      });
      
      // Clear all timeouts
      reconnectTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      
      // Cleanup API service
      apiServiceManager.cleanup();
    };
  }, [selectedVenue, selectedSymbol, connectToOrderbook]);

  // Health check for connections
  const performHealthCheck = useCallback(async () => {
    try {
      const healthStatus = await apiServiceManager.healthCheck();
      
      // Update connection status based on health check
      Object.entries(healthStatus).forEach(([venue, isHealthy]) => {
        const connection = connectionsRef.current.get(createConnectionKey(venue as Venue, selectedSymbol));
        if (connection && !isHealthy) {
          handleConnectionError(venue as Venue, selectedSymbol, 'Health check failed');
        }
      });

      return healthStatus;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        okx: false,
        bybit: false,
        deribit: false,
      };
    }
  }, [createConnectionKey, selectedSymbol, handleConnectionError]);

  // Periodic health check
  useEffect(() => {
    const healthCheckInterval = setInterval(performHealthCheck, 60000); // Every minute

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [performHealthCheck]);

  return {
    // Data
    orderbook: store.getCurrentOrderbook(),
    selectedVenue,
    selectedSymbol,
    isLoading: store.isLoading,
    error: store.error,
    
    // Connection status
    connectionStatuses: getConnectionStatuses(),
    
    // Actions
    switchMarket,
    refreshConnection,
    connectToOrderbook,
    disconnectFromOrderbook,
    performHealthCheck,
  };
}; 