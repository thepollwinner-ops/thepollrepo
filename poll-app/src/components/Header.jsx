import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Wallet, User, ChevronDown, LogOut, History, Settings } from 'lucide-react';
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
    { path: '/', label: 'Active Polls', icon: '📊' },
    { path: '/results', label: 'Results', icon: '🏆' },
    { path: '/history', label: 'My Polls', icon: '📜' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
  ];

  return (
    <header className="gradient-bg text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <span className="text-xl font-bold hidden sm:block">The Poll Winner</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/wallet" className="bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/30 transition">
              <Wallet className="w-5 h-5" />
              <span className="font-semibold">₹{balance}</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/30 transition"
              >
                <User className="w-5 h-5" />
                <span className="font-medium hidden sm:block">{user?.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings className="w-5 h-5" />
                    Profile
                  </Link>
                  <Link
                    to="/history"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowDropdown(false)}
                  >
                    <History className="w-5 h-5" />
                    My Polls
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={() => { logout(); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-gray-50"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="max-w-6xl mx-auto px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                location.pathname === item.path
                  ? 'bg-white/25 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
