import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, Flame } from 'lucide-react';
import { getPolls } from '../api';
import PollCard from '../components/PollCard';
import Loading from '../components/Loading';

const PollsPage = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const res = await getPolls();
      const activePolls = res.data.filter((p) => p.status === 'active' && !p.is_deleted);
      setPolls(activePolls);
    } catch (err) {
      console.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="glass-card p-8 sm:p-10 mb-10 gradient-mesh">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Live Polls</h1>
                <p className="text-slate-400">Vote now and win big!</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-emerald-400">{polls.length} Active</span>
          </div>
        </div>
      </div>
      
      {polls.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Active Polls</h3>
          <p className="text-slate-400">Check back soon for new voting opportunities!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {polls.map((poll, idx) => (
            <div key={poll.poll_id} className="animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
              <PollCard poll={poll} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PollsPage;
