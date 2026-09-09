import React from 'react';

const DifficultyBadge = ({ difficulty }) => {
  const diff = (difficulty || 'medium').toLowerCase();

  const styles = {
    easy: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    tough: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const labels = {
    easy: 'Easy',
    medium: 'Medium',
    tough: 'Tough',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[diff] || styles.medium
      }`}
    >
      {labels[diff] || diff}
    </span>
  );
};

export default DifficultyBadge;
