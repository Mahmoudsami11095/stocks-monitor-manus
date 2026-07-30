/**
 * Router for database seeding endpoint.
 * Allows initialization of database with mock MPCI data.
 */

import { Router } from 'express';
import { getDb } from './db';
import { stockData, technicalIndicators, priceHistory } from '../drizzle/schema';

export function createSeedRouter(): Router {
  const router = Router();

  /**
   * POST /api/seed/init
   * Initialize database with mock MPCI data.
   * Only works in development mode.
   */
  router.post('/init', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Seeding only allowed in development' });
      }

      console.log('[Seed] Starting database initialization...');
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database connection failed' });
      }

      // Insert stock data
      const stockDataRecord = {
        ticker: 'MPCI',
        price: '278.01',
        dayHigh: '285.00',
        dayLow: '270.01',
        weekHigh52: '285.00',
        weekLow52: '90.00',
        peRatio: '12.2',
        eps: '22.81',
        marketCap: '6.32B',
        volume: '552442',
        previousClose: '269.00',
        open: '270.01',
        bidAsk: '278.01/279.99',
      };

      await db.insert(stockData).values({
        ticker: stockDataRecord.ticker,
        price: stockDataRecord.price,
        dayHigh: stockDataRecord.dayHigh,
        dayLow: stockDataRecord.dayLow,
        weekHigh52: stockDataRecord.weekHigh52,
        weekLow52: stockDataRecord.weekLow52,
        peRatio: stockDataRecord.peRatio,
        eps: stockDataRecord.eps,
        marketCap: stockDataRecord.marketCap,
        volume: stockDataRecord.volume,
        previousClose: stockDataRecord.previousClose,
        open: stockDataRecord.open,
        bidAsk: stockDataRecord.bidAsk,
      });

      console.log('[Seed] ✓ Inserted stock data');

      // Insert price history (90 days instead of 365 for faster seeding)
      const now = new Date();
      const priceHistoryValues: any[] = [];

      for (let i = 90; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const basePrice = 200 + Math.random() * 80;
        const open = (basePrice + (Math.random() - 0.5) * 10).toFixed(2);
        const close = (basePrice + (Math.random() - 0.5) * 10).toFixed(2);
        const high = Math.max(parseFloat(open), parseFloat(close)) + Math.random() * 5;
        const low = Math.min(parseFloat(open), parseFloat(close)) - Math.random() * 5;
        const volume = Math.floor(300000 + Math.random() * 300000);

        priceHistoryValues.push([
          'MPCI',
          date,
          open,
          high.toFixed(2),
          low.toFixed(2),
          close,
          volume.toString(),
        ]);
      }

      // Batch insert price history
      if (priceHistoryValues.length > 0) {
        const records = priceHistoryValues.map(([ticker, date, open, high, low, close, volume]) => ({
          ticker,
          date,
          open,
          high,
          low,
          close,
          volume,
        }));
        await db.insert(priceHistory).values(records);
      }

      console.log(`[Seed] ✓ Inserted ${priceHistoryValues.length} price history records`);

      // Insert technical indicators
      const indicatorsData = {
        ticker: 'MPCI',
        ma20: '275.50',
        ma50: '268.30',
        rsi: '58.45',
        support: '265.00',
        resistance: '285.00',
        recommendation: 'hold',
        entryPrice: '270.00',
        exitPrice: '280.00',
        fairValueMin: '250.00',
        fairValueMax: '320.00',
      };

      await db.insert(technicalIndicators).values({
        ticker: indicatorsData.ticker,
        ma20: indicatorsData.ma20,
        ma50: indicatorsData.ma50,
        rsi: indicatorsData.rsi,
        support: indicatorsData.support,
        resistance: indicatorsData.resistance,
        recommendation: indicatorsData.recommendation as any,
        entryPrice: indicatorsData.entryPrice,
        exitPrice: indicatorsData.exitPrice,
        fairValueMin: indicatorsData.fairValueMin,
        fairValueMax: indicatorsData.fairValueMax,
      });

      console.log('[Seed] ✓ Inserted technical indicators');

      res.json({
        success: true,
        message: 'Database seeded successfully',
        data: {
          stockData: 1,
          priceHistory: priceHistoryValues.length,
          technicalIndicators: 1,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Seed] Error:', errorMessage);
      res.status(500).json({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
