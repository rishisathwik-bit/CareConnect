import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  Navigation,
  PlayCircle,
  PlusCircle,
  DollarSign,
  ArrowLeft,
  User,
  Phone,
  FileText,
  MessageSquare,
  Send
} from 'lucide-react';

export default function ProviderBookingDetail() {
  const { id } = useParams();
  const { success, error } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Evidence state
  const [beforePhotoUrl, setBeforePhotoUrl] = useState('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [savingEvidence, setSavingEvidence] = useState(false);

  // Parts cost state
  const [partsCost, setPartsCost] = useState(0);
  const [statusNote, setStatusNote] = useState('');

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

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
        success('Message sent to customer');
      }
    } catch (err) {
      error(err.message || 'Failed to send message');
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      if (res.success) {
        setBooking(res.data);
        if (res.data.evidence) {
          setBeforePhotoUrl(res.data.evidence.beforePhotos?.[0] || '');
          setAfterPhotoUrl(res.data.evidence.afterPhotos?.[0] || '');
          setEvidenceNotes(res.data.evidence.providerNotes || '');
        }
      }
    } catch (err) {
      error('Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus, defaultNote) => {
    const note = statusNote || defaultNote;
    try {
      const res = await api.put(`/bookings/${id}/status`, {
        status: newStatus,
        note,
        partsCost: Number(partsCost) || 0
      });
      if (res.success) {
        success(`Job status updated to ${newStatus.replace('_', ' ').toUpperCase()}!`);
        setStatusNote('');
        fetchBooking();
      }
    } catch (err) {
      error(err.message || 'Failed to update status');
    }
  };

  const handleSaveEvidence = async (e) => {
    e.preventDefault();
    setSavingEvidence(true);
    try {
      const res = await api.post(`/bookings/${id}/evidence`, {
        beforePhotos: beforePhotoUrl ? [beforePhotoUrl] : [],
        afterPhotos: afterPhotoUrl ? [afterPhotoUrl] : [],
        providerNotes: evidenceNotes
      });
      if (res.success) {
        success('Work evidence and photos recorded successfully!');
        fetchBooking();
      }
    } catch (err) {
      error(err.message || 'Failed to upload evidence');
    } finally {
      setSavingEvidence(false);
    }
  };

  const sampleEvidencePhotos = {
    before: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80'
    ],
    after: [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80'
    ]
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto p-12 text-center text-slate-500">Loading job details...</div>;
  }

  if (!booking) {
    return <div className="max-w-5xl mx-auto p-12 text-center text-rose-500">Job not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/provider/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Provider Hub</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <StatusBadge status={booking.status} />
              <span className="text-xs text-slate-400 font-semibold">
                Job #{booking._id.slice(-6)}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {booking.category?.name || 'Service Job Execution'}
            </h1>
          </div>

          {booking.customerConfirmed && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Customer Confirmed Completion</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Hub: Status Transition Buttons */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Job Execution Controls
        </h2>

        {/* Status transition action row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={['en_route', 'in_progress', 'completed', 'cancelled'].includes(booking.status)}
            onClick={() => handleUpdateStatus('en_route', 'Technician is en route to customer residence')}
            className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 ${
              booking.status === 'scheduled'
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <Navigation className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="text-xs font-bold block">1. Mark En Route</span>
              <span className="text-[11px] opacity-75">Customer receives ETA</span>
            </div>
          </button>

          <button
            type="button"
            disabled={['in_progress', 'completed', 'cancelled'].includes(booking.status) || booking.status === 'scheduled'}
            onClick={() => handleUpdateStatus('in_progress', 'Arrived on-site. Began diagnosis and repair.')}
            className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 ${
              booking.status === 'en_route'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100'
                : 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <PlayCircle className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="text-xs font-bold block">2. Arrived / In Progress</span>
              <span className="text-[11px] opacity-75">Work started</span>
            </div>
          </button>

          <button
            type="button"
            disabled={booking.status !== 'in_progress'}
            onClick={() => handleUpdateStatus('completed', 'Work successfully executed and tested. Ready for sign-off.')}
            className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 ${
              booking.status === 'in_progress'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                : 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-bold block">3. Complete Job</span>
              <span className="text-[11px] opacity-75">Submit final invoice</span>
            </div>
          </button>
        </div>

        {/* Optional update note & parts cost input */}
        {booking.status === 'in_progress' && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician Work Note (Optional for next status update)
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Replaced leaking valve, tested water pressure"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Add Replacement Parts / Materials Cost ($)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 self-center">
                  Appends to invoice
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer & Location Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Customer Information
          </h3>

          <div className="flex items-center gap-3">
            <img
              src={booking.customer?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
              alt={booking.customer?.name}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-100"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{booking.customer?.name}</h4>
              <span className="text-xs text-slate-500 block">{booking.customer?.phone}</span>
              <span className="text-xs text-slate-400 block">{booking.customer?.email}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{booking.serviceAddress?.street}, {booking.serviceAddress?.city} ({booking.serviceAddress?.zipCode})</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{booking.timeSlot}</span>
            </div>
          </div>
        </div>

        {/* Work Evidence Upload Section */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Work Evidence & Photos
              </h3>
            </div>
            <span className="text-xs text-slate-400">Customer sees these before sign-off</span>
          </div>

          <form onSubmit={handleSaveEvidence} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Before Photo (URL or Sample)
                </label>
                <input
                  type="text"
                  value={beforePhotoUrl}
                  onChange={(e) => setBeforePhotoUrl(e.target.value)}
                  placeholder="https://images... / photo url"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 mb-1.5"
                />
                <button
                  type="button"
                  onClick={() => setBeforePhotoUrl(sampleEvidencePhotos.before[0])}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  + Use Sample Before Photo
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  After Photo (URL or Sample)
                </label>
                <input
                  type="text"
                  value={afterPhotoUrl}
                  onChange={(e) => setAfterPhotoUrl(e.target.value)}
                  placeholder="https://images... / photo url"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 mb-1.5"
                />
                <button
                  type="button"
                  onClick={() => setAfterPhotoUrl(sampleEvidencePhotos.after[0])}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  + Use Sample After Photo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician Inspection & Completion Notes
              </label>
              <textarea
                rows="2"
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                placeholder="Explain the work done, diagnosed cause, parts replaced, and warranty tips..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingEvidence}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{savingEvidence ? 'Saving Evidence...' : 'Save & Attach Work Evidence'}</span>
            </button>
          </form>

          {/* Photo Previews */}
          {(beforePhotoUrl || afterPhotoUrl) && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              {beforePhotoUrl && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Before:</span>
                  <img src={beforePhotoUrl} alt="Before" className="h-32 w-full object-cover rounded-xl border" />
                </div>
              )}
              {afterPhotoUrl && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">After:</span>
                  <img src={afterPhotoUrl} alt="After" className="h-32 w-full object-cover rounded-xl border" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Direct Chat with Customer */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Direct Chat with Customer ({booking.customer?.name})
              </h2>
              <p className="text-[11px] text-slate-400">
                Notify customer of arrival ETA, ask for gate codes, or update job progress.
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
              No messages yet. Send an arrival notice to {booking.customer?.name}!
            </div>
          ) : (
            booking.messages.map((m, idx) => {
              const isMe = (m.sender?._id || m.sender) === (booking.provider?._id || booking.provider);
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
                      {m.sender?.name || (isMe ? 'You' : 'Customer')}
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
            placeholder="Type a note (e.g. ETA 15 mins, parked in driveway)..."
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
    </div>
  );
}
