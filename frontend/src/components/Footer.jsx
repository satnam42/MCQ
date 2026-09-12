import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-sm space-y-4 md:space-y-0">
        <div>
          <p className="font-semibold text-white">MCQ Preparation Platform</p>
          <p className="text-xs text-slate-500 mt-1">Authoritative competitive exam preparation suite</p>
        </div>
        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} MCQ Preparation Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
