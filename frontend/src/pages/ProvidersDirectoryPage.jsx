import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import StarRating from '../components/common/StarRating';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Zap,
  Sparkles,
  Hammer,
  Fan,
  Check,
  ArrowRight,
  Award,
  Phone,
  Mail,
  Calendar,
  X,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  ExternalLink,
  ShieldAlert,
  FileCheck
} from 'lucide-react';

const ICON_MAP = {
  Wrench: Wrench,
  Zap: Zap,
  Sparkles: Sparkles,
  Hammer: Hammer,
  Fan: Fan,
  CheckCircle: CheckCircle2
};

export default function ProvidersDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || '');
  const [minRating, setMinRating] = useState(parseFloat(searchParams.get('rating')) || 0);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'jobs' | 'rate-low' | 'rate-high'

  // Modal Profile View
  const [activeModalProvider, setActiveModalProvider] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [verifiedOnly]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [catRes, provRes] = await Promise.all([
        api.get('/categories'),
        api.get(`/providers?verifiedOnly=${verifiedOnly}`)
      ]);
      if (catRes.success) setCategories(catRes.data);
      if (provRes.success) setProviders(provRes.data);
    } catch (err) {
      console.error('Error fetching directory data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort providers in-memory for immediate, snappy UX
  const filteredProviders = useMemo(() => {
    let list = [...providers];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((p) =>
        p.categories?.some((cat) => cat._id === selectedCategory || cat.slug === selectedCategory)
      );
    }

    // Search query filter (business name, bio, skills)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.businessName?.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          p.user?.name?.toLowerCase().includes(q) ||
          p.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Area / ZIP filter
    if (selectedArea.trim()) {
      const a = selectedArea.toLowerCase();
      list = list.filter(
        (p) =>
          p.serviceAreas?.some((area) => area.toLowerCase().includes(a)) ||
          p.user?.address?.city?.toLowerCase().includes(a) ||
          p.user?.address?.zipCode?.includes(a)
      );
    }

    // Minimum rating filter
    if (minRating > 0) {
      list = list.filter((p) => (p.ratingAverage || 0) >= minRating);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      }
      if (sortBy === 'jobs') {
        return (b.completedJobsCount || 0) - (a.completedJobsCount || 0);
      }
      if (sortBy === 'rate-low') {
        return (a.hourlyRate || 0) - (b.hourlyRate || 0);
      }
      if (sortBy === 'rate-high') {
        return (b.hourlyRate || 0) - (a.hourlyRate || 0);
      }
      return 0;
    });

    return list;
  }, [providers, selectedCategory, searchQuery, selectedArea, minRating, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedArea('');
    setMinRating(0);
    setSortBy('rating');
  };

  const handleBookProvider = (provider) => {
    const primaryCat = provider.categories?.[0];
    const queryParams = new URLSearchParams();
    if (primaryCat?._id) queryParams.set('category', primaryCat._id);
    queryParams.set('preferredProvider', provider._id);
    navigate(`/customer/new-request?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Background Checked & Verified Specialists</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Verified Service Providers
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore our vetted network of licensed plumbers, certified electricians, professional cleaners, and HVAC technicians. Compare verified credentials, transparent hourly rates, and client reviews.
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Keyword Search */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pro name, company, or skills (e.g., leak repair)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Service Area / Zip */}
            <div className="md:col-span-3 relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                placeholder="City or ZIP (e.g. 94102)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Rating Filter */}
            <div className="md:col-span-2">
              <select
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>Any Rating</option>
                <option value={4.0}>★ 4.0 & above</option>
                <option value={4.5}>★ 4.5 & above</option>
                <option value={4.8}>★ 4.8 & above</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="rating">Top Rated</option>
                <option value="jobs">Most Jobs Completed</option>
                <option value="rate-low">Price: Low to High</option>
                <option value="rate-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Category:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Trades ({providers.length})
            </button>
            {categories.map((cat) => {
              const count = providers.filter((p) =>
                p.categories?.some((c) => c._id === cat._id)
              ).length;
              const Icon = ICON_MAP[cat.icon] || Wrench;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                    selectedCategory === cat._id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat._id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Metadata Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div>
            Showing <strong className="text-slate-800 font-bold">{filteredProviders.length}</strong> verified professionals
            {selectedCategory !== 'all' && (
              <span> in <strong className="text-indigo-600">{categories.find(c => c._id === selectedCategory)?.name}</strong></span>
            )}
          </div>
          {(searchQuery || selectedCategory !== 'all' || selectedArea || minRating > 0) && (
            <button
              onClick={resetFilters}
              className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Providers Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-slate-500">Loading verified specialists...</span>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No specialists match your filters</h3>
            <p className="text-sm text-slate-500">
              Try adjusting your search query, lowering the minimum rating, or clearing trade categories.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => {
              const isVerified = provider.verificationStatus === 'verified';
              return (
                <div
                  key={provider._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-indigo-200 transition group relative"
                >
                  <div>
                    {/* Header: Avatar, Name, Verification badge */}
                    <div className="flex items-start gap-3.5 mb-4">
                      <div className="relative shrink-0">
                        <img
                          src={provider.user?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                          alt={provider.businessName}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm"
                        />
                        {isVerified && (
                          <div
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md"
                            title="Verified Pro (Background Checked & Licensed)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition">
                            {provider.businessName}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>{provider.user?.name}</span>
                          {provider.experienceYears && (
                            <>
                              <span>•</span>
                              <span>{provider.experienceYears} yrs exp</span>
                            </>
                          )}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <StarRating rating={provider.ratingAverage || 5} count={provider.ratingCount || 0} size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Bio snippet */}
                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {provider.bio || 'Experienced and reliable home service professional dedicated to customer satisfaction.'}
                    </p>

                    {/* Trade Categories */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {provider.categories?.map((cat) => (
                        <span
                          key={cat._id}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-semibold border border-indigo-100"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>

                    {/* Skills pills */}
                    {provider.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {provider.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {provider.skills.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full font-medium">
                            +{provider.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Service Areas */}
                    {provider.serviceAreas?.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Covers {provider.serviceAreas.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Rate, Completed Jobs & CTA */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Hourly Rate</span>
                        <span className="text-base font-extrabold text-slate-900">
                          ${provider.hourlyRate}
                          <span className="text-xs font-normal text-slate-500">/hr</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Track Record</span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <Check className="w-3 h-3" />
                          {provider.completedJobsCount || 0} jobs completed
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setActiveModalProvider(provider)}
                        className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1 transition"
                      >
                        <span>View Profile</span>
                      </button>
                      <button
                        onClick={() => handleBookProvider(provider)}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-sm transition"
                      >
                        <span>Book Slot</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Provider Detailed Profile Modal */}
      {activeModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white relative">
              <button
                onClick={() => setActiveModalProvider(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={activeModalProvider.user?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                  alt={activeModalProvider.businessName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">
                      {activeModalProvider.businessName}
                    </h2>
                    {activeModalProvider.verificationStatus === 'verified' && (
                      <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Verified Pro
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mt-0.5">
                    Lead Technician: {activeModalProvider.user?.name}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <StarRating
                      rating={activeModalProvider.ratingAverage || 5}
                      count={activeModalProvider.ratingCount || 0}
                      size="sm"
                    />
                    <span className="text-slate-400">•</span>
                    <span className="text-indigo-300 font-semibold">
                      {activeModalProvider.completedJobsCount || 0} Successful Jobs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Standard Rate</span>
                  <span className="text-lg font-extrabold text-slate-900">${activeModalProvider.hourlyRate}/hr</span>
                </div>
                <div className="border-x border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Experience</span>
                  <span className="text-lg font-extrabold text-slate-900">{activeModalProvider.experienceYears || 5}+ Years</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Satisfaction</span>
                  <span className="text-lg font-extrabold text-emerald-600">
                    {activeModalProvider.ratingAverage ? `${((activeModalProvider.ratingAverage / 5) * 100).toFixed(0)}%` : '100%'}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  About Provider
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-white border border-slate-100 p-4 rounded-2xl">
                  {activeModalProvider.bio || 'Committed to delivering professional, reliable, and prompt repair & installation services with top-tier craftsmanship.'}
                </p>
              </div>

              {/* Verified Credentials Status */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  CareConnect Vetting & Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block text-slate-800">Identity & Background Check</strong>
                      <span className="text-emerald-700 font-semibold">Verified Clean Record</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block text-slate-800">General Liability Coverage</strong>
                      <span className="text-emerald-700 font-semibold">Active & Audited</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade Categories & Skills */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Core Skills & Services Offered
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalProvider.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Covered Service Areas & Postal Codes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeModalProvider.serviceAreas?.map((area, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold"
                    >
                      <MapPin className="w-3 h-3 text-indigo-500" />
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Pricing estimate</span>
                <span className="text-base font-extrabold text-slate-900">${activeModalProvider.hourlyRate}/hr</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModalProvider(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleBookProvider(activeModalProvider)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200 hover:shadow-indigo-300 flex items-center gap-2 transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Request Booking Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
