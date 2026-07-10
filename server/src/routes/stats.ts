import express from 'express';
import { getItems, getTransactions } from '../store';
import { computeUnitsSold, computeTrendPct, computeDaysSinceLastSale, computeForecast, getItemPrice } from '../services/analytics';
import { getInventoryInsight } from '../services/insights';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const items = await getItems();
        const transactions = await getTransactions();

        // Calculate Stats
        const totalSKUs = items.length;
        const lowStock = items.filter(i => i.stock < 20 && i.stock > 0).length;
        const outOfStock = items.filter(i => i.stock === 0).length;

        // Calculate Total Value
        const totalValue = items.reduce((acc, item) => {
            const price = getItemPrice(item.price);
            return acc + (price * item.stock);
        }, 0);

        // Aggregate stock-value trend for the last 4 weeks plus a 3-week forward projection,
        // based on real transaction velocity rather than fabricated numbers.
        const totalDailyVelocityValue = items.reduce((sum, item) => {
            const price = getItemPrice(item.price);
            return sum + computeUnitsSold(item.id, transactions, 30) / 30 * price;
        }, 0);
        const chartData = [];
        for (let week = -3; week <= 3; week++) {
            const date = new Date();
            date.setDate(date.getDate() + week * 7);
            const projected = Math.max(0, totalValue - totalDailyVelocityValue * week * 7);
            chartData.push({
                name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: week <= 0 ? Math.round(projected) : null,
                forecast: Math.round(projected),
                critical: Math.round(totalValue * 0.15),
            });
        }

        // Fast Movers - real units sold and trend from OUT transactions in the last 30 days.
        const fastMovers = items
            .map(item => ({ item, sold: computeUnitsSold(item.id, transactions, 30) }))
            .filter(({ sold }) => sold > 0)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5)
            .map(({ item, sold }, index) => {
                const trendPct = computeTrendPct(item.id, transactions, 30);
                return {
                    rank: `0${index + 1}`,
                    name: item.name,
                    sku: item.sku,
                    stock: item.stock,
                    sold,
                    trend: `${trendPct >= 0 ? '+' : ''}${trendPct}%`,
                    color: ['emerald', 'blue', 'purple', 'amber', 'rose'][index % 5]
                };
            });

        // Dead Stock - items with stock on hand that haven't sold in 30+ days (or never sold).
        const inventoryValue = (item: { price: string; stock: number }) => getItemPrice(item.price) * item.stock;
        const deadStock = items
            .map(item => ({ item, daysSinceLastSale: computeDaysSinceLastSale(item.id, transactions) }))
            .filter(({ item, daysSinceLastSale }) => item.stock > 0 && (daysSinceLastSale === null || daysSinceLastSale > 30))
            .sort((a, b) => inventoryValue(b.item) - inventoryValue(a.item))
            .slice(0, 5)
            .map(({ item, daysSinceLastSale }) => {
                const price = getItemPrice(item.price);
                return {
                    name: item.name,
                    sku: item.sku,
                    stock: item.stock,
                    value: (price * item.stock).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                    days: daysSinceLastSale === null ? 'Never sold' : `${daysSinceLastSale} Days`
                };
            });

        res.json({
            stats: {
                totalSKUs,
                lowStock,
                outOfStock,
                totalValue: totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            },
            chartData,
            fastMovers,
            deadStock
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
});

// Forecasting endpoint - provides dynamic forecasting data for smart forecasting view
router.get('/forecasting', async (req, res) => {
    try {
        const items = await getItems();
        const transactions = await getTransactions();

        if (items.length === 0) {
            return res.json({
                items: [],
                selectedItem: null,
                forecast: null
            });
        }

        // Get item ID from query or use first low-stock item
        const itemId = req.query.itemId as string;
        let selectedItem = itemId
            ? items.find(i => i.id === itemId)
            : items.filter(i => i.stock < 50).sort((a, b) => a.stock - b.stock)[0] || items[0];

        if (!selectedItem) {
            selectedItem = items[0];
        }

        // Calculate forecasting data
        const price = getItemPrice(selectedItem.price);
        const currentStock = selectedItem.stock;

        const forecastResult = computeForecast(selectedItem, transactions);
        const { dailyVelocity, daysUntilStockOut, stockOutDate, reorderQty, confidence } = forecastResult;

        // Generate chart data (weekly intervals): past 2 weeks from real sales history, then projection.
        const chartData = [];
        const now = new Date();
        for (let week = -2; week < 6; week++) {
            const date = new Date(now);
            date.setDate(date.getDate() + (week * 7));
            const projectedStock = Math.max(0, currentStock - (dailyVelocity * week * 7));

            chartData.push({
                name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: week <= 0 ? Math.round(projectedStock) : null,
                forecast: Math.round(projectedStock),
                critical: Math.min(20, currentStock * 0.2) // Critical threshold
            });
        }

        // List of items available for forecasting (low stock priority)
        const forecastableItems = items
            .map(item => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                stock: item.stock,
                selected: item.id === selectedItem.id
            }))
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 10);

        res.json({
            items: forecastableItems,
            selectedItem: {
                id: selectedItem.id,
                name: selectedItem.name,
                sku: selectedItem.sku,
                stock: currentStock,
                price: price
            },
            forecast: {
                dailyVelocity: dailyVelocity.toFixed(1),
                daysUntilStockOut,
                stockOutDate: stockOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                reorderQty,
                confidence,
                chartData
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating forecast', error });
    }
});

// Analytics endpoint - provides profit analysis data
router.get('/analytics', async (req, res) => {
    try {
        const items = await getItems();
        const transactions = await getTransactions();

        // Calculate revenue and costs from transactions
        let totalRevenue = 0;
        let totalCost = 0;

        // OUT transactions = sales (revenue)
        // IN transactions = purchases (cost)
        const salesTransactions = transactions.filter(t => t.type === 'OUT');
        const purchaseTransactions = transactions.filter(t => t.type === 'IN');

        salesTransactions.forEach(t => {
            totalRevenue += (t.price || 0) * (t.qty || 1);
        });

        purchaseTransactions.forEach(t => {
            totalCost += (t.price || 0) * (t.qty || 1);
        });

        // Calculate gross profit (revenue - cost)
        const grossProfit = totalRevenue - totalCost;

        // Calculate net margin
        const netMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

        // Generate weekly profit data (last 7 days)
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const profitData = [];
        const now = new Date();

        // Helper function to extract date string (YYYY-MM-DD) from various formats
        const extractDateStr = (dateValue: string | null | undefined): string | null => {
            if (!dateValue) return null;
            // Try to parse as Date and get YYYY-MM-DD
            const d = new Date(dateValue);
            if (!isNaN(d.getTime())) {
                // Return in local date format YYYY-MM-DD
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            // Fallback: try to extract YYYY-MM-DD from string
            const match = dateValue.match(/(\d{4}-\d{2}-\d{2})/);
            return match ? match[1] : null;
        };

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayName = weekDays[date.getDay()];
            // Get local date string in YYYY-MM-DD format
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Filter transactions for this day
            const daySales = salesTransactions.filter(t => {
                const tDate = extractDateStr(t.date);
                return tDate === dateStr;
            });
            const dayPurchases = purchaseTransactions.filter(t => {
                const tDate = extractDateStr(t.date);
                return tDate === dateStr;
            });

            const dayRevenue = daySales.reduce((sum, t) => sum + ((t.price || 0) * (t.qty || 1)), 0);
            const dayCost = dayPurchases.reduce((sum, t) => sum + ((t.price || 0) * (t.qty || 1)), 0);

            profitData.push({
                name: dayName,
                revenue: Math.round(dayRevenue * 100) / 100, // Keep actual dollar values with 2 decimal places
                profit: Math.round((dayRevenue - dayCost) * 100) / 100
            });
        }

        // Category breakdown from items
        const categoryMap = new Map<string, { revenue: number; items: number }>();
        items.forEach(item => {
            const cat = item.cat || 'Uncategorized';
            const price = getItemPrice(item.price);
            const existing = categoryMap.get(cat) || { revenue: 0, items: 0 };
            existing.revenue += price * item.stock;
            existing.items += 1;
            categoryMap.set(cat, existing);
        });

        // Convert to array and sort by revenue
        const totalCategoryValue = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.revenue, 0);
        const categoryBreakdown = Array.from(categoryMap.entries())
            .map(([name, data], index) => ({
                name,
                value: data.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).replace('$', '$'),
                percentage: totalCategoryValue > 0 ? Math.round((data.revenue / totalCategoryValue) * 100) : 0,
                color: ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][index % 5]
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);

        // AI-powered (Gemini) insight, falling back to deterministic analysis when no API key is set.
        const insight = await getInventoryInsight(items, transactions);

        res.json({
            stats: {
                totalRevenue: totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                grossProfit: grossProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                netMargin: netMargin.toFixed(1),
                totalTransactions: transactions.length
            },
            profitData,
            categoryBreakdown,
            insight
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Error generating analytics', error });
    }
});

export default router;
