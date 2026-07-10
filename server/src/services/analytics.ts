import type { InventoryItem, Transaction } from '../store';

const DAY_MS = 24 * 60 * 60 * 1000;

const parsePrice = (price: string | number): number => {
    if (typeof price === 'number') return price;
    return parseFloat(String(price).replace(/[^0-9.-]/g, '')) || 0;
};

const itemSales = (itemId: string, transactions: Transaction[], sinceMs?: number): Transaction[] => {
    return transactions.filter(t => {
        if (t.type !== 'OUT' || t.itemId !== itemId) return false;
        if (sinceMs === undefined) return true;
        const time = t.date ? new Date(t.date).getTime() : 0;
        return time >= sinceMs;
    });
};

/** Units sold per day for an item, averaged over the trailing window. */
export const computeVelocity = (itemId: string, transactions: Transaction[], windowDays = 30): number => {
    const since = Date.now() - windowDays * DAY_MS;
    const sales = itemSales(itemId, transactions, since);
    const totalQty = sales.reduce((sum, t) => sum + t.qty, 0);
    return totalQty / windowDays;
};

/** Total units sold for an item within the trailing window. */
export const computeUnitsSold = (itemId: string, transactions: Transaction[], windowDays = 30): number => {
    const since = Date.now() - windowDays * DAY_MS;
    return itemSales(itemId, transactions, since).reduce((sum, t) => sum + t.qty, 0);
};

/** Percent change in units sold between the most recent half-window and the prior half-window. */
export const computeTrendPct = (itemId: string, transactions: Transaction[], windowDays = 30): number => {
    const half = windowDays / 2;
    const now = Date.now();
    const recent = itemSales(itemId, transactions, now - half * DAY_MS)
        .reduce((sum, t) => sum + t.qty, 0);
    const priorSales = itemSales(itemId, transactions, now - windowDays * DAY_MS)
        .filter(t => new Date(t.date!).getTime() < now - half * DAY_MS);
    const prior = priorSales.reduce((sum, t) => sum + t.qty, 0);

    if (prior === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - prior) / prior) * 100);
};

/** Days since the item's last outbound (sale) transaction, or null if it has never sold. */
export const computeDaysSinceLastSale = (itemId: string, transactions: Transaction[]): number | null => {
    const sales = itemSales(itemId, transactions);
    if (sales.length === 0) return null;
    const lastSaleMs = Math.max(...sales.map(t => new Date(t.date!).getTime()));
    return Math.floor((Date.now() - lastSaleMs) / DAY_MS);
};

/** Confidence score for a forecast based on how much sales history backs it (more data = higher confidence). */
export const computeConfidence = (itemId: string, transactions: Transaction[], windowDays = 30): number => {
    const since = Date.now() - windowDays * DAY_MS;
    const sampleCount = itemSales(itemId, transactions, since).length;
    // 0 samples -> 40% (pure heuristic), scales up to 95% with sustained sales history.
    return Math.min(95, 40 + sampleCount * 6);
};

export const getItemPrice = parsePrice;

export interface ForecastResult {
    dailyVelocity: number;
    daysUntilStockOut: number;
    stockOutDate: Date;
    reorderQty: number;
    confidence: number;
}

/** Computes a real reorder forecast for an item from its actual sales velocity. No randomness. */
export const computeForecast = (
    item: InventoryItem,
    transactions: Transaction[],
    opts: { targetDays?: number; windowDays?: number } = {}
): ForecastResult => {
    const targetDays = opts.targetDays ?? 30;
    const windowDays = opts.windowDays ?? 30;

    const historicalVelocity = computeVelocity(item.id, transactions, windowDays);
    // If there's no sales history yet, fall back to a conservative estimate based on current stock
    // so new items still get a usable (non-random) forecast instead of a divide-by-zero.
    const dailyVelocity = historicalVelocity > 0 ? historicalVelocity : Math.max(0.1, item.stock / 60);

    const daysUntilStockOut = item.stock > 0 ? Math.floor(item.stock / dailyVelocity) : 0;
    const stockOutDate = new Date(Date.now() + daysUntilStockOut * DAY_MS);

    const targetStock = Math.ceil(dailyVelocity * targetDays);
    const reorderQty = Math.max(0, targetStock - item.stock);

    const confidence = computeConfidence(item.id, transactions, windowDays);

    return { dailyVelocity, daysUntilStockOut, stockOutDate, reorderQty, confidence };
};
