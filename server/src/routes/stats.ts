import express from 'express';
import { getItems } from '../store';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const items = await getItems();

        // Calculate Stats
        const totalSKUs = items.length;
        const lowStock = items.filter(i => i.stock < 20 && i.stock > 0).length;
        const outOfStock = items.filter(i => i.stock === 0).length;

        // Calculate Total Value
        const totalValue = items.reduce((acc, item) => {
            const price = parseFloat(item.price.replace('$', '').replace(',', ''));
            return acc + (price * item.stock);
        }, 0);

        // Mock Chart Data (Static for now, but could be randomized or stored)
        const chartData = [
            { name: 'Sep 15', value: 100, forecast: 100, critical: 50 },
            { name: 'Sep 22', value: 90, forecast: 90, critical: 50 },
            { name: 'Sep 29', value: 75, forecast: 75, critical: 50 },
            { name: 'Oct 06', value: 50, forecast: 50, critical: 50 },
            { name: 'Oct 13', value: null, forecast: 35, critical: 50 },
            { name: 'Oct 24', value: null, forecast: 10, critical: 50 },
            { name: 'Nov 07', value: null, forecast: 0, critical: 50 },
        ];

        // Dynamic Fast Movers (Simulated based on stock levels for now)
        // In a real app, this would come from a Sales/Orders database
        const fastMovers = items
            .filter(item => item.stock < 50) // Simulate "moving fast" if stock is low
            .slice(0, 5)
            .map((item, index) => ({
                rank: `0${index + 1}`,
                name: item.name,
                sku: item.sku,
                stock: item.stock,
                sold: Math.floor(Math.random() * 1000) + 100, // Simulated sales count
                trend: `+${Math.floor(Math.random() * 30)}%`, // Simulated trend
                color: ['emerald', 'blue', 'purple', 'amber', 'rose'][index % 5]
            }));

        // Dead Stock - items with high stock that aren't moving (simulated as high stock items)
        const deadStock = items
            .filter(item => item.stock > 30) // Items with high stock
            .slice(0, 5)
            .map((item) => {
                const price = parseFloat(String(item.price).replace('$', '').replace(',', '')) || 0;
                return {
                    name: item.name,
                    sku: item.sku,
                    stock: item.stock,
                    value: (price * item.stock).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                    days: `${Math.floor(Math.random() * 60) + 60} Days` // Simulated days without sale
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
        const price = parseFloat(String(selectedItem.price).replace('$', '').replace(',', '')) || 0;
        const currentStock = selectedItem.stock;

        // Simulated sales velocity (units per day) - in real app, calculate from transactions
        const dailyVelocity = Math.max(1, Math.floor(currentStock / 30) + Math.random() * 3);

        // Calculate stock-out date
        const daysUntilStockOut = currentStock > 0 ? Math.floor(currentStock / dailyVelocity) : 0;
        const stockOutDate = new Date();
        stockOutDate.setDate(stockOutDate.getDate() + daysUntilStockOut);

        // Recommended reorder quantity (target 30-day supply)
        const targetDays = 30;
        const targetStock = Math.ceil(dailyVelocity * targetDays);
        const reorderQty = Math.max(0, targetStock - currentStock);

        // Confidence score (simulated)
        const confidence = Math.floor(70 + Math.random() * 25);

        // Generate chart data (weekly intervals)
        const chartData = [];
        const now = new Date();
        for (let week = 0; week < 8; week++) {
            const date = new Date(now);
            date.setDate(date.getDate() + (week * 7));
            const projectedStock = Math.max(0, currentStock - (dailyVelocity * week * 7));

            chartData.push({
                name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: week < 2 ? Math.max(0, currentStock - (dailyVelocity * week * 7)) : null, // Actual data (past 2 weeks simulated)
                forecast: projectedStock,
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

        // Import getTransactions dynamically
        const { getTransactions } = await import('../store');
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
            const price = parseFloat(String(item.price).replace('$', '').replace(',', '')) || 0;
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

        // Find top performing item for AI insight
        const topItem = items
            .filter(i => i.stock > 0)
            .sort((a, b) => {
                const priceA = parseFloat(String(a.price).replace('$', '').replace(',', '')) || 0;
                const priceB = parseFloat(String(b.price).replace('$', '').replace(',', '')) || 0;
                return (priceB * b.stock) - (priceA * a.stock);
            })[0];

        res.json({
            stats: {
                totalRevenue: totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                grossProfit: grossProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                netMargin: netMargin.toFixed(1),
                totalTransactions: transactions.length
            },
            profitData,
            categoryBreakdown,
            insight: {
                title: topItem ? 'Top Performer' : 'No Data',
                message: topItem
                    ? `${topItem.name} (${topItem.sku}) has the highest inventory value.`
                    : 'Add inventory and transactions to see insights.',
                sku: topItem?.sku || null
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Error generating analytics', error });
    }
});

export default router;
