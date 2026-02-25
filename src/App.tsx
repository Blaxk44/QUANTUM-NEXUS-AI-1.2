/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Cpu, 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  Menu, 
  X, 
  LayoutDashboard, 
  History, 
  Settings, 
  LogOut,
  AlertCircle,
  Clock,
  Zap,
  Lock,
  ChevronRight,
  BarChart3,
  Globe,
  MessageCircle,
  Send,
  Activity,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  User as UserIcon,
  Bell,
  ExternalLink,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Sidebar } from './components/Sidebar';
import { Logo } from './components/Logo';
import { cn } from './lib/utils';
import { WALLET_ADDRESSES, INVESTMENT_TIERS, MLM_TIERS, WITHDRAWAL_FEE, MIN_DEPOSIT, MIN_WITHDRAWAL } from './constants';
import { User, Deposit, Withdrawal } from './types';

import { Navbar } from './components/Navbar';

// --- Components ---

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-nexus-border/50 rounded-lg", className)} />
);

const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getStrength(password);
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-nexus-accent'];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
        <span className="text-nexus-muted">Security Level</span>
        <span className={strength > 0 ? colors[strength] + ' text-black px-2 rounded' : 'text-nexus-muted'}>
          {password ? labels[strength] : 'None'}
        </span>
      </div>
      <div className="flex gap-1 h-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className={cn(
              "flex-1 rounded-full transition-all duration-500",
              i < strength ? colors[strength] : "bg-white/5"
            )} 
          />
        ))}
      </div>
    </div>
  );
};

function Toast({ message, type = 'info', onClose }: { message: string, type?: 'info' | 'success' | 'error', onClose: () => void, key?: any }) {
  const icons = {
    info: <Bell size={18} className="text-blue-400" />,
    success: <Check size={18} className="text-nexus-accent" />,
    error: <AlertCircle size={18} className="text-red-400" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-nexus-card border border-nexus-border p-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] glass"
    >
      {icons[type]}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="text-nexus-muted hover:text-white transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
};

const MarketChart = ({ data }: { data: any[] }) => (
  <div className="h-[300px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00FF00" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
        <XAxis 
          dataKey="time" 
          stroke="#888" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false}
          minTickGap={30}
        />
        <YAxis 
          stroke="#888" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
          domain={['auto', 'auto']}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px' }}
          itemStyle={{ color: '#00FF00' }}
        />
        <Area 
          type="monotone" 
          dataKey="price" 
          stroke="#00FF00" 
          fillOpacity={1} 
          fill="url(#colorPrice)" 
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const PortfolioChart = ({ nodes }: { nodes: any[] }) => {
  const data = nodes.map(n => ({
    name: n.node_name,
    value: n.amount
  }));

  const COLORS = ['#00FF00', '#00CC00', '#009900', '#006600', '#003300'];

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
          <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const variants: any = {
    primary: 'bg-nexus-accent text-black hover:bg-opacity-90 font-bold',
    secondary: 'bg-nexus-card border border-nexus-border text-white hover:bg-nexus-border',
    outline: 'border border-nexus-accent text-nexus-accent hover:bg-nexus-accent hover:text-black',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', title = '' }: any) => (
  <div className={`bg-nexus-card border border-nexus-border rounded-xl p-6 ${className}`}>
    {title && <h3 className="text-lg font-bold mb-4 text-nexus-accent flex items-center gap-2">{title}</h3>}
    {children}
  </div>
);

const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, className = '' }: any) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {label && <label className="text-sm font-medium text-nexus-muted">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="bg-nexus-bg border border-nexus-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexus-accent transition-colors"
    />
  </div>
);

const Badge = ({ children, variant = 'info' }: any) => {
  const variants: any = {
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    success: 'bg-nexus-accent/10 text-nexus-accent border-nexus-accent/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold border ${variants[variant]}`}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userNodes, setUserNodes] = useState<any[]>([]);
  const [view, setView] = useState('landing'); // landing, login, register, dashboard, deposit, withdraw, referrals, admin, profile
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'info' | 'success' | 'error' }[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const fetchUserNodes = useCallback(async () => {
    const token = localStorage.getItem('nexus_token');
    if (!token) return;
    try {
      const res = await fetch('/api/user-nodes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUserNodes(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Auth Logic
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('nexus_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        fetchUserNodes();
        if (view === 'landing' || view === 'login' || view === 'register') {
          setView('dashboard');
        }
      } else {
        localStorage.removeItem('nexus_token');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [view, fetchUserNodes]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      const prefs = user.preferences ? JSON.parse(user.preferences) : { market: true, nodes: true, bonuses: true };
      
      // Market Notification Simulator
      const interval = setInterval(() => {
        const triggers = [];
        if (prefs.market !== false) {
          triggers.push({ msg: "Neural Engine detected high volatility in BTC/USD", type: 'info' });
          triggers.push({ msg: "Liquidity sweep executed successfully", type: 'success' });
          triggers.push({ msg: "Network congestion detected on Ethereum mainnet", type: 'info' });
        }
        if (prefs.nodes !== false) {
          triggers.push({ msg: "Node Synchronization cycle 84% complete", type: 'success' });
          triggers.push({ msg: "AI Neural Node optimizing entry parameters", type: 'info' });
        }
        if (prefs.bonuses !== false) {
          triggers.push({ msg: "New referral joined your downline network", type: 'success' });
        }

        if (triggers.length > 0 && Math.random() > 0.7) {
          const trigger = triggers[Math.floor(Math.random() * triggers.length)];
          addToast(trigger.msg, trigger.type as any);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, addToast]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    localStorage.removeItem('nexus_token');
    setUser(null);
    setView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nexus-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-nexus-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-nexus-accent font-mono animate-pulse">SYNCHRONIZING NEURAL NET...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        {view === 'landing' && <LandingPage setView={setView} />}
        {view === 'login' && <LoginPage setView={setView} setUser={setUser} fetchUser={fetchUser} />}
        {view === 'register' && <RegisterPage setView={setView} setUser={setUser} fetchUser={fetchUser} />}
        {view === 'forgot-password' && <ForgotPasswordPage setView={setView} addToast={addToast} />}
        {view.startsWith('reset-password') && <ResetPasswordPage setView={setView} addToast={addToast} token={new URLSearchParams(view.split('?')[1]).get('token')} />}
        {user && !['landing', 'login', 'register', 'forgot-password'].includes(view) && !view.startsWith('reset-password') && (
          <div className="flex flex-1 relative h-screen overflow-hidden">
            <Sidebar 
              view={view} 
              setView={setView} 
              user={user} 
              onLogout={handleLogout} 
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
            />
            
            <main className="flex-1 flex flex-col relative w-full bg-nexus-bg overflow-hidden">
              {/* Mobile Header */}
              <div className="md:hidden p-4 border-b border-nexus-border flex items-center justify-between bg-nexus-card/80 backdrop-blur-md z-20">
                <Logo size="sm" />
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-nexus-text">
                  <Menu size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                <div className="max-w-7xl mx-auto w-full pb-20">
                  {view === 'dashboard' && <Dashboard user={user} addToast={addToast} setView={setView} />}
                  {view === 'portfolio' && <PortfolioView user={user} setView={setView} />}
                  {view === 'nodes' && <NodesView user={user} onComplete={fetchUser} />}
                  {view === 'deposit' && <DepositFlow user={user} onComplete={fetchUser} />}
                  {view === 'withdraw' && <WithdrawFlow user={user} onComplete={fetchUser} />}
                  {view === 'history' && <HistoryView user={user} />}
                  {view === 'referrals' && <Referrals user={user} />}
                  {view === 'profile' && <ProfileView user={user} onUpdate={fetchUser} addToast={addToast} />}
                  {view === 'support' && <SupportView user={user} addToast={addToast} />}
                  {view === 'admin' && user.role === 'admin' && <AdminPanel user={user} />}
                </div>
              </div>
            </main>
            
            {/* Floating AI Support Widget */}
            <FloatingChat user={user} />
            
            {/* Floating Active Nodes Widget */}
            <ActiveNodesWidget nodes={userNodes} />
          </div>
        )}
      </AnimatePresence>

      {/* Global Notifications */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[200]">
        <AnimatePresence>
          {toasts.map((toast: any) => (
            <Toast 
              key={toast.id} 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Views ---

function ProfileView({ user, onUpdate, addToast }: { user: User, onUpdate: () => void, addToast: any }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username || '');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token')}`
        },
        body: JSON.stringify({ email, username })
      });
      if (res.ok) {
        addToast("Profile updated successfully", "success");
        setIsEditing(false);
        setShowConfirm(false);
        onUpdate();
      } else {
        const data = await res.json();
        addToast(data.error || "Update failed", "error");
      }
    } catch (e) {
      addToast("Connection error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/profile/update-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token')}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        addToast("Password updated successfully", "success");
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to update password", "error");
      }
    } catch (e) {
      addToast("Connection error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="relative">
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1 h-12 bg-nexus-accent rounded-full" />
        <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Terminal <span className="text-nexus-accent">Profile</span></h1>
        <p className="text-nexus-muted text-xs uppercase tracking-[0.4em] mt-2 font-bold">Neural Identity Management</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="relative overflow-hidden border-nexus-accent/10 shadow-2xl">
            <div className="absolute top-0 right-0 p-6">
              <UserIcon size={120} className="text-nexus-accent opacity-[0.03] -mr-10 -mt-10" />
            </div>
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse" />
                <h3 className="text-xs uppercase tracking-[0.3em] font-black text-nexus-muted">Account Information</h3>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="text-[10px] py-1 px-4 h-auto rounded-full">Edit Profile</Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => { setIsEditing(false); setShowConfirm(false); setEmail(user.email); setUsername(user.username || ''); }} variant="secondary" className="text-[10px] py-1 px-4 h-auto rounded-full">Cancel</Button>
                </div>
              )}
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-nexus-muted">Email Address</label>
                  {isEditing ? (
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-nexus-bg border border-nexus-accent/30 rounded-lg p-3 font-bold focus:border-nexus-accent outline-none transition-all"
                    />
                  ) : (
                    <div className="p-3 bg-nexus-bg/50 border border-nexus-border rounded-lg font-bold">{user.email}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-nexus-muted">Username</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full bg-nexus-bg border border-nexus-accent/30 rounded-lg p-3 font-bold focus:border-nexus-accent outline-none transition-all"
                    />
                  ) : (
                    <div className="p-3 bg-nexus-bg/50 border border-nexus-border rounded-lg font-bold">{user.username || 'Not set'}</div>
                  )}
                </div>
              </div>

              {isEditing && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4"
                >
                  {showConfirm ? (
                    <div className="bg-nexus-accent/10 border border-nexus-accent p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="text-nexus-accent" />
                        <p className="text-xs font-bold uppercase tracking-widest">Confirm profile synchronization?</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button type="submit" className="flex-1 md:flex-none py-2 px-8" disabled={loading}>
                          {loading ? 'SYNCING...' : 'Confirm Sync'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="submit" className="w-full py-3" disabled={loading}>
                      Save Changes
                    </Button>
                  )}
                </motion.div>
              )}
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-nexus-border/50">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-nexus-muted mb-1">Account Role</p>
                <Badge variant={user.role === 'admin' ? 'success' : 'info'} className="font-black">{user.role.toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-nexus-muted mb-1">Member Since</p>
                <p className="font-mono font-bold text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-widest text-nexus-muted mb-1">Referral Code</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-nexus-accent text-lg tracking-tighter">{user.referral_code}</span>
                  <button onClick={() => { navigator.clipboard.writeText(user.referral_code); addToast("Code copied", "success"); }} className="p-2 bg-nexus-accent/10 rounded-lg text-nexus-accent hover:bg-nexus-accent hover:text-black transition-all">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-nexus-accent/10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse" />
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-nexus-muted">Security Protocol</h3>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Input 
                    label="New Access Key" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e: any) => setNewPassword(e.target.value)} 
                    placeholder="••••••••"
                    required
                  />
                  <PasswordStrength password={newPassword} />
                </div>
                <div className="space-y-4">
                  <Input 
                    label="Confirm Access Key" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e: any) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••"
                    required
                  />
                  <div className="pt-8">
                    <Button type="submit" className="w-full py-3 font-black uppercase tracking-widest" disabled={loading}>
                      {loading ? 'UPDATING...' : 'Update Protocol'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-nexus-card to-nexus-bg border-nexus-accent/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse" />
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-nexus-muted">Network Growth</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
              <div className="relative">
                <Users size={64} className="text-nexus-accent" />
                <div className="absolute inset-0 bg-nexus-accent/20 blur-2xl rounded-full -z-10" />
              </div>
              <p className="text-sm text-nexus-muted max-w-[200px] mx-auto leading-relaxed">Expand your neural network and earn institutional rewards.</p>
              <Button onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'referrals' }))} variant="primary" className="w-full rounded-full font-black uppercase tracking-widest text-xs">
                Open Referrals
              </Button>
            </div>
          </Card>

          <Card className="border-nexus-accent/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse" />
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-nexus-muted">Terminal Status</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-nexus-bg/50 border border-nexus-border rounded-xl group hover:border-nexus-accent transition-all">
                <div className="p-3 bg-nexus-accent/10 rounded-xl text-nexus-accent group-hover:bg-nexus-accent group-hover:text-black transition-all">
                  <Globe size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-tighter">Current Session</p>
                  <p className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Latency: 0.4ms</p>
                </div>
                <Badge variant="success" className="font-black">ACTIVE</Badge>
              </div>
              <div className="flex items-center gap-4 p-4 bg-nexus-bg/50 border border-nexus-border rounded-xl opacity-50">
                <div className="p-3 bg-white/5 rounded-xl text-nexus-muted">
                  <Lock size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-tighter">2FA Security</p>
                  <p className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Status: Disabled</p>
                </div>
                <Badge variant="info" className="font-black">SETUP</Badge>
              </div>
            </div>
          </Card>

          <Card className="border-nexus-accent/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse" />
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-nexus-muted">Notification Preferences</h3>
            </div>
            <div className="space-y-4">
              {[
                { id: 'market', label: 'Market Volatility Alerts', desc: 'Receive updates on major market movements' },
                { id: 'nodes', label: 'Node Synchronization', desc: 'Alerts when nodes complete sync cycles' },
                { id: 'bonuses', label: 'Referral Bonuses', desc: 'Notifications for new downline activations' }
              ].map((pref) => {
                const prefs = user.preferences ? JSON.parse(user.preferences) : { market: true, nodes: true, bonuses: true };
                const isEnabled = prefs[pref.id] !== false;
                
                return (
                  <div key={pref.id} className="flex items-center justify-between p-4 bg-nexus-bg/50 border border-nexus-border rounded-xl">
                    <div>
                      <p className="text-sm font-black uppercase tracking-tighter">{pref.label}</p>
                      <p className="text-[10px] text-nexus-muted font-bold">{pref.desc}</p>
                    </div>
                    <button 
                      onClick={async () => {
                        const newPrefs = { ...prefs, [pref.id]: !isEnabled };
                        try {
                          await fetch('/api/profile/preferences', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('nexus_token')}`
                            },
                            body: JSON.stringify({ preferences: newPrefs })
                          });
                          onUpdate();
                          addToast('Preferences updated', 'success');
                        } catch (e) {
                          addToast('Failed to update preferences', 'error');
                        }
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${isEnabled ? 'bg-nexus-accent' : 'bg-nexus-border'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NodeActivityLog({ nodeId }: { nodeId: number }) {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/user-nodes/${nodeId}/activity`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }
        });
        if (res.ok) setActivity(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [nodeId]);

  if (loading) return <div className="p-4 text-center text-nexus-muted"><div className="w-6 h-6 border-2 border-nexus-accent border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  return (
    <div className="p-4 bg-nexus-bg/50 rounded-xl border border-nexus-border mt-2 mb-4 space-y-3">
      <h4 className="text-xs uppercase tracking-widest font-black text-nexus-muted mb-4">Node Activity Log</h4>
      {activity.length > 0 ? (
        activity.map((log, i) => (
          <div key={i} className="flex items-start gap-4 text-sm">
            <div className="mt-1 p-1.5 bg-nexus-accent/10 rounded-full text-nexus-accent">
              <Activity size={14} />
            </div>
            <div>
              <p className="font-bold text-white">{log.action}</p>
              <p className="text-nexus-muted text-xs">{log.details}</p>
              <p className="text-[10px] text-nexus-muted font-mono mt-1">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-xs text-nexus-muted text-center py-4">No activity recorded yet.</p>
      )}
    </div>
  );
}

function PortfolioView({ user, setView }: { user: User, setView: any }) {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNode, setExpandedNode] = useState<number | null>(null);

  useEffect(() => {
    const fetchNodes = async () => {
      const res = await fetch('/api/user-nodes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }
      });
      if (res.ok) setNodes(await res.json());
      setLoading(false);
    };
    fetchNodes();
  }, []);

  const totalInvested = nodes.reduce((sum, n) => sum + n.amount, 0);
  const totalTarget = nodes.reduce((sum, n) => sum + n.target_amount, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tight">Investment <span className="text-nexus-accent">Portfolio</span></h1>
        <p className="text-nexus-muted">Detailed breakdown of your neural node deployments</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            <Card title="Total Deployed">
              <p className="text-3xl font-mono font-bold text-nexus-accent">${totalInvested.toLocaleString()}</p>
              <p className="text-xs text-nexus-muted mt-1 uppercase tracking-widest">Across {nodes.length} Nodes</p>
            </Card>
            <Card title="Projected Maturity">
              <p className="text-3xl font-mono font-bold text-nexus-accent">${totalTarget.toLocaleString()}</p>
              <p className="text-xs text-nexus-muted mt-1 uppercase tracking-widest">At Cycle Completion</p>
            </Card>
            <Card title="Net Unrealized ROI">
              <p className="text-3xl font-mono font-bold text-nexus-accent">
                {totalInvested > 0 ? `+${((totalTarget - totalInvested) / totalInvested * 100).toFixed(2)}%` : '0.00%'}
              </p>
              <p className="text-xs text-nexus-muted mt-1 uppercase tracking-widest">Expected Yield</p>
            </Card>
          </>
        )}
      </div>

      <Card title="Active Node Breakdown">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-nexus-border text-nexus-muted text-xs uppercase tracking-widest">
                <th className="pb-4">Node Tier</th>
                <th className="pb-4">Activation Date</th>
                <th className="pb-4">Initial Capital</th>
                <th className="pb-4">Target Maturity</th>
                <th className="pb-4">Sync Progress</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node, i) => (
                <React.Fragment key={i}>
                  <tr className="border-b border-nexus-border/50 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}>
                    <td className="py-4 font-bold">{node.node_name}</td>
                    <td className="py-4 text-sm">{new Date(node.created_at).toLocaleDateString()}</td>
                    <td className="py-4 font-mono text-nexus-accent">${node.amount.toLocaleString()}</td>
                    <td className="py-4 font-mono text-nexus-accent">${node.target_amount.toLocaleString()}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-nexus-bg h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '45%' }}
                            className="bg-nexus-accent h-full"
                          />
                        </div>
                        <span className="text-xs font-mono">45%</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-nexus-muted hover:text-nexus-accent transition-colors">
                        {expandedNode === node.id ? <ChevronLeft className="-rotate-90" size={20} /> : <ChevronRight className="rotate-90" size={20} />}
                      </button>
                    </td>
                  </tr>
                  {expandedNode === node.id && (
                    <tr>
                      <td colSpan={6} className="p-0 border-b border-nexus-border/50">
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <NodeActivityLog nodeId={node.id} />
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {nodes.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-nexus-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Zap size={48} className="opacity-10" />
                      <p>No active nodes detected. Deploy capital to start synchronization.</p>
                      <Button onClick={() => setView('nodes')} variant="outline" className="mt-4">Deploy Nodes</Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  </div>
  );
}

function LandingPage({ setView }: any) {
  return (
    <div className="flex-1 flex flex-col bg-nexus-bg overflow-hidden">
      <Navbar setView={setView} />

      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-32">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-nexus-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-nexus-accent/5 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-6xl w-full text-center z-10"
        >
          <div className="flex justify-center mb-8">
            <span className="meta-label bg-nexus-accent/10 text-nexus-accent px-4 py-1 rounded-full border border-nexus-accent/20">
              NEURAL ENGINE v4.0.2 ACTIVE
            </span>
          </div>
          
          <h1 className="text-[12vw] md:text-[10vw] font-black leading-[0.85] tracking-tighter uppercase mb-12">
            Institutional <br />
            <span className="text-nexus-accent italic font-serif lowercase tracking-normal">automation</span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left max-w-5xl mx-auto">
            <p className="text-xl md:text-2xl text-nexus-muted leading-relaxed font-light">
              Experience the future of capital management. Our proprietary neural-net executes trades with <span className="text-white font-medium">zero human emotion</span>, delivering institutional-grade returns across global markets.
            </p>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 border-b border-nexus-border pb-4">
                <span className="text-4xl font-serif italic text-nexus-accent">90%</span>
                <span className="text-xs uppercase tracking-widest text-nexus-muted">Capital Protection <br />Reserve Fund</span>
              </div>
              <div className="flex items-center gap-4 border-b border-nexus-border pb-4">
                <span className="text-4xl font-serif italic text-nexus-accent">24h</span>
                <span className="text-xs uppercase tracking-widest text-nexus-muted">Daily Profit <br />Crediting Cycle</span>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col md:flex-row gap-6 justify-center">
            <Button onClick={() => setView('register')} className="text-xl px-16 py-6 rounded-full shadow-[0_0_30px_rgba(0,255,0,0.2)]">Initialize Connection</Button>
            <button 
              onClick={() => setView('login')} 
              className="text-xl px-16 py-6 rounded-full border border-nexus-border hover:bg-white/5 transition-all uppercase font-bold tracking-widest"
            >
              Access Terminal
            </button>
          </div>
        </motion.div>

        {/* Stats Marquee-like section */}
        <div className="mt-32 w-full border-y border-nexus-border py-8 overflow-hidden">
          <div className="flex gap-20 animate-marquee whitespace-nowrap">
            {[
              "BTC/USD +2.4% Neural Optimization",
              "ETH/USD +1.8% Liquidity Sweep",
              "SOL/USD +4.2% Momentum Capture",
              "GBP/JPY +0.9% Fiber-Optic Execution",
              "RESERVE FUND: $12,402,931.00",
              "ACTIVE NODES: 8,421",
              "TOTAL PAYOUTS: $45.2M"
            ].map((stat, i) => (
              <span key={i} className="text-sm font-mono uppercase tracking-[0.3em] text-nexus-muted flex items-center gap-4">
                <div className="w-2 h-2 bg-nexus-accent rounded-full" />
                {stat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase leading-none">The <span className="text-nexus-accent italic font-serif">Nexus</span> Advantage</h2>
            <p className="text-nexus-muted">Our platform bridges the gap between retail investors and institutional-grade algorithmic trading.</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Card className="border-none bg-nexus-card/50">
              <Zap className="text-nexus-accent mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Neural Execution</h3>
              <p className="text-sm text-nexus-muted">Proprietary neural networks analyze millions of data points per second to identify high-probability trade setups.</p>
            </Card>
            <Card className="border-none bg-nexus-card/50">
              <Shield className="text-nexus-accent mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Capital Protection</h3>
              <p className="text-sm text-nexus-muted">Our Reserve Fund provides up to 90% capital protection for high-tier leaders, ensuring long-term stability.</p>
            </Card>
          </div>
        </div>
      </div>

      <footer className="p-12 border-t border-nexus-border bg-nexus-card/50 text-center text-nexus-muted">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Logo size="sm" showText={true} />
        </div>
        <p className="text-xs uppercase tracking-widest">© 2026 Nexus Quantum AI. Institutional-Grade Neural Automation.</p>
      </footer>
    </div>
  );
}

function LoginPage({ setView, setUser, fetchUser }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('nexus_token', data.token);
        setUser(data);
        setView('dashboard');
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" className="mb-6" />
          <h2 className="text-3xl font-black">TERMINAL ACCESS</h2>
          <p className="text-nexus-muted">Enter credentials to synchronize</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input label="Email Address" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <Input label="Access Key" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'SYNCHRONIZING...' : 'INITIALIZE SESSION'}
          </Button>
        </form>
        <div className="mt-6 flex flex-col gap-3 text-center text-sm text-nexus-muted">
          <button onClick={() => setView('forgot-password')} className="hover:text-nexus-accent transition-colors">Forgot Access Key?</button>
          <p>
            New Node? <button onClick={() => setView('register')} className="text-nexus-accent hover:underline">Register Node</button>
          </p>
        </div>
      </Card>
    </div>
  );
}

function ForgotPasswordPage({ setView, addToast }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, 'success');
        if (data.token) {
          // For demo purposes, we pass the token to the reset view
          setTimeout(() => setView(`reset-password?token=${data.token}`), 1000);
        } else {
          setView('login');
        }
      } else {
        addToast(data.error || 'Failed to process request', 'error');
      }
    } catch (e) {
      addToast('Connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" className="mb-6" />
          <h2 className="text-3xl font-black">RECOVER ACCESS</h2>
          <p className="text-nexus-muted">Enter email to reset your key</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Email Address" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'PROCESSING...' : 'SEND RESET LINK'}
          </Button>
        </form>
        <p className="mt-8 text-center text-nexus-muted">
          <button onClick={() => setView('login')} className="text-nexus-accent hover:underline">Return to Login</button>
        </p>
      </Card>
    </div>
  );
}

function ResetPasswordPage({ setView, addToast, token }: any) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, 'success');
        setView('login');
      } else {
        addToast(data.error || 'Failed to reset password', 'error');
      }
    } catch (e) {
      addToast('Connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,0,0.05)_0%,transparent_70%)]">
      <Card className="w-full max-w-md p-10 border-nexus-accent/30 shadow-[0_0_50px_rgba(0,255,0,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nexus-accent to-transparent" />
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" className="mb-6" />
          <h2 className="text-3xl font-black uppercase tracking-tighter">RESET KEY</h2>
          <p className="text-nexus-muted uppercase tracking-widest text-xs mt-2">Establish new secure credentials</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input label="New Access Key" type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} required />
            <PasswordStrength password={newPassword} />
          </div>
          <Button type="submit" className="w-full text-lg py-4 font-black tracking-widest" disabled={loading}>
            {loading ? 'UPDATING...' : 'CONFIRM NEW KEY'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function RegisterPage({ setView, setUser, fetchUser }: any) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(new URLSearchParams(window.location.search).get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, referralCode })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('nexus_token', data.token);
        setUser(data);
        setView('dashboard');
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,0,0.05)_0%,transparent_70%)]">
      <Card className="w-full max-w-md p-10 border-nexus-accent/30 shadow-[0_0_50px_rgba(0,255,0,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nexus-accent to-transparent" />
        
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="relative inline-block mb-6">
            <Logo size="xl" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none mb-2">Initialize <span className="text-nexus-accent">Node</span></h2>
          <p className="text-nexus-muted text-xs uppercase tracking-[0.3em] font-bold">Neural Protocol v4.2</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <Input label="Email Address" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required placeholder="operator@nexus.ai" />
          <Input label="Username" value={username} onChange={(e: any) => setUsername(e.target.value)} placeholder="Neural_Operator_01" />
          <div>
            <Input label="Access Key" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required placeholder="••••••••" />
            <PasswordStrength password={password} />
          </div>
          <Input label="Referral Code (Optional)" value={referralCode} onChange={(e: any) => setReferralCode(e.target.value)} placeholder="ADMIN" />
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <Button type="submit" className="w-full py-4 text-lg tracking-[0.2em] font-black uppercase" disabled={loading}>
            {loading ? 'SYNCING...' : 'Activate Terminal'}
          </Button>
        </form>

        <p className="mt-10 text-center text-nexus-muted text-xs uppercase tracking-widest">
          Already Active? <button onClick={() => setView('login')} className="text-nexus-accent font-bold hover:underline ml-2">Access Terminal</button>
        </p>
      </Card>
    </div>
  );
}


function Dashboard({ user, addToast, setView }: { user: User, addToast: any, setView: any }) {
  const [activeNodes, setActiveNodes] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(true);

  useEffect(() => {
    const fetchNodes = async () => {
      const token = localStorage.getItem('nexus_token');
      const res = await fetch('/api/user-nodes', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setActiveNodes(await res.json());
      setLoadingNodes(false);
    };
    const fetchMarket = async () => {
      const res = await fetch('/api/market-data');
      if (res.ok) setMarketData(await res.json());
      setLoadingMarket(false);
    };
    fetchNodes();
    fetchMarket();
  }, []);

  const totalActive = activeNodes.reduce((sum, n) => sum + n.amount, 0);
  const [activeCard, setActiveCard] = useState(0);
  const nextCard = () => setActiveCard((prev) => (prev + 1) % activeNodes.length);
  const prevCard = () => setActiveCard((prev) => (prev - 1 + activeNodes.length) % activeNodes.length);

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1 h-16 bg-nexus-accent rounded-full hidden md:block" />
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Terminal <span className="text-nexus-accent">Overview</span></h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-nexus-accent/10 border border-nexus-accent/20 rounded-full">
              <Activity size={12} className="text-nexus-accent animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-nexus-accent">Neural-Net: Optimizing</span>
            </div>
            <span className="text-nexus-muted text-[10px] uppercase tracking-widest font-bold">Protocol v4.2.0</span>
          </div>
        </div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-6 bg-gradient-to-br from-nexus-card to-nexus-bg border border-nexus-accent/30 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-nexus-accent/10 transition-all" />
          <div className="text-right relative z-10">
            <p className="text-[10px] text-nexus-muted uppercase tracking-[0.3em] font-black mb-1">Available Liquidity</p>
            <p className="text-4xl font-mono font-bold text-nexus-accent tracking-tighter">${user.balance.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-nexus-accent text-black rounded-xl shadow-[0_0_20px_rgba(0,255,0,0.3)] relative z-10">
            <Wallet size={28} />
          </div>
        </motion.div>
      </header>

      <section className="relative">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-xs uppercase tracking-[0.5em] font-black text-nexus-muted mb-2">Neural Node Deployments</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-nexus-accent to-transparent rounded-full" />
          </div>
          {activeNodes.length > 1 && (
            <div className="flex gap-3">
              <button onClick={prevCard} className="w-12 h-12 rounded-full border border-nexus-border flex items-center justify-center hover:border-nexus-accent hover:text-nexus-accent hover:bg-nexus-accent/5 transition-all shadow-xl"><ChevronLeft size={24} /></button>
              <button onClick={nextCard} className="w-12 h-12 rounded-full border border-nexus-border flex items-center justify-center hover:border-nexus-accent hover:text-nexus-accent hover:bg-nexus-accent/5 transition-all shadow-xl"><ChevronRight size={24} /></button>
            </div>
          )}
        </div>

        {loadingNodes ? (
          <div className="grid grid-cols-1 gap-6">
            <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
          </div>
        ) : activeNodes.length > 0 ? (
          <div className="relative h-[400px] overflow-hidden rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/5 group">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard}
                initial={{ opacity: 0, x: 100, filter: 'blur(20px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -100, filter: 'blur(20px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#050505] p-16 flex flex-col justify-between"
              >
                {/* Luxury background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-nexus-accent/5 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-nexus-accent/5 rounded-full blur-[100px] -ml-48 -mb-48" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00FF00 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-nexus-accent text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(0,255,0,0.5)]">
                        Synchronized
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.4em] font-black text-nexus-muted">Tier: {activeNodes[activeCard].node_name}</span>
                    </div>
                    <h3 className="text-7xl font-black uppercase tracking-tighter leading-none">{activeNodes[activeCard].node_name}</h3>
                    <div className="flex items-center gap-4">
                      <p className="text-nexus-muted font-mono text-xs tracking-widest">ID: {activeNodes[activeCard].id.toString().padStart(8, '0')}</p>
                      <div className="h-px w-12 bg-nexus-border" />
                      <p className="text-nexus-muted font-mono text-xs tracking-widest">ACTIVE_SINCE: {new Date(activeNodes[activeCard].created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-nexus-muted uppercase tracking-[0.4em] font-black mb-2">Institutional Capital</p>
                    <p className="text-7xl font-mono font-bold text-nexus-accent tracking-tighter leading-none">${activeNodes[activeCard].amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-16 pt-12 border-t border-white/10">
                  <div className="space-y-3">
                    <p className="text-[10px] text-nexus-muted uppercase tracking-[0.4em] font-black">Target Maturity</p>
                    <p className="text-4xl font-mono font-bold tracking-tighter">${activeNodes[activeCard].target_amount.toLocaleString()}</p>
                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-nexus-accent/10 rounded border border-nexus-accent/20">
                      <TrendingUp size={12} className="text-nexus-accent" />
                      <span className="text-[10px] text-nexus-accent font-black uppercase tracking-widest">+{((activeNodes[activeCard].target_amount / activeNodes[activeCard].amount - 1) * 100).toFixed(0)}% Net Yield</span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] text-nexus-muted uppercase tracking-[0.4em] font-black">Neural Sync Progress</p>
                      <span className="text-sm font-mono font-black text-nexus-accent">45.2%</span>
                    </div>
                    <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '45.2%' }}
                        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-gradient-to-r from-nexus-accent/50 to-nexus-accent h-full rounded-full shadow-[0_0_20px_rgba(0,255,0,0.6)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-nexus-muted uppercase tracking-[0.4em] font-black">Current Operation</p>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Activity className="text-nexus-accent animate-pulse" size={32} />
                        <div className="absolute inset-0 bg-nexus-accent/20 blur-lg rounded-full animate-ping" />
                      </div>
                      <p className="text-4xl font-black uppercase tracking-tighter">Optimizing</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-[400px] bg-nexus-card border border-dashed border-nexus-border rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 group hover:border-nexus-accent/50 transition-all">
            <div className="relative mb-8">
              <Zap size={80} className="text-nexus-muted group-hover:text-nexus-accent transition-colors" />
              <div className="absolute inset-0 bg-nexus-accent/5 blur-3xl rounded-full -z-10" />
            </div>
            <div className="space-y-2 mb-8">
              <p className="uppercase tracking-[0.5em] text-sm font-black text-nexus-muted">No active nodes detected</p>
              <p className="text-xs opacity-40 max-w-xs mx-auto uppercase tracking-widest leading-relaxed">Deploy institutional capital to initialize high-frequency neural synchronization cycles.</p>
            </div>
            <Button onClick={() => setView('nodes')} variant="outline" className="rounded-full px-16 py-4 font-black uppercase tracking-[0.2em] text-sm">Initialize Node</Button>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card title="Market Performance (BTC/USD Neural Feed)" className="border-nexus-accent/10 shadow-2xl">
            {loadingMarket ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <MarketChart data={marketData} />
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Node Engagement" className="border-nexus-accent/10 shadow-2xl">
              <div className="space-y-6">
                {loadingNodes ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : activeNodes.length > 0 ? (
                  activeNodes.map((node, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-nexus-bg/50 border border-nexus-border rounded-xl hover:border-nexus-accent/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-nexus-accent/10 rounded-lg text-nexus-accent group-hover:bg-nexus-accent group-hover:text-black transition-all">
                          <Zap size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tighter">{node.node_name}</p>
                          <p className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Syncing...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-nexus-accent">${node.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Capital</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-nexus-muted">
                    <p className="text-xs uppercase tracking-widest font-bold">No active engagements</p>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Portfolio Allocation" className="border-nexus-accent/10 shadow-2xl">
              {loadingNodes ? (
                <Skeleton className="h-[200px] w-full" />
              ) : activeNodes.length > 0 ? (
                <PortfolioChart nodes={activeNodes} />
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-center text-nexus-muted">
                  <PieChartIcon size={48} className="mb-4 opacity-10" />
                  <p className="text-xs uppercase tracking-widest font-bold">No allocation data</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card title="Cycle Protection" className="bg-gradient-to-br from-nexus-card to-nexus-bg border-nexus-accent/20 shadow-2xl">
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-6">
              <div className="relative">
                <Shield size={80} className="text-nexus-accent" />
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute inset-0 bg-nexus-accent/30 rounded-full blur-3xl -z-10"
                />
              </div>
              <div className="space-y-2">
                <p className="font-black text-xl uppercase tracking-tighter">Institutional Reserve</p>
                <p className="text-[10px] text-nexus-muted uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto font-bold">
                  Protected up to <span className="text-nexus-accent font-black">90%</span> against black swan events via proprietary insurance.
                </p>
              </div>
              <Badge variant="success" className="px-6 py-1 font-black tracking-widest">SECURE_SYNC</Badge>
            </div>
          </Card>

          <Card title="Live Neural Feed" className="border-nexus-accent/10 shadow-2xl">
            <div className="space-y-4 font-mono text-[10px]">
              {[
                "AI Neural Node 4 is currently optimizing GBP/JPY entries.",
                "Liquidity sweep detected at 1.2450. Adjusting parameters.",
                "Daily credits arriving in 4 hours.",
                "Institutional fiber-optic lines latency: 0.4ms.",
                "Reserve Fund balance: $12.4M USD."
              ].map((msg, i) => (
                <div key={i} className="flex gap-4 text-nexus-muted border-l-2 border-nexus-accent/20 pl-4 py-1 group hover:border-nexus-accent transition-all">
                  <span className="text-nexus-accent font-black">[{new Date().toLocaleTimeString()}]</span>
                  <span className="truncate group-hover:text-white transition-colors">{msg}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Predictive Analytics" className="border-nexus-accent/10 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-nexus-bg/50 border border-nexus-border rounded-xl">
                <div>
                  <p className="text-sm font-black uppercase tracking-tighter">30-Day Projection</p>
                  <p className="text-[10px] text-nexus-muted font-bold">Based on current node performance</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-nexus-accent">+14.2%</p>
                  <p className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Expected ROI</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-nexus-bg/50 border border-nexus-border rounded-xl">
                <div>
                  <p className="text-sm font-black uppercase tracking-tighter">Risk Assessment</p>
                  <p className="text-[10px] text-nexus-muted font-bold">Neural network confidence score</p>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="font-black">LOW RISK</Badge>
                  <p className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold mt-1">92% Confidence</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Quick Actions" className="border-nexus-accent/10 shadow-2xl">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setView('deposit')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-nexus-border hover:border-nexus-accent hover:bg-nexus-accent/5 transition-all group shadow-xl"
              >
                <div className="p-3 bg-nexus-accent/10 rounded-xl text-nexus-accent group-hover:bg-nexus-accent group-hover:text-black transition-all">
                  <ArrowDownLeft size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Add Funds</span>
              </button>
              <button 
                onClick={() => setView('withdraw')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-nexus-border hover:border-nexus-accent hover:bg-nexus-accent/5 transition-all group shadow-xl"
              >
                <div className="p-3 bg-nexus-accent/10 rounded-xl text-nexus-accent group-hover:bg-nexus-accent group-hover:text-black transition-all">
                  <ArrowUpRight size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Withdraw</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DepositFlow({ user, onComplete }: any) {
  const [step, setStep] = useState(1); // 1: Amount, 2: Method, 3: Payment, 4: Confirmation
  const [amount, setAmount] = useState('');
  const [blockchain, setBlockchain] = useState('');
  const [currency, setCurrency] = useState('');
  const [txHash, setTxHash] = useState('');
  const [timer, setTimer] = useState(900); // 15 minutes
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: any;
    if (step === 3 && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNext = () => setStep(step + 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}`
        },
        body: JSON.stringify({ amount: parseFloat(amount), currency, blockchain, txHash })
      });
      if (res.ok) {
        setStep(4);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { id: 'BNB', name: 'BNB Chain', cryptos: ['BNB', 'USDT'] },
    { id: 'ETH', name: 'Ethereum', cryptos: ['ETH', 'USDT', 'USDC'] },
    { id: 'SOL', name: 'Solana', cryptos: ['SOL', 'USDT'] },
    { id: 'TON', name: 'TON', cryptos: ['TON', 'USDT'] },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-black uppercase tracking-tight">Secure <span className="text-nexus-accent">Funding Center</span></h1>
        <p className="text-nexus-muted">Initialize your node activation sequence</p>
      </div>

      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-nexus-border -translate-y-1/2 z-0"></div>
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step >= s ? 'bg-nexus-accent border-nexus-accent text-black' : 'bg-nexus-card border-nexus-border text-nexus-muted'}`}>
            {s}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <Card title="Step 1: Investment Amount">
              <Input 
                label="Amount (USD)" 
                type="number" 
                value={amount} 
                onChange={(e: any) => setAmount(e.target.value)} 
                placeholder="Min $100" 
              />
              <p className="mt-4 text-xs text-nexus-muted">Minimum deposit is $100 for Starter Node activation.</p>
              <Button 
                onClick={handleNext} 
                className="w-full mt-6" 
                disabled={!amount || parseFloat(amount) < MIN_DEPOSIT}
              >
                Continue to Network Selection
              </Button>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <Card title="Step 2: Select Network & Asset">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setBlockchain(m.id); setCurrency(m.cryptos[0]); }}
                    className={`p-4 rounded-xl border transition-all text-left ${blockchain === m.id ? 'border-nexus-accent bg-nexus-accent/5' : 'border-nexus-border hover:border-white/20'}`}
                  >
                    <p className="font-bold">{m.name}</p>
                    <div className="flex gap-2 mt-2">
                      {m.cryptos.map(c => (
                        <span key={c} className="text-[10px] bg-nexus-border px-2 py-0.5 rounded uppercase">{c}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              {blockchain && (
                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium text-nexus-muted">Select Asset</label>
                  <div className="flex gap-2">
                    {methods.find(m => m.id === blockchain)?.cryptos.map(c => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`px-4 py-2 rounded-lg border transition-all ${currency === c ? 'border-nexus-accent bg-nexus-accent/5' : 'border-nexus-border'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Button 
                onClick={handleNext} 
                className="w-full mt-6" 
                disabled={!blockchain || !currency}
              >
                Generate Payment Address
              </Button>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <Card title="Step 3: Secure Payment">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-6 flex items-center gap-3">
                <Clock className="text-yellow-500" />
                <div>
                  <p className="text-yellow-500 font-bold">Payment Window Active</p>
                  <p className="text-xs text-nexus-muted">Complete transfer within {formatTime(timer)} to ensure automatic activation.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-nexus-bg border border-nexus-border rounded-lg">
                  <p className="text-xs text-nexus-muted uppercase tracking-widest mb-2">Send Exactly</p>
                  <p className="text-2xl font-mono font-bold text-nexus-accent">{amount} USD <span className="text-sm text-white">in {currency}</span></p>
                </div>

                <div className="p-4 bg-nexus-bg border border-nexus-border rounded-lg">
                  <p className="text-xs text-nexus-muted uppercase tracking-widest mb-2">{blockchain} Deposit Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm break-all font-mono text-nexus-accent">{(WALLET_ADDRESSES as any)[blockchain]}</code>
                    <button onClick={() => navigator.clipboard.writeText((WALLET_ADDRESSES as any)[blockchain])} className="p-2 hover:bg-white/10 rounded">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <Input 
                  label="Transaction Hash (TxID)" 
                  value={txHash} 
                  onChange={(e: any) => setTxHash(e.target.value)} 
                  placeholder="Paste your blockchain transaction hash here" 
                />

                <div className="p-4 bg-nexus-accent/5 border border-nexus-accent/20 rounded-lg">
                  <p className="text-xs text-nexus-muted italic">
                    "Our AI tracks the hash on the blockchain in real-time. Once it hits 2-5 minutes of confirmation, your Node is activated automatically."
                  </p>
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className="w-full" 
                  disabled={!txHash || loading}
                >
                  {loading ? 'VERIFYING ON BLOCKCHAIN...' : 'Confirm Payment'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-12">
            <div className="w-20 h-20 bg-nexus-accent/20 rounded-full flex items-center justify-center mx-auto text-nexus-accent mb-6">
              <Check size={48} />
            </div>
            <h2 className="text-3xl font-black">ACTIVATION INITIATED</h2>
            <p className="text-nexus-muted max-w-md mx-auto">
              Your transaction hash has been submitted to the neural net. 
              Node activation typically completes within 2-5 minutes of blockchain confirmation.
            </p>
            <Button onClick={() => setStep(1)} variant="secondary">Return to Dashboard</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WithdrawFlow({ user, onComplete }: any) {
  const [amount, setAmount] = useState('');
  const [blockchain, setBlockchain] = useState('');
  const [currency, setCurrency] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleWithdrawRequest = (e: any) => {
    e.preventDefault();
    if (parseFloat(amount) < MIN_WITHDRAWAL) return alert(`Minimum withdrawal is $${MIN_WITHDRAWAL}`);
    setShowConfirm(true);
  };

  const handleFinalWithdraw = async () => {
    setVerifying(true);
    try {
      // 1. Verify Password
      const verifyRes = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}`
        },
        body: JSON.stringify({ password: confirmPassword })
      });
      
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        alert(data.error || 'Password verification failed');
        setVerifying(false);
        return;
      }

      // 2. Process Withdrawal
      setLoading(true);
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}`
        },
        body: JSON.stringify({ amount: parseFloat(amount), currency, blockchain, address })
      });
      if (res.ok) {
        alert('Withdrawal request submitted for neural verification.');
        onComplete();
        setAmount('');
        setAddress('');
        setShowConfirm(false);
        setConfirmPassword('');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred during processing.');
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-black uppercase tracking-tight">Withdraw <span className="text-nexus-accent">Capital</span></h1>
        <p className="text-nexus-muted">Institutional-grade liquidity processing</p>
      </div>

      <Card title="Withdrawal Request">
        <form onSubmit={handleWithdrawRequest} className="space-y-6">
          <div className="p-4 bg-nexus-bg border border-nexus-border rounded-lg flex justify-between items-center">
            <span className="text-nexus-muted">Available for Withdrawal</span>
            <span className="text-xl font-mono font-bold text-nexus-accent">${user.balance.toLocaleString()}</span>
          </div>

          <Input 
            label="Amount (USD)" 
            type="number" 
            value={amount} 
            onChange={(e: any) => setAmount(e.target.value)} 
            placeholder={`Min $${MIN_WITHDRAWAL}`} 
            required 
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-nexus-muted">Blockchain</label>
              <select 
                value={blockchain} 
                onChange={(e) => setBlockchain(e.target.value)}
                className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexus-accent"
                required
              >
                <option value="">Select Network</option>
                <option value="BNB">BNB Chain</option>
                <option value="ETH">Ethereum</option>
                <option value="SOL">Solana</option>
                <option value="TON">TON</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-nexus-muted">Asset</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexus-accent"
                required
              >
                <option value="">Select Asset</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="NATIVE">Native (BNB/ETH/SOL/TON)</option>
              </select>
            </div>
          </div>

          <Input 
            label="Destination Wallet Address" 
            value={address} 
            onChange={(e: any) => setAddress(e.target.value)} 
            placeholder="Paste your wallet address" 
            required 
          />

          <div className="p-4 bg-nexus-card border border-nexus-border rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-nexus-muted">Withdrawal Fee (12%)</span>
              <span className="text-red-500">-${(parseFloat(amount || '0') * (WITHDRAWAL_FEE / 100)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-nexus-border pt-2">
              <span>Net Settlement</span>
              <span className="text-nexus-accent">${(parseFloat(amount || '0') * (1 - WITHDRAWAL_FEE / 100)).toFixed(2)}</span>
            </div>
          </div>

          <p className="text-[10px] text-nexus-muted italic">
            * The 12% Withdrawal Fee acts as an insurance premium that funds the Reserve Fund and maintains high-speed fiber-optic bank lines.
          </p>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'PROCESSING...' : 'Initialize Withdrawal'}
          </Button>
        </form>
      </Card>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <Card title="Neural Verification Required">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-nexus-accent/10 border border-nexus-accent/20 rounded-lg">
                    <Lock className="text-nexus-accent" size={32} />
                    <p className="text-sm">
                      To prevent unauthorized capital flight, please re-enter your <span className="text-nexus-accent font-bold">Access Key</span> to confirm this withdrawal of <span className="font-mono font-bold">${amount}</span>.
                    </p>
                  </div>

                  <Input 
                    label="Access Key" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e: any) => setConfirmPassword(e.target.value)} 
                    placeholder="Enter your password" 
                    required 
                  />

                  <div className="flex gap-4">
                    <Button 
                      variant="secondary" 
                      className="flex-1" 
                      onClick={() => { setShowConfirm(false); setConfirmPassword(''); }}
                      disabled={verifying}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={handleFinalWithdraw}
                      disabled={!confirmPassword || verifying}
                    >
                      {verifying ? 'VERIFYING...' : 'Confirm Withdrawal'}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NodesView({ user, onComplete }: any) {
  const [loading, setLoading] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const activateNode = async (tier: any) => {
    const amountStr = customAmounts[tier.name] || tier.min.toString();
    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount < tier.min) {
      alert(`Minimum activation for ${tier.name} is $${tier.min}`);
      return;
    }

    // Find next tier min to cap custom amount if needed
    const tierIndex = INVESTMENT_TIERS.findIndex(t => t.name === tier.name);
    const nextTier = INVESTMENT_TIERS[tierIndex + 1];
    if (nextTier && amount >= nextTier.min) {
      alert(`Amount $${amount} qualifies for ${nextTier.name}. Please select that tier instead.`);
      return;
    }

    if (user.balance < amount) {
      alert(`Insufficient balance. You need $${amount.toLocaleString()} to activate this node.`);
      return;
    }

    // Calculate target based on multiplier
    const multiplier = tier.target / tier.min;
    const targetAmount = amount * multiplier;

    setLoading(true);
    try {
      const res = await fetch('/api/nodes/activate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}`
        },
        body: JSON.stringify({ 
          nodeName: tier.name,
          amount,
          targetAmount
        })
      });
      if (res.ok) {
        alert(`${tier.name} activated with $${amount.toLocaleString()}. Target: $${targetAmount.toLocaleString()}`);
        onComplete();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tight">Neural <span className="text-nexus-accent">Nodes</span></h1>
        <p className="text-nexus-muted">Deploy capital to institutional-grade automation tiers</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INVESTMENT_TIERS.map((tier, i) => (
          <Card key={i} className="relative overflow-hidden flex flex-col hover:border-nexus-accent transition-all group">
            {tier.protection && (
              <div className="absolute top-0 right-0 bg-nexus-accent text-black text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-lg">
                {tier.protection} Protected
              </div>
            )}
            <div className="mb-4">
              <h3 className="text-2xl font-black mb-1">{tier.name}</h3>
              <p className="text-nexus-accent font-mono text-sm uppercase tracking-widest">Neural Tier {i + 1}</p>
            </div>
            
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-nexus-muted">Min Activation</span>
                <span className="font-bold text-white">${tier.min.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-nexus-muted">Projected Target</span>
                <span className="font-bold text-nexus-accent">~{(tier.target / tier.min * 100).toFixed(0)}% ROI</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-nexus-muted">Cycle Time</span>
                <span className="font-bold text-white">{tier.cycle}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-nexus-muted">Protection</span>
                <span className="font-bold text-nexus-accent">{tier.protection || 'Standard'}</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-nexus-border">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-nexus-muted mb-1 block">Custom Amount ($)</label>
                <input 
                  type="number"
                  placeholder={`Min $${tier.min}`}
                  value={customAmounts[tier.name] || ''}
                  onChange={(e) => setCustomAmounts(prev => ({ ...prev, [tier.name]: e.target.value }))}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-nexus-accent"
                />
              </div>
              <Button 
                onClick={() => activateNode(tier)} 
                className="w-full"
                disabled={loading}
              >
                Deploy Node
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ActiveNodesWidget({ nodes }: { nodes: any[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (nodes.length === 0) return null;

  const totalActive = nodes.reduce((sum, n) => sum + n.amount, 0);

  return (
    <div className="fixed bottom-24 right-6 z-[90] flex flex-col items-end">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="mb-4 w-64 bg-nexus-card border border-nexus-border rounded-xl shadow-2xl p-4 glass"
          >
            <h4 className="text-xs font-bold uppercase tracking-widest text-nexus-accent mb-3">Active Deployments</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
              {nodes.map((node, i) => (
                <div key={i} className="border-b border-nexus-border/50 pb-2 last:border-0">
                  <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span>{node.node_name}</span>
                    <span className="text-nexus-accent">${node.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-nexus-bg h-1 mt-1 rounded-full overflow-hidden">
                    <div className="bg-nexus-accent h-full w-[40%] animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-nexus-card border border-nexus-border p-4 rounded-xl flex items-center gap-3 hover:border-nexus-accent transition-all group shadow-2xl"
      >
        <div className="text-right">
          <p className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Total Active</p>
          <p className="text-lg font-black text-nexus-accent">${totalActive.toLocaleString()}</p>
        </div>
        <div className="w-10 h-10 bg-nexus-accent/10 rounded-full flex items-center justify-center text-nexus-accent group-hover:bg-nexus-accent group-hover:text-black transition-colors">
          <Zap size={20} />
        </div>
      </button>
    </div>
  );
}

function HistoryView({ user }: any) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [referralBonuses, setReferralBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}` };
      const [wRes, dRes, rbRes] = await Promise.all([
        fetch('/api/history/withdrawals', { headers }),
        fetch('/api/history/deposits', { headers }),
        fetch('/api/referral-bonuses', { headers })
      ]);
      if (wRes.ok) setWithdrawals(await wRes.json());
      if (dRes.ok) setDeposits(await dRes.json());
      if (rbRes.ok) setReferralBonuses(await rbRes.json());
      setLoading(false);
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tight">Transaction <span className="text-nexus-accent">History</span></h1>
        <p className="text-nexus-muted">Full audit trail of your neural node activity</p>
      </header>

      <Card title="Withdrawal History">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-nexus-border text-nexus-muted text-xs uppercase tracking-widest">
                <th className="pb-4">Date</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Network</th>
                <th className="pb-4">Address</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-nexus-border/50">
                  <td className="py-4 text-sm">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="py-4 font-mono text-nexus-accent">${w.amount}</td>
                  <td className="py-4 text-sm">{w.blockchain}</td>
                  <td className="py-4"><code className="text-xs truncate max-w-[150px] block">{w.address}</code></td>
                  <td className="py-4"><Badge variant={w.status === 'pending' ? 'warning' : w.status === 'approved' ? 'success' : 'danger'}>{w.status}</Badge></td>
                </tr>
              ))}
              {withdrawals.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-nexus-muted">No withdrawal history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Deposit History">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-nexus-border text-nexus-muted text-xs uppercase tracking-widest">
                <th className="pb-4">Date</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Network</th>
                <th className="pb-4">Hash</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-b border-nexus-border/50">
                  <td className="py-4 text-sm">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="py-4 font-mono text-nexus-accent">${d.amount}</td>
                  <td className="py-4 text-sm">{d.blockchain}</td>
                  <td className="py-4"><code className="text-xs truncate max-w-[150px] block">{d.tx_hash}</code></td>
                  <td className="py-4"><Badge variant={d.status === 'pending' ? 'warning' : d.status === 'approved' ? 'success' : 'danger'}>{d.status}</Badge></td>
                </tr>
              ))}
              {deposits.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-nexus-muted">No deposit history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Referral Bonuses">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-nexus-border text-nexus-muted text-xs uppercase tracking-widest">
                <th className="pb-4">Date</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Referred User</th>
                <th className="pb-4">Tier</th>
              </tr>
            </thead>
            <tbody>
              {referralBonuses.map((rb) => (
                <tr key={rb.id} className="border-b border-nexus-border/50">
                  <td className="py-4 text-sm">{new Date(rb.created_at).toLocaleDateString()}</td>
                  <td className="py-4 font-mono text-nexus-accent">+${rb.amount.toLocaleString()}</td>
                  <td className="py-4 text-sm">{rb.referred_username || rb.referred_email}</td>
                  <td className="py-4"><Badge variant="info">Tier {rb.tier}</Badge></td>
                </tr>
              ))}
              {referralBonuses.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-nexus-muted">No referral bonuses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FloatingChat({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'NEXUS QUANTUM SUPPORT online. How can I assist with your institutional node operations?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Faster model
        contents: [
          {
            role: "user",
            parts: [{ text: `
              You are NEXUS QUANTUM SUPPORT, a fast AI assistant for Nexus Quantum AI.
              Be concise, efficient, and professional.
              
              Context:
              - Tiers: Starter($100), Growth($500), VIP($1k), Leader($10k+).
              - Cycle: 7-14 days. Daily credits.
              - Fee: 12%. Min: $100.
              - MLM: 7%, 3%, 1%.
              - Admin: optrillionaire@gmail.com
              
              Rule: If you can't solve it (e.g. missing deposit), tell them to contact admin.
              
              User: ${userMessage}
            ` }]
          }
        ],
      });

      const aiResponse = response.text || "Synchronization delay. Contact admin.";
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Link interrupted. Contact optrillionaire@gmail.com" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-nexus-card border border-nexus-border rounded-2xl shadow-2xl flex flex-col overflow-hidden glass"
          >
            <div className="p-4 border-b border-nexus-border flex justify-between items-center bg-nexus-accent/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse"></div>
                <span className="font-bold text-sm tracking-tight">NEXUS SUPPORT</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-nexus-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-nexus-accent text-black font-medium' 
                      : 'bg-nexus-bg border border-nexus-border text-white'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-nexus-bg border border-nexus-border p-3 rounded-xl">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-nexus-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask support..."
                  className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-nexus-accent"
                />
                <button type="submit" disabled={loading} className="bg-nexus-accent text-black p-2 rounded-lg disabled:opacity-50">
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-2 flex justify-center">
                <button 
                  type="button"
                  onClick={() => window.location.href = 'mailto:optrillionaire@gmail.com'}
                  className="text-[10px] text-nexus-accent hover:underline uppercase tracking-widest"
                >
                  Redirect to Admin
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300
          ${isOpen ? 'bg-nexus-card border border-nexus-border text-nexus-accent rotate-90' : 'bg-nexus-accent text-black hover:scale-110 neon-glow'}
        `}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
}

function Referrals({ user }: { user: User }) {
  const [referrals, setReferrals] = useState<any[]>([]);
  const refLink = `${window.location.origin}/?ref=${user.referral_code}`;

  useEffect(() => {
    const fetchRefs = async () => {
      const res = await fetch('/api/referrals', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}` }
      });
      if (res.ok) setReferrals(await res.json());
    };
    fetchRefs();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tight">Network <span className="text-nexus-accent">Growth</span></h1>
        <p className="text-nexus-muted">3-Tier Passive Income: 7% | 3% | 1%</p>
      </header>

      <Card title="Your Referral Link">
        <div className="flex items-center gap-4 bg-nexus-bg border border-nexus-border p-4 rounded-lg">
          <code className="flex-1 font-mono text-nexus-accent truncate">{refLink}</code>
          <Button onClick={() => { navigator.clipboard.writeText(refLink); alert('Copied!'); }} variant="secondary" className="px-4 py-2">
            <Copy size={18} />
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Referrals">
          <p className="text-4xl font-black text-nexus-accent">{referrals.length}</p>
        </Card>
        <Card title="Network Tier">
          <p className="text-4xl font-black text-nexus-accent">TIER 1</p>
        </Card>
        <Card title="Passive Earnings">
          <p className="text-4xl font-black text-nexus-accent">$0.00</p>
        </Card>
      </div>

      <Card title="Recent Network Activity">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-nexus-border text-nexus-muted text-xs uppercase tracking-widest">
                <th className="pb-4">Node Email</th>
                <th className="pb-4">Joined</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((ref, i) => (
                <tr key={i} className="border-b border-nexus-border/50">
                  <td className="py-4 font-bold">{ref.email}</td>
                  <td className="py-4 text-nexus-muted">{new Date(ref.created_at).toLocaleDateString()}</td>
                  <td className="py-4"><Badge variant="success">ACTIVE</Badge></td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-nexus-muted">No network activity detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SupportView({ user, addToast }: any) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/support-tickets', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }
        });
        if (res.ok) setTickets(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token')}`
        },
        body: JSON.stringify({ subject, message })
      });
      if (res.ok) {
        addToast('Support ticket submitted successfully', 'success');
        setSubject('');
        setMessage('');
        const newTicket = await fetch('/api/support-tickets', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }
        }).then(res => res.json());
        setTickets(newTicket);
      } else {
        addToast('Failed to submit ticket', 'error');
      }
    } catch (e) {
      addToast('Connection error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="relative">
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1 h-12 bg-nexus-accent rounded-full" />
        <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Terminal <span className="text-nexus-accent">Support</span></h1>
        <p className="text-nexus-muted text-xs uppercase tracking-[0.4em] mt-2 font-bold">Neural Assistance Protocol</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Card title="Submit Ticket" className="border-nexus-accent/10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                label="Subject" 
                value={subject} 
                onChange={(e: any) => setSubject(e.target.value)} 
                placeholder="Brief description of the issue"
                required 
              />
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-nexus-muted">Message</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-32 bg-nexus-bg border border-nexus-accent/30 rounded-lg p-3 font-bold focus:border-nexus-accent outline-none transition-all resize-none"
                  placeholder="Provide detailed information..."
                  required
                />
              </div>
              <Button type="submit" className="w-full py-3 font-black uppercase tracking-widest" disabled={submitting}>
                {submitting ? 'SUBMITTING...' : 'Initialize Request'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card title="Support History" className="border-nexus-accent/10 shadow-2xl">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket, i) => (
                  <div key={i} className="p-4 bg-nexus-bg/50 border border-nexus-border rounded-xl flex flex-col md:flex-row justify-between gap-4 group hover:border-nexus-accent/30 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={ticket.status === 'open' ? 'info' : 'success'} className="font-black uppercase">{ticket.status}</Badge>
                        <span className="text-xs text-nexus-muted font-mono">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="font-black text-lg mb-1">{ticket.subject}</p>
                      <p className="text-sm text-nexus-muted line-clamp-2">{ticket.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-nexus-muted">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs uppercase tracking-widest font-bold">No support tickets found</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ user }: any) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [tab, setTab] = useState('deposits');

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}` };
    const [dRes, wRes, uRes, tRes] = await Promise.all([
      fetch('/api/admin/deposits', { headers }),
      fetch('/api/admin/withdrawals', { headers }),
      fetch('/api/admin/users', { headers }),
      fetch('/api/admin/support-tickets', { headers })
    ]);
    if (dRes.ok) setDeposits(await dRes.json());
    if (wRes.ok) setWithdrawals(await wRes.json());
    if (uRes.ok) setUsers(await uRes.json());
    if (tRes.ok) setTickets(await tRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (type: string, id: number, action: string) => {
    const res = await fetch(`/api/admin/${type}/${id}/${action}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}` }
    });
    if (res.ok) {
      alert('Action successful');
      fetchData();
    }
  };

  const adjustBalance = async (userId: number) => {
    const amount = prompt('Enter amount to adjust (positive for reward, negative for penalty):');
    if (!amount) return;
    const res = await fetch(`/api/admin/users/${userId}/adjust`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}` 
      },
      body: JSON.stringify({ amount: parseFloat(amount) })
    });
    if (res.ok) {
      alert('Balance adjusted');
      fetchData();
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tight">Admin <span className="text-nexus-accent">Control Panel</span></h1>
        <p className="text-nexus-muted">Manage nodes, liquidity, and network growth</p>
      </header>

      <div className="flex gap-4 border-b border-nexus-border overflow-x-auto">
        {['deposits', 'withdrawals', 'users', 'tickets'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-bold uppercase tracking-widest transition-all whitespace-nowrap ${tab === t ? 'text-nexus-accent border-b-2 border-nexus-accent' : 'text-nexus-muted hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'deposits' && (
        <Card title="Pending Deposits">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-nexus-border text-nexus-muted text-xs uppercase tracking-widest">
                  <th className="pb-4">User</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Network</th>
                  <th className="pb-4">Hash</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-b border-nexus-border/50">
                    <td className="py-4">{d.user_email}</td>
                    <td className="py-4 font-mono text-nexus-accent">${d.amount}</td>
                    <td className="py-4">{d.blockchain} ({d.currency})</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs truncate max-w-[100px] block">{d.tx_hash}</code>
                        <button onClick={() => { navigator.clipboard.writeText(d.tx_hash); alert('Hash Copied!'); }} className="p-1 hover:bg-white/10 rounded text-nexus-accent">
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4"><Badge variant={d.status === 'pending' ? 'warning' : d.status === 'approved' ? 'success' : 'danger'}>{d.status}</Badge></td>
                    <td className="py-4">
                      {d.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction('deposits', d.id, 'approve')} className="text-nexus-accent hover:underline">Approve</button>
                          <button onClick={() => handleAction('deposits', d.id, 'decline')} className="text-red-500 hover:underline">Decline</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'withdrawals' && (
        <Card title="Withdrawal Requests">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-nexus-border text-nexus-muted text-xs uppercase tracking-widest">
                  <th className="pb-4">User</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Network</th>
                  <th className="pb-4">Address</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-nexus-border/50">
                    <td className="py-4">{w.user_email}</td>
                    <td className="py-4 font-mono text-nexus-accent">${w.amount}</td>
                    <td className="py-4">{w.blockchain} ({w.currency})</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs truncate max-w-[100px] block">{w.address}</code>
                        <button onClick={() => { navigator.clipboard.writeText(w.address); alert('Address Copied!'); }} className="p-1 hover:bg-white/10 rounded text-nexus-accent">
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4"><Badge variant={w.status === 'pending' ? 'warning' : w.status === 'approved' ? 'success' : 'danger'}>{w.status}</Badge></td>
                    <td className="py-4">
                      {w.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction('withdrawals', w.id, 'approve')} className="text-nexus-accent hover:underline">Approve</button>
                          <button onClick={() => handleAction('withdrawals', w.id, 'decline')} className="text-red-500 hover:underline">Decline</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'users' && (
        <Card title="User Management">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-nexus-border text-nexus-muted text-xs uppercase tracking-widest">
                  <th className="pb-4">Email</th>
                  <th className="pb-4">Balance</th>
                  <th className="pb-4">Role</th>
                  <th className="pb-4">Ref Code</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-nexus-border/50">
                    <td className="py-4">{u.email}</td>
                    <td className="py-4 font-mono text-nexus-accent">${u.balance.toLocaleString()}</td>
                    <td className="py-4 uppercase text-xs">{u.role}</td>
                    <td className="py-4 font-mono">{u.referral_code}</td>
                    <td className="py-4">
                      <button onClick={() => adjustBalance(u.id)} className="text-nexus-accent hover:underline">Adjust Balance</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'tickets' && (
        <Card title="Support Tickets">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-nexus-border text-nexus-muted text-xs uppercase tracking-widest">
                  <th className="pb-4">User</th>
                  <th className="pb-4">Subject</th>
                  <th className="pb-4">Message</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-nexus-border/50">
                    <td className="py-4">{t.user_email}</td>
                    <td className="py-4 font-bold">{t.subject}</td>
                    <td className="py-4 text-sm text-nexus-muted max-w-xs truncate">{t.message}</td>
                    <td className="py-4"><Badge variant={t.status === 'open' ? 'warning' : 'success'}>{t.status}</Badge></td>
                    <td className="py-4">
                      {t.status === 'open' && (
                        <button onClick={() => handleAction('support-tickets', t.id, 'resolve')} className="text-nexus-accent hover:underline">Mark Resolved</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
