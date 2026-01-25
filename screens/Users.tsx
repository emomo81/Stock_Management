import React, { useState, useEffect } from 'react';

const Users: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('manager');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:5001/api/auth/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, password, name, role }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('User created successfully!');
                setEmail('');
                setPassword('');
                setName('');
            } else {
                setMessage(data.message || 'Error creating user');
            }
        } catch (err) {
            setMessage('Server error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent h-full">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Team Management</h1>
                    <p className="text-slate-400">Add new employees and manage access roles.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create User Form */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">person_add</span>
                            </div>
                            <h2 className="text-xl font-bold text-white">Add New Member</h2>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-[#1b2127]/50 border border-white/10 rounded-xl h-12 px-4 text-white focus:border-primary focus:bg-black/20 outline-none transition-all"
                                    placeholder="Jane Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-[#1b2127]/50 border border-white/10 rounded-xl h-12 px-4 text-white focus:border-primary focus:bg-black/20 outline-none transition-all"
                                    placeholder="jane@aims.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-[#1b2127]/50 border border-white/10 rounded-xl h-12 px-4 text-white focus:border-primary focus:bg-black/20 outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 ml-1">Role</label>
                                <select
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                    className="w-full bg-[#1b2127]/50 border border-white/10 rounded-xl h-12 px-4 text-white focus:border-primary focus:bg-black/20 outline-none transition-all appearance-none"
                                >
                                    <option value="manager">Manager</option>
                                    <option value="sales_agent">Sales Agent</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm text-center ${message.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-blue-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                            >
                                {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                Create Account
                            </button>
                        </form>
                    </div>

                    {/* Info Card */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4">Role Permissions</h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">Manager</h4>
                                        <p className="text-slate-400 text-xs">Full access to inventory, reports, and stock adjustments.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg">point_of_sale</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">Sales Agent</h4>
                                        <p className="text-slate-400 text-xs">Can create sales orders and view stock levels only.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-slate-500/20 text-slate-400 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg">person</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">Staff</h4>
                                        <p className="text-slate-400 text-xs">Read-only access to basic inventory view.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Users;
