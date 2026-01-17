import React, { useState, useEffect } from 'react';
import { Wallet, ShoppingCart, Trophy, ArrowDownToLine, Receipt } from 'lucide-react';
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

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="w-5 h-5" />;
      case 'win':
        return <Trophy className="w-5 h-5" />;
      case 'withdrawal':
        return <ArrowDownToLine className="w-5 h-5" />;
      default:
        return <Receipt className="w-5 h-5" />;
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wallet</h1>

      <div className="gradient-bg rounded-2xl p-8 text-white mb-8">
        <p className="text-white/80 mb-2">Available Balance</p>
        <p className="text-5xl font-bold mb-6">₹{balance}</p>
        <button
          onClick={handleWithdraw}
          className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
        >
          <ArrowDownToLine className="w-5 h-5" />
          Withdraw
        </button>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((txn, index) => {
            const isCredit = txn.type === 'win';
            return (
              <div key={index} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                    }`}
                  >
                    {getTransactionIcon(txn.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">
                      {txn.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-lg ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                  {isCredit ? '+' : '-'}₹{txn.amount}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WalletPage;
