import express from 'express';
import { getItems, getTransactions } from '../store';
import { generateInsight, isAiEnabled } from '../services/ai';
import { getInventoryInsight } from '../services/insights';
import { computeForecast } from '../services/analytics';

const router = express.Router();

router.get('/status', (req, res) => {
    res.json({ aiEnabled: isAiEnabled() });
});

// General inventory insight - powers the Dashboard/Analytics "AI Insight" panels.
router.get('/insights', async (req, res) => {
    try {
        const items = await getItems();
        const transactions = await getTransactions();
        const insight = await getInventoryInsight(items, transactions);
        res.json(insight);
    } catch (error) {
        console.error('AI insight error:', error);
        res.status(500).json({ message: 'Error generating AI insight' });
    }
});

// Per-item reorder suggestion - powers the Stock-In "AI Suggests" hint.
router.get('/reorder/:itemId', async (req, res) => {
    try {
        const items = await getItems();
        const transactions = await getTransactions();
        const item = items.find(i => i.id === req.params.itemId);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const forecast = computeForecast(item, transactions);

        const fallback = {
            title: 'Reorder Suggestion',
            message: forecast.reorderQty > 0
                ? `Order ${forecast.reorderQty} units to maintain a 30-day supply.`
                : 'Stock levels are healthy. No reorder needed.',
            recommendations: [],
        };

        const result = await generateInsight(
            `A reorder quantity of ${forecast.reorderQty} units was already computed from real sales velocity (${forecast.dailyVelocity.toFixed(2)} units/day). Explain the reasoning in one short sentence - do not change the number.`,
            {
                itemName: item.name,
                sku: item.sku,
                currentStock: item.stock,
                dailyVelocity: Number(forecast.dailyVelocity.toFixed(2)),
                daysUntilStockOut: forecast.daysUntilStockOut,
                computedReorderQty: forecast.reorderQty,
            },
            fallback
        );

        res.json({
            itemId: item.id,
            sku: item.sku,
            suggestedQty: forecast.reorderQty,
            dailyVelocity: Number(forecast.dailyVelocity.toFixed(2)),
            confidence: forecast.confidence,
            rationale: result.message,
            aiGenerated: result.aiGenerated,
        });
    } catch (error) {
        console.error('AI reorder suggestion error:', error);
        res.status(500).json({ message: 'Error generating reorder suggestion' });
    }
});

export default router;
