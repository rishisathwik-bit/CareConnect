import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState(null);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      if (res.success) {
        setRequest(res.data);
      }
    } catch (err) {
      error('Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    setAcceptingQuoteId(quoteId);
    try {
      const res = await api.put(`/quotes/${quoteId}/accept`);
      if (res.success) {
        success('Quote accepted! Booking created and slot reserved.');
        navigate(`/customer/bookings/${res.data.booking._id}`);
      }
    } catch (err) {
      error(err.message || 'Failed to accept quote. Check for slot conflicts.');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      const res = await api.put(`/requests/${id}/cancel`);
      if (res.success) {
        success('Request cancelled');
        fetchRequest();
      }
    } catch (err) {
      error(err.message || 'Failed to cancel request');
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-slate-500">Loading request details...</div>;
  }

  if (!request) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-rose-500">Request not found.</div>;
  }

  const quotes = request.quotes || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header back link */}
      <div>
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <StatusBadge status={request.status} />
              <StatusBadge status={request.urgency} />
              <span className="text-xs text-slate-400 font-semibold">
                Request #{request._id.slice(-6)}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">{request.title}</h1>
          </div>

          {['open', 'quoted'].includes(request.status) && (
            <button
              onClick={handleCancelRequest}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition self-start sm:self-auto"
            >
              Cancel Request
            </button>
          )}
        </div>
      </div>

      {/* Main Request Information Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Description
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {request.description}
          </p>
        </div>

        {/* Schedule and Location metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <div>
              <span className="text-[11px] text-slate-400 block">Preferred Date</span>
              <span className="text-xs font-bold text-slate-800">
                {new Date(request.preferredDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-indigo-500" />
            <div>
              <span className="text-[11px] text-slate-400 block">Time Slot</span>
              <span className="text-xs font-bold text-slate-800">
                {request.preferredSlot}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-indigo-500" />
            <div>
              <span className="text-[11px] text-slate-400 block">Location</span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {request.address?.city}, {request.address?.zipCode}
              </span>
            </div>
          </div>
        </div>

        {/* AI Classification Info Banner */}
        {request.aiClassification && (
          <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Service Classification</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {request.aiClassification.suggestedSkills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white text-indigo-700 text-[11px] font-semibold border border-indigo-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-indigo-200 sm:pl-4">
              <span className="text-[10px] text-indigo-500 uppercase tracking-wider block font-bold">
                AI Price Range
              </span>
              <span className="text-sm font-extrabold text-indigo-950">
                ${request.aiClassification.estimatedPriceRange?.min} - ${request.aiClassification.estimatedPriceRange?.max}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Received Quotes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Provider Quotes ({quotes.length})
          </h2>
          <span className="text-xs text-slate-400">
            Compare offers & accept best rate
          </span>
        </div>

        {quotes.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
            No provider quotes received yet. Local verified professionals have been notified of your request!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quotes.map((quote) => {
              const isAccepted = quote.status === 'accepted';
              const isDeclined = quote.status === 'declined';
              return (
                <div
                  key={quote._id}
                  className={`bg-white rounded-3xl p-6 border transition flex flex-col justify-between ${
                    isAccepted
                      ? 'border-emerald-500 ring-2 ring-emerald-200'
                      : 'border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Header with Provider Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={quote.provider?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                          alt={quote.provider?.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-100"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{quote.provider?.name}</h4>
                          <span className="text-[11px] text-slate-500 block">Verified Specialist</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                          Quote Amount
                        </span>
                        <span className="text-xl font-extrabold text-slate-900">
                          ${quote.amount}
                        </span>
                      </div>
                    </div>

                    {quote.message && (
                      <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 mb-4 leading-relaxed italic border border-slate-100">
                        "{quote.message}"
                      </div>
                    )}

                    {/* Breakdown */}
                    {quote.breakdown && quote.breakdown.length > 0 && (
                      <div className="mb-4 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Cost Breakdown:
                        </span>
                        {quote.breakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-600">
                            <span>{item.description}</span>
                            <span className="font-semibold">${item.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quote Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Est. duration: {quote.estimatedHours || 2} hrs
                    </span>

                    {isAccepted ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accepted
                      </span>
                    ) : isDeclined ? (
                      <span className="text-xs text-slate-400">Declined</span>
                    ) : (
                      <button
                        onClick={() => handleAcceptQuote(quote._id)}
                        disabled={acceptingQuoteId === quote._id}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{acceptingQuoteId === quote._id ? 'Verifying Slot...' : 'Accept & Book'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
