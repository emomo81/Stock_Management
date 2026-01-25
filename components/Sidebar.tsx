import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { View, UserRole } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  view: View;
  icon: string;
  label: string;
  isNew?: boolean;
  section?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, userRole, isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  // Define all navigation items with their sections
  const allItems: NavItemConfig[] = useMemo(() => {
    const items: NavItemConfig[] = [
      { view: 'dashboard', icon: 'dashboard', label: 'Dashboard', section: 'Main' },
      { view: 'inventory', icon: 'view_list', label: 'Inventory', section: 'Main' },
      { view: 'stock-in', icon: 'input', label: 'Stock In', section: 'Main' },
      { view: 'stock-out', icon: 'shopping_cart_checkout', label: 'Sales Orders', section: 'Main' },
      { view: 'audit', icon: 'fact_check', label: 'Stocktake / Audit', section: 'Main' },
      
      { view: 'forecasting', icon: 'online_prediction', label: 'Smart Forecasting', isNew: true, section: 'Intelligence' },
      { view: 'analytics', icon: 'monitoring', label: 'Profit Analyzer', section: 'Intelligence' },
    ];

    if (userRole !== 'staff') {
      items.push(
        { view: 'users', icon: 'group', label: 'Team Members', section: 'Management' },
        { view: 'export', icon: 'download', label: 'Data Export', section: 'Management' },
        { view: 'barcodes', icon: 'qr_code_2', label: 'Barcodes', section: 'Management' }
      );
    }
    return items;
  }, [userRole]);

  // Determine active index based on currentView
  const activeIndex = useMemo(() => {
    const index = allItems.findIndex(item => item.view === currentView);
    return index !== -1 ? index : 0; // Default to 0 if not found (e.g. scanner view)
  }, [currentView, allItems]);

  // --- Animation Logic (Adapted from GooeyNav) ---
  const animationTime = 600;
  const particleCount = 12;
  const particleDistances: [number, number] = [40, 10];
  const particleR = 60;
  const timeVariance = 200;
  const colors = [1, 2, 3, 4];

  const noise = (n = 1) => n / 2 - Math.random() * n;
  
  const getXY = (distance: number, pointIndex: number, totalPoints: number): [number, number] => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i: number, t: number, d: [number, number], r: number) => {
    let rotate = noise(r / 10);
    const colorCode = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colorCode, 
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
    };
  };

  const makeParticles = (element: HTMLElement) => {
    const d: [number, number] = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);
    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove('active');
      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        
        // Use the CSS variable for color
        point.style.setProperty('--color', `var(--color-${p.color})`);
        point.style.background = `var(--color-${p.color})`;
        
        particle.style.setProperty('--rotate', `${p.rotate}deg`);
        point.classList.add('point');
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add('active');
        });
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {}
        }, t);
      }, 30);
    }
  };

  const updateEffectPosition = (element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();
    
    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`
    };

    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    
    // Copy HTML to capture icons
    textRef.current.innerHTML = element.innerHTML;
  };

  // Handle click to set view and trigger particles
  const handleClick = (e: React.MouseEvent<HTMLLIElement>, view: View) => {
    const liEl = e.currentTarget;
    if (currentView === view) return;
    
    setView(view);
    
    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll('.particle');
      particles.forEach(p => filterRef.current!.removeChild(p));
    }
    
    if (textRef.current) {
      textRef.current.classList.remove('active');
      void textRef.current.offsetWidth; // trigger reflow
      textRef.current.classList.add('active');
    }
    
    if (filterRef.current) {
      makeParticles(filterRef.current);
    }
  };

  // Sync position on activeIndex change
  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeLi = navRef.current.querySelectorAll('li')[activeIndex] as HTMLElement;
    
    if (activeLi) {
      requestAnimationFrame(() => updateEffectPosition(activeLi));
      textRef.current?.classList.add('active');
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll('li')[activeIndex] as HTMLElement;
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex, userRole]);

  // Group items by section for rendering
  const renderItems = () => {
    let currentSection = '';
    const nodes: React.ReactNode[] = [];

    allItems.forEach((item, index) => {
      if (item.section && item.section !== currentSection) {
        currentSection = item.section;
        nodes.push(
          <div key={`section-${currentSection}`} className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 first:mt-2 pointer-events-none">
            {currentSection}
          </div>
        );
      }

      const isActive = index === activeIndex;
      nodes.push(
        <li
          key={item.view}
          onClick={(e) => handleClick(e, item.view)}
          className={`
            relative cursor-pointer rounded-lg mb-1 flex items-center gap-3 px-3 py-2.5 w-full transition-colors duration-300
            text-slate-400 z-[2]
            ${isActive ? 'active' : 'hover:text-white'}
          `}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="text-sm font-medium flex-1">{item.label}</span>
          {item.isNew && (
             <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20">
                NEW
             </span>
          )}
        </li>
      );
    });

    return nodes;
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
      <style>
        {`
          :root {
            --color-1: #2563eb; /* Blue */
            --color-2: #9333ea; /* Purple */
            --color-3: #db2777; /* Pink */
            --color-4: #ea580c; /* Orange */
          }
          
          .effect {
            position: absolute;
            opacity: 1;
            pointer-events: none;
            display: flex;
            align-items: center; 
            padding-left: 0.75rem; 
            box-sizing: border-box;
            z-index: 1;
            border-radius: 0.5rem; 
          }
          .effect span.material-symbols-outlined { margin-right: 0.75rem; } 
          .effect span.text-sm { font-weight: 700; flex: 1; text-align: left; }

          /* The Active Floating Text Label */
          .effect.text {
            color: #000000; /* Black Text */
            transition: color 0.3s ease;
            white-space: nowrap;
            overflow: hidden;
            
            background: #ffffff; /* White Blob */
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          }

          /* Invert icons/tags inside the active blob for contrast */
          .effect.text span.material-symbols-outlined { color: #000000; }
          .effect.text span.bg-primary\\/20 { 
            background-color: rgba(0,0,0,0.1); 
            color: #000000; 
            border-color: rgba(0,0,0,0.2);
          }

          .effect.filter {
            filter: blur(7px) contrast(20) blur(0);
            mix-blend-mode: normal; 
            z-index: 0;
          }
          .effect.filter::before {
            content: "";
            position: absolute;
            inset: -45px;
            z-index: -2;
            background: transparent; 
          }
          .effect.filter::after {
            content: "";
            position: absolute;
            inset: 0;
            background: #ffffff; /* White Particles Base */
            transform: scale(0);
            opacity: 0;
            z-index: -1;
            border-radius: 9999px;
          }
          .effect.active::after {
            animation: pill 0.3s ease both;
          }
          @keyframes pill {
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          /* Hide the active item content in the base list so the overlay takes over completely.
             This matches the 'opacity: 0' behavior on the original li to prevent duplication.
          */
          li.active > span {
             opacity: 0;
          }
          .particle, .point {
            display: block;
            opacity: 0;
            width: 16px;
            height: 16px;
            border-radius: 9999px;
            transform-origin: center;
          }
          .particle {
            --time: 5s;
            position: absolute;
            top: calc(50% - 8px);
            left: calc(50% - 8px);
            animation: particle calc(var(--time)) ease 1 -350ms;
          }
          .point {
            background: var(--color); /* Use CSS var color */
            opacity: 1;
            animation: point calc(var(--time)) ease 1 -350ms;
          }
          @keyframes particle {
            0% {
              transform: rotate(0deg) translate(calc(var(--start-x)), calc(var(--start-y)));
              opacity: 1;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            70% {
              transform: rotate(calc(var(--rotate) * 0.5)) translate(calc(var(--end-x) * 1.2), calc(var(--end-y) * 1.2));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: rotate(calc(var(--rotate) * 0.66)) translate(calc(var(--end-x)), calc(var(--end-y)));
              opacity: 1;
            }
            100% {
              transform: rotate(calc(var(--rotate) * 1.2)) translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5));
              opacity: 1;
            }
          }
          @keyframes point {
            0% { transform: scale(0); opacity: 0; animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45); }
            25% { transform: scale(calc(var(--scale) * 0.25)); }
            38% { opacity: 1; }
            65% { transform: scale(var(--scale)); opacity: 1; animation-timing-function: ease; }
            85% { transform: scale(var(--scale)); opacity: 1; }
            100% { transform: scale(0); opacity: 0; }
          }
        `}
      </style>

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

      <div className="flex-1 px-3 py-4 overflow-y-auto relative" ref={containerRef}>
        <nav className="relative z-[3]">
          <ul ref={navRef} className="list-none p-0 m-0">
            {renderItems()}
          </ul>
        </nav>
        
        {/* Floating Effect Layers */}
        <span className="effect filter" ref={filterRef} />
        <span className="effect text" ref={textRef} />
      </div>

      <div className="p-4 border-t border-white/5 relative z-10">
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