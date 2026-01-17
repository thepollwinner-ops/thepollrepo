import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Wallet, User, ChevronDown, LogOut, History, Settings, BarChart3, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getWallet } from '../api';

const Header = () => {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadBalance();
  }, [location]);

  const loadBalance = async () => {
    try {
      const res = await getWallet();
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error('Failed to load balance');
    }
  };

  const navItems = [
    { path: '/', label: 'Polls', icon: Home },
    { path: '/results', label: 'Results', icon: BarChart3 },
    { path: '/history', label: 'My Votes', icon: History },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/50" style={{background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white hidden sm:block">The Poll Winner</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Wallet */}
            <Link 
              to="/wallet" 
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
            >
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="font-bold text-emerald-400">₹{balance}</span>
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-medium text-white text-sm hidden sm:block">{user?.name?.split(' ')[0]}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 glass-card py-2 shadow-2xl shadow-black/50" onClick={() => setShowDropdown(false)}>
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="font-semibold text-white">{user?.name}</p>
                    <p className="text-sm text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <Link to="/history" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition">
                    <History className="w-4 h-4" /> My Votes
                  </Link>
                  <hr className="my-2 border-slate-700/50" />
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
