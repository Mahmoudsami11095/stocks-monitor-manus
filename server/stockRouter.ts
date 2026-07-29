/**
 * tRPC router for stock data and analysis endpoints.
 */

import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import {
  getLatestStockData,
  getLatestTechnicalIndicators,
  getPriceHistory,
  getRecentTradingSignals,
} from './db';

export const stockRouter = router({
  /**
   * Get current MPCI stock data and technical indicators.
   */
  getCurrent: publicProcedure.query(async () => {
    const stockData = await getLatestStockData();
    const indicators = await getLatestTechnicalIndicators();

    return {
      stock: stockData,
      indicators: indicators,
      timestamp: new Date(),
    };
  }),

  /**
   * Get price history for charting.
   * Supports different time ranges: 1W, 1M, 3M, 1Y
   */
  getPriceHistory: publicProcedure
    .input(
      z.enum(['1w', '1m', '3m', '1y']).default('1m')
    )
    .query(async ({ input }) => {
      const now = new Date();
      let startDate = new Date();

      switch (input) {
        case '1w':
          startDate.setDate(now.getDate() - 7);
          break;
        case '1m':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const history = await getPriceHistory(startDate, now);

      return {
        range: input,
        data: history.map(h => ({
          date: h.date,
          open: parseFloat(h.open),
          high: parseFloat(h.high),
          low: parseFloat(h.low),
          close: parseFloat(h.close),
          volume: h.volume ? parseInt(h.volume) : 0,
        })),
      };
    }),

  /**
   * Get recent trading signals and notifications.
   */
  getRecentSignals: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => {
      const signals = await getRecentTradingSignals(input.limit);

      return {
        signals: signals.map(s => ({
          id: s.id,
          type: s.signalType,
          description: s.description,
          price: s.price,
          createdAt: s.createdAt,
          notificationSent: s.notificationSent === 1,
        })),
        count: signals.length,
      };
    }),

  /**
   * Get dashboard summary data.
   */
  getDashboardSummary: publicProcedure.query(async () => {
    const stockData = await getLatestStockData();
    const indicators = await getLatestTechnicalIndicators();
    const signals = await getRecentTradingSignals(5);

    if (!stockData || !indicators) {
      return null;
    }

    const currentPrice = parseFloat(stockData.price);
    const previousClose = parseFloat(stockData.previousClose || '0');
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = (priceChange / previousClose) * 100;

    return {
      ticker: 'MPCI',
      currentPrice,
      priceChange,
      priceChangePercent: Math.round(priceChangePercent * 100) / 100,
      dayHigh: parseFloat(stockData.dayHigh || '0'),
      dayLow: parseFloat(stockData.dayLow || '0'),
      weekHigh52: parseFloat(stockData.weekHigh52 || '0'),
      weekLow52: parseFloat(stockData.weekLow52 || '0'),
      peRatio: parseFloat(stockData.peRatio || '0'),
      eps: parseFloat(stockData.eps || '0'),
      marketCap: stockData.marketCap,
      volume: parseInt(stockData.volume || '0'),
      bidAsk: stockData.bidAsk,
      recommendation: indicators.recommendation,
      ma20: indicators.ma20 ? parseFloat(indicators.ma20) : null,
      ma50: indicators.ma50 ? parseFloat(indicators.ma50) : null,
      rsi: indicators.rsi ? parseFloat(indicators.rsi) : null,
      support: indicators.support ? parseFloat(indicators.support) : null,
      resistance: indicators.resistance ? parseFloat(indicators.resistance) : null,
      entryPrice: indicators.entryPrice ? parseFloat(indicators.entryPrice) : null,
      exitPrice: indicators.exitPrice ? parseFloat(indicators.exitPrice) : null,
      fairValueMin: indicators.fairValueMin ? parseFloat(indicators.fairValueMin) : null,
      fairValueMax: indicators.fairValueMax ? parseFloat(indicators.fairValueMax) : null,
      recentSignals: signals.map(s => ({
        type: s.signalType,
        description: s.description,
        createdAt: s.createdAt,
      })),
      lastUpdated: stockData.timestamp,
    };
  }),
});
