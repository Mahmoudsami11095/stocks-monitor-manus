/**
 * Scheduled data fetching handler for MPCI stock updates.
 * Runs hourly via Heartbeat cron to update stock data and calculate indicators.
 */

import { notifyOwner } from './_core/notification';
import { performAnalysis, PricePoint } from './analysis';
import {
  getLatestTechnicalIndicators,
  insertStockData,
  insertTechnicalIndicators,
  insertPriceHistory,
  insertTradingSignal,
} from './db';
import { fetchMPCIStockData, fetchMPCIPriceHistory, parseNumeric, validateStockData } from './dataFetcher';

/**
 * Main scheduled fetch handler.
 * Called hourly to update stock data and perform technical analysis.
 */
export async function handleScheduledFetch(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    console.log('[ScheduledFetch] Starting MPCI data update...');

    // Fetch latest stock data
    const stockData = await fetchMPCIStockData();
    if (!stockData || !validateStockData(stockData)) {
      throw new Error('Failed to fetch valid stock data');
    }

    // Store stock data in database
    await insertStockData({
      ticker: 'MPCI',
      price: stockData.price,
      dayHigh: stockData.dayHigh,
      dayLow: stockData.dayLow,
      weekHigh52: stockData.weekHigh52,
      weekLow52: stockData.weekLow52,
      peRatio: stockData.peRatio,
      eps: stockData.eps,
      marketCap: stockData.marketCap,
      volume: stockData.volume,
      previousClose: stockData.previousClose,
      open: stockData.open,
      bidAsk: stockData.bidAsk,
      timestamp: stockData.timestamp,
    });

    // Fetch price history for technical analysis
    const historyData = await fetchMPCIPriceHistory(365);
    if (!historyData || historyData.length === 0) {
      throw new Error('Failed to fetch price history');
    }

    // Convert to PricePoint format
    const prices: PricePoint[] = historyData.map(h => ({
      date: h.date,
      open: parseNumeric(h.open) || 0,
      high: parseNumeric(h.high) || 0,
      low: parseNumeric(h.low) || 0,
      close: parseNumeric(h.close) || 0,
      volume: parseNumeric(h.volume) || undefined,
    }));


    // Store price history
    for (const history of historyData) {
      await insertPriceHistory({
        ticker: 'MPCI',
        date: history.date,
        open: history.open,
        high: history.high,
        low: history.low,
        close: history.close,
        volume: history.volume,
      });
    }

    // Perform technical analysis
    const currentPrice = parseNumeric(stockData.price) || 0;
    const eps = parseNumeric(stockData.eps) || 0;

    const analysis = performAnalysis(prices, currentPrice, eps);

    // Get previous recommendation to detect changes
    const previousIndicators = await getLatestTechnicalIndicators();
    const recommendationChanged = previousIndicators && previousIndicators.recommendation !== analysis.recommendation;

    // Store technical indicators
    await insertTechnicalIndicators({
      ticker: 'MPCI',
      ma20: analysis.ma20?.toString() || null,
      ma50: analysis.ma50?.toString() || null,
      rsi: analysis.rsi?.toString() || null,
      support: analysis.support?.toString() || null,
      resistance: analysis.resistance?.toString() || null,
      recommendation: analysis.recommendation,
      entryPrice: analysis.entryPrice?.toString() || null,
      exitPrice: analysis.exitPrice?.toString() || null,
      fairValueMin: analysis.fairValueMin?.toString() || null,
      fairValueMax: analysis.fairValueMax?.toString() || null,
      timestamp: new Date(),
    });

    // Check for trading signals
    const signals: string[] = [];

    // Check for support/resistance crosses
    if (previousIndicators) {
      const prevSupport = parseNumeric(previousIndicators.support || '') || 0;
      const prevResistance = parseNumeric(previousIndicators.resistance || '') || 0;

      if (analysis.support && currentPrice < analysis.support && prevSupport >= analysis.support) {
        signals.push('Price crossed below support level');
        await notifyOwner({
          title: 'MPCI Support Level Crossed',
          content: `Price ${currentPrice.toFixed(2)} crossed below support level ${analysis.support.toFixed(2)}. Consider selling or setting stop-loss.`,
        });
        await insertTradingSignal({
          ticker: 'MPCI',
          signalType: 'price_support_cross',
          description: `Price ${currentPrice} crossed below support ${analysis.support}`,
          price: currentPrice.toString(),
          notificationSent: 1,
        });
      }

      if (analysis.resistance && currentPrice > analysis.resistance && prevResistance <= analysis.resistance) {
        signals.push('Price crossed above resistance level');
        await notifyOwner({
          title: 'MPCI Resistance Level Crossed',
          content: `Price ${currentPrice.toFixed(2)} crossed above resistance level ${analysis.resistance.toFixed(2)}. Consider buying or taking profits.`,
        });
        await insertTradingSignal({
          ticker: 'MPCI',
          signalType: 'price_resistance_cross',
          description: `Price ${currentPrice} crossed above resistance ${analysis.resistance}`,
          price: currentPrice.toString(),
          notificationSent: 1,
        });
      }
    }

    // Notify owner of recommendation changes
    if (recommendationChanged) {
      const message = `MPCI Recommendation Changed: ${previousIndicators?.recommendation?.toUpperCase()} → ${analysis.recommendation.toUpperCase()}`;
      signals.push(message);

      await notifyOwner({
        title: 'MPCI Trading Signal',
        content: `${message}\n\nCurrent Price: ${currentPrice}\nSignals: ${analysis.signals.join(', ')}`,
      });

      await insertTradingSignal({
        ticker: 'MPCI',
        signalType: 'recommendation_change',
        description: `Recommendation changed from ${previousIndicators?.recommendation} to ${analysis.recommendation}`,
        price: currentPrice.toString(),
        notificationSent: 1,
      });
    }

    // Check for significant price movements (>5%)
    if (previousIndicators) {
      const prevPrice = parseNumeric(previousIndicators.ma20 || '') || currentPrice;
      const priceChange = Math.abs((currentPrice - prevPrice) / prevPrice) * 100;

      if (priceChange > 5) {
        const direction = currentPrice > prevPrice ? 'UP' : 'DOWN';
        signals.push(`Significant price movement: ${direction} ${priceChange.toFixed(2)}%`);

        await notifyOwner({
          title: 'MPCI Significant Price Movement',
          content: `Price moved ${direction} by ${priceChange.toFixed(2)}%\nCurrent Price: ${currentPrice}`,
        });

        await insertTradingSignal({
          ticker: 'MPCI',
          signalType: 'significant_move',
          description: `Price moved ${direction} by ${priceChange.toFixed(2)}%`,
          price: currentPrice.toString(),
          notificationSent: 1,
        });
      }
    }

    console.log(`[ScheduledFetch] Update complete. Signals: ${signals.join(', ')}`);

    return {
      success: true,
      message: `Updated MPCI data. Price: ${currentPrice}, Recommendation: ${analysis.recommendation}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ScheduledFetch] Error:', errorMessage);

    return {
      success: false,
      message: 'Failed to update MPCI data',
      error: errorMessage,
    };
  }
}
