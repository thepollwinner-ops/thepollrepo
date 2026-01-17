import React, { useState, useEffect } from 'react';
import { Wallet, ShoppingCart, Trophy, ArrowDownToLine, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { getWallet, getTransactions, requestWithdrawal } from '../api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const WalletPage = () => {
  const { showToast } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, txnRes] = await Promise.all([
        getWallet(),
        getTransactions(),
      ]);
      setBalance(walletRes.data.balance || 0);
      setTransactions(txnRes.data || []);
    } catch (err) {
      console.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = prompt('Enter withdrawal amount (minimum ₹100):');
    if (!amount || parseInt(amount) < 100) {
      showToast('Minimum withdrawal is ₹100', 'error');
      return;
    }
    const upi = prompt('Enter your UPI ID:');
    if (!upi) return;
    try {
      await requestWithdrawal(parseInt(amount), upi);
      showToast('Withdrawal request submitted!', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Withdrawal failed', 'error');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'purchase': return ShoppingCart;
      case 'win': return Trophy;
      case 'withdrawal': return ArrowDownToLine;
      default: return CreditCard;
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Balance Card */}
      <div className="glass-card overflow-hidden mb-8">
        <div className="p-8 sm:p-10 gradient-mesh">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Available Balance</p>
                  <p className="text-4xl sm:text-5xl font-bold text-white">
                    ₹<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">{balance}</span>
                  </p>
                </div>
              </div>
            </div>
            <button onClick={handleWithdraw} className="btn btn-success">
              <ArrowDownToLine className="w-5 h-5" />
              Withdraw Funds
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 border-t border-slate-700/50">
          <div className="p-6 border-r border-slate-700/50">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm font-medium">Total Winnings</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{transactions.filter(t => t.type === 'win').reduce((a, b) => a + b.amount, 0)}
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Total Invested</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{transactions.filter(t => t.type === 'purchase').reduce((a, b) => a + b.amount, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-sky-400" />
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn, index) => {
              const Icon = getIcon(txn.type);
              const isCredit = txn.type === 'win';
              return (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCredit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-sky-500/15 text-sky-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white capitalize">{txn.type.replace('_', ' ')}</p>
                      <p className="text-sm text-slate-400">{new Date(txn.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCredit ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                    <span className={`font-bold text-lg ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}₹{txn.amount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
