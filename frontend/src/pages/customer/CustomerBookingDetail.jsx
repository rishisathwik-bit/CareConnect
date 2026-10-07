import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Star,
  DollarSign,
  ArrowLeft,
  Camera,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  Send,
  Printer,
  FileText,
  X
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'en_route', label: 'En Route' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' }
];

export default function CustomerBookingDetail() {
  const { id } = useParams();
  const { success, error } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);

  // Dispute form
  const [disputeReason, setDisputeReason] = useState('unfinished_work');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('partial_refund');

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      if (res.success) {
        setBooking(res.data);
      }
    } catch (err) {
      error('Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      const res = await api.put(`/bookings/${id}/confirm`);
      if (res.success) {
        success('Service completion officially confirmed!');
        fetchBooking();
      }
    } catch (err) {
      error(err.message || 'Failed to confirm completion');
    }
  };

  const handlePayInvoice = async () => {
    if (!booking.invoice?._id) return;
    try {
      const res = await api.post(`/invoices/${booking.invoice._id}/pay`, {
        paymentMethod: 'Credit Card (Simulated)'
      });
      if (res.success) {
        success('Payment settled successfully! Receipt generated.');
        setShowPayModal(false);
        fetchBooking();
      }
    } catch (err) {
      error(err.message || 'Payment simulation failed');
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setSendingChat(true);
    try {
      const res = await api.post(`/bookings/${id}/messages`, {
        message: chatInput
      });
      if (res.success) {
        setBooking((prev) => ({
          ...prev,
          messages: res.data
        }));
        setChatInput('');
        success('Message sent to technician');
      }
    } catch (err) {
      error(err.message || 'Failed to send message');
    } finally {
      setSendingChat(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/reviews', {
        bookingId: id,
        rating: reviewRating,
        comment: reviewComment,
        punctualityRating,
        qualityRating,
        cleanlinessRating
      });
      if (res.success) {
        success('Review submitted! Thank you for rating the service provider.');
        setShowReviewModal(false);
        fetchBooking();
      }
    } catch (err) {
      error(err.message || 'Failed to submit review');
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/disputes', {
        bookingId: id,
        reason: disputeReason,
        description: disputeDescription,
        desiredOutcome
      });
      if (res.success) {
        success('Dispute filed. CareConnect Support will mediate your ticket.');
        setShowDisputeModal(false);
        fetchBooking();
      }
    } catch (err) {
      error(err.message || 'Failed to file dispute');
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto p-12 text-center text-slate-500">Loading booking...</div>;
  }

  if (!booking) {
    return <div className="max-w-5xl mx-auto p-12 text-center text-rose-500">Booking not found.</div>;
  }

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === booking.status);
  const isDisputed = booking.status === 'disputed';
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const invoice = booking.invoice;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
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
              <StatusBadge status={booking.status} />
              <span className="text-xs text-slate-400 font-semibold">
                Booking ID #{booking._id.slice(-6)}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {booking.category?.name || 'Service Job'}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isCompleted && !isDisputed && !isCancelled && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Report Issue</span>
              </button>
            )}

            {isCompleted && !booking.customerConfirmed && (
              <button
                onClick={handleConfirmCompletion}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Job Completion</span>
              </button>
            )}

            {isCompleted && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Rate & Review</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Milestone Stepper */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
          Job Execution Stepper
        </h2>

        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-0"></div>
          {STATUS_STEPS.map((step, idx) => {
            const isFinished = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                    isFinished
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 shadow-md'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isFinished ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-bold ${
                    isCurrent ? 'text-indigo-600' : isFinished ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {booking.customerConfirmed && (
          <div className="mt-6 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Customer officially confirmed job completion on{' '}
              {new Date(booking.customerConfirmedAt).toLocaleDateString()}.
            </span>
          </div>
        )}
      </div>

      {/* Grid: Provider Info & Invoice Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Provider Snapshot */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Assigned Service Provider
          </h3>

          <div className="flex items-center gap-3.5">
            <img
              src={booking.provider?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
              alt={booking.provider?.name}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-base">{booking.provider?.name}</h4>
              <span className="text-xs text-slate-500 block">{booking.provider?.phone}</span>
              <span className="text-xs text-slate-400 block">{booking.provider?.email}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{booking.timeSlot}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{booking.serviceAddress?.street}, {booking.serviceAddress?.city}</span>
            </div>
          </div>
        </div>

        {/* Invoice & Payment Card */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Invoice & Payment
              </h3>
              {invoice && <StatusBadge status={invoice.paymentStatus} />}
            </div>

            {invoice ? (
              <div className="space-y-2 text-xs">
                {invoice.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">{item.description}</span>
                    <span className="font-semibold text-slate-900">${item.amount}</span>
                  </div>
                ))}

                <div className="pt-2 flex justify-between text-slate-500">
                  <span>Platform Service Fee</span>
                  <span>${invoice.platformFee}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Tax</span>
                  <span>${invoice.tax}</span>
                </div>
                <div className="pt-2 flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span>${invoice.totalAmount}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Invoice pending calculation</div>
            )}
          </div>

          {invoice && invoice.paymentStatus === 'pending' && (
            <button
              onClick={() => setShowPayModal(true)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Simulate Payment Checkout (${invoice.totalAmount})</span>
            </button>
          )}

          {invoice && invoice.paymentStatus === 'paid' && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Paid in full ({invoice.transactionId})</span>
            </div>
          )}

          {invoice && (
            <button
              onClick={() => setShowReceiptModal(true)}
              className="w-full mt-2 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>View & Print Official Receipt</span>
            </button>
          )}
        </div>
      </div>

      {/* Direct Chat with Assigned Technician */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Direct Chat with Technician ({booking.provider?.name})
              </h2>
              <p className="text-[11px] text-slate-400">
                Coordinate arrival, parking instructions, gate access, or special requests.
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
            Live Chat
          </span>
        </div>

        {/* Chat message history */}
        <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 max-h-56 overflow-y-auto text-xs">
          {(!booking.messages || booking.messages.length === 0) ? (
            <div className="text-center text-slate-400 py-6">
              No messages yet. Send an arrival note or gate code to {booking.provider?.name}!
            </div>
          ) : (
            booking.messages.map((m, idx) => {
              const isMe = (m.sender?._id || m.sender) === (booking.customer?._id || booking.customer);
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {m.sender?.name || (isMe ? 'You' : 'Technician')}
                    </div>
                    {m.message}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendChat} className="flex gap-2 pt-1">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a note (e.g. Ring twice, gate code is #4920)..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sendingChat || !chatInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Before & After Work Evidence Gallery */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Work Evidence & Inspection Photos
            </h2>
          </div>
          <span className="text-xs text-slate-400">Captured on-site by pro</span>
        </div>

        {booking.evidence?.providerNotes && (
          <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic leading-relaxed">
            <span className="font-bold text-slate-800 not-italic block mb-1">Technician Notes:</span>
            "{booking.evidence.providerNotes}"
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Before Photos */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Before Work Commenced
            </span>
            {booking.evidence?.beforePhotos && booking.evidence.beforePhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {booking.evidence.beforePhotos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt="Before work"
                    className="w-full h-44 rounded-2xl object-cover border border-slate-200"
                  />
                ))}
              </div>
            ) : (
              <div className="h-32 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                No before photos uploaded yet.
              </div>
            )}
          </div>

          {/* After Photos */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              After Job Completion
            </span>
            {booking.evidence?.afterPhotos && booking.evidence.afterPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {booking.evidence.afterPhotos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt="After work"
                    className="w-full h-44 rounded-2xl object-cover border border-slate-200"
                  />
                ))}
              </div>
            ) : (
              <div className="h-32 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                After photos will appear when technician finishes work.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Events Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Job Timeline & Activity Audit
        </h2>

        <div className="space-y-4 pl-2 border-l-2 border-slate-100">
          {booking.trackingEvents?.map((evt, idx) => (
            <div key={idx} className="relative pl-6">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[5.5px] top-1.5 ring-4 ring-indigo-50"></div>
              <div className="flex items-center gap-2">
                <StatusBadge status={evt.status} />
                <span className="text-[11px] text-slate-400">
                  {new Date(evt.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1">{evt.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Leave a Review</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Overall Rating</label>
                <StarRating rating={reviewRating} size="lg" interactive onSelect={setReviewRating} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Punctuality</span>
                  <StarRating rating={punctualityRating} interactive onSelect={setPunctualityRating} />
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Quality</span>
                  <StarRating rating={qualityRating} interactive onSelect={setQualityRating} />
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Cleanliness</span>
                  <StarRating rating={cleanlinessRating} interactive onSelect={setCleanlinessRating} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Comments</label>
                <textarea
                  rows="3"
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe your experience with the provider..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>File a Dispute</span>
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              CareConnect support will review the work evidence, mediate with the provider, and process refunds if justified.
            </p>

            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="unfinished_work">Unfinished or Incomplete Work</option>
                  <option value="poor_quality">Poor Workmanship Quality</option>
                  <option value="overcharge">Disputed Charges / Overcharge</option>
                  <option value="late_arrival">No Show / Severe Tardiness</option>
                  <option value="property_damage">Property Damage</option>
                  <option value="other">Other Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Desired Outcome</label>
                <select
                  value={desiredOutcome}
                  onChange={(e) => setDesiredOutcome(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="partial_refund">Partial Refund</option>
                  <option value="full_refund">Full Refund</option>
                  <option value="rework">Provider Return / Rework</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Statement & Details</label>
                <textarea
                  rows="3"
                  required
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Explain what went wrong..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
              >
                Submit Dispute Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-slate-900 text-lg">Confirm Payment Settlement</h3>
            <p className="text-xs text-slate-500">
              Total Amount: <strong className="text-slate-900 text-sm">${invoice?.totalAmount}</strong>
            </p>
            <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl">
              This triggers simulated escrow release and generates an official invoice transaction ID.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handlePayInvoice}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && invoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Official Service Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Content */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-4 text-xs bg-white">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <span className="text-lg font-black text-indigo-600">CareConnect</span>
                  <span className="block text-[10px] text-slate-400">Home Operations Platform</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800">{invoice.invoiceNumber}</div>
                  <div className="text-slate-400 text-[10px]">
                    {new Date(invoice.createdAt || booking.scheduledDate).toLocaleDateString()}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {invoice.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Billed To:</span>
                  <strong className="text-slate-800">{booking.customer?.name}</strong>
                  <div className="text-slate-500">{booking.serviceAddress?.street}</div>
                  <div className="text-slate-500">{booking.serviceAddress?.city}, {booking.serviceAddress?.zipCode}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Serviced By:</span>
                  <strong className="text-slate-800">{booking.provider?.name}</strong>
                  <div className="text-slate-500">{booking.category?.name || 'Home Services'}</div>
                  <div className="text-slate-500">Slot: {booking.timeSlot}</div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                <span className="text-slate-400 uppercase font-bold text-[9px] block">Itemized Charges</span>
                {invoice.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-50 text-slate-700">
                    <span>{it.description}</span>
                    <span className="font-bold text-slate-900">${it.amount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal & Totals */}
              <div className="space-y-1 pt-2 border-t border-slate-100 text-slate-500 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${invoice.subtotal?.toFixed(2) || invoice.pricing?.laborCost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Operations Fee</span>
                  <span>${invoice.platformFee?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (Estimated)</span>
                  <span>${invoice.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-indigo-600">${invoice.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              {invoice.transactionId && (
                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 text-center font-mono">
                  Transaction Ref: {invoice.transactionId} • Method: {invoice.paymentMethod || 'Simulated Card'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
