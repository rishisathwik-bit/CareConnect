import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Wrench, Lock, Mail, ArrowRight, Sparkles, User, Activity, Headphones, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, demoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        success(`Welcome back, ${res.user.name}!`);
        redirectByRole(res.user.role);
      }
    } catch (err) {
      error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleId) => {
    setLoading(true);
    try {
      const res = await demoLogin(roleId);
      if (res.success) {
        success(`Logged in as ${res.user.name} (${res.user.role})`);
        redirectByRole(res.user.role);
      }
    } catch (err) {
      error(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    switch (role) {
      case 'customer':
        navigate('/customer/dashboard');
        break;
      case 'provider':
        navigate('/provider/dashboard');
        break;
      case 'operations':
        navigate('/operations/dashboard');
        break;
      case 'support':
        navigate('/support/disputes');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const DEMO_PRESETS = [
    { role: 'customer', title: 'Customer', name: 'Alice Johnson', icon: User, color: 'hover:border-emerald-400' },
    { role: 'provider', title: 'Provider', name: 'David Miller', icon: Wrench, color: 'hover:border-indigo-400' },
    { role: 'operations', title: 'Operations', name: 'Marcus Brody', icon: Activity, color: 'hover:border-sky-400' },
    { role: 'support', title: 'Support', name: 'Sarah Chen', icon: Headphones, color: 'hover:border-amber-400' },
    { role: 'admin', title: 'Admin', name: 'Victoria Vance', icon: Shield, color: 'hover:border-violet-400' }
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-100">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign in to CareConnect</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your bookings, jobs, operations, or platform controls
          </p>
        </div>

        {/* 1-Click Evaluation Presets */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              1-Click Demo Persona Login
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEMO_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.role}
                  type="button"
                  onClick={() => handleQuickLogin(preset.role)}
                  disabled={loading}
                  className={`p-2 rounded-xl bg-white border border-slate-200 text-left transition ${preset.color} hover:shadow-sm text-xs`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Icon className="w-3 h-3 text-slate-500" />
                    <span>{preset.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider absolute">
            or sign in with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
