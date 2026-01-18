import React, { useState } from 'react';
import type { View, UserRole } from '../types';

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
                                        {['All Products', 'Transaction Logs', 'Low Stock', 'Profit Reports'].map(label => (
                                            <label key={label} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-[#283039]/50 hover:bg-[#283039] hover:border-primary/50 cursor-pointer transition-all">
                                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-transparent border-slate-500 text-primary focus:ring-0" />
                                                <span className="text-sm font-medium text-white">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-[#9cabba] uppercase tracking-wider mb-3 block">Format</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="format" defaultChecked className="text-primary focus:ring-0 bg-transparent" />
                                            <span className="text-white text-sm">CSV (Spreadsheet)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="format" className="text-primary focus:ring-0 bg-transparent" />
                                            <span className="text-white text-sm">JSON (Raw Data)</span>
                                        </label>
                                    </div>
                                </div>

                                <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-[0_0_20px_rgba(25,133,240,0.3)] flex items-center justify-center gap-2 mt-4">
                                    <span className="material-symbols-outlined">download</span> Generate Export
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
                                <table className="w-full text-left text-sm text-[#9cabba] min-w-[300px]">
                                    <thead className="bg-white/5 text-xs uppercase font-semibold text-white">
                                        <tr>
                                            <th className="px-6 py-3">File</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr className="hover:bg-white/5">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-green-500/20 flex items-center justify-center text-green-400"><span className="material-symbols-outlined text-sm">csv</span></div>
                                                <span className="text-white">inv_full.csv</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs">Oct 24, 2023</td>
                                            <td className="px-6 py-4 text-right"><span className="material-symbols-outlined text-white hover:text-primary cursor-pointer">download</span></td>
                                        </tr>
                                        <tr className="hover:bg-white/5 bg-blue-500/5">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-sm animate-spin">sync</span></div>
                                                <span className="text-white">profit_loss.csv</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs">Processing...</td>
                                            <td className="px-6 py-4 text-right"><span className="text-white/30 cursor-not-allowed material-symbols-outlined">download</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Mobile Barcode Scanner View (Simulated)
    if (view === 'scanner') {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
                {/* Camera Feed Simulation */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop')] bg-cover opacity-60"></div>

                {/* UI Overlay */}
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-6">
                    <div className="flex justify-between items-center">
                        <button onClick={() => setView('dashboard')} className="size-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"><span className="material-symbols-outlined">close</span></button>
                        <div className="bg-black/50 backdrop-blur-md px-4 py-1 rounded-full text-white text-sm font-medium">Scan Item</div>
                        <button className="size-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"><span className="material-symbols-outlined">flash_on</span></button>
                    </div>

                    {/* Scan Frame */}
                    <div className="relative w-64 h-64 mx-auto border-2 border-primary/50 rounded-2xl flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary -mt-1 -ml-1 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary -mt-1 -mr-1 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary -mb-1 -ml-1 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary -mb-1 -mr-1 rounded-br-lg"></div>
                        <div className="w-full h-0.5 bg-primary absolute top-1/2 shadow-[0_0_10px_rgba(25,133,240,0.8)] animate-pulse"></div>
                    </div>

                    {/* Bottom Card */}
                    <div className="glass-panel p-4 rounded-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="flex gap-4 items-center">
                            <div className="size-16 bg-white/10 rounded-lg flex-none"></div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold truncate">Steel Ball Bearings</h4>
                                <p className="text-primary text-xs font-mono">UPC: 88349-112</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button className="bg-primary text-white p-2 rounded-lg flex items-center gap-1 text-xs font-bold"><span className="material-symbols-outlined text-sm">add</span> Stock</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Barcode Management
    if (view === 'barcodes') {
        return (
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#101322] flex flex-col lg:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black text-white">Barcode Management</h2>

                    {/* List of items */}
                    <div className="glass-panel rounded-xl flex-1 overflow-auto">
                        <table className="w-full text-left text-sm text-[#9da1b9] min-w-[600px]">
                            <thead className="bg-[#1b2127] text-xs uppercase text-white font-semibold sticky top-0">
                                <tr>
                                    <th className="p-4">Product</th>
                                    <th className="p-4">Code Type</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="hover:bg-white/5 cursor-pointer bg-primary/10 border-l-2 border-primary">
                                    <td className="p-4 text-white font-medium">Mechanical Keyboard K95</td>
                                    <td className="p-4 text-xs text-orange-400 flex items-center gap-1"><span className="material-symbols-outlined text-sm">warning</span> Missing</td>
                                    <td className="p-4"><span className="bg-orange-500/10 text-orange-400 px-2 py-1 rounded text-xs">Unassigned</span></td>
                                    <td className="p-4 text-right text-primary font-bold text-xs hover:underline">Generate</td>
                                </tr>
                                <tr className="hover:bg-white/5">
                                    <td className="p-4 text-white font-medium">Wireless Mouse M305</td>
                                    <td className="p-4 text-xs text-white flex items-center gap-1"><span className="material-symbols-outlined text-sm text-primary">qr_code_2</span> Internal QR</td>
                                    <td className="p-4"><span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs">Active</span></td>
                                    <td className="p-4 text-right text-slate-400 hover:text-white"><span className="material-symbols-outlined text-sm">print</span></td>
                                </tr>
                            </tbody>
                        </table>
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
                        <div className="flex gap-4 items-center p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="size-12 bg-black/40 rounded flex-none"></div>
                            <div>
                                <p className="text-xs text-[#9da1b9] uppercase font-bold">Selected</p>
                                <p className="text-white font-bold">Mechanical Keyboard K95</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[#9da1b9] mb-2">Encoded Data</label>
                                <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono" value="https://aims.app/i/MK-95-RGB" readOnly />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-[#9da1b9] mb-2">Size</label>
                                    <select className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white"><option>Medium (4x4)</option></select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#9da1b9] mb-2">Correction</label>
                                    <select className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white"><option>Medium (15%)</option></select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto bg-white rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-2xl">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AIMS-MK-95-RGB" alt="QR" className="size-32 mb-2" />
                            <p className="text-black font-mono font-bold text-xs">MK-95-RGB</p>
                        </div>

                        <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg">Save & Print Label</button>
                    </div>
                </div>
            </div>
        )
    }

    return <div>Select a view from the sidebar</div>;
};

export default Admin;