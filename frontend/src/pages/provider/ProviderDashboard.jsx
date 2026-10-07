import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import {
  Wrench,
  DollarSign,
  Briefcase,
  Star,
  Clock,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Send,
  Camera,
  CheckCircle2
} from 'lucide-react';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    try {
      const [profileRes, bookingsRes, requestsRes] = await Promise.all([
        api.get('/providers/profile/me'),
        api.get('/bookings'),
        api.get('/requests')
      ]);

      if (profileRes.success) setProfile(profileRes.data);
      if (bookingsRes.success) setActiveJobs(bookingsRes.data);
      if (requestsRes.success) setOpportunities(requestsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Loading provider portal...</div>;
  }

  const ongoingJobs = activeJobs.filter((b) => ['scheduled', 'en_route', 'in_progress'].includes(b.status));
  const completedJobs = activeJobs.filter((b) => b.status === 'completed');
  const estimatedEarnings = completedJobs.reduce((sum, b) => sum + (b.pricing?.laborCost || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-indigo-800/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Provider Hub
            </span>
            <StatusBadge status={profile?.verificationStatus} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {profile?.businessName || user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Standard Rate: <strong>${profile?.hourlyRate || 50}/hr</strong> •{' '}
            {profile?.serviceAreas?.join(', ') || 'San Francisco'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/provider/schedule"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Manage Slots</span>
          </Link>
          <Link
            to="/provider/opportunities"
            className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Find Job Requests</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Jobs
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{ongoingJobs.length}</span>
            <span className="text-xs text-indigo-600 font-semibold">In Progress</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Completed Jobs
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {profile?.completedJobsCount || completedJobs.length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Total Delivered</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Customer Rating
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900">
              {profile?.ratingAverage?.toFixed(1) || '5.0'}
            </span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="text-xs text-slate-400">({profile?.ratingCount || 0} reviews)</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Est. Earnings
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              ${estimatedEarnings}
            </span>
            <span className="text-xs text-teal-600 font-semibold">Labor Payouts</span>
          </div>
        </div>
      </div>

      {/* Active Jobs in Progress */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-600" />
            <span>Assigned Jobs Requiring Action ({ongoingJobs.length})</span>
          </h2>
        </div>

        {ongoingJobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            No jobs currently in progress. Check the{' '}
            <Link to="/provider/opportunities" className="text-indigo-600 font-bold">
              Job Opportunities Feed
            </Link>{' '}
            to submit quotes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ongoingJobs.map((b) => (
              <div
                key={b._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={b.status} />
                    <span className="text-xs text-slate-400 font-semibold">
                      Booking #{b._id.slice(-6)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">
                    {b.category?.name || 'Service Job'}
                  </h3>

                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(b.scheduledDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Customer:</span>
                      <span>{b.customer?.name} ({b.customer?.phone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Address:</span>
                      <span className="truncate">{b.serviceAddress?.street}, {b.serviceAddress?.city}</span>
                    </div>
                  </div>

                  {b.trackingEvents && b.trackingEvents.length > 0 && (
                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 mb-4">
                      <span className="font-bold text-slate-700 block text-[11px]">Latest Note:</span>
                      <span className="italic">"{b.trackingEvents[b.trackingEvents.length - 1]?.note}"</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">
                    Labor: ${b.pricing?.laborCost}
                  </span>
                  <Link
                    to={`/provider/bookings/${b._id}`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Manage Job & Upload Evidence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Open Opportunities Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Open Requests in Your Service Category ({opportunities.length})
          </h2>
          <Link
            to="/provider/opportunities"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            View all opportunities →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.slice(0, 4).map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={req.status} />
                  <StatusBadge status={req.urgency} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{req.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{req.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Target Budget: <strong className="text-slate-900">${req.budget}</strong>
                </span>
                <Link
                  to="/provider/opportunities"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1"
                >
                  <span>Submit Quote</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
