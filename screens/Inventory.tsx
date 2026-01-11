import React, { useState, useMemo } from 'react';
import type { View, UserRole } from '../types';

interface InventoryProps {
    view: View;
    userRole: UserRole;
}

const INITIAL_INVENTORY = [
    { name: 'Wireless Headphones', sku: 'AUDIO-WH-1000', stock: 142, price: '$349.00', cat: 'Electronics', img: 'headphones' },
    { name: 'ErgoChair Pro', sku: 'FURN-EC-200', stock: 12, price: '$499.00', cat: 'Furniture', img: 'chair_alt' },
    { name: 'Mechanical Keyboard', sku: 'TECH-KB-RGB', stock: 850, price: '$129.00', cat: 'Peripherals', img: 'keyboard' },
    { name: 'Smart Watch Series 5', sku: 'WEAR-SW-005', stock: 0, price: '$399.00', cat: 'Wearables', img: 'watch' },
    { name: 'Gaming Mouse', sku: 'TECH-GM-500', stock: 45, price: '$89.00', cat: 'Peripherals', img: 'mouse' },
    { name: 'Office Desk', sku: 'FURN-OD-100', stock: 5, price: '$299.00', cat: 'Furniture', img: 'desk' },
    { name: 'USB-C Cable', sku: 'ACC-USB-001', stock: 200, price: '$19.00', cat: 'Electronics', img: 'cable' },
];

const MOCK_HISTORY = [
    { date: 'Today, 10:23 AM', action: 'Stock Adjustment', detail: '+50 units added via Stock In', user: 'Alex M.', type: 'stock' },
    { date: 'Oct 24, 2023', action: 'Price Update', detail: 'Price changed from $299 to $349', user: 'System AI', type: 'price' },
    { date: 'Sep 15, 2023', action: 'Category Change', detail: 'Moved from "Accessories" to "Electronics"', user: 'Sarah J.', type: 'edit' },
    { date: 'Aug 02, 2023', action: 'Product Created', detail: 'Initial SKU generation', user: 'Admin', type: 'system' },
];

const Inventory: React.FC<InventoryProps> = ({ view, userRole }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // const [showEngine, setShowEngine] = useState(false); // Kept existing state
    const [showEngine, setShowEngine] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        stock: 0,
        price: '',
        cat: 'Electronics',
        img: 'box',
        attributes: [] as { id: string, key: string, value: string }[]
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStock, setFilterStock] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    // Import Modal State
    const [showImport, setShowImport] = useState(false);
    const [importStep, setImportStep] = useState(1);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

    // Custom Category State
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const handleFileSelect = (file: File) => {
        setImportFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length === headers.length) {
                    const row: any = {};
                    headers.forEach((h, index) => {
                        row[h] = values[index];
                    });
                    data.push(row);
                }
            }

            setCsvHeaders(headers);
            setCsvData(data);

            // Auto mapping override explanation if needed: simplifying for demo
            const initialMapping: any = {};
            headers.forEach(h => {
                if (h.toLowerCase().includes('name')) initialMapping['name'] = h;
                if (h.toLowerCase().includes('sku')) initialMapping['sku'] = h;
                if (h.toLowerCase().includes('stock')) initialMapping['stock'] = h;
                if (h.toLowerCase().includes('price')) initialMapping['price'] = h;
                if (h.toLowerCase().includes('cat')) initialMapping['cat'] = h;
            });
            setColumnMapping(initialMapping);

            setImportStep(2);
        };
        reader.readAsText(file);
    };

    const handleImportSubmit = async () => {
        try {
            const payload = csvData.map(row => ({
                name: row[columnMapping['name'] || ''] || 'Unknown Product',
                sku: row[columnMapping['sku'] || ''] || `GEN-${Math.floor(Math.random() * 1000)}`,
                stock: parseInt(row[columnMapping['stock'] || '']) || 0,
                price: row[columnMapping['price'] || ''] || '$0.00',
                cat: row[columnMapping['cat'] || ''] || 'Uncategorized',
                img: 'box'
            }));

            const res = await fetch('http://localhost:5001/api/inventory/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setImportStep(3);
                fetchItems();
            } else {
                alert('Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Import failed');
        }
    };

    // QR Modal State
    const [showQR, setShowQR] = useState(false);

    React.useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/inventory');
            const data = await res.json();
            setItems(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await fetch(`http://localhost:5001/api/inventory/${id}`, { method: 'DELETE' });
            fetchItems();
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    const handleSave = async () => {
        try {
            if (selectedItem) {
                // Update
                await fetch(`http://localhost:5001/api/inventory/${selectedItem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        attributes: formData.attributes.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
                    })
                });
            } else {
                // Create
                await fetch('http://localhost:5001/api/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        attributes: formData.attributes.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
                    })
                });
            }
            setShowEngine(false);
            fetchItems();
        } catch (error) {
            console.error('Failed to save item:', error);
        }
    };

    const handleAddField = () => {
        setFormData({
            ...formData,
            attributes: [
                ...formData.attributes,
                { id: Math.random().toString(36).substr(2, 9), key: 'New Field', value: '' }
            ]
        });
    };

    const handleRemoveField = (id: string) => {
        setFormData({
            ...formData,
            attributes: formData.attributes.filter(attr => attr.id !== id)
        });
    };

    const handleAttributeChange = (id: string, field: 'key' | 'value', newValue: string) => {
        setFormData({
            ...formData,
            attributes: formData.attributes.map(attr =>
                attr.id === id ? { ...attr, [field]: newValue } : attr
            )
        });
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesStock = true;
            if (filterStock === 'low') matchesStock = item.stock < 20 && item.stock > 0;
            if (filterStock === 'out') matchesStock = item.stock === 0;
            if (filterStock === 'in') matchesStock = item.stock >= 20;

            let matchesCategory = true;
            if (filterCategory !== 'all') matchesCategory = item.cat === filterCategory;

            return matchesSearch && matchesStock && matchesCategory;
        });
    }, [items, searchQuery, filterStock, filterCategory]);

    const categories = ['all', ...Array.from(new Set(items.map((item: any) => item.cat))) as string[]];
    // Dynamic categories for the engine dropdown (unique categories from items)
    const uniqueCategories = Array.from(new Set(items.map((item: any) => item.cat))).filter(Boolean).sort() as string[];

    const handleEditClick = (item: any) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            sku: item.sku,
            stock: item.stock,
            price: item.price,
            cat: item.cat,
            img: item.img || 'box',
            attributes: item.attributes ? Object.entries(item.attributes).map(([key, value]) => ({
                id: Math.random().toString(36).substr(2, 9),
                key,
                value: value as string
            })) : []
        });
        setShowEngine(true);
    };

    const handleQRClick = (item: typeof INITIAL_INVENTORY[0]) => {
        setSelectedItem(item);
        setShowQR(true);
    };

    const handleAddClick = () => {
        setSelectedItem(null);
        setFormData({
            name: '',
            sku: '',
            stock: 0,
            price: '',
            cat: 'Electronics',
            img: 'box',
            attributes: []
        });
        setShowEngine(true);
    };

    // If viewing Product Families
    if (view === 'families') {
        return (
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Left List */}
                <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Inventory & Families</h2>
                            <p className="text-slate-400 text-sm">Drag products to assign families.</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm text-white border border-white/5">Filter</button>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
                        <button className="bg-primary text-white px-4 py-1 rounded-full text-sm whitespace-nowrap">All Items</button>
                        <button className="bg-white/5 text-slate-400 px-4 py-1 rounded-full text-sm whitespace-nowrap">Unassigned (12)</button>
                    </div>

                    <div className="flex-1 overflow-auto glass-panel rounded-xl">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-white/5 text-slate-400 font-semibold sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 w-10"></th>
                                    <th className="p-4">Product Name</th>
                                    <th className="p-4">SKU</th>
                                    <th className="p-4">Family</th>
                                    <th className="p-4 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[
                                    { name: 'Classic Cotton T-Shirt', sku: 'TS-001', family: null, price: '$15.00' },
                                    { name: 'V-Neck Tee', sku: 'TS-002', family: null, price: '$18.00' },
                                    { name: 'Ceramic Coffee Mug', sku: 'MG-101', family: 'Mugs', price: '$8.00' },
                                    { name: 'Zip-up Hoodie', sku: 'HD-055', family: null, price: '$45.00' },
                                    { name: 'Graphic Tee', sku: 'TS-003', family: null, price: '$22.00' },
                                ].map((item, i) => (
                                    <tr key={i} className="hover:bg-white/5 group cursor-move">
                                        <td className="p-4"><span className="material-symbols-outlined text-slate-600 group-hover:text-white cursor-grab">drag_indicator</span></td>
                                        <td className="p-4 text-white font-medium">{item.name}</td>
                                        <td className="p-4 text-slate-400 font-mono text-xs">{item.sku}</td>
                                        <td className="p-4">
                                            {item.family ? (
                                                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs border border-blue-500/20">{item.family}</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded bg-white/5 text-slate-500 text-xs border border-white/5 border-dashed">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-white">{item.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Sidebar (Families) */}
                <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-white/10 bg-[#111418]/80 backdrop-blur-xl p-6 flex flex-col gap-4 overflow-y-auto max-h-[40vh] lg:max-h-full">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-bold text-lg">Product Families</h3>
                        <button className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-outlined">add</span></button>
                    </div>

                    {/* Family Card */}
                    <div className="glass-panel p-4 rounded-xl group hover:border-primary/50 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span className="material-symbols-outlined">checkroom</span>
                            </div>
                            <div>
                                <h4 className="text-white font-bold">T-Shirts</h4>
                                <p className="text-xs text-slate-400">12 Items • Spring Collection</p>
                            </div>
                        </div>
                        <div className="bg-black/20 rounded p-2 mb-2">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Inherited Attributes</p>
                            <div className="flex gap-2">
                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300">Size</span>
                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300">Material</span>
                            </div>
                        </div>
                        <div className="border border-dashed border-white/10 rounded-lg p-2 text-center text-xs text-slate-500 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                            Drop items here
                        </div>
                    </div>

                    <div className="glass-panel p-4 rounded-xl group hover:border-primary/50 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <span className="material-symbols-outlined">local_cafe</span>
                            </div>
                            <div>
                                <h4 className="text-white font-bold">Mugs</h4>
                                <p className="text-xs text-slate-400">5 Items • Accessories</p>
                            </div>
                        </div>
                        <div className="border border-dashed border-white/10 rounded-lg p-2 text-center text-xs text-slate-500 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                            Drop items here
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Standard Inventory View
    return (
        <div className="flex h-full relative">
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                {/* Toolbar */}
                <div className="glass-panel p-4 rounded-xl mb-6 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                            <input
                                className="w-full bg-[#101922] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-primary outline-none"
                                placeholder="Search SKU, Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${showFilters ? 'bg-primary/10 border-primary text-primary' : 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">filter_list</span> Filters
                            </button>
                            {userRole !== 'staff' && (
                                <>
                                    <button
                                        onClick={() => { setShowImport(true); setImportStep(1); }}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">upload_file</span> <span className="hidden sm:inline">Import</span>
                                    </button>
                                    <button onClick={handleAddClick} className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">add</span> <span className="hidden md:inline">Add Product</span><span className="md:hidden">Add</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Stock Level</label>
                                <select
                                    value={filterStock}
                                    onChange={(e) => setFilterStock(e.target.value)}
                                    className="w-full bg-[#101922] border border-white/10 text-white text-sm rounded-lg p-2.5 outline-none focus:border-primary"
                                >
                                    <option value="all">All Levels</option>
                                    <option value="low">Low Stock (&lt; 20)</option>
                                    <option value="out">Out of Stock (0)</option>
                                    <option value="in">In Stock (20+)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Category</label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full bg-[#101922] border border-white/10 text-white text-sm rounded-lg p-2.5 outline-none focus:border-primary"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => { setFilterStock('all'); setFilterCategory('all'); setSearchQuery(''); }}
                                    className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-1 py-2.5"
                                >
                                    <span className="material-symbols-outlined text-[16px]">restart_alt</span> Reset Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto glass-panel rounded-xl shadow-2xl">
                    <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                        <thead className="bg-white/5 sticky top-0 backdrop-blur-md z-10 text-slate-400">
                            <tr>
                                <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded bg-transparent border-white/20 text-primary focus:ring-0" /></th>
                                <th className="p-4">Product</th>
                                <th className="p-4">SKU</th>
                                <th className="p-4">Stock</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item, i) => (
                                    <tr key={i} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-center"><input type="checkbox" className="rounded bg-transparent border-white/20 text-primary focus:ring-0" /></td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                                    <span className="material-symbols-outlined text-slate-400">{item.img}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{item.name}</p>
                                                    {item.stock < 20 && item.stock > 0 && <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1.5 rounded border border-orange-500/20">Low Stock</span>}
                                                    {item.stock === 0 && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 rounded border border-red-500/20">Out of Stock</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300 font-mono text-xs">{item.sku}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${item.stock === 0 ? 'bg-transparent' : item.stock < 20 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: item.stock === 0 ? '0%' : item.stock < 20 ? '15%' : '80%' }}></div>
                                                </div>
                                                <span className={`text-xs ${item.stock === 0 ? 'text-slate-500' : item.stock < 20 ? 'text-orange-400' : 'text-emerald-400'}`}>{item.stock}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-white font-medium">{item.price}</td>
                                        <td className="p-4"><span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">{item.cat}</span></td>
                                        <td className="p-4 text-right">
                                            {userRole !== 'staff' && (
                                                <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleQRClick(item)} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Generate QR">
                                                        <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                                                    </button>
                                                    <button onClick={() => handleEditClick(item)} className="p-2 hover:bg-primary/10 rounded text-primary hover:text-white"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl opacity-50">search_off</span>
                                            <p>No items found matching your filters.</p>
                                            <button onClick={() => { setFilterStock('all'); setFilterCategory('all'); setSearchQuery(''); }} className="text-primary text-sm hover:underline mt-2">Clear Filters</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Inventory Engine Sidebar (Manager/Admin Only) */}
            {showEngine && userRole !== 'staff' && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[450px] border-l border-white/10 glass-panel flex flex-col shadow-2xl z-30 animate-in slide-in-from-right duration-300 bg-[#101922]">
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-white/[0.05] to-transparent">
                        <div className="flex items-center gap-2">
                            <span className="bg-primary/20 p-1.5 rounded text-primary material-symbols-outlined text-[20px]">{selectedItem ? 'edit_note' : 'construction'}</span>
                            <h3 className="font-bold text-white text-lg">{selectedItem ? 'Edit Product' : 'Inventory Engine'}</h3>
                        </div>
                        <button onClick={() => setShowEngine(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <div className="p-5 overflow-y-auto flex-1 space-y-6">
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary"></span> Core Identity</p>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Product Name</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#101922] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                    placeholder="e.g. SuperFast Laptop"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">SKU</label>
                                    <input
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full bg-[#101922] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                        placeholder="AUTO-GEN"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">Stock</label>
                                    <input
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-[#101922] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                        type="number"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Price</label>
                                <input
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full bg-[#101922] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                    type="text"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Category</label>
                                {isCustomCategory ? (
                                    <div className="flex gap-2">
                                        <input
                                            value={formData.cat}
                                            onChange={(e) => setFormData({ ...formData, cat: e.target.value })}
                                            className="flex-1 bg-[#101922] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                            placeholder="Enter new category"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => setIsCustomCategory(false)}
                                            className="p-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                                            title="Cancel custom category"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={formData.cat}
                                        onChange={(e) => {
                                            if (e.target.value === '__NEW__') {
                                                setIsCustomCategory(true);
                                                setFormData({ ...formData, cat: '' });
                                            } else {
                                                setFormData({ ...formData, cat: e.target.value });
                                            }
                                        }}
                                        className="w-full bg-[#101922] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                    >
                                        {uniqueCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option disabled>──────────</option>
                                        <option value="__NEW__">+ Create New Category...</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-white/5"></div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><span className="size-1.5 rounded-full bg-purple-400"></span> Custom Attributes</p>
                                <button onClick={handleAddField} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 flex items-center gap-1 hover:bg-primary/20"><span className="material-symbols-outlined text-[12px]">add</span> ADD FIELD</button>
                            </div>

                            {/* Dynamic Fields */}
                            {formData.attributes.map((attr) => (
                                <div key={attr.id} className="bg-white/[0.02] border border-white/5 rounded-lg p-3 relative group hover:border-white/10">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="material-symbols-outlined text-[14px] text-primary">list</span>
                                        <input
                                            value={attr.key}
                                            onChange={(e) => handleAttributeChange(attr.id, 'key', e.target.value)}
                                            className="bg-transparent text-xs text-primary font-mono outline-none border-b border-transparent focus:border-primary/50 w-full"
                                            placeholder="Field Name"
                                        />
                                    </div>
                                    <input
                                        value={attr.value}
                                        onChange={(e) => handleAttributeChange(attr.id, 'value', e.target.value)}
                                        className="w-full bg-[#101922] border border-white/10 rounded-md p-2 text-sm text-slate-300 outline-none focus:border-primary"
                                        placeholder="Value"
                                    />
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1">
                                        <button onClick={() => handleRemoveField(attr.id)} className="text-slate-500 hover:text-red-400"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* History Log Section */}
                        {selectedItem && (
                            <div className="mt-6 border-t border-white/5 pt-6 animate-in fade-in slide-in-from-bottom-2">
                                <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400">history</span> Activity Log
                                </h4>
                                <div className="relative pl-2 border-l border-white/10 space-y-8 ml-1.5">
                                    {MOCK_HISTORY.map((log, idx) => (
                                        <div key={idx} className="relative pl-6 group">
                                            <div className={`absolute -left-[5px] top-1 size-2.5 rounded-full border-2 border-[#101922] ${log.type === 'stock' ? 'bg-emerald-500' :
                                                log.type === 'price' ? 'bg-blue-500' :
                                                    log.type === 'system' ? 'bg-purple-500' : 'bg-slate-500'
                                                }`}></div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-start">
                                                    <span className={`text-xs font-bold ${log.type === 'stock' ? 'text-emerald-400' :
                                                        log.type === 'price' ? 'text-blue-400' :
                                                            'text-white'
                                                        }`}>{log.action}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">{log.date}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-snug">{log.detail}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="material-symbols-outlined text-[12px] text-slate-600">person</span>
                                                    <span className="text-[10px] text-slate-500">{log.user}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-5 border-t border-white/10 bg-[#101922]/50 flex gap-3 pb-8 md:pb-5">
                        <button onClick={() => setShowEngine(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-300 font-medium text-sm hover:bg-white/5">Cancel</button>
                        <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20">Save Changes</button>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#101922] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#1b2127]">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">upload_file</span> Import Inventory
                            </h3>
                            <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        {/* Step 1: Upload */}
                        {importStep === 1 && (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <div
                                    className="w-full h-48 border-2 border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group relative"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file) handleFileSelect(file);
                                    }}
                                >
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                                        }}
                                    />
                                    <div className="size-16 rounded-full bg-[#101922] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary">cloud_upload</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Click to upload or drag and drop</p>
                                        <p className="text-slate-500 text-sm mt-1">CSV (max 10MB)</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-6 w-full">
                                    <button className="flex-1 py-2 rounded-lg text-slate-400 text-sm hover:text-white font-medium">Download Template</button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Mapping / Preview */}
                        {importStep === 2 && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-5 overflow-y-auto space-y-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                                        <div>
                                            <p className="text-white text-sm font-bold">{importFile?.name}</p>
                                            <p className="text-emerald-400 text-xs">File uploaded successfully • {csvData.length} Rows</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-bold text-sm mb-3">Map Columns</h4>
                                        <div className="space-y-2">
                                            {[
                                                { sys: 'name', label: 'Product Name' },
                                                { sys: 'sku', label: 'SKU' },
                                                { sys: 'stock', label: 'Stock Quantity' },
                                                { sys: 'price', label: 'Price' },
                                                { sys: 'cat', label: 'Category' },
                                            ].map((field, i) => (
                                                <div key={i} className="grid grid-cols-12 gap-4 items-center">
                                                    <div className="col-span-4 text-sm text-slate-400">{field.label}</div>
                                                    <div className="col-span-1 flex justify-center"><span className="material-symbols-outlined text-slate-600 text-sm">arrow_right_alt</span></div>
                                                    <div className="col-span-7">
                                                        <select
                                                            className="w-full bg-[#101922] border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-primary"
                                                            value={columnMapping[field.sys] || ''}
                                                            onChange={(e) => setColumnMapping({ ...columnMapping, [field.sys]: e.target.value })}
                                                        >
                                                            <option value="">-- Select Column --</option>
                                                            {csvHeaders.map(h => (
                                                                <option key={h} value={h}>{h}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 border-t border-white/10 bg-[#1b2127] flex justify-end gap-3">
                                    <button onClick={() => setImportStep(1)} className="px-4 py-2 text-slate-300 hover:text-white text-sm">Back</button>
                                    <button onClick={handleImportSubmit} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
                                        Import {csvData.length} Items
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Success */}
                        {importStep === 3 && (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <div className="size-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                                    <span className="material-symbols-outlined text-4xl text-emerald-500">check</span>
                                </div>
                                <h3 className="text-white text-xl font-bold mb-2">Import Successful</h3>
                                <p className="text-slate-400 max-w-xs mb-8">24 new items have been added to your inventory. 3 duplicates were skipped.</p>
                                <button onClick={() => setShowImport(false)} className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-bold transition-all">Done</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQR && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#101922] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500"></div>
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1b2127]">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">qr_code_2</span> Product QR
                            </h3>
                            <button onClick={() => setShowQR(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="p-4 bg-white rounded-xl shadow-lg mb-6">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=AIMS:${selectedItem.sku}`}
                                    alt={`QR for ${selectedItem.name}`}
                                    className="size-40"
                                />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-1">{selectedItem.name}</h4>
                            <p className="text-slate-400 text-xs font-mono mb-6 bg-white/5 px-2 py-1 rounded">{selectedItem.sku}</p>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-all">
                                    <span className="material-symbols-outlined text-[18px]">download</span> Save
                                </button>
                                <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                                    <span className="material-symbols-outlined text-[18px]">print</span> Print Label
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;