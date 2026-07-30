import { describe, it, expect } from 'vitest';
import {
  calculateMA20,
  calculateMA50,
  calculateRSI,
  calculateSupportResistance,
  calculateFairValue,
  generateRecommendation,
  calculateEntryExitPrices,
  performAnalysis,
  PricePoint,
} from './analysis';

describe('Technical Analysis Engine', () => {
  // Generate mock price data for testing
  const generateMockPrices = (count: number): PricePoint[] => {
    const prices: PricePoint[] = [];
    const now = new Date();
    let basePrice = 250;

    for (let i = count; i > 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const open = basePrice + (Math.random() - 0.5) * 5;
      const close = basePrice + (Math.random() - 0.5) * 5;
      const high = Math.max(open, close) + Math.random() * 3;
      const low = Math.min(open, close) - Math.random() * 3;

      prices.push({
        date,
        open,
        high,
        low,
        close,
        volume: 500000,
      });

      basePrice = close;
    }

    return prices;
  };

  describe('calculateMA20', () => {
    it('should return null if less than 20 prices', () => {
      const prices = generateMockPrices(10);
      const result = calculateMA20(prices);
      expect(result).toBeNull();
    });

    it('should calculate 20-day moving average correctly', () => {
      const prices = generateMockPrices(30);
      const result = calculateMA20(prices);
      expect(result).not.toBeNull();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should use last 20 prices only', () => {
      const prices = generateMockPrices(50);
      const ma20 = calculateMA20(prices);
      const last20Sum = prices.slice(-20).reduce((sum, p) => sum + p.close, 0);
      const expectedMA = last20Sum / 20;
      expect(ma20).toBe(expectedMA);
    });
  });

  describe('calculateMA50', () => {
    it('should return null if less than 50 prices', () => {
      const prices = generateMockPrices(30);
      const result = calculateMA50(prices);
      expect(result).toBeNull();
    });

    it('should calculate 50-day moving average correctly', () => {
      const prices = generateMockPrices(60);
      const result = calculateMA50(prices);
      expect(result).not.toBeNull();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calculateRSI', () => {
    it('should return null if insufficient data', () => {
      const prices = generateMockPrices(10);
      const result = calculateRSI(prices);
      expect(result).toBeNull();
    });

    it('should return value between 0 and 100', () => {
      const prices = generateMockPrices(30);
      const result = calculateRSI(prices);
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should return 100 for all gains', () => {
      const prices: PricePoint[] = [];
      for (let i = 0; i < 20; i++) {
        prices.push({
          date: new Date(),
          open: 100 + i,
          high: 102 + i,
          low: 99 + i,
          close: 101 + i,
        });
      }
      const result = calculateRSI(prices);
      expect(result).toBe(100);
    });

    it('should return 0 for all losses', () => {
      const prices: PricePoint[] = [];
      for (let i = 20; i > 0; i--) {
        prices.push({
          date: new Date(),
          open: 100 + i,
          high: 102 + i,
          low: 99 + i,
          close: 101 + (i - 1),
        });
      }
      const result = calculateRSI(prices);
      expect(result).toBe(0);
    });
  });

  describe('calculateSupportResistance', () => {
    it('should return null if insufficient data', () => {
      const prices = generateMockPrices(3);
      const result = calculateSupportResistance(prices);
      expect(result).toBeNull();
    });

    it('should return support and resistance levels', () => {
      const prices = generateMockPrices(30);
      const result = calculateSupportResistance(prices);
      expect(result).not.toBeNull();
      expect(result?.support).toBeLessThan(result?.resistance!);
      expect(result?.support).toBeGreaterThan(0);
      expect(result?.resistance).toBeGreaterThan(0);
    });
  });

  describe('calculateFairValue', () => {
    it('should calculate fair value range', () => {
      const eps = 22.81;
      const result = calculateFairValue(eps);
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    it('should use custom P/E multiples', () => {
      const eps = 10;
      const result = calculateFairValue(eps, 10, 20);
      expect(result.min).toBe(100);
      expect(result.max).toBe(200);
    });
  });

  describe('generateRecommendation', () => {
    it('should return a valid recommendation', () => {
      const prices = generateMockPrices(60);
      const currentPrice = 250;
      const ma20 = calculateMA20(prices);
      const ma50 = calculateMA50(prices);
      const rsi = calculateRSI(prices);
      const supportResistance = calculateSupportResistance(prices);

      const result = generateRecommendation(
        currentPrice,
        ma20,
        ma50,
        rsi,
        supportResistance?.support || null,
        supportResistance?.resistance || null,
        200,
        300
      );

      expect(['buy', 'sell', 'hold']).toContain(result.recommendation);
      expect(Array.isArray(result.signals)).toBe(true);
    });

    it('should recommend buy when price is below fair value', () => {
      const result = generateRecommendation(
        200, // Current price
        250, // MA20
        240, // MA50
        30, // RSI (oversold)
        180, // Support
        280, // Resistance
        250, // Fair value min
        350 // Fair value max
      );

      expect(result.recommendation).toBe('buy');
    });

    it('should recommend sell when price is above fair value', () => {
      const result = generateRecommendation(
        400, // Current price
        250, // MA20
        240, // MA50
        75, // RSI (overbought)
        180, // Support
        280, // Resistance
        250, // Fair value min
        350 // Fair value max
      );

      expect(result.recommendation).toBe('sell');
    });
  });

  describe('calculateEntryExitPrices', () => {
    it('should calculate entry/exit for buy signal', () => {
      const result = calculateEntryExitPrices(250, 200, 300, 240, 'buy');
      expect(result.entryPrice).not.toBeNull();
      expect(result.exitPrice).not.toBeNull();
      expect(result.entryPrice).toBeLessThan(result.exitPrice!);
    });

    it('should calculate entry/exit for sell signal', () => {
      const result = calculateEntryExitPrices(250, 200, 300, 240, 'sell');
      expect(result.entryPrice).not.toBeNull();
      expect(result.exitPrice).not.toBeNull();
      expect(result.entryPrice).toBeGreaterThan(result.exitPrice!);
    });

    it('should return null prices for hold signal', () => {
      const result = calculateEntryExitPrices(250, 200, 300, 240, 'hold');
      expect(result.entryPrice).toBeNull();
      expect(result.exitPrice).toBeNull();
    });
  });

  describe('performAnalysis', () => {
    it('should perform complete analysis', () => {
      const prices = generateMockPrices(60);
      const currentPrice = 250;
      const eps = 22.81;

      const result = performAnalysis(prices, currentPrice, eps);

      expect(result.ma20).not.toBeNull();
      expect(result.ma50).not.toBeNull();
      expect(result.rsi).not.toBeNull();
      expect(result.support).not.toBeNull();
      expect(result.resistance).not.toBeNull();
      expect(['buy', 'sell', 'hold']).toContain(result.recommendation);
      expect(result.fairValueMin).not.toBeNull();
      expect(result.fairValueMax).not.toBeNull();
      expect(Array.isArray(result.signals)).toBe(true);
    });
  });
});
