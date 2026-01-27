import React, { useState } from 'react';
import { API_URL } from './config';
import Sidebar from './components/Sidebar';
import Dashboard from './screens/Dashboard';
import Inventory from './screens/Inventory';
import Analytics from './screens/Analytics';
import Admin from './screens/Admin';
import Auth from './screens/Auth';
import StockOperations from './screens/StockOperations';
import Users from './screens/Users';
import FloatingLines from './components/FloatingLines';

import { View, UserRole } from './types';
// stock managment system
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [isAuth, setIsAuth] = useState(false);

  React.useEffect(() => {
    // Check local storage for auth
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setIsAuth(true);
      const userData = JSON.parse(savedUser);
      setUserRole(userData.role);
    }

    fetch(`${API_URL}/api/health`)
      .then(res => res.json())
      .then(data => console.log('Backend connection:', data))
      .catch(err => console.error('Backend connection detailed error:', err));
  }, []);

  const [viewParams, setViewParams] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ icon: string, color: string, bg: string, title: string, desc: string, time: string }>>([]);

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuth(false);
    setCurrentView('dashboard');
    setViewParams(null);
  };

  const handleSetView = (view: View, params?: any) => {
    setCurrentView(view);
    setViewParams(params || null);
    setIsSidebarOpen(false);
  };

  if (!isAuth) {
    return <Auth currentView="login" setView={handleSetView} setIsAuth={setIsAuth} />;
  }

  // Mobile Scanner View (Fullscreen, no layout)
  if (currentView === 'scanner') {
    return <Admin view={currentView} userRole={userRole} setView={handleSetView} />;
  }
  // v
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
        setView={handleSetView}
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
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white font-medium capitalize">{currentView ? currentView.replace('-', ' ') : 'Dashboard'}</span>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim()) {
                      handleSetView('inventory', { search: target.value });
                      target.value = ''; // Clear after search
                    }
                  }
                }}
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative size-9 flex items-center justify-center rounded-full transition-colors ${showNotifications ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-[#101922]"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#101922]">
                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                    {notifications.length > 0 && (
                      <button onClick={handleClearNotifications} className="text-[10px] text-primary hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif, i) => (
                        <div key={i} className="p-3 hover:bg-white/5 border-b border-white/5 last:border-0 cursor-pointer flex gap-3 transition-colors">
                          <div className={`size-8 rounded-lg ${notif.bg} flex items-center justify-center shrink-0`}>
                            <span className={`material-symbols-outlined text-[18px] ${notif.color}`}>{notif.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{notif.title}</p>
                            <p className="text-xs text-slate-400">{notif.desc}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-[#101922] text-center">
                    <button className="text-xs text-slate-400 hover:text-white transition-colors">View All Activity</button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleLogout}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white leading-none">Sign Out</p>
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
          <div className="absolute inset-0 z-0 pointer-events-auto">
            <FloatingLines
              enabledWaves={["top", "middle", "bottom"]}
              lineCount={5}
              lineDistance={5}
              bendRadius={5}
              bendStrength={-0.5}
              interactive={true}
              parallax={true}
            />
          </div>

          <div className="relative z-10 w-full h-full flex flex-col">
            {currentView === 'dashboard' && <Dashboard setView={handleSetView} />}
            {currentView === 'forecasting' && <Dashboard setView={handleSetView} showForecasting={true} />}
            {currentView === 'users' && <Users />}

            {(currentView === 'inventory' || currentView === 'families') &&
              <Inventory view={currentView} userRole={userRole} initialFilter={viewParams?.filter} initialSearch={viewParams?.search} />
            }

            {(currentView === 'stock-in' || currentView === 'stock-out' || currentView === 'audit') &&
              <StockOperations view={currentView} addNotification={(n) => setNotifications(prev => [n, ...prev])} />
            }

            {currentView === 'analytics' && <Analytics userRole={userRole} />}

            {(currentView === 'team' || currentView === 'export' || currentView === 'barcodes') &&
              <Admin view={currentView} userRole={userRole} setView={handleSetView} />
            }
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;