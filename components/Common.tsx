import React from 'react';

// This file is reserved for future extraction of common UI elements like Cards, Buttons, and Modal wrappers 
// to keep the main files cleaner as the app grows.
export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`glass-panel rounded-xl p-6 ${className}`}>
    {children}
  </div>
);