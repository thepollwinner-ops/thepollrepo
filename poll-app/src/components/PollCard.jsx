import React from 'react';
import { Link } from 'react-router-dom';

const PollCard = ({ poll, isResult = false }) => {
  const linkPath = isResult ? `/results/${poll.poll_id}` : `/poll/${poll.poll_id}`;

  return (
    <Link to={linkPath} className="card p-6 block cursor-pointer border-2 border-transparent hover:border-primary-300">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-gray-900 text-lg">{poll.title}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
            poll.status === 'active'
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {poll.status}
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{poll.description}</p>
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <span className="text-primary-600 font-bold text-lg">₹{poll.price_per_vote}/vote</span>
        <span className="text-gray-400 text-sm">{poll.options?.length} options</span>
      </div>
    </Link>
  );
};

export default PollCard;
