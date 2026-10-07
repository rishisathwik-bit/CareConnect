import React, { useState } from 'react';
import { api } from '../../api/client';
import { Sparkles, Clock, DollarSign, CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function SmartRequestModal({ onApplyClassification, initialText = '' }) {
  const [text, setText] = useState(initialText);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 8) {
      setErrorMsg('Please enter at least a short sentence describing the problem.');
      return;
    }

    setErrorMsg('');
    setAnalyzing(true);
    try {
      const res = await api.post('/ai/classify-request', { text });
      if (res.success) {
        setResult(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'AI Classification service temporarily unavailable.');
    } finally {
      setAnalyzing(false);
    }
  };

  const samplePrompts = [
    'Emergency: Kitchen sink drain pipe burst and is spraying water everywhere',
    'Main electrical circuit breaker trips whenever space heater is turned on',
    'Need deep move-out cleaning for 2-bedroom condo including oven and balcony',
    'Samsung double door refrigerator compressor is buzzing and not cooling below 52 degrees',
    'Install smart Nest thermostat and replace old heating vent filters'
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-500/20 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
            <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            AI Service Assistant
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-semibold">
            Real-time NLP Engine
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Describe what you need fixed in plain words
        </h3>
        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          Our AI analyzes your problem to instantly identify the trade category, required specialized skills, urgency level, and realistic price estimates.
        </p>

        {/* Free text prompt input */}
        <div className="relative mb-3">
          <textarea
            rows="3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Water is leaking from behind the toilet tank and pooling on the bathroom floor. Need urgent diagnostic and seal replacement."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none"
          />

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="absolute bottom-3 right-3 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Request
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {errorMsg}
          </div>
        )}

        {/* Quick prompt suggestions */}
        <div className="mb-5">
          <span className="text-[11px] text-slate-400 block mb-2 font-medium">
            Try a sample request:
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setText(prompt)}
                className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition truncate max-w-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* AI Results card */}
        {result && (
          <div className="bg-slate-800/90 border border-indigo-400/30 rounded-2xl p-5 backdrop-blur-md animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Classified Category</span>
                  <span className="text-base font-bold text-white">
                    {result.categoryName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Urgency</span>
                  <StatusBadge status={result.urgencyLevel} />
                </div>
                <div className="text-right pl-3 border-l border-slate-700">
                  <span className="text-[11px] text-slate-400 block">Confidence</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {Math.round(result.confidenceScore * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Skills & Estimation row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Suggested Required Skills:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.suggestedSkills?.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[11px] text-slate-400 block">Estimated Cost</span>
                    <span className="text-sm font-bold text-emerald-400">
                      ${result.estimatedPriceRange?.min} - ${result.estimatedPriceRange?.max}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-[11px] text-slate-400 block">Est. Duration</span>
                    <span className="text-sm font-bold text-slate-200">
                      ~{result.estimatedHours} hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            {onApplyClassification && (
              <button
                type="button"
                onClick={() => onApplyClassification({ text, ...result })}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Use this AI Classification for My Request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
