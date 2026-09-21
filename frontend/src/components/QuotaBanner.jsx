import React from 'react';
import { ShieldAlert, CheckCircle2, Clock, Lock, Sparkles, AlertCircle } from 'lucide-react';

const QuotaBanner = ({ quota, testTypeName = 'Test', className = '' }) => {
  if (!quota) return null;

  const {
    used = 0,
    limit,
    remaining,
    period = 'daily',
    isUnlimited = false,
    isBlocked = false,
    isAllowed = true,
    resetAt,
  } = quota;

  // Format reset time string
  const formatReset = (isoString) => {
    if (!isoString) return 'at midnight';
    try {
      const date = new Date(isoString);
      return `on ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return String(isoString);
    }
  };

  // Case 1: Test Type Disabled or Blocked
  if (isBlocked || (limit === 0 && !isUnlimited) || (!isAllowed && (remaining === 0 || remaining === undefined) && !used)) {
    return (
      <div className={`bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
          <Lock className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm flex items-center space-x-2">
            <span>{testTypeName} Disabled</span>
            <span className="bg-rose-200 text-rose-900 text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider">
              Blocked
            </span>
          </div>
          <p className="text-xs text-rose-700 mt-0.5">
            This test type is currently disabled for your account. Please contact an administrator for access.
          </p>
        </div>
      </div>
    );
  }

  // Case 2: Unlimited Access Badge
  if (isUnlimited) {
    return (
      <div className={`bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm flex items-center space-x-2">
            <span>{testTypeName} Quota</span>
            <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Unlimited Access</span>
            </span>
          </div>
          <p className="text-xs text-emerald-700 mt-0.5">
            You have unlimited test attempts for this test type.
          </p>
        </div>
      </div>
    );
  }

  // Case 3: Standard Limited Quota
  const isLimitReached = remaining === 0 || !isAllowed;
  const periodLabel = period ? `${period.charAt(0).toUpperCase()}${period.slice(1)}` : 'Daily';

  return (
    <div
      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
        isLimitReached
          ? 'bg-amber-50 border-amber-300 text-amber-950'
          : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
      } ${className}`}
    >
      <div className="flex items-center space-x-3.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isLimitReached ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-600'
          }`}
        >
          {isLimitReached ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        </div>
        <div>
          <div className="font-bold text-sm flex items-center space-x-2">
            <span>{periodLabel} Quota:</span>
            <span className="font-extrabold text-slate-900">
              {used} / {limit !== null && limit !== undefined ? limit : '∞'} used
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2">
            {isLimitReached ? (
              <span className="text-amber-800 font-bold">
                ⚠️ Limit reached ({remaining ?? 0} attempts remaining).
              </span>
            ) : (
              <span className="text-indigo-800 font-semibold">
                {remaining} attempt{remaining !== 1 ? 's' : ''} remaining.
              </span>
            )}
            {resetAt && (
              <span className="text-slate-500 font-mono text-[11px]">
                • Resets {formatReset(resetAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="self-end sm:self-auto">
        {isLimitReached ? (
          <span className="px-3 py-1 bg-amber-200 text-amber-900 text-xs font-black rounded-lg uppercase tracking-wider">
            Quota Exhausted
          </span>
        ) : (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg">
            Active
          </span>
        )}
      </div>
    </div>
  );
};

export default QuotaBanner;
