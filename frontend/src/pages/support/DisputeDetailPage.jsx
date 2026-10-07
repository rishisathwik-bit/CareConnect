import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ShieldAlert,
  ArrowLeft,
  Send,
  MessageSquare,
  DollarSign,
  CheckCircle2,
  XCircle,
  Camera,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function DisputeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);

  // Message state
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Resolution state
  const [resolutionDecision, setResolutionDecision] = useState('partial_refund');
  const [refundAmount, setRefundAmount] = useState(50);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDispute();
  }, [id]);

  const fetchDispute = async () => {
    try {
      const res = await api.get(`/disputes/${id}`);
      if (res.success) {
        setDispute(res.data);
      }
    } catch (err) {
      error('Failed to load dispute');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const res = await api.post(`/disputes/${id}/messages`, { message: newMessage });
      if (res.success) {
        setNewMessage('');
        fetchDispute();
      }
    } catch (err) {
      error(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    setResolving(true);
    try {
      const res = await api.put(`/disputes/${id}/resolve`, {
        decision: resolutionDecision,
        refundAmount: ['full_refund', 'partial_refund'].includes(resolutionDecision) ? Number(refundAmount) : 0,
        notes: resolutionNotes
      });

      if (res.success) {
        success(`Dispute marked as ${res.data.status.toUpperCase()}!`);
        fetchDispute();
      }
    } catch (err) {
      error(err.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto p-12 text-center text-slate-500">Loading dispute ticket...</div>;
  }

  if (!dispute) {
    return <div className="max-w-5xl mx-auto p-12 text-center text-rose-500">Dispute not found.</div>;
  }

  const isResolved = dispute.status === 'resolved' || dispute.status === 'rejected';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/support/disputes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dispute Queue</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <StatusBadge status={dispute.status} />
              <span className="text-xs text-slate-400 font-semibold">
                Dispute #{dispute._id.slice(-6)}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 capitalize">
              {dispute.reason.replace('_', ' ')} Conflict
            </h1>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Parties Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Case Information
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Complainant (Customer):</span>
              <strong className="text-slate-900 text-sm">{dispute.raisedBy?.name}</strong>
              <span className="text-slate-500 block">{dispute.raisedBy?.email}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Respondent (Provider):</span>
              <strong className="text-slate-900 text-sm">{dispute.against?.name}</strong>
              <span className="text-slate-500 block">{dispute.against?.email}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Desired Outcome:</span>
              <span className="font-bold text-amber-700 capitalize">
                {dispute.desiredOutcome.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Claim Statement & Evidence */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Customer Statement & Claims
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            "{dispute.description}"
          </p>

          {/* Evidence Photos */}
          {dispute.evidence && dispute.evidence.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Attached Evidence Photos:
              </span>
              <div className="flex flex-wrap gap-3">
                {dispute.evidence.map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt="Evidence"
                    className="w-32 h-28 rounded-2xl object-cover border border-slate-200"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Panel (Active if not resolved) */}
      {!isResolved ? (
        <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-amber-950">
              Support Agent Resolution & Refund Panel
            </h2>
          </div>

          <form onSubmit={handleResolveDispute} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Resolution Decision
                </label>
                <select
                  value={resolutionDecision}
                  onChange={(e) => setResolutionDecision(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-900"
                >
                  <option value="partial_refund">Approve Partial Refund</option>
                  <option value="full_refund">Approve Full Refund</option>
                  <option value="rework_completed">Order Provider Warranty Rework</option>
                  <option value="rejected">Reject Dispute (No Refund Justified)</option>
                </select>
              </div>

              {['full_refund', 'partial_refund'].includes(resolutionDecision) && (
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">
                    Refund Amount ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-bold text-slate-900"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">
                Resolution Rationale & Official Note
              </label>
              <textarea
                rows="2"
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain the support mediation findings, inspection of photos, and refund instructions..."
                className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={resolving}
              className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-300 transition"
            >
              {resolving ? 'Processing Decision...' : 'Execute Resolution & Update Invoice'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-emerald-900 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base">
              Dispute Marked as {dispute.status.toUpperCase()}
            </h3>
          </div>
          <p className="text-xs">
            Decision: <strong>{dispute.resolution?.decision}</strong> • Refund Issued:{' '}
            <strong>${dispute.resolution?.refundAmount || 0}</strong>
          </p>
          {dispute.resolution?.notes && (
            <p className="text-xs italic bg-white/70 p-3 rounded-xl border border-emerald-100">
              "{dispute.resolution.notes}"
            </p>
          )}
        </div>
      )}

      {/* Mediation Discussion Thread */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <span>Mediation Chat & Statements Thread</span>
        </h2>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {dispute.messages?.map((msg, idx) => {
            const isMe = msg.sender?._id?.toString() === user?._id?.toString();
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-xs max-w-xl ${
                  msg.sender?.role === 'support'
                    ? 'bg-amber-50/80 border-amber-200 ml-auto'
                    : isMe
                    ? 'bg-indigo-50/80 border-indigo-200 ml-auto'
                    : 'bg-slate-50 border-slate-200 mr-auto'
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-4">
                  <span className="font-bold text-slate-900">
                    {msg.sender?.name} ({msg.sender?.role})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{msg.message}</p>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            required
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type mediation message or question..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={sendingMessage}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
