import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  Shield,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  Percent,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard() {
  const { error } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await api.get('/analytics/admin');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      error('Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Loading admin dashboard...</div>;
  }

  const financials = data?.financials || {};
  const users = data?.users || {};
  const bookings = data?.bookings || {};
  const categoryStats = data?.categoryStats || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-violet-800/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Platform Administration
            </span>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[11px] font-semibold">
              Executive Analytics & Controls
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            CareConnect Marketplace Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Financial volume, platform fee commissions, provider verification auditing, and catalog controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/verification"
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-lg shadow-violet-500/30 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Providers ({users.pendingVerification || 0})</span>
          </Link>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total GMV (Volume)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">${financials.gmv || 0}</span>
            <span className="text-xs text-emerald-600 font-semibold">+12% MoM</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Platform Net Revenue
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-violet-600">
              ${financials.platformRevenue || 0}
            </span>
            <span className="text-xs text-slate-400 font-semibold">10% Take Rate</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active User Base
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{users.total || 0}</span>
            <span className="text-xs text-slate-500 font-semibold">
              ({users.customers} Cust, {users.providers} Pros)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Completed Bookings
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">
              {bookings.completed || 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              of {bookings.total || 0} total
            </span>
          </div>
        </div>
      </div>

      {/* Admin Modules Quick Launch Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Link
          to="/admin/categories"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-violet-600 transition">Categories & Skills</h3>
              <span className="text-xs text-slate-400">Manage catalog taxonomy</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 transition" />
        </Link>

        <Link
          to="/admin/verification"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-violet-600 transition">Provider Verification</h3>
              <span className="text-xs text-slate-400">Review licenses & badges</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 transition" />
        </Link>

        <Link
          to="/admin/pricing"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-violet-600 transition">Pricing & Fees</h3>
              <span className="text-xs text-slate-400">Commission & surge rules</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 transition" />
        </Link>

        <Link
          to="/admin/audit"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-violet-600 transition">Audit Trail Logs</h3>
              <span className="text-xs text-slate-400">Security & dispatch history</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 transition" />
        </Link>
      </div>

      {/* Category Performance Matrix */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Booking Volume by Category
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categoryStats.map((cat, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-800 text-sm block">
                  {cat.categoryName}
                </span>
                <span className="text-xs text-slate-400">{cat.count} total bookings</span>
              </div>
              <span className="text-base font-extrabold text-indigo-700">
                ${cat.totalAmount || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
