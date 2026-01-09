import React, { useState } from 'react';
import { View } from '../App';

interface StockOperationsProps {
  view: View;
}

const StockOperations: React.FC<StockOperationsProps> = ({ view }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [cart, setCart] = useState<{name: string, sku: string, qty: number, price: number}[]>([
      { name: 'Wireless Headphones', sku: 'AUDIO-WH-1000', qty: 2, price: 349.00 }
  ]);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const addItemToCart = () => {
      setCart([...cart, { name: 'Smart Watch Series 5', sku: 'WEAR-SW-005', qty: 1, price: 399.00 }]);
      setIsAddingItem(false);
  };

  const handleCheckout = (e: React.FormEvent) => {
      e.preventDefault();
      setShowInvoice(true);
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  if (view === 'stock-out') {
      return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#101922]">
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
                                    <button type="button" onClick={() => addItemToCart()} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">add</span> Add Item
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg group">
                                            <div className="size-10 bg-black/20 rounded flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-outlined">inventory_2</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-medium">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.sku}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-slate-400">Qty</span>
                                                    <span className="text-white font-mono">{item.qty}</span>
                                                </div>
                                                <div className="flex flex-col items-end w-20">
                                                    <span className="text-xs text-slate-400">Price</span>
                                                    <span className="text-white font-mono">${item.price}</span>
                                                </div>
                                                <button type="button" onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-400">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
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

                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined">check_circle</span> Complete Order
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
            </div>

            {/* Invoice Modal */}
            {showInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div id="invoice-modal" className="bg-white text-slate-900 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Print Toolbar */}
                        <div className="bg-slate-100 p-3 border-b border-slate-200 flex justify-between items-center print:hidden">
                            <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-600">check_circle</span> Order Created Successfully
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded flex items-center gap-1 hover:bg-slate-700">
                                    <span className="material-symbols-outlined text-sm">print</span> Print
                                </button>
                                <button onClick={() => setShowInvoice(false)} className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-300">
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
            )}
        </div>
      );
  }
  
  if (view === 'audit') {
    return (
      <div className="flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Left List */}
        <div className="w-full lg:w-2/3 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-[#101922]/90 h-1/2 lg:h-full">
            <div className="p-4 lg:p-6 border-b border-white/10">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl lg:text-2xl font-bold text-white">Zone 3 Audit</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-yellow-500 font-bold uppercase">Audit Active</span>
                    </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{width: '12%'}}></div>
                </div>
                <p className="text-xs text-slate-400 mt-1 text-right">12/450 items counted</p>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-2">
                <div className="bg-primary/10 border-l-4 border-l-primary p-4 rounded-r-lg cursor-pointer">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="size-10 bg-slate-800 rounded flex items-center justify-center text-slate-500"><span className="material-symbols-outlined">laptop_mac</span></div>
                            <div>
                                <h4 className="text-white font-bold">MacBook Pro 16"</h4>
                                <p className="text-xs text-primary font-mono">SKU: MB-PRO-16-SPACE</p>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/20">Reviewing</span>
                    </div>
                </div>

                <div className="hover:bg-white/5 p-4 rounded-lg cursor-pointer border border-transparent hover:border-white/5 transition-all">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="size-10 bg-slate-800 rounded flex items-center justify-center text-slate-500"><span className="material-symbols-outlined">mouse</span></div>
                            <div>
                                <h4 className="text-slate-200 font-medium">Ergo Mouse</h4>
                                <p className="text-xs text-slate-500 font-mono">SKU: EM-299</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-xs">System: 120</p>
                            <p className="text-red-400 font-bold font-mono">118 (-2)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Detail Panel */}
        <div className="w-full lg:w-1/3 bg-[#0f172a] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col relative z-20 shadow-2xl h-1/2 lg:h-full overflow-y-auto">
            {/* AI Warning Banner */}
            <div className="bg-blue-900/30 border-b border-blue-500/20 p-4 flex gap-3 sticky top-0 backdrop-blur-md z-10">
                <span className="material-symbols-outlined text-blue-400 text-sm mt-0.5">auto_awesome</span>
                <div>
                    <h4 className="text-blue-100 text-xs font-bold">AI Insight Detected</h4>
                    <p className="text-blue-200/70 text-[10px] leading-relaxed">High discrepancy rates detected in Aisle 4. Check returns bin.</p>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
                <div className="aspect-video bg-slate-800 rounded-lg w-full relative overflow-hidden group shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600">Product Image</div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-center text-xs text-white">MacBook Pro 16"</div>
                </div>

                <div className="glass-panel p-4 rounded-xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity Verification</h3>
                    <div className="flex items-center justify-between">
                        <div className="text-center">
                            <p className="text-xs text-slate-500">System</p>
                            <p className="text-2xl font-mono font-bold text-slate-300">50</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-600">arrow_right_alt</span>
                        <div className="text-center">
                            <p className="text-xs text-slate-500">Physical</p>
                            <input className="bg-slate-800 text-white text-2xl font-mono font-bold w-20 text-center rounded p-1 border border-slate-600 focus:border-primary outline-none" defaultValue="48" />
                        </div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-2 flex justify-between items-center text-red-300 text-sm">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">trending_down</span> Discrepancy</span>
                        <span className="font-mono font-bold">-2 Units</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-slate-400">Reason Code</label>
                    <select className="w-full bg-[#1b2127] border border-white/10 rounded text-sm text-white p-2">
                        <option>Data Entry Error</option>
                        <option>Theft / Loss</option>
                        <option>Damaged</option>
                    </select>
                </div>
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2 bg-[#0f172a] sticky bottom-0">
                <button className="flex-1 py-3 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition">Skip</button>
                <button className="flex-[2] py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-lg">Confirm</button>
            </div>
        </div>
      </div>
    )
  }

  // Stock In View
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#101922]">
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

            <div className="glass-panel p-4 md:p-8 rounded-xl border border-white/10 shadow-2xl">
                <form className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2"><span className="material-symbols-outlined text-primary">local_shipping</span> Source Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs text-[#9cabba] mb-1">Select Vendor</label>
                                <select className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3"><option>TechSupplies Global</option></select>
                            </div>
                            <div>
                                <label className="block text-xs text-[#9cabba] mb-1">Invoice #</label>
                                <input className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3" placeholder="INV-2023-001" />
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
                                <input className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3 pl-10" placeholder="Search..." />
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
                                <input type="number" className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3" />
                                <div className="text-xs text-primary mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">info</span> AI Suggests: +500</div>
                            </div>
                            <div>
                                <label className="block text-xs text-[#9cabba] mb-1">Unit Cost</label>
                                <input type="number" className="w-full bg-[#1b2127] border border-[#3b4754] text-white rounded-lg h-10 px-3" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs text-[#9cabba] mb-1">Total Value</label>
                                <div className="w-full bg-[#111418] border border-[#283039] text-gray-500 rounded-lg h-10 px-3 flex items-center justify-between cursor-not-allowed">
                                    <span>$ 0.00</span>
                                    <span className="material-symbols-outlined text-sm">lock</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button className="px-6 py-2 text-white hover:bg-white/5 rounded">Cancel</button>
                        <button className="px-8 py-2 bg-primary text-white font-bold rounded shadow-lg hover:bg-primary/90">Confirm Stock In</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default StockOperations;