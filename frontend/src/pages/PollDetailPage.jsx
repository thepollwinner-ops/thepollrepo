import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, IndianRupee, List, Loader2 } from 'lucide-react';
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
      // Create purchase order
      const purchaseRes = await purchaseVotes(pollId, {
        poll_id: pollId,
        vote_count: voteCount,
        option_id: selectedOption,
      });

      const data = purchaseRes.data;

      // If auto-approved (test mode), cast vote immediately
      if (data.status === 'success') {
        await castVote(pollId, {
          option_id: selectedOption,
          vote_count: voteCount,
        });
        showToast('Vote cast successfully! 🎉', 'success');
        navigate('/');
        return;
      }

      // If payment session available, redirect to Cashfree
      if (data.payment_session_id) {
        // Store pending vote info
        sessionStorage.setItem('pendingVote', JSON.stringify({
          pollId,
          optionId: selectedOption,
          voteCount,
        }));

        // Redirect to Cashfree checkout in same window
        const checkoutUrl = `https://payments.cashfree.com/forms?sessionId=${data.payment_session_id}`;
        window.location.href = checkoutUrl;
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
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Polls
      </button>

      <div className="card p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{poll.title}</h1>
          <p className="text-gray-600 text-lg leading-relaxed">{poll.description}</p>
        </div>

        <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-xl mb-8">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gray-700">₹{poll.price_per_vote} per vote</span>
          </div>
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gray-700">{poll.options?.length} options</span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Select your option:</h3>
          <div className="space-y-3">
            {poll.options?.map((option) => (
              <div
                key={option.option_id}
                onClick={() => setSelectedOption(option.option_id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-4 ${
                  selectedOption === option.option_id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === option.option_id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedOption === option.option_id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
                <span className="font-medium text-gray-800">{option.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-4 mb-6">
            <label className="font-semibold text-gray-700">Number of votes:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={voteCount}
              onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-4 py-3 border-2 border-gray-200 rounded-xl text-center font-semibold focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="bg-gradient-to-r from-primary-50 to-purple-50 p-6 rounded-xl mb-6 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Amount:</span>
            <span className="text-3xl font-bold text-primary-600">₹{totalAmount}</span>
          </div>

          <button
            onClick={handleVote}
            disabled={processing || !selectedOption}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span>🗳️</span>
                Confirm & Pay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollDetailPage;
