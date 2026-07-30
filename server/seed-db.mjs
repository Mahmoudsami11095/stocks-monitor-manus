/**
 * Seed script to populate database with initial MPCI stock data.
 * Run with: node server/seed-db.mjs
 */

import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost';
const DB_NAME = process.env.DATABASE_URL?.split('/').pop() || 'test';
const DB_USER = process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root';
const DB_PASS = process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '';

async function seedDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });

    console.log('✓ Connected to database');

    // Insert initial stock data
    const stockData = {
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
      timestamp: new Date(),
    };

    await connection.execute(
      `INSERT INTO stock_data (ticker, price, day_high, day_low, week_high_52, week_low_52, pe_ratio, eps, market_cap, volume, previous_close, open, bid_ask, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stockData.ticker,
        stockData.price,
        stockData.dayHigh,
        stockData.dayLow,
        stockData.weekHigh52,
        stockData.weekLow52,
        stockData.peRatio,
        stockData.eps,
        stockData.marketCap,
        stockData.volume,
        stockData.previousClose,
        stockData.open,
        stockData.bidAsk,
        stockData.timestamp,
      ]
    );

    console.log('✓ Inserted stock data');

    // Insert price history (365 days)
    const now = new Date();
    const priceHistory = [];

    for (let i = 365; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const basePrice = 200 + Math.random() * 80;
      const open = (basePrice + (Math.random() - 0.5) * 10).toFixed(2);
      const close = (basePrice + (Math.random() - 0.5) * 10).toFixed(2);
      const high = Math.max(parseFloat(open), parseFloat(close)) + Math.random() * 5;
      const low = Math.min(parseFloat(open), parseFloat(close)) - Math.random() * 5;
      const volume = Math.floor(300000 + Math.random() * 300000);

      priceHistory.push([
        'MPCI',
        date,
        open,
        high.toFixed(2),
        low.toFixed(2),
        close,
        volume.toString(),
      ]);
    }

    for (const record of priceHistory) {
      await connection.execute(
        `INSERT INTO price_history (ticker, date, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        record
      );
    }

    console.log(`✓ Inserted ${priceHistory.length} price history records`);

    // Insert technical indicators
    const technicalIndicators = {
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
      timestamp: new Date(),
    };

    await connection.execute(
      `INSERT INTO technical_indicators (ticker, ma_20, ma_50, rsi, support, resistance, recommendation, entry_price, exit_price, fair_value_min, fair_value_max, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        technicalIndicators.ticker,
        technicalIndicators.ma20,
        technicalIndicators.ma50,
        technicalIndicators.rsi,
        technicalIndicators.support,
        technicalIndicators.resistance,
        technicalIndicators.recommendation,
        technicalIndicators.entryPrice,
        technicalIndicators.exitPrice,
        technicalIndicators.fairValueMin,
        technicalIndicators.fairValueMax,
        technicalIndicators.timestamp,
      ]
    );

    console.log('✓ Inserted technical indicators');

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
