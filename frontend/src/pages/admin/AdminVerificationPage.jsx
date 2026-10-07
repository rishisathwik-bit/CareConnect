import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Wrench,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function AdminVerificationPage() {
  const { success, error } = useToast();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/providers/admin/all');
      if (res.success) {
        setProviders(res.data);
      }
    } catch (err) {
      error(`Failed to load providers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (providerProfile) => {
    setActionLoadingId(providerProfile._id);
    try {
      const res = await api.put(`/providers/${providerProfile._id}/verify`, {
        status: 'verified',
        verificationNotes: 'Credentials inspected and approved by Platform Administrator.'
      });

      if (res.success) {
        success(`Verified: ${providerProfile.user?.name || providerProfile.businessName}`);
        fetchProviders();
      }
    } catch (err) {
      error(`Verification failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReject = (providerProfile) => {
    setSelectedProvider(providerProfile);
    setRejectNotes('Trade license or insurance document unreadable or expired. Please upload valid proof.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    setActionLoadingId(selectedProvider._id);
    try {
      const res = await api.put(`/providers/${selectedProvider._id}/verify`, {
        status: 'rejected',
        verificationNotes: rejectNotes
      });

      if (res.success) {
        success(`Status set to Rejected for ${selectedProvider.businessName}`);
        setRejectModalOpen(false);
        fetchProviders();
      }
    } catch (err) {
      error(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.verificationStatus === statusFilter;
  });

  const pendingCount = providers.filter((p) => p.verificationStatus === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Provider Verification Queue
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Inspect uploaded licenses, surety bonds, and liability insurance before granting platform trust badges.
          </p>
        </div>

        <button
          onClick={fetchProviders}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit text-xs font-medium">
        {['pending', 'verified', 'rejected', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-1.5 rounded-xl capitalize transition ${
              statusFilter === tab
                ? 'bg-white text-slate-900 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'pending' ? `Pending Review (${pendingCount})` : tab}
          </button>
        ))}
      </div>

      {/* Verification Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading verification pipeline...</div>
      ) : filteredProviders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
          <p className="text-sm font-semibold">No provider profiles currently in this filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProviders.map((p) => {
            const isPending = p.verificationStatus === 'pending';
            const isActionRunning = actionLoadingId === p._id;

            return (
              <div
                key={p._id}
                className={`bg-white rounded-3xl border p-6 shadow-sm transition space-y-6 ${
                  isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                }`}
              >
                {/* Provider Card Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base overflow-hidden border border-indigo-200">
                      {p.user?.avatar ? (
                        <img src={p.user.avatar} alt={p.user.name} className="w-full h-full object-cover" />
                      ) : (
                        p.user?.name?.charAt(0) || 'P'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base">{p.businessName}</h3>
                        <StatusBadge status={p.verificationStatus} />
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Lead Technician: <strong>{p.user?.name}</strong></span>
                        <span>•</span>
                        <span>{p.user?.email}</span>
                        <span>•</span>
                        <span>{p.user?.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-400 block">Rate / Experience</span>
                    <strong className="text-slate-800 text-sm">
                      ${p.hourlyRate}/hr • {p.experienceYears || 0} years exp
                    </strong>
                  </div>
                </div>

                {/* Bio & Categories */}
                <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2">
                  <p className="text-slate-700 leading-relaxed">{p.bio}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-slate-400 font-semibold mr-1">Skills:</span>
                    {(p.skills || []).map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Uploaded Documents Inspection */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-violet-600" />
                    <span>Compliance & Verification Documents ({p.documents?.length || 0})</span>
                  </h4>

                  {(p.documents || []).length === 0 ? (
                    <div className="text-xs text-slate-400 italic">
                      No documents uploaded yet by provider.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {p.documents.map((doc, dIdx) => (
                        <div
                          key={dIdx}
                          className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{doc.title}</div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                                Type: {doc.docType} • Status: <span className="font-bold capitalize">{doc.status}</span>
                              </div>
                            </div>
                          </div>

                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Inspect Document"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verification Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {p.verificationNotes ? `Notes: ${p.verificationNotes}` : 'Ready for admin review'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReject(p)}
                      disabled={isActionRunning}
                      className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject / Revoke</span>
                    </button>

                    <button
                      onClick={() => handleVerify(p)}
                      disabled={isActionRunning}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isActionRunning ? 'Verifying...' : 'Approve & Verify Badge'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-bold text-slate-900 text-base">
              Reject Provider Credentials: {selectedProvider.businessName}
            </h3>
            <p className="text-slate-500">
              Please enter the explanation so the provider can re-submit the required documents.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rejection Reason / Notes
                </label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
