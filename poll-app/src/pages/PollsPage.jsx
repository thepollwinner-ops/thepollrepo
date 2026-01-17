import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Active Polls</h1>
      
      {polls.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No active polls available</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <PollCard key={poll.poll_id} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PollsPage;
