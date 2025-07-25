import { Venue, Orderbook, ApiResponse, WebSocketConnection } from '@/types/orderbook';
import { OKXApiService } from './okxApi';
import { BybitApiService } from './bybitApi';
import { DeribitApiService } from './deribitApi';
import { BaseApiService } from './baseApi';

class ApiServiceManager {
  private services: Record<Venue, BaseApiService>;

  constructor() {
    this.services = {
      okx: new OKXApiService(),
      bybit: new BybitApiService(),
      deribit: new DeribitApiService(),
    };
  }

  async fetchOrderbook(venue: Venue, symbol: string): Promise<ApiResponse<Orderbook>> {
    const service = this.services[venue];
    if (!service) {
      return {
        success: false,
        error: `Unsupported venue: ${venue}`,
        timestamp: Date.now(),
      };
    }

    return service.fetchOrderbook(symbol);
  }

  async subscribeToOrderbook(
    venue: Venue,
    symbol: string,
    onUpdate: (orderbook: Orderbook) => void,
    onError: (error: string) => void
  ): Promise<WebSocketConnection | null> {
    const service = this.services[venue];
    if (!service) {
      onError(`Unsupported venue: ${venue}`);
      return null;
    }

    try {
      return await service.subscribeToOrderbook(symbol, onUpdate, onError);
    } catch (error: any) {
      onError(`Failed to subscribe to ${venue}: ${error.message}`);
      return null;
    }
  }

  async unsubscribeFromOrderbook(venue: Venue, symbol: string): Promise<void> {
    const service = this.services[venue];
    if (service) {
      await service.unsubscribeFromOrderbook(symbol);
    }
  }

  cleanup(): void {
    Object.values(this.services).forEach(service => service.cleanup());
  }

  // Health check for all services
  async healthCheck(): Promise<Record<Venue, boolean>> {
    const healthStatus: Record<Venue, boolean> = {
      okx: false,
      bybit: false,
      deribit: false,
    };

    const promises = Object.entries(this.services).map(async ([venue, service]) => {
      try {
        // Try to fetch orderbook for a common symbol to test connectivity
        const result = await service.fetchOrderbook('BTC-USDT');
        healthStatus[venue as Venue] = result.success;
      } catch (error) {
        healthStatus[venue as Venue] = false;
      }
    });

    await Promise.all(promises);
    return healthStatus;
  }
}

// Singleton instance
export const apiServiceManager = new ApiServiceManager();

// Export for cleanup on app unmount
export { ApiServiceManager }; 