import React, { useState, useEffect } from 'react';
import { History, Trophy, XCircle } from 'lucide-react';
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
      // API might not exist yet
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Poll History</h1>

      {history.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">You haven't participated in any polls yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={index} className="card p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-900">{item.poll_title}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    item.poll_status === 'active'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {item.poll_status}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                {item.total_votes} vote(s) • ₹{item.total_spent} spent
              </p>
              {item.result_status && (
                <div className="pt-4 border-t border-gray-100">
                  {item.result_status === 'won' ? (
                    <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
                      <Trophy className="w-5 h-5" />
                      Won ₹{item.winning_amount}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-red-500">
                      <XCircle className="w-5 h-5" />
                      Lost
                    </span>
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
