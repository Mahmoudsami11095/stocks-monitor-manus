/**
 * Technical analysis engine for MPCI stock.
 * Calculates moving averages, RSI, support/resistance, and trading signals.
 */

export interface PricePoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface AnalysisResult {
  ma20: number | null;
  ma50: number | null;
  rsi: number | null;
  support: number | null;
  resistance: number | null;
  recommendation: 'buy' | 'sell' | 'hold';
  entryPrice: number | null;
  exitPrice: number | null;
  fairValueMin: number | null;
  fairValueMax: number | null;
  signals: string[];
}

/**
 * Calculate 20-day moving average.
 */
export function calculateMA20(prices: PricePoint[]): number | null {
  if (prices.length < 20) return null;
  const last20 = prices.slice(-20);
  const sum = last20.reduce((acc, p) => acc + p.close, 0);
  return sum / 20;
}

/**
 * Calculate 50-day moving average.
 */
export function calculateMA50(prices: PricePoint[]): number | null {
  if (prices.length < 50) return null;
  const last50 = prices.slice(-50);
  const sum = last50.reduce((acc, p) => acc + p.close, 0);
  return sum / 50;
}

/**
 * Calculate RSI (Relative Strength Index).
 * Standard 14-period RSI.
 */
export function calculateRSI(prices: PricePoint[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i].close - prices[i - 1].close);
  }

  const lastChanges = changes.slice(-period);
  const gains = lastChanges.filter(c => c > 0).reduce((a, b) => a + b, 0);
  const losses = Math.abs(lastChanges.filter(c => c < 0).reduce((a, b) => a + b, 0));

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Math.round(rsi * 100) / 100;
}

/**
 * Calculate support and resistance levels.
 * Uses pivot point method with recent price data.
 */
export function calculateSupportResistance(prices: PricePoint[]): { support: number; resistance: number } | null {
  if (prices.length < 5) return null;

  // Use last 20 days for calculation
  const recentPrices = prices.slice(-20);
  const highs = recentPrices.map(p => p.high);
  const lows = recentPrices.map(p => p.low);
  const closes = recentPrices.map(p => p.close);

  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const lastClose = closes[closes.length - 1];

  // Pivot point calculation
  const pivot = (maxHigh + minLow + lastClose) / 3;
  const support = 2 * pivot - maxHigh;
  const resistance = 2 * pivot - minLow;

  return {
    support: Math.round(support * 100) / 100,
    resistance: Math.round(resistance * 100) / 100,
  };
}

/**
 * Calculate fair value (intrinsic value range).
 * Uses EPS and sector P/E multiples.
 */
export function calculateFairValue(
  eps: number,
  sectorPELow: number = 15,
  sectorPEHigh: number = 30
): { min: number; max: number } {
  const min = eps * sectorPELow;
  const max = eps * sectorPEHigh;

  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
  };
}

/**
 * Generate Buy/Sell/Hold recommendation based on technical indicators.
 */
export function generateRecommendation(
  currentPrice: number,
  ma20: number | null,
  ma50: number | null,
  rsi: number | null,
  support: number | null,
  resistance: number | null,
  fairValueMin: number | null,
  fairValueMax: number | null
): { recommendation: 'buy' | 'sell' | 'hold'; signals: string[] } {
  const signals: string[] = [];
  let buyScore = 0;
  let sellScore = 0;

  // MA20 vs MA50 analysis
  if (ma20 && ma50) {
    if (ma20 > ma50) {
      buyScore += 2;
      signals.push('MA20 above MA50 (bullish)');
    } else {
      sellScore += 2;
      signals.push('MA20 below MA50 (bearish)');
    }
  }

  // RSI analysis
  if (rsi !== null) {
    if (rsi < 30) {
      buyScore += 2;
      signals.push('RSI oversold (<30)');
    } else if (rsi > 70) {
      sellScore += 2;
      signals.push('RSI overbought (>70)');
    } else if (rsi > 40 && rsi < 60) {
      signals.push('RSI neutral (40-60)');
    }
  }

  // Price vs Support/Resistance
  if (support && currentPrice < support * 1.05) {
    buyScore += 1;
    signals.push('Price near support level');
  }

  if (resistance && currentPrice > resistance * 0.95) {
    sellScore += 1;
    signals.push('Price near resistance level');
  }

  // Fair value analysis
  if (fairValueMin && fairValueMax) {
    if (currentPrice < fairValueMin * 0.9) {
      buyScore += 2;
      signals.push('Price significantly below fair value');
    } else if (currentPrice > fairValueMax * 1.1) {
      sellScore += 2;
      signals.push('Price significantly above fair value');
    } else if (currentPrice >= fairValueMin && currentPrice <= fairValueMax) {
      signals.push('Price within fair value range');
    }
  }

  // Determine recommendation
  let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
  if (buyScore > sellScore + 1) {
    recommendation = 'buy';
  } else if (sellScore > buyScore + 1) {
    recommendation = 'sell';
  }

  return { recommendation, signals };
}

/**
 * Calculate entry and exit prices based on technical levels.
 */
export function calculateEntryExitPrices(
  currentPrice: number,
  support: number | null,
  resistance: number | null,
  ma20: number | null,
  recommendation: 'buy' | 'sell' | 'hold'
): { entryPrice: number | null; exitPrice: number | null } {
  let entryPrice: number | null = null;
  let exitPrice: number | null = null;

  if (recommendation === 'buy') {
    // Entry: slightly above support or at MA20
    if (support) {
      entryPrice = Math.round(support * 1.02 * 100) / 100;
    } else if (ma20) {
      entryPrice = Math.round(ma20 * 100) / 100;
    }

    // Exit: at resistance or 5% above current
    if (resistance) {
      exitPrice = Math.round(resistance * 0.98 * 100) / 100;
    } else {
      exitPrice = Math.round(currentPrice * 1.05 * 100) / 100;
    }
  } else if (recommendation === 'sell') {
    // Entry: slightly below resistance or at current price
    if (resistance) {
      entryPrice = Math.round(resistance * 0.98 * 100) / 100;
    } else {
      entryPrice = Math.round(currentPrice * 100) / 100;
    }

    // Exit: at support or 3% below current
    if (support) {
      exitPrice = Math.round(support * 1.02 * 100) / 100;
    } else {
      exitPrice = Math.round(currentPrice * 0.97 * 100) / 100;
    }
  }

  return { entryPrice, exitPrice };
}

/**
 * Perform complete technical analysis.
 */
export function performAnalysis(
  prices: PricePoint[],
  currentPrice: number,
  eps: number
): AnalysisResult {
  const ma20 = calculateMA20(prices);
  const ma50 = calculateMA50(prices);
  const rsi = calculateRSI(prices);
  const supportResistance = calculateSupportResistance(prices);
  const fairValue = calculateFairValue(eps);

  const support = supportResistance?.support ?? null;
  const resistance = supportResistance?.resistance ?? null;

  const { recommendation, signals } = generateRecommendation(
    currentPrice,
    ma20,
    ma50,
    rsi,
    support,
    resistance,
    fairValue.min,
    fairValue.max
  );

  const { entryPrice, exitPrice } = calculateEntryExitPrices(
    currentPrice,
    support,
    resistance,
    ma20,
    recommendation
  );

  return {
    ma20,
    ma50,
    rsi,
    support,
    resistance,
    recommendation,
    entryPrice,
    exitPrice,
    fairValueMin: fairValue.min,
    fairValueMax: fairValue.max,
    signals,
  };
}
