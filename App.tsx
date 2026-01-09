import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './screens/Dashboard';
import Inventory from './screens/Inventory';
import Analytics from './screens/Analytics';
import Admin from './screens/Admin';
import Auth from './screens/Auth';
import StockOperations from './screens/StockOperations';

import { View, UserRole } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [isAuth, setIsAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!isAuth || currentView === 'login' || currentView === 'register') {
    return <Auth currentView={currentView as 'login' | 'register'} setView={setCurrentView} setIsAuth={setIsAuth} />;
  }

  // Mobile Scanner View (Fullscreen, no layout)
  if (currentView === 'scanner') {
    return <Admin view={currentView} userRole={userRole} setView={setCurrentView} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-white font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setView={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }}
        userRole={userRole}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 border-b border-white/5 bg-[#101922]/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4 text-slate-400">
            <button
              className="md:hidden p-1 -ml-2 text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="material-symbols-outlined cursor-pointer hover:text-white hidden md:block">menu</span>
            <div className="h-4 w-px bg-white/10 hidden md:block"></div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white font-medium capitalize">{currentView.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search */}
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">search</span>
              <input
                type="text"
                placeholder="Global Search..."
                className="bg-[#1e293b]/50 border border-white/10 rounded-full h-9 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-64 transition-all"
              />
            </div>

            {/* Role Switcher for Demo */}
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-[#1e293b] text-xs text-slate-300 border border-white/10 rounded px-2 py-1 outline-none hidden sm:block"
            >
              <option value="admin">View as: Admin</option>
              <option value="manager">View as: Manager</option>
              <option value="staff">View as: Staff</option>
            </select>

            <div className="flex gap-3 relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative size-9 flex items-center justify-center rounded-full transition-colors ${showNotifications ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-[#101922]"></span>
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-[#1b2127] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1b2127]">
                    <h3 className="font-bold text-white text-sm">Notifications</h3>
                    <span className="text-xs text-primary cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto bg-[#1b2127]">
                    {[
                      { id: 1, title: 'Low Stock Alert', message: 'Wireless Headphones (SKU-1000) is below threshold (5 units left).', time: '10m ago', type: 'critical' },
                      { id: 2, title: 'Stockout Risk', message: 'Smart Watch Series 5 is predicted to run out in 2 days.', time: '1h ago', type: 'warning' },
                      { id: 3, title: 'Restock Success', message: 'Received 500 units of Mechanical Keyboards.', time: '2h ago', type: 'success' },
                    ].map(alert => (
                      <div key={alert.id} className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer flex gap-3 transition-colors">
                        <div className={`mt-1 size-2 rounded-full shrink-0 ${alert.type === 'critical' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                        <div>
                          <p className="text-xs font-bold text-white mb-0.5">{alert.title}</p>
                          <p className="text-xs text-slate-400 leading-snug">{alert.message}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-white/5 bg-black/20">
                    <button className="text-xs text-slate-400 hover:text-white">View Activity Log</button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsAuth(false)}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white leading-none">Alex Morgan</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wide mt-1">{userRole}</p>
              </div>
              <img
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                alt="User"
                className="rounded-full size-9 ring-2 ring-primary/30 group-hover:ring-primary transition-all shadow-lg shadow-primary/10"
              />
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="flex-1 overflow-hidden relative">
          {currentView === 'dashboard' && <Dashboard setView={setCurrentView} />}
          {currentView === 'forecasting' && <Dashboard setView={setCurrentView} showForecasting={true} />}

          {(currentView === 'inventory' || currentView === 'families') &&
            <Inventory view={currentView} userRole={userRole} />
          }

          {(currentView === 'stock-in' || currentView === 'stock-out' || currentView === 'audit') &&
            <StockOperations view={currentView} />
          }

          {currentView === 'analytics' && <Analytics userRole={userRole} />}

          {(currentView === 'team' || currentView === 'export' || currentView === 'barcodes') &&
            <Admin view={currentView} userRole={userRole} setView={setCurrentView} />
          }
        </main>
      </div>
    </div>
  );
};

export default App;