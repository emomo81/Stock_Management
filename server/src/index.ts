import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { addTransaction, getVendors, getTransactions } from './store'; // Added imports for new routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

import inventoryRoutes from './routes/inventory';
import statsRoutes from './routes/stats';
import authRoutes from './routes/auth';

app.use(cors());
app.use(express.json());

app.use('/api/inventory', inventoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// Get unique vendors from history
app.get('/api/vendors', async (req, res) => {
    try {
        const vendors = await getVendors();
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});s

// Add Transaction (Internal or Audit)
app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = await addTransaction(req.body);
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Get all transactions for analysis
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await getTransactions();
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
