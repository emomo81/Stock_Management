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

export default router;
