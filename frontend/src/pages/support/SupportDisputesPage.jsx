import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Headphones,
  AlertOctagon,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Wrench,
  MessageSquare,
  Send,
  FileText,
  ShieldCheck,
  RefreshCw,
  XCircle,
  RotateCcw
} from 'lucide-react';

export default function SupportDisputesPage() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Mediation chat state
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Resolution state
  const [decision, setDecision] = useState('partial_refund');
  const [refundAmount, setRefundAmount] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/disputes');
      if (res.success) {
        setDisputes(res.data);
        if (res.data.length > 0) {
          const toSelect = paramId ? res.data.find((d) => d._id === paramId) || res.data[0] : res.data[0];
          setSelectedDispute(toSelect);
          if (toSelect.booking?.pricing?.totalAmount) {
            setRefundAmount(Math.round(toSelect.booking.pricing.totalAmount * 0.5));
          }
        }
      }
    } catch (err) {
      error(`Failed to load disputes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDispute = (dispute) => {
    setSelectedDispute(dispute);
    if (dispute.booking?.pricing?.totalAmount) {
      setRefundAmount(Math.round(dispute.booking.pricing.totalAmount * 0.5));
    }
  };

  // Send message in mediation discussion
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setSendingMessage(true);
    try {
      const res = await api.post(`/disputes/${selectedDispute._id}/messages`, {
        message: chatMessage
      });

      if (res.success) {
        setSelectedDispute((prev) => ({
          ...prev,
          messages: res.data,
          status: prev.status === 'open' ? 'under_review' : prev.status
        }));
        setChatMessage('');
        success('Mediation message sent');
      }
    } catch (err) {
      error(`Message failed: ${err.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  // Resolve Dispute
  const handleResolveDispute = async (e) => {
    e.preventDefault();
    setResolving(true);
    try {
      const res = await api.put(`/disputes/${selectedDispute._id}/resolve`, {
        decision,
        refundAmount: ['full_refund', 'partial_refund'].includes(decision) ? Number(refundAmount) : 0,
        notes: resolutionNotes
      });

      if (res.success) {
        success(`Dispute resolved with status: ${decision.replace('_', ' ')}`);
        fetchDisputes();
      }
    } catch (err) {
      error(`Resolution failed: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (statusFilter === 'all') return true;
    return d.status === statusFilter;
  });

  const countOpen = disputes.filter((d) => d.status === 'open').length;
  const countUnderReview = disputes.filter((d) => d.status === 'under_review').length;
  const countResolved = disputes.filter((d) => ['resolved', 'rejected'].includes(d.status)).length;

  if (loading && disputes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Loading support dispute queue...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2 border border-amber-200">
            <Headphones className="w-3.5 h-3.5 text-amber-600" />
            <span>Support & Trust Engineering</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Disputes & Mediation Center
          </h1>
          <p className="text-sm text-slate-500">
            Mediate service disputes, inspect field evidence, and enforce fair resolution or refunds.
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Claims</span>
            <AlertOctagon className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{disputes.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Open (Unassigned)</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{countOpen}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Under Mediation</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{countUnderReview}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved Cases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{countResolved}</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Disputes List */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-base">Cases Queue</h2>
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              {['all', 'open', 'under_review', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {filteredDisputes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No disputes matching current filter.
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {filteredDisputes.map((d) => {
                const isSelected = selectedDispute?._id === d._id;
                return (
                  <div
                    key={d._id}
                    onClick={() => handleSelectDispute(d)}
                    className={`p-4 rounded-2xl border transition cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">
                        #{d._id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>

                    <div className="font-semibold text-slate-800 capitalize">
                      Reason: {d.reason?.replace('_', ' ')}
                    </div>

                    <p className="text-slate-600 line-clamp-2 leading-relaxed">
                      {d.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100/80">
                      <span>Customer: <strong>{d.raisedBy?.name}</strong></span>
                      <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Case Deep Dive & Resolution Workspace */}
        <div className="lg:col-span-7 space-y-6">
          {selectedDispute ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Case Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      Case #{selectedDispute._id.slice(-6).toUpperCase()}
                    </span>
                    <StatusBadge status={selectedDispute.status} />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 capitalize">
                    {selectedDispute.reason?.replace('_', ' ')}
                  </h3>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block">Filed on</span>
                  <strong className="text-slate-700">
                    {new Date(selectedDispute.createdAt).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Customer & Provider Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl text-xs">
                <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-slate-200 pb-2 sm:pb-0 sm:pr-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Complainant (Customer)
                  </span>
                  <div className="font-bold text-slate-900">{selectedDispute.raisedBy?.name}</div>
                  <div className="text-slate-500">{selectedDispute.raisedBy?.email}</div>
                  <div className="text-slate-500">{selectedDispute.raisedBy?.phone}</div>
                </div>

                <div className="space-y-1 sm:pl-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Service Provider
                  </span>
                  <div className="font-bold text-slate-900">{selectedDispute.against?.name}</div>
                  <div className="text-slate-500">{selectedDispute.against?.email}</div>
                  <div className="text-slate-500">{selectedDispute.against?.phone}</div>
                </div>
              </div>

              {/* Customer Claim & Uploaded Evidence */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Customer Claim & Description
                </h4>
                <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-2xl text-xs text-slate-700 leading-relaxed">
                  {selectedDispute.description}
                </div>

                {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-2">
                      Customer Photo Evidence:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedDispute.evidence.map((imgUrl, i) => (
                        <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={imgUrl}
                            alt="Dispute evidence"
                            className="rounded-xl h-28 w-full object-cover border border-slate-200 hover:opacity-90 transition"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3-Way Mediation Thread */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mediation Thread ({selectedDispute.messages?.length || 0} messages)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Visible to Customer, Provider & Support
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-3 max-h-64 overflow-y-auto text-xs">
                  {(selectedDispute.messages || []).length === 0 ? (
                    <div className="text-center text-slate-400 py-4">
                      No messages yet in this mediation thread.
                    </div>
                  ) : (
                    selectedDispute.messages.map((m, idx) => {
                      const isAgent = m.sender?.role === 'support' || m.sender?.role === 'admin';
                      const isCust = m.sender?.role === 'customer';

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl ${
                            isAgent
                              ? 'bg-amber-100/70 border border-amber-200 ml-4'
                              : isCust
                              ? 'bg-white border border-slate-200 mr-4'
                              : 'bg-indigo-50 border border-indigo-200 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span className="text-slate-800">
                              {m.sender?.name || 'Participant'}{' '}
                              <span className="text-[10px] font-normal text-slate-500 capitalize">
                                ({m.sender?.role || 'user'})
                              </span>
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{m.message}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send Agent Message */}
                {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'rejected' && (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a mediation message or instruction..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !chatMessage.trim()}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Resolution Decision Panel */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Case Resolution Decision
                </h4>

                {['resolved', 'rejected'].includes(selectedDispute.status) ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Dispute Officially Resolved</span>
                    </div>
                    <div className="text-slate-700">
                      <strong>Resolution:</strong>{' '}
                      {selectedDispute.resolution?.decision?.replace('_', ' ') || selectedDispute.status}
                    </div>
                    {selectedDispute.resolution?.refundAmount > 0 && (
                      <div className="text-emerald-700 font-bold">
                        Refund Issued: ${selectedDispute.resolution.refundAmount}
                      </div>
                    )}
                    <div className="text-slate-600">
                      <strong>Notes:</strong> {selectedDispute.resolution?.decisionNote || 'Resolution finalized.'}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleResolveDispute} className="space-y-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Choose Support Resolution Action:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                          decision === 'partial_refund' ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/60 border-slate-200'
                        }`}>
                          <input
                            type="radio"
                            name="decision"
                            value="partial_refund"
                            checked={decision === 'partial_refund'}
                            onChange={(e) => setDecision(e.target.value)}
                            className="text-amber-500"
                          />
                          <div>
                            <div className="font-bold text-slate-800">Partial Refund</div>
                            <div className="text-[10px] text-slate-500">Split compensation</div>
                          </div>
                        </label>

                        <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                          decision === 'full_refund' ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/60 border-slate-200'
                        }`}>
                          <input
                            type="radio"
                            name="decision"
                            value="full_refund"
                            checked={decision === 'full_refund'}
                            onChange={(e) => setDecision(e.target.value)}
                            className="text-amber-500"
                          />
                          <div>
                            <div className="font-bold text-slate-800">Full 100% Refund</div>
                            <div className="text-[10px] text-slate-500">Full customer refund</div>
                          </div>
                        </label>

                        <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                          decision === 'rejected' ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/60 border-slate-200'
                        }`}>
                          <input
                            type="radio"
                            name="decision"
                            value="rejected"
                            checked={decision === 'rejected'}
                            onChange={(e) => setDecision(e.target.value)}
                            className="text-amber-500"
                          />
                          <div>
                            <div className="font-bold text-slate-800">Reject Claim</div>
                            <div className="text-[10px] text-slate-500">Stand by provider</div>
                          </div>
                        </label>

                        <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                          decision === 'rework_completed' ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/60 border-slate-200'
                        }`}>
                          <input
                            type="radio"
                            name="decision"
                            value="rework_completed"
                            checked={decision === 'rework_completed'}
                            onChange={(e) => setDecision(e.target.value)}
                            className="text-amber-500"
                          />
                          <div>
                            <div className="font-bold text-slate-800">Rework Agreed</div>
                            <div className="text-[10px] text-slate-500">Provider revisits</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {['full_refund', 'partial_refund'].includes(decision) && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Refund Amount ($)
                        </label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          min="1"
                          max={selectedDispute.booking?.pricing?.totalAmount || 500}
                          className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Resolution Decision Note & Explanation
                      </label>
                      <textarea
                        rows={2}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Detail the rationale behind the decision for the audit log and customer report..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <button
                        type="submit"
                        disabled={resolving}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-200 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{resolving ? 'Executing Resolution...' : 'Finalize Dispute Resolution'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <Headphones className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">Select a dispute from the queue to review and mediate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
