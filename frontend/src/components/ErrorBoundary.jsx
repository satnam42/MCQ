import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoDashboard = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-gurmukhi">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ (Something Went Wrong)
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                ਅਸੀਂ ਇਸ ਅਣਪਛਾਤੀ ਸਮੱਸਿਆ ਲਈ ਮੁਆਫੀ ਚਾਹੁੰਦੇ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਪੰਨੇ ਨੂੰ ਰਿਫ੍ਰੈਸ਼ ਕਰੋ ਜਾਂ ਡੈਸ਼ਬੋਰਡ ’ਤੇ ਵਾਪਸ ਜਾਓ।
              </p>
              <p className="text-slate-500 text-xs font-mono pt-1">
                We encountered an unexpected error displaying this component.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-colors flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ਰਿਫ੍ਰੈਸ਼ ਕਰੋ (Refresh)</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoDashboard}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center space-x-2 border border-slate-600 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-300" />
                <span>ਡੈਸ਼ਬੋਰਡ (Dashboard)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
