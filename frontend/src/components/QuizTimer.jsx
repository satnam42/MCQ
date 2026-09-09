import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';

const QuizTimer = ({ seconds, setSeconds }) => {
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [setSeconds]);

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-900 text-amber-400 px-3 py-1.5 rounded-lg border border-slate-800 text-sm font-mono font-bold shadow-inner">
      <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
      <span>{formatTime(seconds)}</span>
    </div>
  );
};

export default QuizTimer;
