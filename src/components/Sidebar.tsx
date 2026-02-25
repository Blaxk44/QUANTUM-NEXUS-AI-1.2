import React from 'react';
import { 
  LayoutDashboard, 
  PieChart as PieChartIcon, 
  Zap, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Users, 
  User as UserIcon, 
  MessageSquare, 
  Shield, 
  LogOut,
  X,
  Menu
} from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/utils';
import { User } from '../types';

interface SidebarProps {
  view: string;
  setView: (view: string) => void;
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, user, onLogout, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'portfolio', icon: <PieChartIcon size={20} />, label: 'Portfolio' },
    { id: 'nodes', icon: <Zap size={20} />, label: 'Nodes' },
    { id: 'deposit', icon: <ArrowDownLeft size={20} />, label: 'Deposit' },
    { id: 'withdraw', icon: <ArrowUpRight size={20} />, label: 'Withdraw' },
    { id: 'history', icon: <History size={20} />, label: 'History' },
    { id: 'referrals', icon: <Users size={20} />, label: 'Referrals' },
    { id: 'profile', icon: <UserIcon size={20} />, label: 'Profile' },
    { id: 'support', icon: <MessageSquare size={20} />, label: 'Support' },
  ];

  if (user.role === 'admin') {
    menuItems.push({ id: 'admin', icon: <Shield size={20} />, label: 'Admin Panel' });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 w-72 bg-nexus-card border-r border-nexus-border flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 border-b border-nexus-border flex items-center justify-between">
          <Logo size="sm" />
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-nexus-muted hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setIsOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                view === item.id 
                  ? "bg-nexus-accent text-black font-bold shadow-[0_0_15px_rgba(0,255,0,0.3)]" 
                  : "text-nexus-muted hover:bg-white/5 hover:text-white"
              )}
            >
              {view === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50" />
              )}
              <span className={cn("relative z-10", view === item.id ? "text-black" : "group-hover:text-nexus-accent transition-colors")}>
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
              {view === item.id && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-nexus-border bg-black/20">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-nexus-accent/20 flex items-center justify-center text-nexus-accent font-bold border border-nexus-accent/30">
              {user.email[0].toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold truncate text-white">{user.email}</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent animate-pulse" />
                <p className="text-[10px] text-nexus-muted uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-sm font-medium border border-transparent hover:border-red-500/20"
          >
            <LogOut size={18} />
            Disconnect Session
          </button>
        </div>
      </aside>
    </>
  );
};
