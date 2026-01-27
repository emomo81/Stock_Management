import React, { useRef } from 'react';
import type { View } from '../types';
import { LaserFlow } from '../components/LaserFlow';

interface AuthProps {
  currentView: 'login' | 'register';
  setView: (view: View) => void;
  setIsAuth: (auth: boolean) => void;
}

import { API_URL } from '../config';

const Auth: React.FC<AuthProps> = ({ setView, setIsAuth }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('password123');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        setIsAuth(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setView('dashboard');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#060010] flex items-center justify-center relative overflow-hidden font-sans text-white"
      onMouseMove={handleMouseMove}
    >
      {/* Laser Flow Background */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <LaserFlow
          horizontalBeamOffset={0}
          verticalBeamOffset={-0.4}
          color="#CF9EFF"
          horizontalSizing={0.5}
          verticalSizing={2}
          wispDensity={1}
          wispSpeed={15}
          wispIntensity={5}
          flowSpeed={0.35}
          flowStrength={0.25}
          fogIntensity={0.45}
          fogScale={0.3}
          fogFallSpeed={0.6}
          decay={1.1}
          falloffStart={1.2}
        />
      </div>

      {/* Dot Pattern Background - Bottom Area */}
      <div
        className="absolute bottom-0 left-0 right-0 top-[40%] z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#a5b4fc 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(to bottom, transparent, black 20%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%)'
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4" ref={containerRef}>
        <div className="glass-panel rounded-2xl p-8 border-t border-white/10 shadow-2xl backdrop-blur-xl bg-surface/40 relative group overflow-hidden">
          {/* Reveal Effect Border */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-[#CF9EFF] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              maskImage: `radial-gradient(300px circle at var(--mouse-x) var(--mouse-y), white, transparent)`,
              WebkitMaskImage: `radial-gradient(300px circle at var(--mouse-x) var(--mouse-y), white, transparent)`,
            }}
          />

          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-400 shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined text-4xl text-white">inventory_2</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-[#9cabba] text-sm max-w-xs">
              Log in to AIMS to manage your inventory with AI-driven precision.
            </p>
          </div>

          <form className="flex flex-col gap-5 relative z-10" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-slate-400 ml-1">Email Address</label>
              <div className="relative group/input">
                <span className="material-symbols-outlined absolute left-4 top-3.5 text-[#9cabba]">mail</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1b2127]/60 border border-white/10 rounded-xl h-12 pl-12 text-white placeholder:text-slate-600 focus:border-primary focus:bg-black/40 outline-none transition-all"
                  placeholder="user@company.com"
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between ml-1">
                <label className="text-xs font-bold uppercase text-slate-400">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
              </div>
              <div className="relative group/input">
                <span className="material-symbols-outlined absolute left-4 top-3.5 text-[#9cabba]">lock</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1b2127]/60 border border-white/10 rounded-xl h-12 pl-12 pr-12 text-white placeholder:text-slate-600 focus:border-primary focus:bg-black/40 outline-none transition-all"
                  placeholder="••••••••"
                  type="password"
                  required
                />
                <span className="material-symbols-outlined absolute right-4 top-3.5 text-[#9cabba] cursor-pointer hover:text-white">visibility</span>
              </div>
            </div>

            <button disabled={loading} className="mt-4 w-full bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center relative z-10">
            <p className="text-sm text-[#9cabba]">
              Restricted Access. Employee Login Only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;