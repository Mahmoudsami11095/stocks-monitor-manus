/**
 * Data fetcher for MPCI stock data.
 * Retrieves live price and metrics from public stock data sources.
 */

import axios from 'axios';

export interface StockDataFetch {
  price: string;
  dayHigh: string;
  dayLow: string;
  weekHigh52: string;
  weekLow52: string;
  peRatio: string;
  eps: string;
  marketCap: string;
  volume: string;
  previousClose: string;
  open: string;
  bidAsk: string;
  timestamp: Date;
}

/**
 * Fetch MPCI stock data from Investing.com API.
 * Note: This is a mock implementation. In production, you would use:
 * - Official EGX API
 * - Investing.com API (with proper authentication)
 * - Alpha Vantage or similar service
 */
export async function fetchMPCIStockData(): Promise<StockDataFetch | null> {
  try {
    // Mock data based on the latest information from the analysis report
    // In production, replace this with actual API calls
    const mockData: StockDataFetch = {
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
      timestamp: new Date(),
    };

    return mockData;
  } catch (error) {
    console.error('[DataFetcher] Error fetching MPCI data:', error);
    return null;
  }
}

/**
 * Fetch historical price data for MPCI.
 * Returns OHLC (Open, High, Low, Close) data for charting.
 * Mock implementation - in production, use real API.
 */
export async function fetchMPCIPriceHistory(
  days: number = 365
): Promise<Array<{ date: Date; open: string; high: string; low: string; close: string; volume: string }> | null> {
  try {
    // Generate mock historical data
    const history = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Simulate realistic price movements
      const basePrice = 200 + Math.random() * 80;
      const open = (basePrice + (Math.random() - 0.5) * 10).toFixed(2);
      const close = (basePrice + (Math.random() - 0.5) * 10).toFixed(2);
      const high = Math.max(parseFloat(open), parseFloat(close)) + Math.random() * 5;
      const low = Math.min(parseFloat(open), parseFloat(close)) - Math.random() * 5;
      const volume = Math.floor(300000 + Math.random() * 300000).toString();

      history.push({
        date,
        open,
        high: high.toFixed(2),
        low: low.toFixed(2),
        close,
        volume,
      });
    }

    return history;
  } catch (error) {
    console.error('[DataFetcher] Error fetching price history:', error);
    return null;
  }
}

/**
 * Validate and normalize stock data.
 */
export function validateStockData(data: StockDataFetch): boolean {
  return !!(data.price &&
    data.dayHigh &&
    data.dayLow &&
    data.peRatio &&
    data.eps &&
    data.marketCap &&
    data.volume);
}

/**
 * Parse numeric string values safely.
 */
export function parseNumeric(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
  return isNaN(parsed) ? null : parsed;
}
