import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0f172a]/90 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
      <p className="text-slate-400">Loading...</p>
    </div>
  );
};

export default Loading;
