import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, stockData, InsertStockData, technicalIndicators, InsertTechnicalIndicators, priceHistory, InsertPriceHistory, tradingSignals, InsertTradingSignals } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get the latest stock data for MPCI.
 */
export async function getLatestStockData() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(stockData).orderBy(desc(stockData.createdAt)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get the latest technical indicators for MPCI.
 */
export async function getLatestTechnicalIndicators() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(technicalIndicators).orderBy(desc(technicalIndicators.createdAt)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get price history for a specific date range.
 */
export async function getPriceHistory(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(priceHistory)
    .where(and(
      gte(priceHistory.date, startDate),
      lte(priceHistory.date, endDate)
    ))
    .orderBy(asc(priceHistory.date));
}

/**
 * Insert new stock data.
 */
export async function insertStockData(data: InsertStockData) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(stockData).values(data);
  return result;
}

/**
 * Insert new technical indicators.
 */
export async function insertTechnicalIndicators(data: InsertTechnicalIndicators) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(technicalIndicators).values(data);
  return result;
}

/**
 * Insert price history data.
 */
export async function insertPriceHistory(data: InsertPriceHistory) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(priceHistory).values(data);
  return result;
}

/**
 * Get recent trading signals.
 */
export async function getRecentTradingSignals(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tradingSignals)
    .orderBy(desc(tradingSignals.createdAt))
    .limit(limit);
}

/**
 * Insert a new trading signal.
 */
export async function insertTradingSignal(data: InsertTradingSignals) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(tradingSignals).values(data);
  return result;
}

/**
 * Update trading signal notification status.
 */
export async function updateTradingSignalNotification(id: number, sent: boolean) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(tradingSignals)
    .set({ notificationSent: sent ? 1 : 0 })
    .where(eq(tradingSignals.id, id));
}
