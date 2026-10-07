import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StarRating from '../../components/common/StarRating';
import { Star, MessageSquare, CornerDownRight, CheckCircle2 } from 'lucide-react';

export default function ProviderReviewsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/reviews/provider/${user._id}`);
      if (res.success) {
        setReviews(res.data);
      }
    } catch (err) {
      error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      const res = await api.put(`/reviews/${reviewId}/reply`, { reply: replyText });
      if (res.success) {
        success('Reply posted!');
        setReplyingId(null);
        setReplyText('');
        fetchReviews();
      }
    } catch (err) {
      error(err.message || 'Failed to post reply');
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-slate-500">Loading reviews...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Customer Ratings & Reviews</h1>
        <p className="text-xs text-slate-500 mt-1">
          Feedback left by customers following verified job completions.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold">No reviews received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {rev.customer?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{rev.customer?.name}</h4>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <StarRating rating={rev.rating} size="md" />
              </div>

              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{rev.comment}"
              </p>

              {/* Sub-ratings */}
              <div className="flex gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-50">
                <span>Punctuality: <strong>{rev.punctualityRating}★</strong></span>
                <span>Quality: <strong>{rev.qualityRating}★</strong></span>
                <span>Cleanliness: <strong>{rev.cleanlinessRating}★</strong></span>
              </div>

              {/* Provider Reply */}
              {rev.providerReply ? (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700 text-[11px] mb-1">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Your Response:</span>
                  </div>
                  <p className="text-slate-600">{rev.providerReply}</p>
                </div>
              ) : replyingId === rev._id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows="2"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a polite response to customer feedback..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReplyingId(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendReply(rev._id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                    >
                      Post Reply
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setReplyingId(rev._id);
                    setReplyText('');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 pt-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Reply to customer</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
