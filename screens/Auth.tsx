import React from 'react';
import type { View } from '../types';

interface AuthProps {
  currentView: 'login' | 'register';
  setView: (view: View) => void;
  setIsAuth: (auth: boolean) => void;
}

const Auth: React.FC<AuthProps> = ({ currentView, setView, setIsAuth }) => {
  return (
    <div className="min-h-screen w-full bg-[#101922] flex items-center justify-center relative overflow-hidden font-sans text-white">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[130px] opacity-70 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/10 blur-[100px] opacity-60"></div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-panel rounded-2xl p-8 border-t border-white/10 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-400 shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined text-4xl text-white">inventory_2</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
            <p className="text-[#9cabba] text-sm max-w-xs">
              Log in to AIMS to manage your inventory with AI-driven precision.
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); setIsAuth(true); setView('dashboard'); }}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-3.5 text-[#9cabba]">mail</span>
                <input className="w-full bg-[#1b2127]/50 border border-white/10 rounded-xl h-12 pl-12 text-white placeholder:text-slate-600 focus:border-primary focus:bg-black/20 outline-none transition-all" placeholder="user@company.com" type="email" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between ml-1">
                <label className="text-xs font-bold uppercase text-slate-400">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-3.5 text-[#9cabba]">lock</span>
                <input className="w-full bg-[#1b2127]/50 border border-white/10 rounded-xl h-12 pl-12 pr-12 text-white placeholder:text-slate-600 focus:border-primary focus:bg-black/20 outline-none transition-all" placeholder="••••••••" type="password" />
                <span className="material-symbols-outlined absolute right-4 top-3.5 text-[#9cabba] cursor-pointer hover:text-white">visibility</span>
              </div>
            </div>

            <button className="mt-4 w-full bg-primary hover:bg-blue-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-[#9cabba]">
              Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;