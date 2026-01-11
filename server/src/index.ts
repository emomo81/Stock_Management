import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
