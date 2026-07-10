import type { InventoryItem, Transaction } from '../store';
import { generateInsight, type InsightPayload } from './ai';
import { computeDaysSinceLastSale, computeTrendPct, getItemPrice } from './analytics';

export interface InventoryInsight extends InsightPayload {
    sku: string | null;
    aiGenerated: boolean;
}

/**
 * Builds the single most useful inventory insight from real inventory/sales data,
 * using Gemini when configured and falling back to a deterministic rule-based
 * insight otherwise. Shared by the AI insights endpoint and the analytics endpoint
 * so both surfaces stay consistent.
 */
export const getInventoryInsight = async (
    items: InventoryItem[],
    transactions: Transaction[]
): Promise<InventoryInsight> => {
    if (items.length === 0) {
        return {
            title: 'No Data',
            message: 'Add inventory and transactions to unlock AI insights.',
            recommendations: [],
            sku: null,
            aiGenerated: false,
        };
    }

    const withRevenue = items.map(item => ({
        item,
        value: getItemPrice(item.price) * item.stock,
        trendPct: computeTrendPct(item.id, transactions),
        daysSinceLastSale: computeDaysSinceLastSale(item.id, transactions),
    }));

    const topPerformer = [...withRevenue].sort((a, b) => b.value - a.value)[0];
    const trending = [...withRevenue].sort((a, b) => b.trendPct - a.trendPct)[0];
    const staleItems = withRevenue
        .filter(w => w.daysSinceLastSale === null || w.daysSinceLastSale > 30)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(w => ({ name: w.item.name, sku: w.item.sku, daysSinceLastSale: w.daysSinceLastSale, value: w.value }));

    const fallback: InsightPayload = {
        title: topPerformer ? 'Top Performer' : 'No Data',
        message: topPerformer
            ? `${topPerformer.item.name} (${topPerformer.item.sku}) has the highest inventory value.`
            : 'Add inventory and transactions to see insights.',
        recommendations: staleItems.length > 0
            ? [`Review ${staleItems.length} slow-moving item(s) that haven't sold in 30+ days.`]
            : ['Keep tracking sales to surface more recommendations.'],
    };

    const result = await generateInsight(
        'Analyze this inventory snapshot (top performer, trending item, and stale/dead stock) and give the single most useful business insight for a warehouse manager, plus concrete next steps.',
        {
            topPerformer: topPerformer && {
                name: topPerformer.item.name,
                sku: topPerformer.item.sku,
                inventoryValue: topPerformer.value,
                stock: topPerformer.item.stock,
            },
            trendingItem: trending && trending.trendPct !== 0 ? {
                name: trending.item.name,
                sku: trending.item.sku,
                trendPct: trending.trendPct,
            } : null,
            staleItems,
            totalSkus: items.length,
        },
        fallback
    );

    return { ...result, sku: topPerformer?.item.sku || null };
};
