import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, 'candidate');
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 max-w-md w-full space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 font-bold font-gurmukhi text-2xl">
            ਪ੍ਰ
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Create Account
          </h1>
          <p className="text-xs text-slate-500">
            Punjabi Lecturer Cadre Candidate Registration
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1">Full Name:</label>
            <input
              type="text"
              required
              placeholder="Candidate Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 font-normal"
            />
          </div>

          <div>
            <label className="block mb-1">Email Address:</label>
            <input
              type="email"
              required
              placeholder="candidate@example.com"
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
              placeholder="Minimum 6 characters"
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
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Registering...' : 'Register'}</span>
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-amber-600 font-bold hover:underline">
              Sign In here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
