import React, { useState } from 'react';
import type { View, UserRole } from '../types';

// Data Export View Component
const DataExportView: React.FC = () => {
    const [selectedSets, setSelectedSets] = useState<Record<string, boolean>>({
        'All Products': true,
        'Transaction Logs': true,
        'Low Stock': false,
        'Profit Reports': false,
    });
    const [format, setFormat] = useState<'csv' | 'json'>('csv');
    const [isExporting, setIsExporting] = useState(false);
    const [exportHistory, setExportHistory] = useState<Array<{ name: string; date: string; status: 'ready' | 'processing' }>>([]);

    const toggleDataSet = (label: string) => {
        setSelectedSets(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const handleExport = async () => {
        const selected = Object.entries(selectedSets).filter(([_, v]) => v).map(([k]) => k);
        if (selected.length === 0) return;

        setIsExporting(true);

        try {
            let exportData: any = {};

            // Fetch inventory/products if selected
            if (selectedSets['All Products'] || selectedSets['Low Stock']) {
                const itemsRes = await fetch('http://localhost:5001/api/items');
                if (itemsRes.ok) {
                    const items = await itemsRes.json();
                    if (selectedSets['All Products']) {
                        exportData.products = items;
                    }
                    if (selectedSets['Low Stock']) {
                        exportData.lowStock = items.filter((item: any) => item.qty <= (item.low_stock_level || 10));
                    }
                }
            }

            // Fetch transactions if selected
            if (selectedSets['Transaction Logs']) {
                const txRes = await fetch('http://localhost:5001/api/transactions');
                if (txRes.ok) {
                    exportData.transactions = await txRes.json();
                }
            }

            // Fetch profit data if selected
            if (selectedSets['Profit Reports']) {
                const statsRes = await fetch('http://localhost:5001/api/stats/analytics');
                if (statsRes.ok) {
                    exportData.profitAnalytics = await statsRes.json();
                }
            }

            // Generate file content
            let content: string;
            let filename: string;
            let mimeType: string;
            const dateStr = new Date().toISOString().split('T')[0];

            if (format === 'json') {
                content = JSON.stringify(exportData, null, 2);
                filename = `aims_export_${dateStr}.json`;
                mimeType = 'application/json';
            } else {
                // CSV format - flatten data
                let csvContent = '';

                if (exportData.products && exportData.products.length > 0) {
                    csvContent += 'PRODUCTS\n';
                    csvContent += 'SKU,Name,Category,Quantity,Price,Location\n';
                    exportData.products.forEach((p: any) => {
                        csvContent += `${p.sku || ''},${(p.name || '').replace(/,/g, ' ')},${p.category || ''},${p.qty || 0},${p.price || 0},${p.location || ''}\n`;
                    });
                    csvContent += '\n';
                }

                if (exportData.lowStock && exportData.lowStock.length > 0) {
                    csvContent += 'LOW STOCK ITEMS\n';
                    csvContent += 'SKU,Name,Current Qty,Threshold\n';
                    exportData.lowStock.forEach((p: any) => {
                        csvContent += `${p.sku || ''},${(p.name || '').replace(/,/g, ' ')},${p.qty || 0},${p.low_stock_level || 10}\n`;
                    });
                    csvContent += '\n';
                }

                if (exportData.transactions && exportData.transactions.length > 0) {
                    csvContent += 'TRANSACTIONS\n';
                    csvContent += 'Date,Type,SKU,Description,Quantity,Price\n';
                    exportData.transactions.forEach((t: any) => {
                        csvContent += `${t.date || ''},${t.type || ''},${t.itemSku || t.sku || ''},${(t.description || '').replace(/,/g, ' ')},${t.qty || 0},${t.price || 0}\n`;
                    });
                    csvContent += '\n';
                }

                if (exportData.profitAnalytics) {
                    const stats = exportData.profitAnalytics.stats;
                    csvContent += 'PROFIT SUMMARY\n';
                    csvContent += `Total Revenue,${stats?.totalRevenue || 0}\n`;
                    csvContent += `Gross Profit,${stats?.grossProfit || 0}\n`;
                    csvContent += `Net Margin,${stats?.netMargin || 0}%\n`;
                }

                content = csvContent;
                filename = `aims_export_${dateStr}.csv`;
                mimeType = 'text/csv';
            }

            // Download file
            const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);

            // Add to history
            setExportHistory(prev => [
                { name: filename, date: new Date().toLocaleDateString(), status: 'ready' },
                ...prev.slice(0, 4)
            ]);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#111418] relative">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-7 flex flex-col gap-6">
                    <div className="rounded-xl border border-white/10 bg-[#1e2732]/60 backdrop-blur-xl shadow-2xl p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                            <span className="material-symbols-outlined text-primary">tune</span>
                            <h3 className="text-lg font-bold text-white">Export Configuration</h3>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div>
                                <label className="text-sm font-semibold text-[#9cabba] uppercase tracking-wider mb-3 block">Select Data Sets</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.keys(selectedSets).map(label => (
                                        <label
                                            key={label}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedSets[label]
                                                ? 'border-primary/50 bg-primary/10'
                                                : 'border-white/5 bg-[#283039]/50 hover:bg-[#283039] hover:border-primary/30'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSets[label]}
                                                onChange={() => toggleDataSet(label)}
                                                className="w-5 h-5 rounded bg-transparent border-slate-500 text-primary focus:ring-0"
                                            />
                                            <span className="text-sm font-medium text-white">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-[#9cabba] uppercase tracking-wider mb-3 block">Format</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="format"
                                            checked={format === 'csv'}
                                            onChange={() => setFormat('csv')}
                                            className="text-primary focus:ring-0 bg-transparent"
                                        />
                                        <span className="text-white text-sm">CSV (Spreadsheet)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="format"
                                            checked={format === 'json'}
                                            onChange={() => setFormat('json')}
                                            className="text-primary focus:ring-0 bg-transparent"
                                        />
                                        <span className="text-white text-sm">JSON (Raw Data)</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleExport}
                                disabled={isExporting || Object.values(selectedSets).every(v => !v)}
                                className={`w-full text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4 transition-all ${isExporting || Object.values(selectedSets).every(v => !v)
                                    ? 'bg-slate-600 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(25,133,240,0.3)]'
                                    }`}
                            >
                                {isExporting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">sync</span> Exporting...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">download</span> Generate Export
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-5 flex flex-col h-full">
                    <div className="flex-1 rounded-xl border border-white/10 bg-[#1e2732]/60 backdrop-blur-xl shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#9cabba]">history</span> Export History
                            </h3>
                        </div>
                        <div className="flex-1 p-0 overflow-x-auto">
                            {exportHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">folder_open</span>
                                    <p className="text-sm">No exports yet</p>
                                    <p className="text-xs">Generated exports will appear here</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm text-[#9cabba] min-w-[300px]">
                                    <thead className="bg-white/5 text-xs uppercase font-semibold text-white">
                                        <tr>
                                            <th className="px-6 py-3">File</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {exportHistory.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white/5">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded flex items-center justify-center ${item.name.endsWith('.json') ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                                                        }`}>
                                                        <span className="material-symbols-outlined text-sm">
                                                            {item.name.endsWith('.json') ? 'data_object' : 'csv'}
                                                        </span>
                                                    </div>
                                                    <span className="text-white">{item.name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs">{item.date}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-green-400 text-xs font-medium">Complete</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mobile Scanner View Component
const MobileScannerView: React.FC<{ setView: (view: View) => void }> = ({ setView }) => {
    const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [stockMode, setStockMode] = useState<'in' | 'out'>('in');
    const [qty, setQty] = useState(1);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleScan = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!barcodeInput.trim()) return;

        setIsScanning(true);
        setFeedback(null);
        setScannedItem(null);

        try {
            // In a real app, this would query by barcode. Here we'll search inventory by SKU or Name
            const res = await fetch('http://localhost:5001/api/inventory');
            if (res.ok) {
                const items: InventoryItem[] = await res.json();
                // Simulating a scan by matching SKU partial or name
                const found = items.find(i =>
                    i.sku.toLowerCase().includes(barcodeInput.toLowerCase()) ||
                    `AIMS-${i.sku}`.toLowerCase() === barcodeInput.toLowerCase()
                );

                if (found) {
                    setScannedItem(found);
                    // vibration feedback simulation
                    if (navigator.vibrate) navigator.vibrate(200);
                } else {
                    setFeedback({ type: 'error', message: 'Product not found' });
                }
            }
        } catch (error) {
            console.error('Scan failed:', error);
            setFeedback({ type: 'error', message: 'Connection error' });
        } finally {
            setIsScanning(false);
        }
    };

    const handleUpdateStock = async () => {
        if (!scannedItem) return;

        try {
            const newQty = stockMode === 'in'
                ? scannedItem.qty + qty
                : Math.max(0, scannedItem.qty - qty);

            // Using the items endpoint to update
            const res = await fetch(`http://localhost:5001/api/items/${scannedItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...scannedItem, qty: newQty })
            });

            if (res.ok) {
                const updated = await res.json();
                setScannedItem(updated);
                setFeedback({ type: 'success', message: `Stock successfully updated (New: ${updated.qty})` });
                setQty(1);
                // Clear success message after 3s
                setTimeout(() => setFeedback(null), 3000);
            } else {
                setFeedback({ type: 'error', message: 'Failed to update stock' });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: 'Update failed' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            {/* Camera Feed Simulation / Input Area */}
            <div className="absolute inset-0 bg-[#0f172a]">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop')] bg-cover opacity-10"></div>
            </div>

            {/* UI Overlay */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 max-w-md mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <button onClick={() => setView('dashboard')} className="size-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-white text-sm font-medium border border-white/10">
                        Scanner Active
                    </div>
                    <button className="size-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition">
                        <span className="material-symbols-outlined">flash_on</span>
                    </button>
                </div>

                {/* Main Scanning Area */}
                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                    {!scannedItem ? (
                        <div className="w-full space-y-8">
                            {/* Scanning View */}
                            <div className="relative w-64 h-64 mx-auto border-2 border-primary/50 rounded-3xl flex items-center justify-center overflow-hidden">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
                                <div className="w-full h-0.5 bg-primary absolute top-1/2 shadow-[0_0_20px_rgba(25,133,240,0.8)] animate-pulse"></div>

                                <span className="material-symbols-outlined text-6xl text-white/10">qr_code_scanner</span>
                            </div>

                            <form onSubmit={handleScan} className="w-full relative">
                                <input
                                    type="text"
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    placeholder="Enter SKU or Scan..."
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-center text-lg font-mono"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!barcodeInput}
                                    className="absolute right-2 top-2 bottom-2 bg-primary text-white rounded-lg px-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    GO
                                </button>
                            </form>

                            {feedback && (
                                <div className={`p-4 rounded-xl text-center text-sm font-bold animate-in fade-in slide-in-from-bottom-4 ${feedback.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                    }`}>
                                    {feedback.message}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Product Found View */
                        <div className="w-full animate-in zoom-in-95 duration-200">
                            <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#1e293b]/80 backdrop-blur-xl shadow-2xl">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Product Found</p>
                                        <h3 className="text-xl font-bold text-white leading-tight">{scannedItem.name}</h3>
                                        <p className="text-primary font-mono text-sm mt-1">{scannedItem.sku}</p>
                                    </div>
                                    <button onClick={() => { setScannedItem(null); setBarcodeInput(''); setFeedback(null); }} className="text-slate-400 hover:text-white p-2">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="bg-black/30 rounded-xl p-4 mb-6 flex justify-between items-center">
                                    <div>
                                        <p className="text-slate-400 text-xs">Current Stock</p>
                                        <p className="text-2xl font-bold text-white">{scannedItem.qty}</p>
                                    </div>
                                    <div className="h-8 w-px bg-white/10"></div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-xs">Price</p>
                                        <p className="text-2xl font-bold text-emerald-400">${scannedItem.price}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex bg-black/20 p-1 rounded-lg">
                                        <button
                                            onClick={() => setStockMode('in')}
                                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${stockMode === 'in' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            Stock In (+)
                                        </button>
                                        <button
                                            onClick={() => setStockMode('out')}
                                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${stockMode === 'out' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            Stock Out (-)
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setQty(Math.max(1, qty - 1))}
                                            className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition"
                                        >
                                            <span className="material-symbols-outlined">remove</span>
                                        </button>
                                        <input
                                            type="number"
                                            value={qty}
                                            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="flex-1 bg-transparent text-center text-3xl font-bold text-white outline-none border-b border-white/10 py-1"
                                        />
                                        <button
                                            onClick={() => setQty(qty + 1)}
                                            className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition"
                                        >
                                            <span className="material-symbols-outlined">add</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleUpdateStock}
                                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg text-lg flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all ${stockMode === 'in' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Confirm Update
                                    </button>

                                    {feedback && (
                                        <p className={`text-center text-sm font-bold ${feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                            {feedback.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <p className="text-slate-500 text-xs">Point camera at barcode or enter SKU manually</p>
                </div>
            </div>
        </div>
    );
};

// Barcodes View Component
interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    category?: string;
    qty: number;
    price?: number;
}

const BarcodesView: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [qrSize, setQrSize] = useState<'100' | '150' | '200'>('150');
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/inventory');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
                if (data.length > 0) setSelectedItem(data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const getQRCodeUrl = (item: InventoryItem) => {
        const data = encodeURIComponent(`AIMS-${item.sku}`);
        return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${data}`;
    };

    const handlePrint = () => {
        if (!selectedItem) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Label - ${selectedItem.sku}</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                            .label { display: inline-block; padding: 20px; border: 1px solid #ccc; }
                            img { margin-bottom: 10px; }
                            .sku { font-family: monospace; font-weight: bold; font-size: 14px; }
                            .name { font-size: 12px; color: #666; margin-top: 5px; }
                        </style>
                    </head>
                    <body>
                        <div class="label">
                            <img src="${getQRCodeUrl(selectedItem)}" alt="QR Code" />
                            <div class="sku">${selectedItem.sku}</div>
                            <div class="name">${selectedItem.name}</div>
                        </div>
                        <script>window.onload = function() { window.print(); window.close(); }</script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#101322] flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-black text-white">Barcode Management</h2>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 bg-[#1b2127] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-primary outline-none"
                    />
                </div>

                <div className="glass-panel rounded-xl flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            <span className="material-symbols-outlined animate-spin mr-2">sync</span>
                            Loading inventory...
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inventory_2</span>
                            <p className="text-sm">No products found</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-[#9da1b9] min-w-[600px]">
                            <thead className="bg-[#1b2127] text-xs uppercase text-white font-semibold sticky top-0">
                                <tr>
                                    <th className="p-4">Product</th>
                                    <th className="p-4">SKU</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredItems.map(item => (
                                    <tr
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`hover:bg-white/5 cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                                            }`}
                                    >
                                        <td className="p-4 text-white font-medium">{item.name}</td>
                                        <td className="p-4 text-xs text-white flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-primary">qr_code_2</span>
                                            {item.sku}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs">Active</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                                                className="text-primary font-bold text-xs hover:underline"
                                            >
                                                Generate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Generator Panel */}
            <div className="w-full lg:w-[400px] glass-panel rounded-xl flex flex-col overflow-hidden relative shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">auto_fix_high</span> Code Generator
                    </h3>
                </div>
                <div className="p-6 flex-1 flex flex-col gap-6">
                    {selectedItem ? (
                        <>
                            <div className="flex gap-4 items-center p-4 bg-white/5 rounded-lg border border-white/10">
                                <div className="size-12 bg-primary/20 rounded flex items-center justify-center flex-none">
                                    <span className="material-symbols-outlined text-primary">inventory_2</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-[#9da1b9] uppercase font-bold">Selected</p>
                                    <p className="text-white font-bold truncate">{selectedItem.name}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[#9da1b9] mb-2">Encoded Data</label>
                                    <input
                                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono"
                                        value={`AIMS-${selectedItem.sku}`}
                                        readOnly
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#9da1b9] mb-2">Size</label>
                                        <select
                                            value={qrSize}
                                            onChange={(e) => setQrSize(e.target.value as any)}
                                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                        >
                                            <option value="100">Small (100px)</option>
                                            <option value="150">Medium (150px)</option>
                                            <option value="200">Large (200px)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#9da1b9] mb-2">Quantity</label>
                                        <div className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white">
                                            {selectedItem.qty} in stock
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto bg-white rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-2xl">
                                <img
                                    src={getQRCodeUrl(selectedItem)}
                                    alt="QR Code"
                                    className="mb-2"
                                    style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
                                />
                                <p className="text-black font-mono font-bold text-xs">{selectedItem.sku}</p>
                            </div>

                            <button
                                onClick={handlePrint}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">print</span>
                                Print Label
                            </button>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">qr_code</span>
                            <p className="text-sm">Select a product to generate QR code</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface AdminProps {
    view: View;
    userRole: UserRole;
    setView: (view: View) => void;
}

const Admin: React.FC<AdminProps> = ({ view, userRole, setView }) => {
    // Team Management View
    if (view === 'team') {
        return (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#101922] bg-[radial-gradient(at_0%_0%,_rgba(25,133,240,0.15)_0px,_transparent_50%)]">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Team Management</h1>
                            <p className="text-slate-400">Manage employee access, invite new members, and configure roles.</p>
                        </div>
                        <button className="glass-panel hover:bg-white/5 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-[20px]">download</span> Export List
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Invite Section */}
                        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
                            <div className="glass-panel p-6 rounded-2xl sticky top-6">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><span className="material-symbols-outlined">person_add</span></div>
                                    Invite New Member
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1.5">Email Address</label>
                                        <input className="w-full bg-[#1b2127]/50 border border-white/10 rounded-lg p-2.5 text-white focus:border-primary outline-none" placeholder="colleague@aims.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1.5">Role Assignment</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-lg border border-primary bg-primary/10 text-center cursor-pointer">
                                                <div className="text-sm font-bold text-white">Staff</div>
                                                <div className="text-xs text-slate-400">Standard access</div>
                                            </div>
                                            <div className="p-3 rounded-lg border border-white/10 bg-[#1b2127]/30 hover:bg-white/5 text-center cursor-pointer transition-all">
                                                <div className="text-sm font-bold text-white">Manager</div>
                                                <div className="text-xs text-slate-400">Full control</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/25 mt-2">Send Invitation</button>
                                </div>
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="lg:col-span-8 order-1 lg:order-2">
                            <div className="glass-panel rounded-2xl overflow-hidden">
                                <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <h2 className="text-lg font-bold text-white">Current Team Members</h2>
                                    <input className="w-full sm:w-auto bg-[#1b2127] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-primary outline-none" placeholder="Search users..." />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead className="bg-white/5 text-xs uppercase text-slate-400 font-semibold">
                                            <tr>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-sm">
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 bg-cover bg-center" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?u=1)' }}></div>
                                                        <div>
                                                            <div className="font-medium text-white">John Doe</div>
                                                            <div className="text-slate-500 text-xs">john.d@aims.com</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/20">Manager</span></td>
                                                <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500 shadow-emerald-500/50 shadow-sm"></div><span className="text-slate-300">Active</span></div></td>
                                                <td className="px-6 py-4 text-right"><span className="material-symbols-outlined text-slate-400 hover:text-white cursor-pointer">more_vert</span></td>
                                            </tr>
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold border border-purple-500/20">JS</div>
                                                        <div>
                                                            <div className="font-medium text-white">Jane Smith</div>
                                                            <div className="text-slate-500 text-xs">jane.s@aims.com</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-white/10">Staff</span></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 mb-0.5"><div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div><span className="text-slate-300">Invite Pending</span></div>
                                                    <div className="text-xs text-amber-500/80">Expires in 23h</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-xs font-medium text-primary hover:underline mr-4">Resend</button>
                                                    <span className="material-symbols-outlined text-slate-400 hover:text-white cursor-pointer align-middle">more_vert</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Data Export View
    if (view === 'export') {
        return <DataExportView />;
    }

    // Mobile Barcode Scanner View
    if (view === 'scanner') {
        return <MobileScannerView setView={setView} />;
    }

    // Barcode Management
    if (view === 'barcodes') {
        return <BarcodesView />;
    }

    return <div>Select a view from the sidebar</div>;
};

export default Admin;