import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { View } from '../types';

const data = [
  { name: 'Sep 15', value: 100, forecast: 100, critical: 50 },
  { name: 'Sep 22', value: 90, forecast: 90, critical: 50 },
  { name: 'Sep 29', value: 75, forecast: 75, critical: 50 },
  { name: 'Oct 06', value: 50, forecast: 50, critical: 50 },
  { name: 'Oct 13', value: null, forecast: 35, critical: 50 },
  { name: 'Oct 24', value: null, forecast: 10, critical: 50 },
  { name: 'Nov 07', value: null, forecast: 0, critical: 50 },
];

const profitData = [
  { name: 'Mon', revenue: 4000, profit: 2400 },
  { name: 'Tue', revenue: 3000, profit: 1398 },
  { name: 'Wed', revenue: 2000, profit: 9800 },
  { name: 'Thu', revenue: 2780, profit: 3908 },
  { name: 'Fri', revenue: 1890, profit: 4800 },
  { name: 'Sat', revenue: 2390, profit: 3800 },
  { name: 'Sun', revenue: 3490, profit: 4300 },
];

interface DashboardProps {
  setView: (view: View) => void;
  showForecasting?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, showForecasting = false }) => {
  const [scenarioMode, setScenarioMode] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

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
            <p className="text-slate-400">Predictive inventory analysis for SKU-1029 (Wireless Headphones)</p>
          </div>
          <button
            onClick={() => setView('dashboard')}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100%-100px)]">
          {/* Controls Panel */}
          <div className="lg:col-span-3 flex flex-col gap-6 glass-panel p-6 rounded-2xl">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Scenario Mode</label>
              <select className="w-full bg-[#1b2127] border border-white/10 text-white text-sm rounded-lg p-3 outline-none focus:border-primary">
                <option>Custom Scenario A</option>
                <option>Aggressive Growth</option>
                <option>Conservative</option>
              </select>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm text-white mb-2">
                  <span>Sales Velocity</span>
                  <span className="text-primary font-bold">+15%</span>
                </div>
                <input type="range" className="w-full accent-primary h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between text-sm text-white mb-2">
                  <span>Supplier Lead Time</span>
                  <span className="font-bold">14 Days</span>
                </div>
                <input type="range" className="w-full accent-primary h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="text-primary font-bold text-sm mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">lightbulb</span> AI Recommendation
                </h4>
                <p className="text-xs text-slate-300">Based on +15% velocity, reorder 450 units immediately to maintain 98% service level.</p>
              </div>
              <button className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20">
                Apply to Inventory
              </button>
            </div>
          </div>

          {/* Visualization Panel */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-xl border-l-4 border-l-orange-500">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Predicted Stock-Out</p>
                <h3 className="text-2xl font-bold text-white">Oct 24, 2023</h3>
                <span className="text-xs text-orange-400">12 days earlier than expected</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border-l-4 border-l-primary">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Recommended Reorder</p>
                <h3 className="text-2xl font-bold text-white">450 Units</h3>
                <span className="text-xs text-primary">+250 units suggested</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Demand Confidence</p>
                <h3 className="text-2xl font-bold text-white">High (89%)</h3>
                <span className="text-xs text-slate-400">Based on 12mo history</span>
              </div>
            </div>

            {/* Chart */}
            <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col min-h-[400px]">
              <h3 className="text-lg font-semibold text-white mb-6">Inventory Trajectory</h3>
              <div className="flex-1 w-full min-h-[350px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
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
                    <Area type="monotone" dataKey="value" stroke="#1985f0" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    <Area type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} fill="transparent" />
                    <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col bg-[#101922]">
      {/* Alert Banner */}
      {showAlert && !showForecasting && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start justify-between animate-in slide-in-from-top-2 fade-in duration-500">
          <div className="flex gap-4">
            <div className="size-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-red-500">warning</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Critical Stock Alert</h3>
              <p className="text-slate-400 text-xs mt-1">3 items have dropped below safety stock levels. Immediate reorder required to avoid fulfillment delays.</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setView('inventory')} className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">View Items</button>
                <button onClick={() => setShowAlert(false)} className="text-slate-400 hover:text-white text-xs font-medium px-3 py-1.5">Dismiss</button>
              </div>
            </div>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
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
            { label: 'Total SKUs', value: '12,450', change: '+12%', color: 'text-white', icon: 'inventory_2', iconColor: 'text-white' },
            { label: 'Low Stock', value: '85', change: 'Action Needed', color: 'text-white', icon: 'warning', iconColor: 'text-orange-400', badgeColor: 'bg-orange-400/10 text-orange-400' },
            { label: 'AI Insights', value: '12', change: '3 New', color: 'text-white', icon: 'auto_awesome', iconColor: 'text-purple-400', badgeColor: 'bg-purple-400/10 text-purple-400' },
            { label: 'Total Value', value: '$4.2M', change: '+0.8%', color: 'text-white', icon: 'attach_money', iconColor: 'text-emerald-400', badgeColor: 'bg-emerald-400/10 text-emerald-400' },
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
            <button className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">more_vert</span></button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {[
              { rank: '01', name: 'Pro Audio Headset', sku: 'AUDIO-WH-1000', stock: 142, sold: '1,240', trend: '+24%', color: 'emerald' },
              { rank: '02', name: 'Smart Watch V2', sku: 'WEAR-SW-005', stock: 0, sold: '985', trend: '+18%', color: 'emerald' },
              { rank: '03', name: 'Mech Keyboard', sku: 'TECH-KB-RGB', stock: 850, sold: '850', trend: '+12%', color: 'emerald' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg group transition-colors cursor-pointer" onClick={() => setView('forecasting')}>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 font-bold w-6">{item.rank}</span>
                  <div className="size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400">image</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sold} units sold</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xs font-bold text-${item.color}-400 bg-${item.color}-400/10 px-2 py-0.5 rounded flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-[10px]">trending_up</span> {item.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dead Stock */}
        <div className="glass-panel rounded-xl flex-1 flex flex-col h-[400px]">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-400">hourglass_disabled</span>
              Dead Stock
            </h3>
            <span className="text-xs text-white bg-rose-500/20 px-2 py-1 rounded border border-rose-500/30">3 Items</span>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {[
              { name: 'Legacy Printer A4', stock: 45, value: '$4,500', days: '120 Days' },
              { name: 'Router v1.0', stock: 22, value: '$1,980', days: '105 Days' },
              { name: 'VGA Cables', stock: 150, value: '$750', days: '98 Days' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg border border-transparent hover:border-rose-500/20 transition-all cursor-pointer">
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;