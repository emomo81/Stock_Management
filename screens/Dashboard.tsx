import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { View } from '../types';

// Interfaces for API data
interface FastMover {
  rank: string;
  name: string;
  sku: string;
  stock: number;
  sold: number;
  trend: string;
  color: string;
}

interface DeadStockItem {
  name: string;
  sku: string;
  stock: number;
  value: string;
  days: string;
}

interface DashboardStats {
  totalSKUs: number;
  lowStock: number;
  outOfStock: number;
  totalValue: string;
}

interface DashboardData {
  stats: DashboardStats;
  chartData: Array<{ name: string; value: number | null; forecast: number; critical: number }>;
  fastMovers: FastMover[];
  deadStock: DeadStockItem[];
}

// Forecasting interfaces
interface ForecastableItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  selected: boolean;
}

interface ForecastData {
  dailyVelocity: string;
  daysUntilStockOut: number;
  stockOutDate: string;
  reorderQty: number;
  confidence: number;
  chartData: Array<{ name: string; value: number | null; forecast: number; critical: number }>;
}

interface ForecastingData {
  items: ForecastableItem[];
  selectedItem: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    price: number;
  } | null;
  forecast: ForecastData | null;
}

interface DashboardProps {
  setView: (view: View) => void;
  showForecasting?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, showForecasting = false }) => {
  /* const [showAlert, setShowAlert] = useState(true); */

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [forecastingData, setForecastingData] = useState<ForecastingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesVelocityModifier, setSalesVelocityModifier] = useState(0);
  const [leadTimeDays, setLeadTimeDays] = useState(14);

  useEffect(() => {
    if (showForecasting) {
      fetchForecasting();
    } else {
      fetchStats();
    }
  }, [showForecasting]);

  const fetchStats = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch('http://localhost:5001/api/stats');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setDashboardData(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load dashboard data. Please check your connection.');
      setLoading(false);
    }
  };

  const fetchForecasting = async (itemId?: string) => {
    try {
      setForecastLoading(true);
      setError(null);
      const url = itemId
        ? `http://localhost:5001/api/stats/forecasting?itemId=${itemId}`
        : 'http://localhost:5001/api/stats/forecasting';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setForecastingData(data);
      setLoading(false);
      setForecastLoading(false);
    } catch (err) {
      console.error('Failed to fetch forecasting:', err);
      setError('Failed to load forecasting data.');
      setLoading(false);
      setForecastLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-slate-500 bg-[#101922]">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-2">progress_activity</span>
        {showForecasting ? 'Loading Forecasting...' : 'Loading Dashboard...'}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-slate-500 bg-[#101922]">
        <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
        <p className="text-red-400 font-bold">Connection Error</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => showForecasting ? fetchForecasting() : fetchStats()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Default fallback data if API returns partial data
  const defaultStats: DashboardStats = { totalSKUs: 0, lowStock: 0, outOfStock: 0, totalValue: '$0.00' };
  const defaultChartData = [
    { name: 'No Data', value: 0, forecast: 0, critical: 0 },
  ];

  // Use fetched data or fallback
  const chartData = dashboardData?.chartData || defaultChartData;
  const stats = dashboardData?.stats || defaultStats;
  const fastMovers: FastMover[] = dashboardData?.fastMovers || [];
  const deadStock: DeadStockItem[] = dashboardData?.deadStock || [];

  // Forecasting data
  const selectedItem = forecastingData?.selectedItem;
  const forecast = forecastingData?.forecast;
  const forecastItems = forecastingData?.items || [];

  if (showForecasting) {
    return (
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#101922] h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              Smart Forecasting
            </h1>
            <p className="text-slate-400">
              {selectedItem
                ? `Predictive analysis for ${selectedItem.sku} (${selectedItem.name})`
                : 'Select an item to view forecasting data'
              }
            </p>
          </div>
          <button
            onClick={() => setView('dashboard')}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {!selectedItem ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">inventory_2</span>
            <p className="text-lg">No items available for forecasting</p>
            <p className="text-sm">Add inventory items to enable smart forecasting</p>
            <button
              onClick={() => setView('inventory')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              Go to Inventory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100%-100px)]">
            {/* Controls Panel */}
            <div className="lg:col-span-3 flex flex-col gap-6 glass-panel p-6 rounded-2xl">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Select Item</label>
                <select
                  className="w-full bg-[#1b2127] border border-white/10 text-white text-sm rounded-lg p-3 outline-none focus:border-primary"
                  value={selectedItem.id}
                  onChange={(e) => fetchForecasting(e.target.value)}
                  disabled={forecastLoading}
                >
                  {forecastItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm text-white mb-2">
                    <span>Sales Velocity Modifier</span>
                    <span className="text-primary font-bold">{salesVelocityModifier > 0 ? '+' : ''}{salesVelocityModifier}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={salesVelocityModifier}
                    onChange={(e) => setSalesVelocityModifier(parseInt(e.target.value))}
                    className="w-full accent-primary h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-white mb-2">
                    <span>Supplier Lead Time</span>
                    <span className="font-bold">{leadTimeDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(parseInt(e.target.value))}
                    className="w-full accent-primary h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h4 className="text-primary font-bold text-sm mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">lightbulb</span> AI Recommendation
                  </h4>
                  <p className="text-xs text-slate-300">
                    {forecast && forecast.reorderQty > 0
                      ? `Reorder ${forecast.reorderQty} units within ${leadTimeDays} days to maintain service level.`
                      : 'Stock levels are healthy. No immediate reorder needed.'
                    }
                  </p>
                </div>
                <button
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                  onClick={() => setView('stock-in')}
                >
                  Create Reorder
                </button>
              </div>
            </div>

            {/* Visualization Panel */}
            <div className="lg:col-span-9 flex flex-col gap-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-orange-500">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Predicted Stock-Out</p>
                  <h3 className="text-2xl font-bold text-white">
                    {forecast?.stockOutDate || 'N/A'}
                  </h3>
                  <span className="text-xs text-orange-400">
                    {forecast?.daysUntilStockOut !== undefined
                      ? `In ${forecast.daysUntilStockOut} days`
                      : 'Unable to calculate'
                    }
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-primary">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Recommended Reorder</p>
                  <h3 className="text-2xl font-bold text-white">
                    {forecast?.reorderQty !== undefined ? `${forecast.reorderQty} Units` : 'N/A'}
                  </h3>
                  <span className="text-xs text-primary">
                    Daily velocity: {forecast?.dailyVelocity || '0'} units/day
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Demand Confidence</p>
                  <h3 className="text-2xl font-bold text-white">
                    {forecast?.confidence ? `${forecast.confidence >= 80 ? 'High' : forecast.confidence >= 60 ? 'Medium' : 'Low'} (${forecast.confidence}%)` : 'N/A'}
                  </h3>
                  <span className="text-xs text-slate-400">Based on historical data</span>
                </div>
              </div>

              {/* Chart */}
              <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Inventory Trajectory</h3>
                  {forecastLoading && (
                    <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                  )}
                </div>
                <div className="flex-1 w-full min-h-[350px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast?.chartData || defaultChartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1985f0" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1985f0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1b2127', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#1985f0" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="Actual" />
                      <Area type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} fill="transparent" name="Forecast" />
                      <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" fill="transparent" name="Critical Level" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col bg-[#101922]">
      {/* Alert Banner */}
      {/* Alert Banner */}
      {stats.lowStock > 0 && !showForecasting && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start justify-between animate-in slide-in-from-top-2 fade-in duration-500">
          <div className="flex gap-4">
            <div className="size-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-red-500">warning</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Critical Stock Alert</h3>
              <p className="text-slate-400 text-xs mt-1">{stats.lowStock} items have dropped below safety stock levels. Immediate reorder required to avoid fulfillment delays.</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setView('inventory', { filter: 'low' })} className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">View Items</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-6 mb-8 flex-shrink-0">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Product Inventory</h2>
            <p className="text-slate-400 mt-1">View current stock levels and product details.</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border border-white/5">
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total SKUs', value: stats.totalSKUs, change: '+12%', color: 'text-white', icon: 'inventory_2', iconColor: 'text-white' },
            { label: 'Low Stock', value: stats.lowStock, change: 'Action Needed', color: 'text-white', icon: 'warning', iconColor: 'text-orange-400', badgeColor: 'bg-orange-400/10 text-orange-400' },
            { label: 'AI Insights', value: '12', change: '3 New', color: 'text-white', icon: 'auto_awesome', iconColor: 'text-purple-400', badgeColor: 'bg-purple-400/10 text-purple-400' },
            { label: 'Total Value', value: stats.totalValue, change: '+0.8%', color: 'text-white', icon: 'attach_money', iconColor: 'text-emerald-400', badgeColor: 'bg-emerald-400/10 text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-5 rounded-xl flex flex-col gap-1 relative overflow-hidden group hover:border-white/20 transition-all cursor-pointer" onClick={() => i === 2 && setView('forecasting')}>
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className={`material-symbols-outlined text-4xl ${stat.iconColor}`}>{stat.icon}</span>
              </div>
              <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${stat.badgeColor || 'bg-emerald-400/10 text-emerald-400'}`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Fast Movers Table */}
        <div className="glass-panel rounded-xl flex-1 flex flex-col h-[400px]">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">rocket_launch</span>
              Fast Movers
            </h3>
            <span className="text-xs text-white bg-cyan-500/20 px-2 py-1 rounded border border-cyan-500/30">
              {fastMovers.length} Items
            </span>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {fastMovers.length > 0 ? (
              fastMovers.map((item, i) => (
                <div key={`fast-${item.sku}-${i}`} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg group transition-colors cursor-pointer" onClick={() => setView('inventory')}>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 font-bold w-6">{item.rank}</span>
                    <div className="size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sold.toLocaleString()} units sold</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 bg-emerald-400/10 text-emerald-400`}>
                      <span className="material-symbols-outlined text-[10px]">trending_up</span> {item.trend}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">Stock: {item.stock}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
                <span className="material-symbols-outlined text-3xl mb-2 opacity-50">inventory_2</span>
                <p className="text-sm">No fast movers yet</p>
                <p className="text-xs">Sales data will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Dead Stock */}
        <div className="glass-panel rounded-xl flex-1 flex flex-col h-[400px]">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-400">hourglass_disabled</span>
              Dead Stock
            </h3>
            <span className="text-xs text-white bg-rose-500/20 px-2 py-1 rounded border border-rose-500/30">
              {deadStock.length} Items
            </span>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {deadStock.length > 0 ? (
              deadStock.map((item, i) => (
                <div key={`dead-${item.sku}-${i}`} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg border border-transparent hover:border-rose-500/20 transition-all cursor-pointer" onClick={() => setView('inventory')}>
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-rose-400">inventory</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">Stock: {item.stock} • {item.value}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-400 bg-rose-400/10 px-2 py-1 rounded">{item.days}</span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
                <span className="material-symbols-outlined text-3xl mb-2 opacity-50">check_circle</span>
                <p className="text-sm">No dead stock</p>
                <p className="text-xs">All inventory is moving well</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;