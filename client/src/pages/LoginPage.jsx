import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const demoAccounts = [
    { role: 'OWNER', email: 'owner@hive.demo', pass: 'HiveDemo@123', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { role: 'ADMIN', email: 'admin@hive.demo', pass: 'HiveDemo@123', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    { role: 'MEMBER', email: 'member@hive.demo', pass: 'HiveDemo@123', color: 'bg-slate-50 text-slate-800 border-slate-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
            H
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back to Hive
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Real-time collaborative project management platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        {/* Main Login Form */}
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          <ErrorMessage message={error} onClose={() => setError('')} className="mb-6" />

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />

            <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Box */}
        <div className="bg-white py-6 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
            </svg>
            <h3 className="text-base font-semibold text-slate-900">Demo Credentials</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Click "Use" to auto-fill the login form with test RBAC accounts:
          </p>

          <div className="space-y-3">
            {demoAccounts.map((acc) => (
              <div
                key={acc.role}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${acc.color}`}
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold mb-0.5">
                    <span className="uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-white/70 border border-black/10">
                      {acc.role}
                    </span>
                    <span>{acc.email}</span>
                  </div>
                  <div className="text-slate-500 font-mono">Password: {acc.pass}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUseDemo(acc.email, acc.pass)}
                  className="px-2.5 py-1 font-medium bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
