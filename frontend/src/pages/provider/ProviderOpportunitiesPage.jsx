import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Briefcase,
  DollarSign,
  Clock,
  Calendar,
  Send,
  Sparkles,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ProviderOpportunitiesPage() {
  const { success, error } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quote modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState(120);
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests');
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuoteModal = (req) => {
    setSelectedRequest(req);
    setQuoteAmount(req.budget || 120);
    setEstimatedHours(req.aiClassification?.estimatedHours || 2);
    setQuoteMessage(
      `Hello ${req.customer?.name || 'there'}! I am available to complete this service on ${new Date(
        req.preferredDate
      ).toLocaleDateString()} (${req.preferredSlot}). Professional service and work guarantee included.`
    );
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSubmittingQuote(true);
    try {
      const res = await api.post('/quotes', {
        requestId: selectedRequest._id,
        amount: Number(quoteAmount),
        estimatedHours: Number(estimatedHours),
        message: quoteMessage,
        breakdown: [
          {
            description: `${selectedRequest.title} - Labor & Diagnostic (${estimatedHours} hrs)`,
            amount: Number(quoteAmount)
          }
        ]
      });

      if (res.success) {
        success('Quote submitted successfully! Customer has been notified.');
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err) {
      error(err.message || 'Failed to submit quote');
    } finally {
      setSubmittingQuote(false);
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-12 text-center text-slate-500">Loading opportunities...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Job Opportunities Feed
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Browse customer service requests matching your trade qualifications and submit competitive quotes.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">No Open Requests Right Now</h3>
          <p className="text-xs text-slate-400 mt-1">
            Check back shortly or update your profile skills to match more trade categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={req.status} />
                    <StatusBadge status={req.urgency} />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    ID: #{req._id.slice(-6)}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1.5">{req.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                  {req.description}
                </p>

                {/* AI Detected skills */}
                {req.aiClassification?.suggestedSkills && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {req.aiClassification.suggestedSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Scheduling & Location metadata */}
                <div className="text-xs text-slate-500 space-y-1 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Requested Date: {new Date(req.preferredDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Slot: {req.preferredSlot}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{req.address?.city}, {req.address?.zipCode}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Customer Budget
                  </span>
                  <span className="text-lg font-extrabold text-slate-900">
                    ${req.budget}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenQuoteModal(req)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Quote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Quote Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Submit Quote Offer
                </span>
                <h3 className="font-bold text-slate-900 text-base truncate max-w-sm">
                  {selectedRequest.title}
                </h3>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quote Total ($)</label>
                  <input
                    type="number"
                    required
                    min="20"
                    max="3000"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Duration (hrs)</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message to Customer</label>
                <textarea
                  rows="4"
                  required
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  placeholder="Introduce yourself and explain your service scope..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Customer Budget:</span>
                  <span className="font-semibold text-slate-700">${selectedRequest.budget}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Quoted Rate:</span>
                  <span className="font-bold text-indigo-700">${quoteAmount}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingQuote}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submittingQuote ? 'Sending Quote...' : 'Send Quote to Customer'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
