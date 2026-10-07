import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SmartRequestModal from '../../components/ai/SmartRequestModal';
import ProviderMatchCard from '../../components/ai/ProviderMatchCard';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Send,
  Users,
  CheckCircle2
} from 'lucide-react';

export default function NewRequestPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: location.state?.categoryId || '',
    description: '',
    urgency: 'medium',
    preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredSlot: '09:00 - 12:00',
    budget: 120,
    street: user?.address?.street || '452 Hayes St',
    city: user?.address?.city || 'San Francisco',
    zipCode: user?.address?.zipCode || '94102'
  });

  const [aiClassification, setAiClassification] = useState(null);
  const [rankedProviders, setRankedProviders] = useState([]);
  const [searchingPros, setSearchingPros] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.success) {
          setCategories(res.data);
          if (!formData.categoryId && res.data.length > 0) {
            setFormData((prev) => ({ ...prev, categoryId: res.data[0]._id }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();

    // Check if passed from landing page AI assistant
    if (location.state?.prefill) {
      applyAiData(location.state.prefill);
    }
  }, []);

  const applyAiData = (data) => {
    setAiClassification(data);
    setFormData((prev) => ({
      ...prev,
      title: prev.title || `${data.categoryName} Service`,
      description: data.text || prev.description,
      urgency: data.urgencyLevel || prev.urgency,
      budget: data.estimatedPriceRange?.min || prev.budget,
      categoryId: data.categoryId || prev.categoryId
    }));
    success(`Applied AI classification for ${data.categoryName}!`);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Find & Rank Providers with AI
  const handleFindMatchedProviders = async () => {
    setSearchingPros(true);
    try {
      const skills = aiClassification?.suggestedSkills || [];
      const res = await api.post('/ai/rank-providers', {
        categoryId: formData.categoryId,
        skills,
        address: {
          zipCode: formData.zipCode,
          city: formData.city
        },
        preferredSlot: formData.preferredSlot,
        preferredDate: formData.preferredDate
      });

      if (res.success) {
        setRankedProviders(res.data);
        if (res.data.length === 0) {
          error('No matching verified providers found for this specific category and area.');
        } else {
          success(`Found ${res.count} matched providers scored by AI!`);
        }
      }
    } catch (err) {
      error(err.message || 'Failed to rank providers');
    } finally {
      setSearchingPros(false);
    }
  };

  // Direct Booking of a selected matched provider
  const handleDirectBook = async (matchItem) => {
    setSubmitting(true);
    try {
      const providerId = matchItem.provider._id || matchItem.profile.user;
      const res = await api.post('/bookings/direct', {
        providerId,
        categoryId: formData.categoryId,
        scheduledDate: formData.preferredDate,
        timeSlot: formData.preferredSlot,
        serviceAddress: {
          street: formData.street,
          city: formData.city,
          zipCode: formData.zipCode
        },
        description: formData.description || formData.title,
        estimatedHours: aiClassification?.estimatedHours || 2
      });

      if (res.success) {
        success('Booking scheduled! Conflict verification passed.');
        navigate(`/customer/bookings/${res.data.booking._id}`);
      }
    } catch (err) {
      error(err.message || 'Booking conflict or error');
    } finally {
      setSubmitting(false);
    }
  };

  // Publish open request for providers to submit competitive quotes
  const handleSubmitOpenRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title: formData.title || 'Home Service Request',
        description: formData.description,
        categoryId: formData.categoryId,
        urgency: formData.urgency,
        preferredDate: formData.preferredDate,
        preferredSlot: formData.preferredSlot,
        budget: Number(formData.budget),
        address: {
          street: formData.street,
          city: formData.city,
          zipCode: formData.zipCode
        }
      };

      const res = await api.post('/requests', payload);
      if (res.success) {
        success('Service request published! Providers will submit quotes shortly.');
        navigate(`/customer/requests/${res.data._id}`);
      }
    } catch (err) {
      error(err.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Book a Home Service
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Use AI to diagnose the task or fill out your scheduling preferences.
        </p>
      </div>

      {/* AI Free Text Assistant Accordion / Banner */}
      <SmartRequestModal onApplyClassification={applyAiData} />

      {/* Main Request Form & AI Provider Matcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Request Details */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Service Request Details</span>
            {aiClassification && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                AI Autofilled
              </span>
            )}
          </h2>

          <form onSubmit={handleSubmitOpenRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Request Title / Headline
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Leaking kitchen sink drain pipe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Category
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} (from ${c.basePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency Level
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="low">Low (Flexible timing / Quote inquiry)</option>
                  <option value="medium">Medium (Within a few days)</option>
                  <option value="high">High (Today / Urgent)</option>
                  <option value="emergency">Emergency (Water leak / Electrical hazard)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Problem Description
              </label>
              <textarea
                name="description"
                required
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide details about the issue, location in the home, sounds, symptoms..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition resize-none"
              />
            </div>

            {/* Preferred Scheduling Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  name="preferredDate"
                  required
                  value={formData.preferredDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Time Slot Interval
                </label>
                <select
                  name="preferredSlot"
                  value={formData.preferredSlot}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="09:00 - 12:00">Morning (09:00 - 12:00)</option>
                  <option value="13:00 - 16:00">Afternoon (13:00 - 16:00)</option>
                  <option value="16:00 - 19:00">Evening (16:00 - 19:00)</option>
                </select>
              </div>
            </div>

            {/* Address & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street"
                  required
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zipcode
                </label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Budget Target ($)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                min="35"
                max="2000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleFindMatchedProviders}
                disabled={searchingPros}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{searchingPros ? 'Matching Pros...' : 'Find Matched Pros with AI'}</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Publishing...' : 'Request Competitive Quotes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Section: Matched Providers by AI */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>AI Matched Providers</span>
            </h2>
            {rankedProviders.length > 0 && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                {rankedProviders.length} Top Matches
              </span>
            )}
          </div>

          {rankedProviders.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-8 text-center text-slate-500">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
              <h4 className="font-bold text-sm text-slate-700 mb-1">
                No Matched Providers Yet
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                Click <strong>"Find Matched Pros with AI"</strong> to run our multi-factor ranking algorithm against verified service specialists in your area.
              </p>
              <button
                type="button"
                onClick={handleFindMatchedProviders}
                disabled={searchingPros}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Match Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rankedProviders.map((matchItem, idx) => (
                <ProviderMatchCard
                  key={idx}
                  matchItem={matchItem}
                  onDirectBook={() => handleDirectBook(matchItem)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
