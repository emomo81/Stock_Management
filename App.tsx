import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './screens/Dashboard';
import Inventory from './screens/Inventory';
import Analytics from './screens/Analytics';
import Admin from './screens/Admin';
import Auth from './screens/Auth';
import StockOperations from './screens/StockOperations';
import Users from './screens/Users';

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

    fetch('http://localhost:5001/api/health')
      .then(res => res.json())
      .then(data => console.log('Backend connection:', data))
      .catch(err => console.error('Backend connection detailed error:', err));
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuth(false);
    setCurrentView('dashboard');
  };

  if (!isAuth) {
    return <Auth currentView="login" setView={setCurrentView} setIsAuth={setIsAuth} />;
  }

  // Mobile Scanner View (Fullscreen, no layout)
  if (currentView === 'scanner') {
    return <Admin view={currentView} userRole={userRole} setView={setCurrentView} />;
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
              />
            </div>

            <div className="flex gap-3 relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative size-9 flex items-center justify-center rounded-full transition-colors ${showNotifications ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-[#101922]"></span>
              </button>
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
          {currentView === 'dashboard' && <Dashboard setView={setCurrentView} />}
          {currentView === 'users' && <Users />}

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