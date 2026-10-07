import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  Shield,
  Activity,
  Headphones,
  Check,
  X,
  Clock,
  UserCheck,
  AlertCircle,
  Eye,
  Copy,
  Search,
  Filter,
  User,
  Calendar,
  Key,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

const ROLE_META = {
  operations: {
    label: 'Operations Manager',
    icon: Activity,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  support: {
    label: 'Support Agent',
    icon: Headphones,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  admin: {
    label: 'Platform Admin',
    icon: Shield,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  customer: {
    label: 'Customer',
    icon: User,
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200'
  },
  provider: {
    label: 'Service Provider',
    icon: User,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  }
};

export default function AdminStaffApprovalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal for Reject Reason
  const [rejectModalTarget, setRejectModalTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Modal for viewing Login Details to give to user
  const [credentialModalTarget, setCredentialModalTarget] = useState(null);
  const [copied, setCopied] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/auth/admin/staff-requests?status=${statusFilter}`);
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Error fetching staff requests:', err);
      error('Failed to load staff registration requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user) => {
    setActionLoadingId(user._id);
    try {
      const res = await api.put(`/auth/admin/staff-requests/${user._id}/approve`);
      if (res.success) {
        success(`Registration accepted! ${user.name} is now an active ${user.role}.`);
        // Show credentials modal so Admin can give details personally to the applicant
        setCredentialModalTarget({
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        });
        fetchRequests();
      } else {
        error(res.message || 'Failed to approve user');
      }
    } catch (err) {
      error(err.message || 'Error approving staff user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalTarget) return;

    setActionLoadingId(rejectModalTarget._id);
    try {
      const res = await api.put(`/auth/admin/staff-requests/${rejectModalTarget._id}/reject`, {
        reason: rejectionReason
      });
      if (res.success) {
        success(`Registration request for ${rejectModalTarget.name} has been rejected.`);
        setRejectModalTarget(null);
        setRejectionReason('');
        fetchRequests();
      } else {
        error(res.message || 'Failed to reject request');
      }
    } catch (err) {
      error(err.message || 'Error rejecting staff user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.role?.toLowerCase().includes(q) ||
      r.registrationNotes?.toLowerCase().includes(q)
    );
  });

  const pendingCount = requests.filter((r) => r.approvalStatus === 'pending').length;

  const handleCopyCredentials = () => {
    if (!credentialModalTarget) return;
    const text = `CareConnect Login Credentials\nName: ${credentialModalTarget.name}\nEmail: ${credentialModalTarget.email}\nRole: ${credentialModalTarget.role}\nStatus: Active & Approved\nLogin URL: http://localhost:5173/login\n(Use the password chosen during registration)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    success('Login credentials text copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Platform Admin Security
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3" />
                  {pendingCount} Pending Review
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Staff Registration Requests & Approvals
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review and authorize applicant access for Operations Managers, Support Agents, and Admin staff roles.
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'All Staff' },
              { id: 'pending', label: 'Pending Approval', count: pendingCount },
              { id: 'approved', label: 'Active Staff' },
              { id: 'rejected', label: 'Declined' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      statusFilter === tab.id
                        ? 'bg-purple-800 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applicant name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Requests Table / Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-slate-500">Loading staff registration requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No staff requests found</h3>
            <p className="text-xs text-slate-500">
              {statusFilter === 'pending'
                ? 'There are currently no staff registration requests awaiting administrator approval.'
                : 'No registration records match your filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">Applicant</th>
                    <th className="py-3.5 px-6">Requested Role</th>
                    <th className="py-3.5 px-6">Submitted Date</th>
                    <th className="py-3.5 px-6">Application Notes</th>
                    <th className="py-3.5 px-6">Approval Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRequests.map((req) => {
                    const roleInfo = ROLE_META[req.role] || ROLE_META.operations;
                    const RoleIcon = roleInfo.icon;
                    const isPending = req.approvalStatus === 'pending';
                    const isApproved = req.approvalStatus === 'approved';
                    const isRejected = req.approvalStatus === 'rejected';

                    return (
                      <tr key={req._id} className="hover:bg-slate-50/80 transition">
                        {/* Applicant Name & Email */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
                              {req.name.charAt(0)}
                            </div>
                            <div>
                              <strong className="block font-bold text-slate-900 text-sm">
                                {req.name}
                              </strong>
                              <span className="text-slate-500 font-mono text-[11px] block">
                                {req.email}
                              </span>
                              {req.phone && (
                                <span className="text-slate-400 text-[10px] block">
                                  {req.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role Requested */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeColor}`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span>{roleInfo.label}</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                          <div>
                            {new Date(req.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(req.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="py-4 px-6 max-w-xs">
                          {req.registrationNotes ? (
                            <p className="text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                              "{req.registrationNotes}"
                            </p>
                          ) : (
                            <span className="text-slate-400 text-[11px]">— No notes provided —</span>
                          )}
                          {isRejected && req.rejectionReason && (
                            <p className="text-rose-600 text-[11px] mt-1 font-medium">
                              Reason: {req.rejectionReason}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                              <span>Pending Admin Review</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Active & Approved</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Declined</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={actionLoadingId === req._id}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept Request</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalTarget(req);
                                  setRejectionReason('');
                                }}
                                disabled={actionLoadingId === req._id}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </div>
                          ) : isApproved ? (
                            <button
                              onClick={() => setCredentialModalTarget(req)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1 ml-auto transition"
                            >
                              <Key className="w-3.5 h-3.5 text-purple-600" />
                              <span>View Login Details</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(req)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs ml-auto transition"
                            >
                              Re-Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Decline Registration Request
                </h3>
                <p className="text-xs text-slate-500">
                  {rejectModalTarget.name} ({rejectModalTarget.email})
                </p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Declining (Optional feedback)
                </label>
                <textarea
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Unverified identity or department quota reached..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === rejectModalTarget._id}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credential Details Modal - Admin can share personally with the user */}
      {credentialModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Staff Login Details
                  </h3>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Account Active & Authorized
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCredentialModalTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This account has been accepted by Platform Admin. Share these credentials personally with the user so they can log into their designated portal:
            </p>

            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans">Full Name:</span>
                <span className="text-white font-bold">{credentialModalTarget.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans">Login Email:</span>
                <span className="text-emerald-400 font-bold">{credentialModalTarget.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans">Authorized Role:</span>
                <span className="text-indigo-300 font-bold uppercase">{credentialModalTarget.role}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans">Password:</span>
                <span className="text-slate-300 italic font-sans">[Password set during registration]</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400 font-sans">Sign-in URL:</span>
                <span className="text-sky-300 underline">http://localhost:5173/login</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-200 flex items-center justify-center gap-2 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Login Details to Share'}</span>
              </button>
              <button
                onClick={() => setCredentialModalTarget(null)}
                className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
