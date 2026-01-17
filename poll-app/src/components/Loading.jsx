import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );
};

export default Loading;
