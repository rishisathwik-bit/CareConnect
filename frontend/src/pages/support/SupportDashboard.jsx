import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Headphones,
  ShieldAlert,
  MessageSquare,
  DollarSign,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function SupportDashboard() {
  const { error } = useToast();
  const [disputes, setDisputes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes');
      if (res.success) {
        setDisputes(res.data);
      }
    } catch (err) {
      error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const filteredDisputes = statusFilter === 'all'
    ? disputes
    : disputes.filter((d) => d.status === statusFilter);

  if (loading) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Loading support queue...</div>;
  }

  const openCount = disputes.filter((d) => ['open', 'under_review'].includes(d.status)).length;
  const resolvedCount = disputes.filter((d) => d.status === 'resolved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-amber-800/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Support Operations
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold">
              Disputes & Mediation Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Customer Complaints & Dispute Resolution
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Mediate service conflicts, inspect job photo evidence, and process customer refunds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-center">
            <span className="text-[10px] uppercase tracking-wider block text-amber-300">Pending Resolution</span>
            <span className="text-xl font-extrabold text-white">{openCount}</span>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-center">
            <span className="text-[10px] uppercase tracking-wider block text-emerald-300">Resolved</span>
            <span className="text-xl font-extrabold text-white">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Disputes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Dispute Tickets Queue ({filteredDisputes.length})</span>
          </h2>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['all', 'open', 'under_review', 'resolved', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredDisputes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No Active Disputes</h3>
            <p className="text-xs text-slate-400 mt-1">All customer complaints have been mediated and resolved.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDisputes.map((dispute) => (
              <div
                key={dispute._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={dispute.status} />
                    <span className="text-xs text-slate-400 font-semibold">
                      Ticket #{dispute._id.slice(-6)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1 capitalize">
                    Reason: {dispute.reason.replace('_', ' ')}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {dispute.description}
                  </p>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Raised By:</span>
                      <strong className="text-slate-800">{dispute.raisedBy?.name} ({dispute.raisedBy?.role})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Against:</span>
                      <strong className="text-slate-800">{dispute.against?.name} ({dispute.against?.role})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Desired Outcome:</span>
                      <span className="font-semibold text-amber-700 capitalize">
                        {dispute.desiredOutcome.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {dispute.messages?.length || 0} mediation messages
                  </span>

                  <Link
                    to={`/support/disputes/${dispute._id}`}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>Mediate & Resolve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
