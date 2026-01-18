import React from 'react';
import type { View, UserRole } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, userRole, isOpen, onClose }) => {
  const NavItem = ({ view, icon, label, isNew = false }: { view: View, icon: string, label: string, isNew?: boolean }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setView(view)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all group relative ${isActive
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(25,133,240,0.15)]'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
      >
        <span className={`material-symbols-outlined ${isActive ? 'fill-1' : ''}`}>{icon}</span>
        <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
        {isNew && (
          <span className="ml-auto bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20">
            NEW
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#101922]/95 backdrop-blur-xl border-r border-white/5 
        transition-transform duration-300 ease-in-out flex flex-col
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-indigo-600 aspect-square rounded-xl size-10 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-[20px]">inventory_2</span>
          </div>
          <div>
            <h1 className="text-white text-base font-bold leading-tight tracking-tight">AIMS</h1>
            <p className="text-slate-400 text-xs font-medium">Inventory OS</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Main</p>
        <NavItem view="dashboard" icon="dashboard" label="Dashboard" />
        <NavItem view="inventory" icon="view_list" label="Inventory" />
        <NavItem view="stock-in" icon="input" label="Stock In" />
        <NavItem view="stock-out" icon="shopping_cart_checkout" label="Sales Orders" />
        <NavItem view="audit" icon="fact_check" label="Stocktake / Audit" />

        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Intelligence</p>
        <NavItem view="forecasting" icon="online_prediction" label="Smart Forecasting" isNew={true} />
        <NavItem view="analytics" icon="monitoring" label="Profit Analyzer" />

        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Management</p>
        {userRole !== 'staff' && (
          <>
            <NavItem view="users" icon="group" label="Team Members" />
            <NavItem view="export" icon="download" label="Data Export" />
            <NavItem view="barcodes" icon="qr_code_2" label="Barcodes" />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => setView('scanner')}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          <span className="material-symbols-outlined">qr_code_scanner</span>
          <span className="text-sm font-medium">Mobile Scanner</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;