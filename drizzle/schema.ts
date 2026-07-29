import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Stock price data for MPCI — stores historical prices and key metrics.
 * Updated hourly via Heartbeat cron job.
 */
export const stockData = mysqlTable("stock_data", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull().default("MPCI"),
  price: varchar("price", { length: 20 }).notNull(), // Store as string for precision
  dayHigh: varchar("day_high", { length: 20 }),
  dayLow: varchar("day_low", { length: 20 }),
  weekHigh52: varchar("week_high_52", { length: 20 }),
  weekLow52: varchar("week_low_52", { length: 20 }),
  peRatio: varchar("pe_ratio", { length: 20 }),
  eps: varchar("eps", { length: 20 }),
  marketCap: varchar("market_cap", { length: 50 }),
  volume: varchar("volume", { length: 20 }),
  previousClose: varchar("previous_close", { length: 20 }),
  open: varchar("open", { length: 20 }),
  bidAsk: varchar("bid_ask", { length: 50 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type StockData = typeof stockData.$inferSelect;
export type InsertStockData = typeof stockData.$inferInsert;

/**
 * Technical indicators calculated from price data.
 * Updated hourly via Heartbeat cron job.
 */
export const technicalIndicators = mysqlTable("technical_indicators", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull().default("MPCI"),
  ma20: varchar("ma_20", { length: 20 }), // 20-day moving average
  ma50: varchar("ma_50", { length: 20 }), // 50-day moving average
  rsi: varchar("rsi", { length: 20 }), // Relative Strength Index
  support: varchar("support", { length: 20 }), // Support level
  resistance: varchar("resistance", { length: 20 }), // Resistance level
  recommendation: mysqlEnum("recommendation", ["buy", "sell", "hold"]).notNull().default("hold"),
  entryPrice: varchar("entry_price", { length: 20 }),
  exitPrice: varchar("exit_price", { length: 20 }),
  fairValueMin: varchar("fair_value_min", { length: 20 }),
  fairValueMax: varchar("fair_value_max", { length: 20 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TechnicalIndicators = typeof technicalIndicators.$inferSelect;
export type InsertTechnicalIndicators = typeof technicalIndicators.$inferInsert;

/**
 * Historical price data for charting.
 * Stores daily OHLC (Open, High, Low, Close) data.
 */
export const priceHistory = mysqlTable("price_history", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull().default("MPCI"),
  date: timestamp("date").notNull(),
  open: varchar("open", { length: 20 }).notNull(),
  high: varchar("high", { length: 20 }).notNull(),
  low: varchar("low", { length: 20 }).notNull(),
  close: varchar("close", { length: 20 }).notNull(),
  volume: varchar("volume", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

/**
 * Tracks trading signals and notifications sent to the owner.
 * Used to prevent duplicate notifications and maintain history.
 */
export const tradingSignals = mysqlTable("trading_signals", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull().default("MPCI"),
  signalType: mysqlEnum("signal_type", [
    "price_support_cross",
    "price_resistance_cross",
    "recommendation_change",
    "significant_move",
  ]).notNull(),
  description: text("description"),
  price: varchar("price", { length: 20 }),
  notificationSent: int("notification_sent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TradingSignals = typeof tradingSignals.$inferSelect;
export type InsertTradingSignals = typeof tradingSignals.$inferInsert;