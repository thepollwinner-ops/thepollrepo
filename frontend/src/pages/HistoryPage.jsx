import React, { useState, useEffect } from 'react';
import { History, Trophy, XCircle, Clock } from 'lucide-react';
import { getPollHistory } from '../api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const HistoryPage = () => {
  const { showToast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getPollHistory();
      setHistory(res.data);
    } catch (err) {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="glass-card p-8 sm:p-10 mb-8 gradient-mesh">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/30">
            <History className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Voting History</h1>
            <p className="text-slate-400">Track all your poll participations</p>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No History Yet</h3>
          <p className="text-slate-400">Start voting to see your participation history</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={index} className="glass-card p-6 hover:border-sky-500/30 transition-all">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">{item.poll_title}</h3>
                  <p className="text-slate-400 text-sm">
                    {item.total_votes} vote{item.total_votes > 1 ? 's' : ''} • ₹{item.total_spent} invested
                  </p>
                </div>
                <span className={`badge ${item.poll_status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  {item.poll_status === 'active' ? 'Live' : 'Ended'}
                </span>
              </div>
              
              {item.result_status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                  item.result_status === 'won'
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  {item.result_status === 'won' ? (
                    <>
                      <Trophy className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="font-bold text-emerald-400">You Won!</p>
                        <p className="text-2xl font-bold text-white">₹{item.winning_amount}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-400" />
                      <p className="font-semibold text-red-400">Better luck next time</p>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
