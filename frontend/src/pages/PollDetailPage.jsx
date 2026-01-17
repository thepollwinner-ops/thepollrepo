import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, IndianRupee, Users, Clock, Loader2, Check, Minus, Plus } from 'lucide-react';
import { getPoll, purchaseVotes, castVote } from '../api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const PollDetailPage = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voteCount, setVoteCount] = useState(1);

  useEffect(() => {
    loadPoll();
  }, [pollId]);

  const loadPoll = async () => {
    try {
      const res = await getPoll(pollId);
      setPoll(res.data);
    } catch (err) {
      showToast('Failed to load poll', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption) {
      showToast('Please select an option', 'error');
      return;
    }

    setProcessing(true);
    try {
      const purchaseRes = await purchaseVotes(pollId, {
        poll_id: pollId,
        vote_count: voteCount,
        option_id: selectedOption,
      });

      const data = purchaseRes.data;

      if (data.status === 'success') {
        await castVote(pollId, {
          option_id: selectedOption,
          vote_count: voteCount,
        });
        showToast('Vote cast successfully! 🎉', 'success');
        navigate('/');
        return;
      }

      if (data.payment_session_id) {
        sessionStorage.setItem('pendingVote', JSON.stringify({
          pollId,
          optionId: selectedOption,
          voteCount,
        }));
        // Use Cashfree sandbox redirect checkout URL
        window.location.href = `https://sandbox.cashfree.com/pg/view/sessions/${data.payment_session_id}`;
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to process vote', 'error');
      setProcessing(false);
    }
  };

  if (loading) return <Loading />;
  if (!poll) return null;

  const totalAmount = voteCount * poll.price_per_vote;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-sky-400 mb-8 transition group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Polls</span>
      </button>

      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="p-8 sm:p-10 border-b border-slate-700/50 gradient-mesh">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{poll.title}</h1>
            <span className="badge badge-success flex-shrink-0">Live</span>
          </div>
          <p className="text-slate-300 text-lg leading-relaxed">{poll.description}</p>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-black/20">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400">Price per vote</p>
                <p className="font-bold text-white">₹{poll.price_per_vote}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-black/20">
              <Users className="w-5 h-5 text-sky-400" />
              <div>
                <p className="text-xs text-slate-400">Options</p>
                <p className="font-bold text-white">{poll.options?.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-8 sm:p-10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 text-sm">1</span>
            Select Your Prediction
          </h3>
          
          <div className="space-y-4 mb-10">
            {poll.options?.map((option) => (
              <button
                key={option.option_id}
                onClick={() => setSelectedOption(option.option_id)}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                  selectedOption === option.option_id
                    ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/20'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                }`}
              >
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selectedOption === option.option_id
                    ? 'border-sky-500 bg-sky-500'
                    : 'border-slate-500'
                }`}>
                  {selectedOption === option.option_id && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className={`font-semibold text-lg transition-colors ${
                  selectedOption === option.option_id ? 'text-white' : 'text-slate-300'
                }`}>
                  {option.text}
                </span>
              </button>
            ))}
          </div>

          {/* Vote Count */}
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 text-sm">2</span>
            Choose Vote Quantity
          </h3>
          
          <div className="flex items-center gap-6 mb-10">
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-2xl p-2">
              <button
                onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-16 text-center text-2xl font-bold text-white">{voteCount}</span>
              <button
                onClick={() => setVoteCount(Math.min(100, voteCount + 1))}
                className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="text-slate-400">
              <span className="text-sm">Quick select:</span>
              <div className="flex gap-2 mt-2">
                {[5, 10, 25, 50].map(n => (
                  <button
                    key={n}
                    onClick={() => setVoteCount(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      voteCount === n 
                        ? 'bg-sky-500 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Total & Submit */}
          <div className="glass-card-light p-6 rounded-2xl mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Amount</p>
                <p className="text-4xl font-bold text-white">
                  ₹<span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">{totalAmount}</span>
                </p>
              </div>
              <div className="text-right text-slate-400 text-sm">
                <p>{voteCount} vote{voteCount > 1 ? 's' : ''} × ₹{poll.price_per_vote}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleVote}
            disabled={processing || !selectedOption}
            className="btn btn-primary w-full py-5 text-lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Confirm & Pay ₹{totalAmount}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Sparkles = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export default PollDetailPage;
