import { Orderbook, OrderbookLevel, SimulatedOrder, OrderImpactMetrics, OrderSide } from '@/types/orderbook';

export class OrderImpactCalculator {
  static calculateOrderImpact(
    orderbook: Orderbook,
    simulatedOrder: SimulatedOrder
  ): OrderImpactMetrics {
    if (!orderbook || !simulatedOrder) {
      return this.getEmptyMetrics();
    }

    const { side, quantity, price, type } = simulatedOrder;
    const levels = side === 'buy' ? orderbook.asks : orderbook.bids;
    
    if (levels.length === 0) {
      return this.getEmptyMetrics();
    }

    if (type === 'market') {
      return this.calculateMarketOrderImpact(levels, quantity, side);
    } else {
      return this.calculateLimitOrderImpact(levels, quantity, price!, side);
    }
  }

  private static calculateMarketOrderImpact(
    levels: OrderbookLevel[],
    quantity: number,
    side: OrderSide
  ): OrderImpactMetrics {
    let remainingQuantity = quantity;
    let totalCost = 0;
    let fillLevels = 0;

    // Calculate how much of the order can be filled and at what cost
    for (const level of levels) {
      if (remainingQuantity <= 0) break;

      const fillableQuantity = Math.min(remainingQuantity, level.quantity);
      totalCost += fillableQuantity * level.price;
      remainingQuantity -= fillableQuantity;
      fillLevels++;
    }

    const filledQuantity = quantity - remainingQuantity;
    const estimatedFillPercentage = (filledQuantity / quantity) * 100;
    const averageFillPrice = filledQuantity > 0 ? totalCost / filledQuantity : levels[0].price;

    // Market impact: compare to mid price
    const midPrice = this.calculateMidPrice(levels, side);
    const marketImpact = Math.abs((averageFillPrice - midPrice) / midPrice) * 100;

    // Slippage: compare to best bid/ask
    const bestPrice = levels[0].price;
    const slippage = Math.abs((averageFillPrice - bestPrice) / bestPrice) * 100;

    // Worst case scenario (if order consumes multiple levels)
    const worstPrice = fillLevels > 0 ? levels[Math.min(fillLevels - 1, levels.length - 1)].price : bestPrice;
    const worstCaseSlippage = Math.abs((worstPrice - bestPrice) / bestPrice) * 100;

    // Estimate time to fill based on order size and market depth
    const timeToFill = this.estimateTimeToFill(quantity, filledQuantity, fillLevels);

    return {
      estimatedFillPercentage,
      marketImpact,
      slippage,
      timeToFill,
      averageFillPrice,
      worstCase: {
        price: worstPrice,
        slippage: worstCaseSlippage,
      },
    };
  }

  private static calculateLimitOrderImpact(
    levels: OrderbookLevel[],
    quantity: number,
    limitPrice: number,
    side: OrderSide
  ): OrderImpactMetrics {
    // Find where the limit order would sit in the orderbook
    const bestPrice = levels[0].price;
    
    // Check if limit order would execute immediately
    const wouldExecuteImmediately = side === 'buy' 
      ? limitPrice >= bestPrice 
      : limitPrice <= bestPrice;

    if (wouldExecuteImmediately) {
      // Calculate as if it were a market order up to the limit price
      return this.calculateLimitOrderExecution(levels, quantity, limitPrice, side);
    }

    // Limit order would not execute immediately
    const midPrice = this.calculateMidPrice(levels, side);
    const marketImpact = Math.abs((limitPrice - midPrice) / midPrice) * 100;
    const slippage = Math.abs((limitPrice - bestPrice) / bestPrice) * 100;

    return {
      estimatedFillPercentage: 0, // Won't fill immediately
      marketImpact,
      slippage,
      timeToFill: undefined, // Cannot estimate for limit orders that won't fill immediately
      averageFillPrice: limitPrice,
      worstCase: {
        price: limitPrice,
        slippage,
      },
    };
  }

  private static calculateLimitOrderExecution(
    levels: OrderbookLevel[],
    quantity: number,
    limitPrice: number,
    side: OrderSide
  ): OrderImpactMetrics {
    let remainingQuantity = quantity;
    let totalCost = 0;
    let fillLevels = 0;

    for (const level of levels) {
      if (remainingQuantity <= 0) break;
      
      // Check if this level can be executed at the limit price
      const canExecute = side === 'buy' 
        ? level.price <= limitPrice 
        : level.price >= limitPrice;
      
      if (!canExecute) break;

      const fillableQuantity = Math.min(remainingQuantity, level.quantity);
      totalCost += fillableQuantity * level.price;
      remainingQuantity -= fillableQuantity;
      fillLevels++;
    }

    const filledQuantity = quantity - remainingQuantity;
    const estimatedFillPercentage = (filledQuantity / quantity) * 100;
    const averageFillPrice = filledQuantity > 0 ? totalCost / filledQuantity : limitPrice;

    const midPrice = this.calculateMidPrice(levels, side);
    const marketImpact = Math.abs((averageFillPrice - midPrice) / midPrice) * 100;

    const bestPrice = levels[0].price;
    const slippage = Math.abs((averageFillPrice - bestPrice) / bestPrice) * 100;

    const timeToFill = this.estimateTimeToFill(quantity, filledQuantity, fillLevels);

    return {
      estimatedFillPercentage,
      marketImpact,
      slippage,
      timeToFill,
      averageFillPrice,
      worstCase: {
        price: limitPrice,
        slippage: Math.abs((limitPrice - bestPrice) / bestPrice) * 100,
      },
    };
  }

  private static calculateMidPrice(levels: OrderbookLevel[], side: OrderSide): number {
    // For simplicity, assume the current level's price as mid price
    // In a real implementation, you'd want the actual mid price from both sides
    return levels[0].price;
  }

  private static estimateTimeToFill(
    totalQuantity: number,
    filledQuantity: number,
    levelsConsumed: number
  ): number | undefined {
    if (filledQuantity === 0) return undefined;
    if (filledQuantity === totalQuantity) return 0; // Immediate fill

    // Rough estimation based on levels consumed and order size
    // More levels = higher complexity = longer time
    const complexityFactor = Math.min(levelsConsumed / 5, 1);
    const sizeFactor = Math.min(totalQuantity / 10, 1);
    
    return Math.ceil((complexityFactor + sizeFactor) * 5); // 0-10 seconds estimate
  }

  private static getEmptyMetrics(): OrderImpactMetrics {
    return {
      estimatedFillPercentage: 0,
      marketImpact: 0,
      slippage: 0,
      timeToFill: undefined,
      averageFillPrice: 0,
      worstCase: {
        price: 0,
        slippage: 0,
      },
    };
  }

  // Utility method to find where an order would sit in the orderbook
  static findOrderPosition(
    orderbook: Orderbook,
    simulatedOrder: SimulatedOrder
  ): { position: number; isMarketPrice: boolean } {
    if (!orderbook || !simulatedOrder || simulatedOrder.type === 'market') {
      return { position: 0, isMarketPrice: true };
    }

    const { side, price } = simulatedOrder;
    const levels = side === 'buy' ? orderbook.bids : orderbook.asks;
    
    let position = 0;
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      
      if (side === 'buy') {
        if (price! >= level.price) {
          return { position: i, isMarketPrice: false };
        }
      } else {
        if (price! <= level.price) {
          return { position: i, isMarketPrice: false };
        }
      }
      position++;
    }

    return { position: levels.length, isMarketPrice: false };
  }
} 