import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  Percent,
  DollarSign,
  Zap,
  Shield,
  ArrowLeft,
  Save,
  CheckCircle2,
  Calculator,
  AlertTriangle
} from 'lucide-react';

export default function AdminPricingPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    platformFeePercentage: 10,
    taxPercentage: 8.25,
    minimumBookingFee: 35,
    urgencySurgeMultiplier: {
      low: 1.0,
      medium: 1.0,
      high: 1.25,
      emergency: 1.5
    }
  });

  // Dynamic simulation calculator state
  const [testLabor, setTestLabor] = useState(120);
  const [testUrgency, setTestUrgency] = useState('emergency');

  useEffect(() => {
    fetchPricingRule();
  }, []);

  const fetchPricingRule = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/pricing-rules');
      if (res.success && res.data) {
        setFormData({
          platformFeePercentage: res.data.platformFeePercentage ?? 10,
          taxPercentage: res.data.taxPercentage ?? 8.25,
          minimumBookingFee: res.data.minimumBookingFee ?? 35,
          urgencySurgeMultiplier: {
            low: res.data.urgencySurgeMultiplier?.low ?? 1.0,
            medium: res.data.urgencySurgeMultiplier?.medium ?? 1.0,
            high: res.data.urgencySurgeMultiplier?.high ?? 1.25,
            emergency: res.data.urgencySurgeMultiplier?.emergency ?? 1.5
          }
        });
      }
    } catch (err) {
      error(`Failed to load pricing rules: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/analytics/pricing-rules', formData);
      if (res.success) {
        success('Platform pricing rules updated and active');
      }
    } catch (err) {
      error(`Failed to update rules: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculator simulations
  const multiplier = formData.urgencySurgeMultiplier[testUrgency] || 1.0;
  const surchargedLabor = testLabor * multiplier;
  const simulatedPlatformFee = Math.round(surchargedLabor * (formData.platformFeePercentage / 100) * 100) / 100;
  const simulatedTax = Math.round(surchargedLabor * (formData.taxPercentage / 100) * 100) / 100;
  const simulatedTotal = Math.max(
    formData.minimumBookingFee,
    Math.round((surchargedLabor + simulatedPlatformFee + simulatedTax) * 100) / 100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Dynamic Pricing Rules & Commission Controls
        </h1>
        <p className="text-sm text-slate-500">
          Configure marketplace fee splits, urgency surge multipliers, minimum fare thresholds, and taxes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Pricing Rules Editor */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Percent className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-slate-900 text-base">
              Marketplace Economics Parameters
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* Core Rates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Platform Commission Fee (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={formData.platformFeePercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, platformFeePercentage: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <Percent className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Deducted from gross booking value.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Applicable Sales Tax (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="30"
                    value={formData.taxPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, taxPercentage: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <Percent className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Standard municipal service tax.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Minimum Fare Threshold ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={formData.minimumBookingFee}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumBookingFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <DollarSign className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Minimum invoice baseline.
                </span>
              </div>
            </div>

            {/* Urgency Surge Multipliers */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Urgency Surge Multipliers
                </h3>
              </div>
              <p className="text-slate-500 text-xs">
                Automatically adjusts labor pricing based on customer urgency tags and emergency SLA requirements.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Low Urgency
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="3.0"
                    value={formData.urgencySurgeMultiplier.low}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        urgencySurgeMultiplier: {
                          ...formData.urgencySurgeMultiplier,
                          low: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-extrabold text-slate-900"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Baseline standard</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Medium Urgency
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="3.0"
                    value={formData.urgencySurgeMultiplier.medium}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        urgencySurgeMultiplier: {
                          ...formData.urgencySurgeMultiplier,
                          medium: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-extrabold text-slate-900"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Scheduled in 48h</span>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                    High Urgency
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="3.0"
                    value={formData.urgencySurgeMultiplier.high}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        urgencySurgeMultiplier: {
                          ...formData.urgencySurgeMultiplier,
                          high: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-300 text-xs font-extrabold text-amber-900 bg-white"
                    required
                  />
                  <span className="text-[10px] text-amber-700 block">Same day service</span>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-1">
                  <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px]">
                    Emergency
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="3.0"
                    value={formData.urgencySurgeMultiplier.emergency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        urgencySurgeMultiplier: {
                          ...formData.urgencySurgeMultiplier,
                          emergency: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-rose-300 text-xs font-extrabold text-rose-900 bg-white"
                    required
                  />
                  <span className="text-[10px] text-rose-700 block">Immediate dispatch</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating Rules...' : 'Save & Publish Pricing Rules'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Live Invoice Simulator */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-indigo-800 pb-3">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">Real-Time Invoice Simulator</h3>
              <p className="text-[11px] text-indigo-300">Live preview of customer billing logic</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-indigo-200 mb-1">
                Base Service Quote ($)
              </label>
              <input
                type="number"
                value={testLabor}
                onChange={(e) => setTestLabor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-indigo-900/50 border border-indigo-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="block font-bold text-indigo-200 mb-1">
                Simulated Urgency Tier
              </label>
              <select
                value={testUrgency}
                onChange={(e) => setTestUrgency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-indigo-900/50 border border-indigo-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="low">Low (1.0x)</option>
                <option value="medium">Medium (1.0x)</option>
                <option value="high">High ({formData.urgencySurgeMultiplier.high}x)</option>
                <option value="emergency">Emergency ({formData.urgencySurgeMultiplier.emergency}x)</option>
              </select>
            </div>

            {/* Itemized Calculation Box */}
            <div className="p-4 rounded-2xl bg-indigo-900/30 border border-indigo-800/80 space-y-2.5 pt-4">
              <div className="flex items-center justify-between text-indigo-200">
                <span>Labor Cost (Base × Multiplier {multiplier}x):</span>
                <strong className="text-white">${surchargedLabor.toFixed(2)}</strong>
              </div>

              <div className="flex items-center justify-between text-indigo-200">
                <span>Platform Commission ({formData.platformFeePercentage}%):</span>
                <strong className="text-emerald-400">+${simulatedPlatformFee.toFixed(2)}</strong>
              </div>

              <div className="flex items-center justify-between text-indigo-200">
                <span>Tax Assessment ({formData.taxPercentage}%):</span>
                <strong className="text-white">+${simulatedTax.toFixed(2)}</strong>
              </div>

              <div className="pt-3 border-t border-indigo-800 flex items-center justify-between text-sm">
                <span className="font-extrabold text-white">Final Customer Total:</span>
                <span className="text-xl font-black text-emerald-400">
                  ${simulatedTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-indigo-300 italic">
              * The platform takes <strong>${simulatedPlatformFee.toFixed(2)}</strong>, and provider payout settles at <strong>${surchargedLabor.toFixed(2)}</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
