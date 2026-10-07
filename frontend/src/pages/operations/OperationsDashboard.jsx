import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Activity,
  AlertTriangle,
  Clock,
  User,
  Wrench,
  Calendar,
  CheckCircle2,
  Filter,
  Send,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  X
} from 'lucide-react';

export default function OperationsDashboard() {
  const { success, error } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Reassignment modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newProviderId, setNewProviderId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    fetchOpsData();
  }, []);

  const fetchOpsData = async () => {
    try {
      const [metricsRes, bookingsRes, provRes] = await Promise.all([
        api.get('/analytics/operations'),
        api.get('/bookings'),
        api.get('/providers?verifiedOnly=true')
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data);
      if (provRes.success) setProviders(provRes.data);
    } catch (err) {
      error('Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReassignModal = (booking) => {
    setSelectedBooking(booking);
    setNewProviderId(providers[0]?.user?._id || '');
    setReassignReason('Operations dispatch load balancing');
  };

  const handleReassignProvider = async (e) => {
    e.preventDefault();
    if (!selectedBooking || !newProviderId) return;

    setReassigning(true);
    try {
      const res = await api.put(`/bookings/${selectedBooking._id}/assign`, {
        newProviderId,
        reason: reassignReason
      });

      if (res.success) {
        success('Provider reassigned and notified via dispatch audit!');
        setSelectedBooking(null);
        fetchOpsData();
      }
    } catch (err) {
      error(err.message || 'Reassignment failed');
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Loading operations dispatch board...</div>;
  }

  const summary = metrics?.summary || {};
  const urgentRequests = metrics?.unassignedUrgentRequests || [];

  const filteredBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-sky-800/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
              Operations Control Center
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-semibold">
              Live Dispatch Board
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Booking & Dispatch Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Monitor real-time job execution, prevent SLA breaches, and manage manual provider dispatch.
          </p>
        </div>

        <button
          onClick={fetchOpsData}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition"
        >
          Refresh Live Feeds
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Scheduled</span>
          <span className="text-2xl font-extrabold text-indigo-600">{summary.scheduled || 0}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">En Route</span>
          <span className="text-2xl font-extrabold text-amber-600">{summary.enRoute || 0}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">In Progress</span>
          <span className="text-2xl font-extrabold text-cyan-600">{summary.inProgress || 0}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Completed</span>
          <span className="text-2xl font-extrabold text-emerald-600">{summary.completed || 0}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Disputed</span>
          <span className="text-2xl font-extrabold text-rose-600">{summary.disputed || 0}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Open Tickets</span>
          <span className="text-2xl font-extrabold text-purple-600">{summary.openDisputesCount || 0}</span>
        </div>
      </div>

      {/* SLA & Urgent Unassigned Alert Section */}
      {urgentRequests.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-amber-900">
              SLA Urgent Escalations: Unassigned Emergency Requests ({urgentRequests.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={req.urgency} />
                    <span className="text-xs font-bold text-slate-900">{req.category?.name}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 truncate max-w-sm">{req.title}</h4>
                  <span className="text-[11px] text-slate-400">
                    Customer: {req.customer?.name} ({req.customer?.phone})
                  </span>
                </div>

                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                  Budget ${req.budget}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Dispatch Management Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <span>All Bookings & Live Dispatches ({filteredBookings.length})</span>
          </h2>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['all', 'scheduled', 'en_route', 'in_progress', 'completed', 'disputed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Assigned Provider</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    #{b._id.slice(-6)}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    {b.category?.name}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <div className="font-semibold text-slate-800">{b.customer?.name}</div>
                    <div className="text-[10px] text-slate-400">{b.serviceAddress?.city}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <div className="font-semibold text-slate-800">{b.provider?.name}</div>
                    <div className="text-[10px] text-slate-400">{b.provider?.phone}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    <div>{new Date(b.scheduledDate).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">{b.timeSlot}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3.5 font-extrabold text-slate-900">
                    ${b.pricing?.totalAmount}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {['scheduled', 'en_route'].includes(b.status) && (
                      <button
                        onClick={() => handleOpenReassignModal(b)}
                        className="px-3 py-1.5 rounded-xl border border-sky-200 text-sky-700 hover:bg-sky-50 font-bold transition"
                      >
                        Reassign Pro
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider Reassignment Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                  Operations Dispatch
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Reassign Provider for Booking #{selectedBooking._id.slice(-6)}
                </h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignProvider} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Provider
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedBooking.provider?.name || 'Unassigned'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select New Verified Provider
                </label>
                <select
                  value={newProviderId}
                  onChange={(e) => setNewProviderId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  {providers.map((p) => (
                    <option key={p._id} value={p.user?._id}>
                      {p.user?.name} — {p.businessName} (${p.hourlyRate}/hr, {p.ratingAverage}★)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch & Reassignment Reason
                </label>
                <input
                  type="text"
                  required
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Current technician delayed due to emergency job"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={reassigning}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-200 transition"
              >
                {reassigning ? 'Dispatching...' : 'Confirm Provider Reassignment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
