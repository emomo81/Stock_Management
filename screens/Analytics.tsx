import React, { useState, useEffect } from 'react';
import type { UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface AnalyticsProps {
    userRole: UserRole;
}

const Analytics: React.FC<AnalyticsProps> = ({ userRole }) => {
    const [items, setItems] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [forecastData, setForecastData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemsRes, transRes] = await Promise.all([
                    fetch('http://localhost:5001/api/inventory'),
                    fetch('http://localhost:5001/api/transactions')
                ]);

                const itemsData = await itemsRes.json();
                const transData = await transRes.json();

                setItems(itemsData);
                setTransactions(transData);

                // Calculate Forecast
                if (Array.isArray(itemsData) && Array.isArray(transData)) {
                    const now = new Date();
                    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

                    const forecast = itemsData.map((item: any) => {
                        const outTx = transData.filter((t: any) =>
                            t.itemId === item.id &&
                            t.type === 'OUT' &&
                            new Date(t.date || '') >= thirtyDaysAgo
                        );

                        const totalSold = outTx.reduce((sum: number, t: any) => sum + (t.qty || 0), 0);
                        const velocity = totalSold / 30; // Units per day
                        const daysRemaining = velocity > 0 ? Math.floor(item.stock / velocity) : 999;

                        let status = 'Healthy';
                        let statusColor = 'text-emerald-500';
                        if (daysRemaining < 7) { status = 'Critical'; statusColor = 'text-red-500'; }
                        else if (daysRemaining < 14) { status = 'Low'; statusColor = 'text-yellow-500'; }

                        const targetStock = Math.ceil(velocity * 30);
                        const reorderQty = Math.max(0, targetStock - item.stock);

                        return {
                            ...item,
                            velocity: velocity.toFixed(2),
                            daysRemaining: daysRemaining === 999 ? '∞' : daysRemaining,
                            status,
                            statusColor,
                            reorderQty,
                            totalSold
                        };
                    }).sort((a: any, b: any) => b.velocity - a.velocity); // Sort by highest velocity

                    setForecastData(forecast);
                }
            } catch (error) {
                console.error("Failed to load analytics data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-white">Loading Forecasting Engine...</div>;

    const topMovers = forecastData.slice(0, 5);
    const lowStockCount = forecastData.filter(i => i.status === 'Critical' || i.status === 'Low').length;
    const totalValue = items.reduce((sum, item) => sum + (item.stock * (parseFloat(item.price) || 0)), 0);

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#101922]">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Smart Forecasting</h2>
                        <p className="text-slate-400 text-base">AI-driven inventory optimization and reorder insights.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-xl flex flex-col gap-2">
                        <p className="text-slate-400 text-sm font-bold uppercase">Total Inventory Value</p>
                        <h3 className="text-3xl font-mono font-bold text-white">${totalValue.toLocaleString()}</h3>
                    </div>
                    <div className="glass-panel p-6 rounded-xl flex flex-col gap-2">
                        <p className="text-slate-400 text-sm font-bold uppercase">Low Stock Alerts</p>
                        <h3 className={`text-3xl font-mono font-bold ${lowStockCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {lowStockCount} <span className="text-sm text-slate-500 font-sans font-normal">items</span>
                        </h3>
                    </div>
                    <div className="glass-panel p-6 rounded-xl flex flex-col gap-2">
                        <p className="text-slate-400 text-sm font-bold uppercase">Top Mover (30d)</p>
                        <h3 className="text-2xl font-bold text-white truncate">{topMovers[0]?.name || 'N/A'}</h3>
                        <p className="text-xs text-primary">{topMovers[0]?.totalSold || 0} units sold</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="glass-panel p-6 rounded-xl min-h-[400px] flex flex-col">
                    <h3 className="text-white font-bold text-lg mb-6">Top Moving Items (Velocity)</h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topMovers} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" />
                                <YAxis dataKey="name" type="category" stroke="#fff" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1b2127', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                                <Bar dataKey="totalSold" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                    {topMovers.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-white font-bold text-lg">Reorder Recommendations</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-white/5 uppercase font-bold text-xs tracking-wider text-slate-300">
                                <tr>
                                    <th className="p-4">Item Name</th>
                                    <th className="p-4 text-center">Stock</th>
                                    <th className="p-4 text-center">Velocity /Day</th>
                                    <th className="p-4 text-center">Days Left</th>
                                    <th className="p-4 text-center">Reorder Qty</th>
                                    <th className="p-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {forecastData.length > 0 ? forecastData.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-white">{item.name}</td>
                                        <td className="p-4 text-center font-mono">{item.stock}</td>
                                        <td className="p-4 text-center font-mono">{item.velocity}</td>
                                        <td className="p-4 text-center font-mono">{item.daysRemaining}</td>
                                        <td className="p-4 text-center">
                                            {item.reorderQty > 0 ? (
                                                <span className="text-primary font-bold">+{item.reorderQty}</span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className={`p-4 text-center font-bold ${item.statusColor}`}>
                                            {item.status}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500">
                                            No data available for forecasting. Use the app to generate sales history.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;