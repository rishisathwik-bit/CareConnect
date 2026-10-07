import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  PlusCircle,
  FileText,
  AlertCircle,
  Wrench,
  CheckCircle2
} from 'lucide-react';

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bookingsRes, requestsRes] = await Promise.all([
          api.get('/bookings'),
          api.get('/requests')
        ]);
        if (bookingsRes.success) setBookings(bookingsRes.data);
        if (requestsRes.success) setRequests(requestsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const activeBookings = bookings.filter((b) =>
    ['scheduled', 'en_route', 'in_progress', 'disputed'].includes(b.status)
  );
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const openRequests = requests.filter((r) => ['open', 'quoted'].includes(r.status));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Action CTA */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-indigo-700/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>CareConnect AI Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Customer Service Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            Track your ongoing jobs, compare provider quotes, and book verified specialists.
          </p>
        </div>

        <Link
          to="/customer/new-request"
          className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition flex items-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>New AI Service Request</span>
        </Link>
      </div>

      {/* KPI Stats Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Jobs
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {activeBookings.length}
            </span>
            <span className="text-xs text-indigo-600 font-semibold">In Progress / Scheduled</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Open Requests
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {openRequests.length}
            </span>
            <span className="text-xs text-purple-600 font-semibold">Awaiting Quotes / Selection</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Completed Services
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {completedBookings.length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Verified Work</span>
          </div>
        </div>
      </div>

      {/* Active Jobs in Progress */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Active & Upcoming Jobs</span>
          </h2>
        </div>

        {activeBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
            <p className="text-sm">You have no active bookings right now.</p>
            <Link
              to="/customer/new-request"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-2"
            >
              Request a service <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeBookings.map((b) => (
              <div
                key={b._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusBadge status={b.status} />
                    <span className="text-xs font-semibold text-slate-400">
                      ID: #{b._id.slice(-6)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">
                    {b.category?.name || 'Service Booking'}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(b.scheduledDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.timeSlot}</span>
                  </div>

                  {/* Provider Snapshot */}
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                    <img
                      src={b.provider?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                      alt={b.provider?.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {b.provider?.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Assigned Professional
                      </span>
                    </div>
                  </div>

                  {/* Latest tracking note */}
                  {b.trackingEvents && b.trackingEvents.length > 0 && (
                    <div className="text-xs text-slate-600 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100/80 mb-4">
                      <span className="font-bold text-indigo-900 block mb-0.5">Latest Update:</span>
                      <span className="italic">"{b.trackingEvents[b.trackingEvents.length - 1]?.note}"</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="font-extrabold text-slate-900 text-sm">
                    ${b.pricing?.totalAmount || 0}
                  </span>
                  <Link
                    to={`/customer/bookings/${b._id}`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>Track Live Job & Evidence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open Service Requests awaiting Quotes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span>My Service Requests ({openRequests.length})</span>
          </h2>
        </div>

        {openRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500 text-xs">
            No open requests currently awaiting quotes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={req.status} />
                    <StatusBadge status={req.urgency} />
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">
                    {req.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {req.description}
                  </p>

                  {/* AI Extracted Skills */}
                  {req.aiClassification?.suggestedSkills && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {req.aiClassification.suggestedSkills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Budget: <strong>${req.budget}</strong>
                  </span>
                  <Link
                    to={`/customer/requests/${req._id}`}
                    className="px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>View Quotes & Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed History */}
      {completedBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Completed Service History</span>
          </h2>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Total Paid</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {b.category?.name}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {b.provider?.name}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(b.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      ${b.pricing?.totalAmount}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/customer/bookings/${b._id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        View Receipt & Evidence
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
