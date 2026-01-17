import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, XCircle, Users, IndianRupee, Crown, Medal } from 'lucide-react';
import { getPoll, getPollResults, getMyResult } from '../api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const ResultDetailPage = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState(null);
  const [myResult, setMyResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [pollId]);

  const loadData = async () => {
    try {
      const [pollRes, resultsRes, myResultRes] = await Promise.all([
        getPoll(pollId),
        getPollResults(pollId),
        getMyResult(pollId),
      ]);
      setPoll(pollRes.data);
      setResults(resultsRes.data);
      setMyResult(myResultRes.data);
    } catch (err) {
      showToast('Failed to load results', 'error');
      navigate('/results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!poll || !results) return null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/results')}
        className="flex items-center gap-2 text-slate-400 hover:text-sky-400 mb-8 transition group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Results</span>
      </button>

      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="p-8 sm:p-10 border-b border-slate-700/50 gradient-mesh">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{poll.title}</h1>
            <span className="badge badge-danger flex-shrink-0">Ended</span>
          </div>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">{poll.description}</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card-light p-4 rounded-xl text-center">
              <Users className="w-6 h-6 text-sky-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{results.total_votes}</p>
              <p className="text-xs text-slate-400">Total Votes</p>
            </div>
            <div className="glass-card-light p-4 rounded-xl text-center">
              <IndianRupee className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">₹{results.total_amount}</p>
              <p className="text-xs text-slate-400">Prize Pool</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="p-8 sm:p-10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-400" />
            Final Results
          </h3>
          
          <div className="space-y-4 mb-10">
            {results.option_results?.map((option, idx) => (
              <div
                key={option.option_id}
                className={`p-5 rounded-2xl border-2 transition-all ${
                  option.is_winner 
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' 
                    : 'border-slate-700/50 bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {option.is_winner ? (
                      <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                        <span className="font-bold text-slate-400">#{idx + 1}</span>
                      </div>
                    )}
                    <span className={`font-bold text-lg ${option.is_winner ? 'text-emerald-400' : 'text-white'}`}>
                      {option.text}
                    </span>
                  </div>
                  {option.is_winner && (
                    <span className="badge badge-success">Winner</span>
                  )}
                </div>
                
                <div className="progress-bar mb-3">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${option.percentage}%`,
                      background: option.is_winner 
                        ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' 
                        : 'linear-gradient(90deg, #0ea5e9 0%, #8b5cf6 100%)'
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{option.vote_count} votes</span>
                  <span className={`font-bold ${option.is_winner ? 'text-emerald-400' : 'text-sky-400'}`}>
                    {option.percentage?.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* My Result */}
          {myResult?.participated && (
            <div className={`p-8 rounded-2xl border-2 ${
              myResult.result_status === 'won'
                ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5'
                : 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5'
            }`}>
              <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5" />
                Your Results
              </h4>
              <p className="text-slate-300 mb-6">
                You placed {myResult.total_votes} vote(s) worth ₹{myResult.total_spent}
              </p>
              
              {myResult.result_status === 'won' ? (
                <div className="flex items-center gap-4 p-5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <div className="w-14 h-14 rounded-xl gradient-success flex items-center justify-center glow-success">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-bold text-sm mb-1">Congratulations!</p>
                    <p className="text-3xl font-bold text-white">You Won ₹{myResult.winning_amount}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="w-14 h-14 rounded-xl gradient-danger flex items-center justify-center">
                    <XCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-red-400 font-semibold">Better luck next time!</p>
                    <p className="text-slate-400 text-sm">Keep voting to increase your chances</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDetailPage;
