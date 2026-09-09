import React from 'react';

const ProgressBar = ({ current, total }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((current / total) * 100)));

  return (
    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
      <div
        className="bg-amber-500 h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;
