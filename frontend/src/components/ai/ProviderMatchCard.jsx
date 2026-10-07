import React from 'react';
import StarRating from '../common/StarRating';
import StatusBadge from '../common/StatusBadge';
import { ShieldCheck, MapPin, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function ProviderMatchCard({ matchItem, onSelect, onDirectBook }) {
  const { provider, profile, matchScore, matchReasons } = matchItem;

  const scoreColor =
    matchScore >= 90
      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
      : matchScore >= 75
      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
      : 'bg-amber-50 text-amber-700 border-amber-300';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between">
      {/* Top row: match score pill & verified pro badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={`px-2.5 py-1 rounded-full text-xs font-extrabold border flex items-center gap-1.5 ${scoreColor}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{matchScore}% AI Match</span>
        </div>

        {profile.verificationStatus === 'verified' && (
          <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Verified Pro
          </span>
        )}
      </div>

      {/* Provider Details */}
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden shrink-0 shadow-inner">
          {provider?.avatar ? (
            <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-lg text-indigo-600">
              {provider?.name?.charAt(0) || 'P'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 text-base truncate">
            {profile.businessName || provider?.name}
          </h4>
          <span className="text-xs text-slate-500 block truncate">
            {provider?.name} • {profile.experienceYears || 1}+ yrs exp
          </span>

          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={profile.ratingAverage} count={profile.ratingCount} size="sm" />
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 font-medium">
              {profile.completedJobsCount || 0} jobs done
            </span>
          </div>
        </div>
      </div>

      {/* Hourly Rate & Service Area */}
      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-100">
        <div>
          <span className="text-slate-400 block text-[10px]">Standard Rate</span>
          <span className="text-sm font-extrabold text-slate-900">
            ${profile.hourlyRate}
            <span className="text-xs font-normal text-slate-500">/hr</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-slate-400 block text-[10px]">Service Area</span>
          <span className="font-medium text-slate-700 flex items-center gap-1 justify-end">
            <MapPin className="w-3 h-3 text-slate-400" />
            {profile.serviceAreas?.[0] || 'San Francisco'}
          </span>
        </div>
      </div>

      {/* AI Match Explanations */}
      {matchReasons && matchReasons.length > 0 && (
        <div className="mb-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Why this provider matches:
          </span>
          {matchReasons.slice(0, 3).map((reason, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {profile.skills?.slice(0, 3).map((s, idx) => (
          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
            {s}
          </span>
        ))}
        {profile.skills?.length > 3 && (
          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[11px]">
            +{profile.skills.length - 3} more
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {onSelect && (
          <button
            onClick={() => onSelect(matchItem)}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            View Profile
          </button>
        )}
        {onDirectBook && (
          <button
            onClick={() => onDirectBook(matchItem)}
            className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition"
          >
            Book Slot
          </button>
        )}
      </div>
    </div>
  );
}
