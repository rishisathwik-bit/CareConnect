import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, CheckCircle2, XCircle, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProviderSchedulePage() {
  const { success, error } = useToast();
  const [profile, setProfile] = useState(null);
  const [workingDays, setWorkingDays] = useState([]);
  const [slots, setSlots] = useState([]);
  const [blackoutDate, setBlackoutDate] = useState('');
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [saving, setSaving] = useState(false);

  // Slot conflict tester
  const [inspectDate, setInspectDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectedSlots, setInspectedSlots] = useState([]);
  const [inspecting, setInspecting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/providers/profile/me');
      if (res.success) {
        setProfile(res.data);
        const avail = res.data.availability || {};
        setWorkingDays(avail.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
        setSlots(
          avail.slots && avail.slots.length > 0
            ? avail.slots
            : [
                { start: '09:00', end: '12:00' },
                { start: '13:00', end: '16:00' },
                { start: '16:00', end: '19:00' }
              ]
        );
        setBlackoutDates(avail.blackoutDates || []);
        inspectSlotsForDate(res.data._id, new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      error('Failed to load availability');
    }
  };

  const inspectSlotsForDate = async (providerId, dateStr) => {
    setInspecting(true);
    try {
      const res = await api.get(`/providers/${providerId}/slots?date=${dateStr}`);
      if (res.success) {
        setInspectedSlots(res.data);
      }
    } catch (err) {
      // ignore
    } finally {
      setInspecting(false);
    }
  };

  const toggleDay = (day) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addBlackout = () => {
    if (!blackoutDate) return;
    if (blackoutDates.includes(blackoutDate)) return;
    setBlackoutDates([...blackoutDates, blackoutDate]);
    setBlackoutDate('');
  };

  const removeBlackout = (dateToRemove) => {
    setBlackoutDates(blackoutDates.filter((d) => d !== dateToRemove));
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const res = await api.put('/providers/profile/me/availability', {
        workingDays,
        slots,
        blackoutDates
      });
      if (res.success) {
        success('Availability schedule saved! Booking engine updated.');
        if (profile) inspectSlotsForDate(profile._id, inspectDate);
      }
    } catch (err) {
      error(err.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Availability & Slot Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure active working days, daily slot intervals, and blackout dates. Our availability engine strictly prevents overlapping bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Schedule Configuration */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Working Days */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Standard Working Days
            </label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isActive = workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-3 rounded-2xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{day}</span>
                    <span className="text-[10px] opacity-80">{isActive ? 'ON' : 'OFF'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Intervals */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daily Booking Slot Intervals
              </label>
            </div>

            <div className="space-y-2">
              {slots.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>
                      {s.start} — {s.end}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">3-hour window</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blackout Dates / Holidays */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Blackout / Vacation Dates
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={blackoutDate}
                onChange={(e) => setBlackoutDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addBlackout}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Off Date</span>
              </button>
            </div>

            {blackoutDates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blackoutDates.map((bDate, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"
                  >
                    <span>{new Date(bDate).toLocaleDateString()}</span>
                    <button onClick={() => removeBlackout(bDate)} className="text-rose-400 hover:text-rose-700">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveSchedule}
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition"
          >
            {saving ? 'Saving Availability...' : 'Save Availability Settings'}
          </button>
        </div>

        {/* Right: Live Availability & Conflict Prevention Inspector */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Double-Booking Prevention</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Live Slot Inspector
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any calendar date to see how the booking engine exposes or locks slots based on active bookings.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Test Date
            </label>
            <input
              type="date"
              value={inspectDate}
              onChange={(e) => {
                setInspectDate(e.target.value);
                if (profile) inspectSlotsForDate(profile._id, e.target.value);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Slot Availability Status:
            </span>

            {inspecting ? (
              <div className="text-xs text-slate-400 py-4 text-center">Checking slots...</div>
            ) : inspectedSlots.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No slots configured.</div>
            ) : (
              inspectedSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    slot.isAvailable
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${slot.isAvailable ? 'text-emerald-600' : 'text-rose-600'}`} />
                    <span className="font-bold text-xs">{slot.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {slot.isAvailable ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Available</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Booked / Blocked</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
