import React from 'react';
import type { UserRole } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalyticsProps {
    userRole: UserRole;
}

const profitData = [
    { name: 'Mon', revenue: 10, profit: 4 },
    { name: 'Tue', revenue: 15, profit: 7 },
    { name: 'Wed', revenue: 8, profit: 3 },
    { name: 'Thu', revenue: 22, profit: 12 },
    { name: 'Fri', revenue: 18, profit: 9 },
    { name: 'Sat', revenue: 25, profit: 15 },
    { name: 'Sun', revenue: 12, profit: 5 },
];

const Analytics: React.FC<AnalyticsProps> = ({ userRole }) => {

    if (userRole === 'staff') {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#101922] h-full">
                <div className="glass-panel w-full max-w-lg p-10 rounded-2xl flex flex-col items-center text-center border-t border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <span className="material-symbols-outlined text-[40px] text-red-500">lock_person</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Access Restricted</h3>
                    <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">
                        You do not have permission to view sensitive financial data such as costs, profits, and margins.
                    </p>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-left w-full mb-6">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-yellow-500 text-[20px] mt-0.5">info</span>
                            <div>
                                <p className="text-sm font-bold text-white mb-1">Role: Staff</p>
                                <p className="text-xs text-slate-400">Restricted to Admin and Manager roles only.</p>
                            </div>
                        </div>
                    </div>
                    <button className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all">
                        Request Access
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#101922]">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Profit Analysis</h2>
                        <p className="text-slate-400 text-base">Real-time margin tracking powered by AI</p>
                    </div>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-[20px]">description</span> Generate Report
                    </button>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass-panel rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-4xl text-white">payments</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-white">$124,500</h3>
                        <span className="text-[#0bda5b] text-sm font-medium bg-[#0bda5b]/10 w-fit px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span> +12%
                        </span>
                    </div>
                    <div className="glass-panel rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-4xl text-white">monetization_on</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Gross Profit</p>
                        <h3 className="text-3xl font-bold text-white">$45,200</h3>
                        <span className="text-[#0bda5b] text-sm font-medium bg-[#0bda5b]/10 w-fit px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span> +5%
                        </span>
                    </div>
                    <div className="glass-panel rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-4xl text-white">pie_chart</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Net Margin</p>
                        <h3 className="text-3xl font-bold text-white">36.3%</h3>
                        <span className="text-[#0bda5b] text-sm font-medium bg-[#0bda5b]/10 w-fit px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span> +2.1%
                        </span>
                    </div>
                    {/* AI Insight */}
                    <div className="glass-panel rounded-xl p-1 bg-gradient-to-br from-primary/20 to-purple-600/20 border-primary/30">
                        <div className="bg-[#101922]/90 h-full w-full rounded-[10px] p-4 flex flex-col justify-between backdrop-blur-sm">
                            <div className="flex justify-between items-start">
                                <p className="text-primary text-sm font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span> AI Insight
                                </p>
                            </div>
                            <div>
                                <p className="text-white text-lg font-bold leading-tight">Margin Surge</p>
                                <p className="text-slate-400 text-xs mt-1">Electronics category is trending up significantly this week.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts & Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="glass-panel rounded-xl p-6 lg:col-span-2 flex flex-col gap-4 min-h-[300px]">
                        <h3 className="text-white font-bold text-lg">Revenue vs. Profit Trend</h3>
                        <div className="flex-1 w-full min-h-[300px] min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={profitData}>
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1b2127', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                    <Bar dataKey="revenue" stackId="a" fill="#334155" radius={[0, 0, 0, 0]} barSize={32} />
                                    <Bar dataKey="profit" stackId="a" fill="#1985f0" radius={[4, 4, 0, 0]} barSize={32}>
                                        {profitData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fillOpacity={0.8 + (index * 0.02)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Breakdown & Optimization */}
                    <div className="flex flex-col gap-6">
                        <div className="glass-panel rounded-xl p-6 flex flex-col">
                            <h3 className="text-white font-bold text-lg mb-4">Profit by Category</h3>
                            <div className="space-y-4">
                                {[
                                    { name: 'Electronics', val: '$20.3k', pct: '45%', color: 'bg-blue-500' },
                                    { name: 'Apparel', val: '$12.6k', pct: '28%', color: 'bg-purple-500' },
                                    { name: 'Home', val: '$7.6k', pct: '17%', color: 'bg-emerald-500' },
                                ].map((cat, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm text-white">
                                            <span>{cat.name}</span>
                                            <span className="font-bold">{cat.val}</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-1.5">
                                            <div className={`h-1.5 rounded-full ${cat.color}`} style={{ width: cat.pct }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-panel rounded-xl p-5 border border-primary/30 relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                            <div className="flex flex-col gap-3 relative z-10">
                                <div className="flex items-center gap-2 text-primary">
                                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                                    <span className="text-sm font-bold uppercase tracking-wider">Optimization</span>
                                </div>
                                <p className="text-white font-medium text-sm leading-snug">
                                    Reorder <span className="text-primary">SKU-123</span> immediately to capitalize on a 15% margin surge.
                                </p>
                                <button className="mt-2 w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-bold uppercase py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
                                    View Recommendation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;