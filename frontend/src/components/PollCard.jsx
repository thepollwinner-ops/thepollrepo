import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, IndianRupee } from 'lucide-react';

const PollCard = ({ poll, isResult = false }) => {
  const linkPath = isResult ? `/results/${poll.poll_id}` : `/poll/${poll.poll_id}`;

  return (
    <Link to={linkPath} className="group block">
      <div className="glass-card p-6 h-full transition-all duration-300 hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-white text-lg leading-snug pr-4 group-hover:text-sky-400 transition-colors">
            {poll.title}
          </h3>
          <span className={`badge flex-shrink-0 ${poll.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
            {poll.status === 'active' ? 'Live' : 'Ended'}
          </span>
        </div>
        
        <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed">
          {poll.description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <IndianRupee className="w-4 h-4" />
              <span className="font-bold">{poll.price_per_vote}</span>
              <span className="text-slate-500 text-sm">/vote</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">{poll.options?.length} options</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500 transition-all duration-300">
            <ArrowRight className="w-5 h-5 text-sky-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PollCard;
