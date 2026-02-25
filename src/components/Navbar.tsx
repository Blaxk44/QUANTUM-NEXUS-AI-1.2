import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/utils';

interface NavbarProps {
  setView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setView }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-nexus-bg/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
          <Logo size="sm" />
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => setView('login')} className="text-sm font-bold uppercase tracking-widest hover:text-nexus-accent transition-colors">
            Login
          </button>
          <button 
            onClick={() => setView('register')} 
            className="bg-nexus-accent text-black px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,0,0.3)]"
          >
            Activate Node
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-nexus-card border-b border-nexus-border p-6 space-y-4 animate-in slide-in-from-top-5">
          <button 
            onClick={() => { setView('login'); setIsOpen(false); }} 
            className="block w-full text-left py-3 text-sm font-bold uppercase tracking-widest border-b border-white/5"
          >
            Login
          </button>
          <button 
            onClick={() => { setView('register'); setIsOpen(false); }} 
            className="block w-full bg-nexus-accent text-black py-3 rounded-lg font-bold uppercase tracking-widest text-xs text-center"
          >
            Activate Node
          </button>
        </div>
      )}
    </nav>
  );
};
