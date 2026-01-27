import React, { useState, useEffect } from 'react';
import type { UserRole } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { API_URL } from '../config';

interface AnalyticsProps {
    userRole: UserRole;
}

// API Interfaces
interface AnalyticsStats {
    totalRevenue: string;
    grossProfit: string;
    netMargin: string;
    totalTransactions: number;
}

interface ProfitDataPoint {
    name: string;
    revenue: number;
    profit: number;
}

interface CategoryBreakdown {
    name: string;
    value: string;
    percentage: number;
    color: string;
}

interface Insight {
    title: string;
    message: string;
    sku: string | null;
}

interface AnalyticsData {
    stats: AnalyticsStats;
    profitData: ProfitDataPoint[];
    categoryBreakdown: CategoryBreakdown[];
    insight: Insight;
}

const Analytics: React.FC<AnalyticsProps> = ({ userRole }) => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRecommendation, setShowRecommendation] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${API_URL}/api/stats/analytics`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setAnalyticsData(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
            setError('Failed to load analytics data. Please check your connection.');
            setLoading(false);
        }
    };

    // Generate and download CSV report
    const generateReport = () => {
        if (!analyticsData) return;

        const { stats, profitData, categoryBreakdown } = analyticsData;

        // Create CSV content
        let csvContent = "PROFIT ANALYSIS REPORT\n";
        csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

        csvContent += "SUMMARY\n";
        csvContent += `Total Revenue,${stats.totalRevenue}\n`;
        csvContent += `Gross Profit,${stats.grossProfit}\n`;
        csvContent += `Net Margin,${stats.netMargin}%\n`;
        csvContent += `Total Transactions,${stats.totalTransactions}\n\n`;

        csvContent += "DAILY TRENDS (Last 7 Days)\n";
        csvContent += "Day,Revenue,Profit\n";
        profitData.forEach(d => {
            csvContent += `${d.name},$${d.revenue},$${d.profit}\n`;
        });
        csvContent += "\n";

        csvContent += "CATEGORY BREAKDOWN\n";
        csvContent += "Category,Value,Percentage\n";
        categoryBreakdown.forEach(c => {
            csvContent += `${c.name},${c.value},${c.percentage}%\n`;
        });

        // Create Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = `profit_report_${new Date().toISOString().split('T')[0]}.csv`;

        // Check for IE/Edge legacy
        if ((navigator as any).msSaveBlob) {
            (navigator as any).msSaveBlob(blob, filename);
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            // Append to body, click, then remove
            document.body.appendChild(link);
            // Use MouseEvent for better compatibility
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            link.dispatchEvent(event);
            document.body.removeChild(link);
            // Revoke URL after a short delay
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }
    };

    if (userRole === 'staff') {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-transparent h-full">
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

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-transparent h-full">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-2">progress_activity</span>
                <p className="text-slate-400">Loading Analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-transparent h-full">
                <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
                <p className="text-red-400 font-bold">Connection Error</p>
                <p className="text-sm text-slate-400">{error}</p>
                <button
                    onClick={fetchAnalytics}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Fallback values if data is missing
    const stats = analyticsData?.stats || { totalRevenue: '$0', grossProfit: '$0', netMargin: '0', totalTransactions: 0 };
    const profitData = analyticsData?.profitData || [];
    const categoryBreakdown = analyticsData?.categoryBreakdown || [];
    const insight = analyticsData?.insight || { title: 'No Data', message: 'Add transactions to see insights.', sku: null };

    // Calculate trend (positive if profit > 0)
    const profitTrend = parseFloat(stats.grossProfit.replace(/[^0-9.-]/g, '')) > 0;
    const marginTrend = parseFloat(stats.netMargin) > 0;

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-transparent">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Profit Analysis</h2>
                        <p className="text-slate-400 text-base">Real-time margin tracking from your transactions</p>
                    </div>
                    <button
                        onClick={generateReport}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
                    >
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
                        <h3 className="text-3xl font-bold text-white">{stats.totalRevenue}</h3>
                        <span className="text-sm font-medium w-fit px-2 py-0.5 rounded flex items-center gap-1 bg-slate-500/20 text-slate-400">
                            {stats.totalTransactions} transactions
                        </span>
                    </div>
                    <div className="glass-panel rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-4xl text-white">monetization_on</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Gross Profit</p>
                        <h3 className="text-3xl font-bold text-white">{stats.grossProfit}</h3>
                        <span className={`text-sm font-medium w-fit px-2 py-0.5 rounded flex items-center gap-1 ${profitTrend ? 'text-[#0bda5b] bg-[#0bda5b]/10' : 'text-red-400 bg-red-400/10'}`}>
                            <span className="material-symbols-outlined text-[16px]">{profitTrend ? 'trending_up' : 'trending_down'}</span>
                            {profitTrend ? 'Profitable' : 'Loss'}
                        </span>
                    </div>
                    <div className="glass-panel rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-4xl text-white">pie_chart</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Net Margin</p>
                        <h3 className="text-3xl font-bold text-white">{stats.netMargin}%</h3>
                        <span className={`text-sm font-medium w-fit px-2 py-0.5 rounded flex items-center gap-1 ${marginTrend ? 'text-[#0bda5b] bg-[#0bda5b]/10' : 'text-red-400 bg-red-400/10'}`}>
                            <span className="material-symbols-outlined text-[16px]">{marginTrend ? 'trending_up' : 'trending_flat'}</span>
                            {marginTrend ? 'Healthy' : 'Needs attention'}
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
                                <p className="text-white text-lg font-bold leading-tight">{insight.title}</p>
                                <p className="text-slate-400 text-xs mt-1">{insight.message}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts & Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="glass-panel rounded-xl p-6 lg:col-span-2 flex flex-col gap-4 min-h-[300px]">
                        <h3 className="text-white font-bold text-lg">Revenue vs. Profit Trend (Last 7 Days)</h3>
                        {profitData.length > 0 ? (
                            <div className="flex-1 w-full min-h-[300px] min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={profitData} barGap={4}>
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1b2127', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} />
                                        <Bar dataKey="revenue" fill="#334155" radius={[4, 4, 0, 0]} barSize={24} name="Revenue">
                                            {profitData.map((entry, index) => (
                                                <Cell key={`rev-${index}`} fillOpacity={0.9} />
                                            ))}
                                        </Bar>
                                        <Bar dataKey="profit" fill="#1985f0" radius={[4, 4, 0, 0]} barSize={24} name="Profit">
                                            {profitData.map((entry, index) => (
                                                <Cell key={`prof-${index}`} fill={entry.profit >= 0 ? '#0bda5b' : '#ef4444'} fillOpacity={0.9} />
                                            ))}
                                        </Bar>
                                        <Legend
                                            wrapperStyle={{ paddingTop: '10px' }}
                                            formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">bar_chart</span>
                                <p>No transaction data available</p>
                                <p className="text-sm">Create sales to see profit trends</p>
                            </div>
                        )}
                    </div>

                    {/* Category Breakdown & Optimization */}
                    <div className="flex flex-col gap-6">
                        <div className="glass-panel rounded-xl p-6 flex flex-col">
                            <h3 className="text-white font-bold text-lg mb-4">Value by Category</h3>
                            {categoryBreakdown.length > 0 ? (
                                <div className="space-y-4">
                                    {categoryBreakdown.map((cat, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-sm text-white">
                                                <span>{cat.name}</span>
                                                <span className="font-bold">{cat.value}</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-1.5">
                                                <div className={`h-1.5 rounded-full ${cat.color}`} style={{ width: `${cat.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-4">
                                    <span className="material-symbols-outlined text-3xl mb-2 opacity-50">category</span>
                                    <p className="text-sm">No categories found</p>
                                </div>
                            )}
                        </div>

                        <div className="glass-panel rounded-xl p-5 border border-primary/30 relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                            <div className="flex flex-col gap-3 relative z-10">
                                <div className="flex items-center gap-2 text-primary">
                                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                                    <span className="text-sm font-bold uppercase tracking-wider">Optimization</span>
                                </div>
                                <p className="text-white font-medium text-sm leading-snug">
                                    {insight.sku ? (
                                        <>Focus on <span className="text-primary">{insight.sku}</span> to maximize margins.</>
                                    ) : (
                                        'Add more transactions to get optimization recommendations.'
                                    )}
                                </p>
                                <button
                                    onClick={() => setShowRecommendation(true)}
                                    className="mt-2 w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-bold uppercase py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    View Recommendation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendation Modal */}
            {showRecommendation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRecommendation(false)}>
                    <div className="glass-panel rounded-2xl w-full max-w-lg p-6 border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Profit Optimization</h3>
                                    <p className="text-sm text-slate-400">AI-powered recommendations</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowRecommendation(false)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                            >
                                <span className="material-symbols-outlined text-slate-400 text-xl">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {insight.sku ? (
                                <>
                                    <div className="bg-[#0bda5b]/10 border border-[#0bda5b]/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-[#0bda5b] mb-2">
                                            <span className="material-symbols-outlined text-lg">trending_up</span>
                                            <span className="font-bold text-sm uppercase">{insight.title}</span>
                                        </div>
                                        <p className="text-white text-sm">{insight.message}</p>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4">
                                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
                                            Recommendations
                                        </h4>
                                        <ul className="space-y-2 text-sm text-slate-300">
                                            <li className="flex items-start gap-2">
                                                <span className="text-primary mt-0.5">•</span>
                                                <span>Increase stock for high-margin items to avoid stockouts</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-primary mt-0.5">•</span>
                                                <span>Consider bundling slow-moving items with bestsellers</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-primary mt-0.5">•</span>
                                                <span>Review pricing on items with margins below {stats.netMargin}%</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-primary mt-0.5">•</span>
                                                <span>Track <span className="text-primary font-medium">{insight.sku}</span> performance weekly</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-white">{stats.totalRevenue}</p>
                                            <p className="text-xs text-slate-400">Total Revenue</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-[#0bda5b]">{stats.netMargin}%</p>
                                            <p className="text-xs text-slate-400">Net Margin</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">inventory_2</span>
                                    <h4 className="text-white font-bold mb-2">No Recommendations Yet</h4>
                                    <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                        Add more inventory and transactions to get AI-powered optimization suggestions.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowRecommendation(false)}
                                className="flex-1 py-2.5 rounded-lg bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { generateReport(); setShowRecommendation(false); }}
                                className="flex-1 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Export Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;