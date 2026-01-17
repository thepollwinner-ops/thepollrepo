import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, XCircle, Users, IndianRupee } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/results')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Results
      </button>

      <div className="card p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{poll.title}</h1>
          <p className="text-gray-600 text-lg leading-relaxed">{poll.description}</p>
        </div>

        <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-xl mb-8">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gray-700">{results.total_votes} total votes</span>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gray-700">₹{results.total_amount} collected</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-4">Results:</h3>
        <div className="space-y-4 mb-8">
          {results.option_results?.map((option) => (
            <div
              key={option.option_id}
              className={`p-5 rounded-xl border-2 ${
                option.is_winner ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`font-semibold ${option.is_winner ? 'text-green-700' : 'text-gray-800'}`}>
                  {option.text}
                </span>
                {option.is_winner && (
                  <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                    <Trophy className="w-4 h-4" />
                    Winner
                  </span>
                )}
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    option.is_winner
                      ? 'bg-gradient-to-r from-green-400 to-green-500'
                      : 'bg-gradient-to-r from-primary-400 to-primary-500'
                  }`}
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{option.vote_count} votes</span>
                <span>{option.percentage?.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>

        {myResult?.participated && (
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 p-6 rounded-xl">
            <h4 className="font-bold text-primary-800 mb-3">Your Participation</h4>
            <p className="text-gray-600 mb-4">
              You spent ₹{myResult.total_spent} on {myResult.total_votes} vote(s)
            </p>
            {myResult.result_status === 'won' ? (
              <div className="inline-flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-xl font-bold">
                <Trophy className="w-5 h-5" />
                You won ₹{myResult.winning_amount}!
              </div>
            ) : myResult.result_status === 'lost' ? (
              <div className="inline-flex items-center gap-2 px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold">
                <XCircle className="w-5 h-5" />
                Better luck next time!
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDetailPage;
