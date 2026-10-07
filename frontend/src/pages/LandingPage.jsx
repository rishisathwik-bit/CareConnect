import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import SmartRequestModal from '../components/ai/SmartRequestModal';
import StarRating from '../components/common/StarRating';
import {
  Wrench,
  Zap,
  Sparkles,
  Hammer,
  Fan,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowRight,
  Search,
  Star,
  Check,
  Calendar
} from 'lucide-react';

const ICON_MAP = {
  Wrench: Wrench,
  Zap: Zap,
  Sparkles: Sparkles,
  Hammer: Hammer,
  Fan: Fan,
  CheckCircle: CheckCircle2
};

export default function LandingPage() {
  const [categories, setCategories] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, provRes] = await Promise.all([
          api.get('/categories'),
          api.get('/providers?verifiedOnly=true')
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (provRes.success) setTopProviders(provRes.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApplyAIClassification = (classificationData) => {
    // Navigate to new request page with state pre-filled
    navigate('/customer/new-request', { state: { prefill: classificationData } });
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span>Next-Gen Home Services & Operations</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Quality home care,{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                  AI-matched
                </span>{' '}
                and verified.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Book top-tier plumbers, electricians, cleaners, and appliance technicians.
                With automated availability conflict prevention, before/after work evidence, and seamless operations oversight.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/customer/new-request"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Book with AI Assistant</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#services"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 transition text-center"
                >
                  Browse Categories
                </a>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Licensed & Background Checked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>No Double-Booking Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Photo Evidence Verification</span>
                </div>
              </div>
            </div>

            {/* Right Interactive AI Card */}
            <div className="lg:col-span-6">
              <SmartRequestModal onApplyClassification={handleApplyAIClassification} />
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
            Explore Services
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900">
            Professional trades for every home need
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Every category is managed with transparent pricing policies, verified skills, and quality standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || Wrench;
            return (
              <div
                key={cat._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                        Starting from
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">
                        ${cat.basePrice}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {cat.description}
                  </p>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {cat.skillsList?.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  to="/customer/new-request"
                  state={{ categoryId: cat._id }}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-semibold text-xs transition text-center flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <span>Request {cat.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-900 text-white py-16 lg:py-20 rounded-3xl mx-4 sm:mx-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
              The CareConnect Lifecycle
            </span>
            <h3 className="text-3xl font-extrabold text-white">
              End-to-End Transparency from Request to Sign-Off
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/50">
                1
              </div>
              <h4 className="font-bold text-base text-white mb-2">
                1. AI Request Intake
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe your problem in natural text. AI tags urgency, extracts required skills, and matches suitable verified providers.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/50">
                2
              </div>
              <h4 className="font-bold text-base text-white mb-2">
                2. Quotes & Slot Lock
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive quotes or direct book. Our availability engine ensures zero overlapping schedules and immediate slot reservation.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/50">
                3
              </div>
              <h4 className="font-bold text-base text-white mb-2">
                3. Live Job Tracking
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track status milestones (En Route, In Progress, Complete). Technicians capture and attach before/after work evidence photos.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/50">
                4
              </div>
              <h4 className="font-bold text-base text-white mb-2">
                4. Sign-Off & Escrow
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customer reviews completed work evidence, approves invoice, and rates technician. Support agents handle disputes and refunds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Verified Providers */}
      <section id="providers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
              Vetted Experts
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900">
              Top Rated Home Specialists
            </h3>
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <Link
              to="/providers"
              className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1 transition"
            >
              Browse All Pros <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/customer/new-request"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
            >
              Match with AI <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topProviders.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <img
                  src={p.user?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                  alt={p.businessName}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{p.businessName}</h4>
                  <span className="text-xs text-slate-500 block">{p.user?.name}</span>
                  <div className="mt-1">
                    <StarRating rating={p.ratingAverage} count={p.ratingCount} size="sm" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                {p.bio}
              </p>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                <span className="font-extrabold text-slate-900 text-sm">
                  ${p.hourlyRate}/hr
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                  {p.completedJobsCount} jobs completed
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
