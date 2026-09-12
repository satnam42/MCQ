import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle, UserCheck, ShieldCheck, KeyRound } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      const user = await login(demoEmail, demoPassword);
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Quick Login failed:', err);
      setError(err.response?.data?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 max-w-md w-full space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 font-extrabold text-sm tracking-tight">
            MCQ
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Sign In
          </h1>
          <p className="text-xs text-slate-500">
            MCQ Preparation Portal
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Quick Login Buttons */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            1-Click Instant Login
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('navjot@gmail.com', 'fundo@123')}
              disabled={loading}
              className="col-span-2 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Login as Navjot (navjot@gmail.com)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('candidate@punjabi.com', 'Candidate@12345')}
              disabled={loading}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-[11px] flex items-center justify-center space-x-1 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Candidate</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@punjabi.com', 'Admin@12345')}
              disabled={loading}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 font-bold rounded-xl text-[11px] flex items-center justify-center space-x-1 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">OR ENTER CREDENTIALS</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1">Email Address:</label>
            <input
              type="email"
              required
              placeholder="navjot@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 font-normal"
            />
          </div>

          <div>
            <label className="block mb-1">Password:</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 font-normal"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-sm shadow-md disabled:opacity-40 transition-all flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-600 font-bold hover:underline">
              Register here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
