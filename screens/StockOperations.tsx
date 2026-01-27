import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { View } from '../types';
import { API_URL } from '../config';

// TypeScript Interfaces
interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    stock: number;
    price: number | string;
    img?: string;
    attributes?: Record<string, unknown>;
}

interface CartItem {
    id?: string;
    name: string;
    sku?: string;
    qty: number;
    price: number;
    isCustom?: boolean;
}

interface Transaction {
    itemId: string;
    type: 'IN' | 'OUT';
    qty: number;
    date?: string;
    price?: number;
    vendor?: string;
}

interface ForecastItem extends InventoryItem {
    velocity: number;
    daysRemaining: number;
    status: 'Healthy' | 'Low' | 'Critical';
    reorderQty: number;
}

interface StockOperationsProps {
    view: View;
    addNotification?: (notification: any) => void;
}

const StockOperations: React.FC<StockOperationsProps> = ({ view, addNotification }) => {
    // Customer State
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [showInvoice, setShowInvoice] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isAddingItem, setIsAddingItem] = useState(false);

    // Sales Order State
    const [salesSearch, setSalesSearch] = useState('');
    const [selectedSalesItem, setSelectedSalesItem] = useState<InventoryItem | null>(null);
    const [customItem, setCustomItem] = useState({ name: '', price: '' });
    const [salesQty, setSalesQty] = useState(1);
    const [showSalesSuggestions, setShowSalesSuggestions] = useState(false);

    // Inventory State
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [vendors, setVendors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Stock In State
    const [stockInSearch, setStockInSearch] = useState('');
    const [selectedStockItem, setSelectedStockItem] = useState<InventoryItem | null>(null);
    const [stockInQty, setStockInQty] = useState('');
    const [stockInCost, setStockInCost] = useState('');
    const [stockInVendor, setStockInVendor] = useState('');
    const [stockInInvoice, setStockInInvoice] = useState('');
    const [showStockInSuccess, setShowStockInSuccess] = useState(false);
    const [showStockSuggestions, setShowStockSuggestions] = useState(false);
    const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);

    // Audit State
    const [auditSearch, setAuditSearch] = useState('');
    const [auditSelectedItem, setAuditSelectedItem] = useState<InventoryItem | null>(null);
    const [auditPhysicalCount, setAuditPhysicalCount] = useState('');
    const [auditReason, setAuditReason] = useState('Data Entry Error');
    const [showAuditSuccess, setShowAuditSuccess] = useState(false);

    // Forecasting State
    const [forecastItems, setForecastItems] = useState<ForecastItem[]>([]);

    // Checkout State
    const [isProcessing, setIsProcessing] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // Refs for click-outside handling
    const salesDropdownRef = useRef<HTMLDivElement>(null);
    const stockDropdownRef = useRef<HTMLDivElement>(null);
    const vendorDropdownRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);

        let fetchedItems: InventoryItem[] = [];

        // Fetch Inventory (Critical)
        try {
            const itemsRes = await fetch(`${API_URL}/api/inventory`);
            if (!itemsRes.ok) throw new Error(`HTTP error! status: ${itemsRes.status}`);
            const itemsData = await itemsRes.json();

            if (Array.isArray(itemsData)) {
                fetchedItems = itemsData;
                setItems(itemsData);
            } else {
                console.error('Invalid items data:', itemsData);
                setFetchError('Invalid data received from server');
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            setFetchError('Failed to load inventory. Please check your connection.');
            setIsLoading(false);
            return;
        }

        // Fetch History (Non-Critical)
        try {
            const [vendorsRes, transRes] = await Promise.all([
                fetch(`${API_URL}/api/vendors`),
                fetch(`${API_URL}/api/transactions`)
            ]);

            const vendorsData = await vendorsRes.json();
            const transData: Transaction[] = await transRes.json();

            if (Array.isArray(vendorsData)) {
                setVendors(vendorsData);
            }

            // Calculate Forecast only if we have items
            if (fetchedItems.length > 0) {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                const forecast: ForecastItem[] = fetchedItems.map((item) => {
                    // Filter OUT transactions for this item in last 30 days
                    const outTx = transData.filter((t) =>
                        t.itemId === item.id &&
                        t.type === 'OUT' &&
                        new Date(t.date || '') >= thirtyDaysAgo
                    );

                    const totalSold = outTx.reduce((sum, t) => sum + (t.qty || 0), 0);
                    const velocity = totalSold / 30;
                    const daysRemaining = velocity > 0 ? Math.floor(item.stock / velocity) : 999;

                    let status: 'Healthy' | 'Low' | 'Critical' = 'Healthy';
                    if (daysRemaining < 7) status = 'Critical';
                    else if (daysRemaining < 14) status = 'Low';

                    const targetStock = Math.ceil(velocity * 30);
                    const reorderQty = Math.max(0, targetStock - item.stock);

                    return { ...item, velocity, daysRemaining, status, reorderQty };
                }).sort((a, b) => a.daysRemaining - b.daysRemaining);

                setForecastItems(forecast);
            }
        } catch (error) {
            console.error('Failed to fetch history (non-critical):', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Click outside handler for dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (salesDropdownRef.current && !salesDropdownRef.current.contains(event.target as Node)) {
                setShowSalesSuggestions(false);
            }
            if (stockDropdownRef.current && !stockDropdownRef.current.contains(event.target as Node)) {
                setShowStockSuggestions(false);
            }
            if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
                setShowVendorSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchData();
    }, [view, fetchData]);

    const filteredStockItems = items.filter(item =>
        item.name.toLowerCase().includes(stockInSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(stockInSearch.toLowerCase())
    ).slice(0, 5);

    const filteredVendors = vendors.filter(v =>
        v.toLowerCase().includes(stockInVendor.toLowerCase())
    ).slice(0, 5);

    const handleStockIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStockItem || !stockInQty) return;

        try {
            const currentStock = selectedStockItem.stock || 0;
            const addedQty = parseInt(stockInQty);
            const newStock = currentStock + addedQty;

            await fetch(`${API_URL}/api/inventory/${selectedStockItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...selectedStockItem,
                    stock: newStock,
                    // Preserve other fields, ensure attributes are handled if needed by backend (though backend likely handles it)
                    attributes: selectedStockItem.attributes // Pass back if backend expects it
                })
            });

            // Save Transaction History
            await fetch(`${API_URL}/api/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'IN',
                    itemId: selectedStockItem.id,
                    qty: addedQty,
                    price: parseFloat(stockInCost) || 0,
                    vendor: stockInVendor
                })
            });

            // Reset and Show Success
            setShowStockInSuccess(true);
            setStockInQty('');
            setStockInCost('');
            setStockInSearch('');
            setStockInVendor(''); // Clear vendor or keep it? User might add multiple from same vendor. Let's clear for now.
            setSelectedStockItem(null);

            // Refresh Data
            const [itemsRes, vendorsRes] = await Promise.all([
                fetch(`${API_URL}/api/inventory`),
                fetch(`${API_URL}/api/vendors`)
            ]);
            setItems(await itemsRes.json());
            setVendors(await vendorsRes.json());

            setTimeout(() => setShowStockInSuccess(false), 3000);

        } catch (error) {
            console.error('Failed to update stock:', error);
        }
    };

    const filteredAuditItems = items.filter(item =>
        item.name.toLowerCase().includes(auditSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(auditSearch.toLowerCase())
    );

    const handleAuditConfirm = async () => {
        if (!auditSelectedItem || !auditPhysicalCount) return;

        try {
            const physical = parseInt(auditPhysicalCount);
            const current = auditSelectedItem.stock || 0;
            const diff = physical - current;

            // Update Stock
            await fetch(`${API_URL}/api/inventory/${auditSelectedItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...auditSelectedItem,
                    stock: physical,
                    attributes: auditSelectedItem.attributes
                })
            });

            // Create Transaction Record (Audit Adjustment)
            if (diff !== 0) {
                await fetch(`${API_URL}/api/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: diff > 0 ? 'IN' : 'OUT',
                        itemId: auditSelectedItem.id,
                        qty: Math.abs(diff),
                        price: 0, // Audit adjustments usually don't have a direct "price" in this context, or use avg cost
                        vendor: `AUDIT: ${auditReason}`
                    })
                });
            }

            // Success & Reset
            setShowAuditSuccess(true);
            setAuditSelectedItem(null);
            setAuditPhysicalCount('');
            setAuditSearch('');

            // Refresh Data
            const res = await fetch(`${API_URL}/api/inventory`);
            const data = await res.json();
            setItems(data);

            setTimeout(() => setShowAuditSuccess(false), 3000);

        } catch (error) {
            console.error('Failed to submit audit:', error);
        }
    };

    const filteredSalesItems = items.filter(item =>
        (item.name && item.name.toLowerCase().includes(salesSearch.toLowerCase())) ||
        (item.sku && item.sku.toLowerCase().includes(salesSearch.toLowerCase()))
    ).slice(0, 5);

    const addItemToCart = useCallback((e?: React.MouseEvent) => {
        if (e) e.preventDefault();

        if (selectedSalesItem) {
            const price = typeof selectedSalesItem.price === 'string'
                ? parseFloat(selectedSalesItem.price.replace(/[^0-9.]/g, ''))
                : Number(selectedSalesItem.price);

            setCart(prev => [...prev, {
                id: selectedSalesItem.id,
                name: selectedSalesItem.name,
                sku: selectedSalesItem.sku,
                qty: salesQty,
                price: isNaN(price) ? 0 : price,
                isCustom: false
            }]);
            setSelectedSalesItem(null);
            setSalesSearch('');
            setSalesQty(1);
            setIsAddingItem(false);
        } else if (customItem.name && customItem.price) {
            const price = parseFloat(customItem.price);
            setCart(prev => [...prev, {
                name: customItem.name,
                qty: salesQty,
                price: isNaN(price) ? 0 : price,
                isCustom: true
            }]);
            setCustomItem({ name: '', price: '' });
            setSalesQty(1);
            setIsAddingItem(false);
        }
    }, [selectedSalesItem, customItem, salesQty]);

    const updateCartQty = useCallback((index: number, change: number) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index] = { ...newCart[index], qty: Math.max(1, newCart[index].qty + change) };
            return newCart;
        });
    }, []);

    const removeFromCart = useCallback((index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            setCheckoutError("Cart is empty");
            return;
        }

        setIsProcessing(true);
        setCheckoutError(null);

        try {
            for (const item of cart) {
                // 1. Update Stock (if Inventory Item)
                if (!item.isCustom && item.id) {
                    const originalItem = items.find(i => i.id === item.id);
                    if (originalItem) {
                        const newStock = (originalItem.stock || 0) - item.qty;
                        const res = await fetch(`${API_URL}/api/inventory/${item.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...originalItem,
                                stock: newStock,
                                attributes: originalItem.attributes
                            })
                        });
                        if (!res.ok) throw new Error(`Failed to update stock for ${item.name}`);
                    }
                }

                // 2. Create Transaction
                const transRes = await fetch(`${API_URL}/api/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'OUT',
                        itemId: item.isCustom ? 'CUSTOM' : item.id,
                        qty: item.qty,
                        price: item.price,
                        vendor: customerName || 'Guest', // Use vendor field for Customer Name
                        description: item.isCustom ? item.name : undefined
                    })
                });
                if (!transRes.ok) {
                    const errorText = await transRes.text();
                    throw new Error(`Failed to create transaction for ${item.name}: ${errorText}`);
                }
            }

            // Success Notification
            if (addNotification) {
                addNotification({
                    icon: 'check_circle',
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10',
                    title: 'Order Completed',
                    desc: `${cart.length} items sold to ${customerName || 'Guest'}`,
                    time: 'Just now'
                });
            }

            // Refresh Inventory first
            await fetchData();
            // Then show invoice
            setShowInvoice(true);
            // Clear cart? Maybe wait until invoice closed or new order started.
            // keeping cart for invoice display.

        } catch (error: any) {
            console.error("Checkout failed", error);
            setCheckoutError(error.message || "Checkout failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const calculateTotal = useCallback(() => {
        return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    }, [cart]);

    // Memoized filtered items to avoid recalculating on every render
    const filteredSalesItemsMemo = React.useMemo(() => {
        if (!salesSearch) return items;
        const search = salesSearch.toLowerCase();
        return items.filter(item =>
            (item.name?.toLowerCase().includes(search)) ||
            (item.sku?.toLowerCase().includes(search))
        ).slice(0, 10);
    }, [items, salesSearch]);

    if (isLoading && items.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-transparent">
                <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                    <p className="text-slate-400 mt-2">Loading inventory...</p>
                </div>
            </div>
        );
    }

    if (fetchError && items.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-transparent">
                <div className="text-center max-w-md p-6">
                    <span className="material-symbols-outlined text-4xl text-red-400">error</span>
                    <p className="text-red-400 mt-2 font-bold">Connection Error</p>
                    <p className="text-slate-400 text-sm mt-1">{fetchError}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'stock-out') {
        return (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent">
                <div className="max-w-4xl mx-auto flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-white">Create Sales Order</h1>
                            <p className="text-slate-400">Process new customer order and generate invoice.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Order Form */}
                        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-white/10 shadow-2xl">
                            <form className="space-y-6" onSubmit={handleCheckout}>
                                <div className="space-y-4">
                                    <h3 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">person</span> Customer Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs text-[#9cabba] mb-1">Full Name / Company</label>
                                            <input
                                                required
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3 focus:border-primary outline-none"
                                                placeholder="e.g. Acme Corp or John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-[#9cabba] mb-1">Email Address</label>
                                            <input
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3 focus:border-primary outline-none"
                                                placeholder="email@example.com"
                                                type="email"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-[#9cabba] mb-1">Phone Number</label>
                                            <input
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3 focus:border-primary outline-none"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">shopping_cart</span> Order Items
                                        </h3>
                                        <button type="button" onClick={() => setIsAddingItem(true)} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">add</span> Add Item
                                        </button>
                                    </div>

                                    {/* Add Item Form */}
                                    {isAddingItem && (
                                        <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-white font-bold text-sm border-b border-white/10 pb-2">Add Item to Order</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="text-xs text-[#9cabba]">Select Product</label>
                                                        <button
                                                            type="button"
                                                            onClick={fetchData}
                                                            className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[12px]">refresh</span> Refresh List
                                                        </button>
                                                    </div>

                                                    {/* Custom Dropdown / Search */}
                                                    <div className="relative" ref={salesDropdownRef}>
                                                        <div
                                                            className="flex items-center bg-[#1b2127] border border-[#3b4754] rounded-lg h-10 px-3 cursor-text focus-within:border-primary transition-colors"
                                                            onClick={() => {
                                                                if (!showSalesSuggestions) setShowSalesSuggestions(true);
                                                                // Focus input
                                                                const input = document.getElementById('sales-search-input');
                                                                if (input) input.focus();
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined text-slate-500 mr-2">search</span>
                                                            <input
                                                                id="sales-search-input"
                                                                value={salesSearch}
                                                                onChange={(e) => {
                                                                    setSalesSearch(e.target.value);
                                                                    if (!showSalesSuggestions) setShowSalesSuggestions(true);
                                                                    setSelectedSalesItem(null);
                                                                    setCustomItem({ name: '', price: '' });
                                                                }}
                                                                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-slate-500"
                                                                placeholder={items.length > 0 ? "Type to search..." : "Loading items..."}
                                                                autoComplete="off"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowSalesSuggestions(!showSalesSuggestions);
                                                                }}
                                                                className="text-slate-500 hover:text-white"
                                                            >
                                                                <span className="material-symbols-outlined">{showSalesSuggestions ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
                                                            </button>
                                                        </div>

                                                        {/* Dropdown List */}
                                                        {showSalesSuggestions && (
                                                            <div className="absolute top-full left-0 w-full mt-1 bg-[#232d36] border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                                                {filteredSalesItemsMemo.length > 0 ? (
                                                                    filteredSalesItemsMemo.map(item => (
                                                                        <button
                                                                            key={item.id}
                                                                            type="button"
                                                                            className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex justify-between items-center group"
                                                                            onClick={() => {
                                                                                setSelectedSalesItem(item);
                                                                                setSalesSearch(item.name);
                                                                                setSalesQty(1);
                                                                                setShowSalesSuggestions(false);
                                                                            }}
                                                                        >
                                                                            <div>
                                                                                <p className="text-white text-sm font-bold">{item.name}</p>
                                                                                <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-xs text-slate-400">Stock</p>
                                                                                <p className={`font-mono font-bold ${item.stock > 10 ? 'text-emerald-400' : item.stock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                                    {item.stock}
                                                                                </p>
                                                                            </div>
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-4 text-center">
                                                                        <p className="text-sm text-slate-400 mb-1">No products found.</p>
                                                                        {items.length === 0 && <p className="text-xs text-slate-500">Inventory is empty.</p>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>    {selectedSalesItem && (
                                                    <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                        Selected: {selectedSalesItem.name}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="material-symbols-outlined text-sm">info</span>
                                                <span className="text-xs">Or add a custom item:</span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-2">
                                                    <input
                                                        value={customItem.name}
                                                        onChange={(e) => {
                                                            setCustomItem({ ...customItem, name: e.target.value });
                                                            setSalesSearch('');
                                                            setSelectedSalesItem(null);
                                                        }}
                                                        placeholder="Item Name"
                                                        className="w-full bg-[#1b2127] border border-white/10 rounded text-sm text-white p-2"
                                                    />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={customItem.price}
                                                    onChange={(e) => setCustomItem({ ...customItem, price: e.target.value })}
                                                    placeholder="Price"
                                                    className="bg-[#1b2127] border border-white/10 rounded text-sm text-white p-2"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center border border-white/10 rounded bg-[#1b2127]">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSalesQty(Math.max(1, salesQty - 1))}
                                                        className="px-3 py-1.5 text-slate-400 hover:bg-white/5"
                                                    >-</button>
                                                    <span className="px-2 text-white text-sm font-mono w-8 text-center">{salesQty}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSalesQty(salesQty + 1)}
                                                        className="px-3 py-1.5 text-slate-400 hover:bg-white/5"
                                                    >+</button>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={!selectedSalesItem && (!customItem.name || !customItem.price)}
                                                    onClick={addItemToCart}
                                                    className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-1.5 rounded text-xs font-bold hover:bg-emerald-500/30 transition disabled:opacity-50"
                                                >
                                                    Confirm Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {cart.map((item, idx) => (
                                            <div key={`cart-${idx}-${item.name}`} className="flex justify-between items-center group bg-white/5 p-3 rounded-lg border border-transparent hover:border-white/10 transition">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => removeFromCart(idx)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><span className="material-symbols-outlined text-sm">close</span></button>
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{item.name}</p>
                                                        <p className="text-xs text-slate-500">{item.isCustom ? 'Custom Item' : item.sku}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-[#1b2127] rounded px-1">
                                                        <button onClick={() => updateCartQty(idx, -1)} className="text-slate-500 hover:text-white px-1 text-xs">-</button>
                                                        <span className="text-xs text-white font-mono w-4 text-center">{item.qty}</span>
                                                        <button onClick={() => updateCartQty(idx, 1)} className="text-slate-500 hover:text-white px-1 text-xs">+</button>
                                                    </div>
                                                    <div className="text-right w-16">
                                                        <p className="text-white font-mono font-bold">${(item.price * item.qty).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {cart.length === 0 && (
                                            <div className="text-center p-6 text-slate-500 text-sm border border-dashed border-white/10 rounded-lg">
                                                No items in order.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col items-end gap-2">
                                    {checkoutError && (
                                        <p className="text-red-400 text-sm font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">error</span> {checkoutError}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="px-8 py-3 bg-primary hover:bg-primary/90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg flex items-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <><span className="material-symbols-outlined animate-spin">progress_activity</span> Processing...</>
                                        ) : (
                                            <><span className="material-symbols-outlined">check_circle</span> Complete Order</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Summary Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="glass-panel p-6 rounded-xl border border-white/10">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Order Summary</h3>
                                <div className="space-y-3 border-b border-white/5 pb-4 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Subtotal</span>
                                        <span className="text-white font-mono">${calculateTotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Tax (8%)</span>
                                        <span className="text-white font-mono">${(calculateTotal() * 0.08).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Shipping</span>
                                        <span className="text-white font-mono">$0.00</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-white font-bold">Total</span>
                                    <span className="text-2xl text-primary font-bold font-mono">${(calculateTotal() * 1.08).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                    <div>
                                        <h4 className="text-primary font-bold text-sm">Upsell Opportunity</h4>
                                        <p className="text-primary/70 text-xs mt-1">Customer often buys <b>Protection Plan</b> with Electronics. Suggest adding SKU-PROT-1Y.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Invoice Modal */}
                {
                    showInvoice && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                            <div id="invoice-modal" className="bg-white text-slate-900 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                                {/* Print Toolbar */}
                                <div className="bg-slate-100 p-3 border-b border-slate-200 flex justify-between items-center print:hidden">
                                    <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-green-600">check_circle</span> Order Created Successfully
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => window.print()}
                                            className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded flex items-center gap-1 hover:bg-slate-700 transition"
                                        >
                                            <span className="material-symbols-outlined text-sm">print</span> Print
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowInvoice(false);
                                                // Reset form for new order
                                                setCart([]);
                                                setCustomerName('');
                                                setCustomerEmail('');
                                                setCustomerPhone('');
                                                setCheckoutError(null);
                                            }}
                                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded flex items-center gap-1 hover:bg-emerald-700 transition"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span> New Order
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowInvoice(false)}
                                            className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-300 transition"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>

                                {/* Invoice Content */}
                                <div className="p-8 overflow-y-auto" id="invoice-area">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">INVOICE</h1>
                                            <p className="text-slate-500 font-medium">#INV-{Math.floor(Math.random() * 10000)}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-2 mb-1">
                                                <div className="size-6 bg-primary rounded-md flex items-center justify-center"><span className="material-symbols-outlined text-white text-xs">inventory_2</span></div>
                                                <span className="font-bold text-slate-900">AIMS Inc.</span>
                                            </div>
                                            <p className="text-xs text-slate-500">123 Tech Boulevard</p>
                                            <p className="text-xs text-slate-500">San Francisco, CA 94105</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bill To</p>
                                            <h3 className="font-bold text-slate-900 text-lg">{customerName || 'Guest Customer'}</h3>
                                            <p className="text-sm text-slate-600">{customerEmail || 'No email provided'}</p>
                                            <p className="text-sm text-slate-600">{customerPhone || 'No phone provided'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                                            <p className="font-medium text-slate-900">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <table className="w-full text-left text-sm mb-8">
                                        <thead className="border-b-2 border-slate-100">
                                            <tr>
                                                <th className="py-3 font-bold text-slate-700">Item Description</th>
                                                <th className="py-3 font-bold text-slate-700 text-right">Qty</th>
                                                <th className="py-3 font-bold text-slate-700 text-right">Unit Price</th>
                                                <th className="py-3 font-bold text-slate-700 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {cart.map((item, i) => (
                                                <tr key={i}>
                                                    <td className="py-3">
                                                        <p className="font-medium text-slate-900">{item.name}</p>
                                                        <p className="text-xs text-slate-500">{item.sku}</p>
                                                    </td>
                                                    <td className="py-3 text-right text-slate-600">{item.qty}</td>
                                                    <td className="py-3 text-right text-slate-600">${item.price.toFixed(2)}</td>
                                                    <td className="py-3 text-right font-medium text-slate-900">${(item.price * item.qty).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="flex justify-end">
                                        <div className="w-64 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-slate-500">Subtotal</span>
                                                <span className="font-medium text-slate-900">${calculateTotal().toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-slate-500">Tax (8%)</span>
                                                <span className="font-medium text-slate-900">${(calculateTotal() * 0.08).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg pt-2 border-t border-slate-200">
                                                <span className="font-bold text-slate-900">Total</span>
                                                <span className="font-bold text-primary">${(calculateTotal() * 1.08).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-6 border-t border-slate-100 text-center">
                                        <p className="text-xs text-slate-400">Thank you for your business.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }

    if (view === 'audit') {
        const sysStock = auditSelectedItem?.stock || 0;
        const physStock = parseInt(auditPhysicalCount) || 0;
        const discrepancy = physStock - sysStock;

        return (
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Left List */}
                <div className="w-full lg:w-2/3 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-[#101922]/90 h-1/2 lg:h-full">
                    <div className="p-4 lg:p-6 border-b border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-xl lg:text-2xl font-bold text-white">Stocktake / Audit</h1>
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                <span className="text-xs text-yellow-500 font-bold uppercase">Audit Active</span>
                            </div>
                        </div>

                        <div className="relative">
                            <input
                                value={auditSearch}
                                onChange={(e) => {
                                    setAuditSearch(e.target.value);
                                    setAuditSelectedItem(null);
                                }}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg py-2 px-4 pl-10 text-white focus:border-primary outline-none"
                                placeholder="Scan or search item to count..."
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500">search</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-2">
                        {auditSearch ? (
                            filteredAuditItems.length > 0 ? (
                                filteredAuditItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            setAuditSelectedItem(item);
                                            setAuditPhysicalCount(item.stock?.toString() || '0');
                                        }}
                                        className={`p-4 rounded-lg cursor-pointer border transition-all flex justify-between items-center ${auditSelectedItem?.id === item.id
                                            ? 'bg-primary/10 border-primary'
                                            : 'hover:bg-white/5 border-transparent hover:border-white/5'
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="size-10 bg-slate-800 rounded flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-outlined">inventory_2</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium">{item.name}</h4>
                                                <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-400 text-xs">System Qty</p>
                                            <p className="text-white font-mono font-bold">{item.stock}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 text-slate-500">No items found matching "{auditSearch}"</div>
                            )
                        ) : (
                            <div className="text-center p-8 text-slate-500 flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-4xl opacity-50">qr_code_scanner</span>
                                <p>Search for an item to begin audit</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Detail Panel */}
                <div className="w-full lg:w-1/3 bg-[#0f172a] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col relative z-20 shadow-2xl h-1/2 lg:h-full overflow-y-auto">
                    {/* Success Message */}
                    {showAuditSuccess && (
                        <div className="absolute top-0 left-0 right-0 z-30 bg-emerald-500 text-white p-3 text-center text-sm font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top">
                            <span className="material-symbols-outlined text-sm">check_circle</span> Adjustment Saved
                        </div>
                    )}

                    {auditSelectedItem ? (
                        <>
                            <div className="p-6 flex-1 flex flex-col gap-6">
                                <div className="aspect-video bg-slate-800 rounded-lg w-full relative overflow-hidden group shrink-0">
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                        {auditSelectedItem.img === 'box' ? (
                                            <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                        ) : (
                                            <img src="https://placehold.co/400x300/1e293b/475569?text=Product" className="w-full h-full object-cover opacity-50" />
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-center text-xs text-white">{auditSelectedItem.name}</div>
                                </div>

                                <div className="glass-panel p-4 rounded-xl space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity Verification</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500">System</p>
                                            <p className="text-2xl font-mono font-bold text-slate-300">{sysStock}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-600">arrow_right_alt</span>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500">Physical</p>
                                            <input
                                                type="number"
                                                value={auditPhysicalCount}
                                                onChange={(e) => setAuditPhysicalCount(e.target.value)}
                                                className="bg-slate-800 text-white text-2xl font-mono font-bold w-24 text-center rounded p-1 border border-slate-600 focus:border-primary outline-none"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {discrepancy !== 0 ? (
                                        <div className={`border rounded p-2 flex justify-between items-center text-sm ${discrepancy < 0 ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                            }`}>
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">
                                                    {discrepancy < 0 ? 'trending_down' : 'trending_up'}
                                                </span>
                                                Discrepancy
                                            </span>
                                            <span className="font-mono font-bold">{discrepancy > 0 ? '+' : ''}{discrepancy} Units</span>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-800/50 border border-white/5 rounded p-2 text-center text-slate-400 text-sm">
                                            <span className="material-symbols-outlined text-sm align-middle mr-1">check</span> Counts Match
                                        </div>
                                    )}
                                </div>

                                {discrepancy !== 0 && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                        <label className="text-xs text-slate-400">Reason Code</label>
                                        <select
                                            value={auditReason}
                                            onChange={(e) => setAuditReason(e.target.value)}
                                            className="w-full bg-[#1b2127] border border-white/10 rounded text-sm text-white p-2"
                                        >
                                            <option>Data Entry Error</option>
                                            <option>Theft / Loss</option>
                                            <option>Damaged</option>
                                            <option>Found Stock</option>
                                            <option>Vendor Bonus</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/10 flex gap-2 bg-[#0f172a] sticky bottom-0">
                                <button onClick={() => setAuditSelectedItem(null)} className="flex-1 py-3 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition">Cancel</button>
                                <button onClick={handleAuditConfirm} className="flex-[2] py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-lg">
                                    {discrepancy === 0 ? 'Confirm Match' : 'Adjust Stock'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                            <span className="material-symbols-outlined text-6xl mb-4 opacity-20">fact_check</span>
                            <p>Select an item from the list<br />to verify counts.</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Stock In View
    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white">Record Stock In</h1>
                        <p className="text-slate-400">Log incoming shipments and update levels.</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span> Demand Spiking for Electronics
                    </div>
                </div>

                {showStockInSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <span className="material-symbols-outlined">check_circle</span>
                        <div>
                            <p className="font-bold">Stock Updated Successfully</p>
                            <p className="text-xs opacity-80">Inventory levels have been adjusted.</p>
                        </div>
                    </div>
                )}

                <div className="glass-panel p-4 md:p-8 rounded-xl border border-white/10 shadow-2xl">
                    <form className="space-y-8" onSubmit={handleStockIn}>
                        <div className="space-y-4">
                            <h3 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2"><span className="material-symbols-outlined text-primary">local_shipping</span> Source Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs text-[#9cabba] mb-1">Select Vendor</label>
                                    <div className="relative" ref={vendorDropdownRef}>
                                        <input
                                            value={stockInVendor}
                                            onChange={(e) => {
                                                setStockInVendor(e.target.value);
                                                setShowVendorSuggestions(true);
                                            }}
                                            onFocus={() => setShowVendorSuggestions(true)}
                                            className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3 focus:border-primary outline-none"
                                            placeholder="e.g. TechSupplies Global"
                                            aria-label="Vendor name"
                                            autoComplete="off"
                                        />
                                        {/* Vendor Suggestions */}
                                        {showVendorSuggestions && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-[#232d36] border border-white/10 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                                                {filteredVendors.length > 0 ? filteredVendors.map((v, i) => (
                                                    <button
                                                        key={`vendor-${i}-${v}`}
                                                        type="button"
                                                        className="w-full text-left p-2.5 hover:bg-white/5 border-b border-white/5 last:border-0 text-sm text-white"
                                                        onClick={() => {
                                                            setStockInVendor(v);
                                                            setShowVendorSuggestions(false);
                                                        }}
                                                    >
                                                        {v}
                                                    </button>
                                                )) : (
                                                    stockInVendor && <div className="p-2.5 text-xs text-emerald-400">New Vendor: "{stockInVendor}"</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#9cabba] mb-1">Invoice #</label>
                                    <input
                                        value={stockInInvoice}
                                        onChange={(e) => setStockInInvoice(e.target.value)}
                                        className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3"
                                        placeholder="INV-2023-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#9cabba] mb-1">Date Received</label>
                                    <input type="date" className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2"><span className="material-symbols-outlined text-primary">qr_code_2</span> Item Specs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-[#9cabba] mb-1">Search Product</label>
                                    <div className="relative" ref={stockDropdownRef}>
                                        <input
                                            value={stockInSearch}
                                            onChange={(e) => {
                                                setStockInSearch(e.target.value);
                                                setShowStockSuggestions(true);
                                                if (!e.target.value) setSelectedStockItem(null);
                                            }}
                                            onFocus={() => setShowStockSuggestions(true)}
                                            className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3 pl-10 focus:border-primary outline-none"
                                            placeholder="Search by name or SKU..."
                                            aria-label="Search products"
                                            autoComplete="off"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <span className="material-symbols-outlined text-[18px]">search</span>
                                        </div>

                                        {/* Suggestions */}
                                        {showStockSuggestions && stockInSearch && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-[#232d36] border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                                {filteredStockItems.length > 0 ? filteredStockItems.map(item => (
                                                    <button
                                                        key={`stock-${item.id}`}
                                                        type="button"
                                                        className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex justify-between items-center group"
                                                        onClick={() => {
                                                            setSelectedStockItem(item);
                                                            setStockInSearch(item.name);
                                                            setStockInCost(String(item.price));
                                                            setShowStockSuggestions(false);
                                                        }}
                                                    >
                                                        <div>
                                                            <p className="text-white text-sm font-bold">{item.name}</p>
                                                            <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-400">Current Stock</p>
                                                            <p className={`font-mono font-bold ${item.stock > 10 ? 'text-emerald-400' : item.stock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                {item.stock}
                                                            </p>
                                                        </div>
                                                    </button>
                                                )) : (
                                                    <div className="p-3 text-xs text-slate-500 text-center">No items found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {selectedStockItem && (
                                        <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                            Selected: {selectedStockItem.name}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3" placeholder="Batch Lot" />
                                    <input type="date" className="bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2"><span className="material-symbols-outlined text-primary">payments</span> Quantity & Cost</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="relative">
                                    <label className="block text-xs text-[#9cabba] mb-1">Qty Received</label>
                                    <input
                                        type="number"
                                        value={stockInQty}
                                        onChange={(e) => setStockInQty(e.target.value)}
                                        className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3 focus:border-primary outline-none"
                                        min="1"
                                    />
                                    <div className="text-xs text-primary mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">info</span> AI Suggests: +500</div>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#9cabba] mb-1">Unit Cost</label>
                                    <input
                                        type="number"
                                        value={stockInCost}
                                        onChange={(e) => setStockInCost(e.target.value)}
                                        className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3 focus:border-primary outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#9cabba] mb-1">Total Value</label>
                                    <div className="w-full bg-[#111418] border border-[#283039] text-gray-500 rounded-lg h-10 px-3 flex items-center justify-between cursor-not-allowed">
                                        <span>$ {((parseInt(stockInQty) || 0) * (parseFloat(stockInCost) || 0)).toFixed(2)}</span>
                                        <span className="material-symbols-outlined text-sm">lock</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button type="button" className="px-6 py-2 text-white hover:bg-white/5 rounded transition" onClick={() => {
                                setSelectedStockItem(null);
                                setStockInSearch('');
                                setStockInQty('');
                                setStockInCost('');
                                setStockInVendor('');
                                setStockInInvoice('');
                            }}>Cancel</button>
                            <button type="submit" className="px-8 py-2 bg-primary text-white font-bold rounded shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition" disabled={!selectedStockItem || !stockInQty}>
                                Confirm Stock In
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StockOperations;