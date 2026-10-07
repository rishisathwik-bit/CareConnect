import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  CheckCircle2,
  Camera,
  Save,
  Wrench,
  Activity,
  Headphones,
  ExternalLink,
  Calendar,
  AlertCircle,
  FileText,
  Lock,
  Key,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
];

export default function ProfileSettingsPage() {
  const { user, role, setUser, refreshUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Password update states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setStreet(user.address?.street || '');
      setCity(user.address?.city || '');
      setStateVal(user.address?.state || 'CA');
      setZipCode(user.address?.zipCode || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validation if attempting password change
    if (showPasswordSection || newPassword) {
      if (!currentPassword) {
        error('Please enter your current password to authorize a password change.');
        return;
      }
      if (newPassword.length < 6) {
        error('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        error('New passwords do not match. Please verify and re-type.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name,
        email: email.trim(),
        phone,
        avatar,
        address: {
          street,
          city,
          state: stateVal,
          zipCode
        }
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.put('/auth/profile', payload);
      if (res.success) {
        success('Your profile and security credentials were updated successfully!');
        if (setUser && res.user) {
          setUser((prev) => ({ ...prev, ...res.user }));
        }

        // If a new session token was returned, update storage
        if (res.token) {
          localStorage.setItem('careconnect_token', res.token);
        }

        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);

        await refreshUser();
      } else {
        error(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      error(err.message || 'Server error while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Account & Profile Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal identity, login email, security password, and service address.
            </p>
          </div>

          {/* Role badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 self-start sm:self-auto">
            {role === 'admin' && <Shield className="w-4 h-4 text-purple-600" />}
            {role === 'operations' && <Activity className="w-4 h-4 text-amber-600" />}
            {role === 'support' && <Headphones className="w-4 h-4 text-sky-600" />}
            {role === 'provider' && <Wrench className="w-4 h-4 text-teal-600" />}
            {role === 'customer' && <User className="w-4 h-4 text-indigo-600" />}
            <span className="capitalize">{role} Account</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1"></span>
          </div>
        </div>

        {/* Profile Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Cover / Profile Banner Header */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/20 bg-indigo-100 flex items-center justify-center text-3xl font-extrabold text-indigo-700 shadow-lg">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0) || 'U'
                  )}
                </div>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-bold text-white">{name || 'CareConnect Member'}</h2>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" title="Verified Account" />
                </div>
                <p className="text-xs text-slate-300 font-mono">{email}</p>
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-400">
                  <span>CareConnect ID: <span className="font-mono text-indigo-300">{user.id || user._id}</span></span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Profile Photo / Avatar
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="text-xs text-slate-400 shrink-0 mr-1">Choose preset:</span>
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-10 h-10 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                        avatar === url ? 'border-indigo-600 ring-2 ring-indigo-300 scale-105' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Or paste a custom avatar image URL (https://...)"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Personal & Login Credentials Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Personal & Login Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Editable Login Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                    <span>Login Email Address *</span>
                    <span className="text-[11px] text-indigo-600 font-normal">
                      Used for authentication and notifications
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                      placeholder="user@example.com"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    You can update your email at any time. When changed, your session security token will be refreshed automatically.
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Password & Security Section */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Password & Account Security
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update your sign-in password to keep your account safe
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    showPasswordSection
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
                </button>
              </div>

              {showPasswordSection && (
                <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPasswords ? 'Hide passwords' : 'Show passwords'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Current Password *
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        New Password (min 6) *
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                          confirmPassword && newPassword !== confirmPassword
                            ? 'border-rose-300 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                  </div>

                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Passwords do not match.
                    </p>
                  )}
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Address Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Service Address & Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    placeholder="123 Market Street, Apt 4B"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    placeholder="CA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ZIP / Postal Code
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    placeholder="94102"
                  />
                </div>
              </div>
            </div>

            {/* Role specific quick jump links */}
            {role === 'provider' && (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                    Service Provider Profile & Trade Settings
                  </h4>
                  <p className="text-xs text-teal-700 mt-0.5">
                    Configure your business name, hourly rate, verified skills, and upload trade credentials.
                  </p>
                </div>
                <Link
                  to="/provider/profile"
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition flex items-center gap-1 shrink-0"
                >
                  <span>Edit Pro Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {role === 'customer' && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Past Bookings & Invoices
                  </h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    View official receipts, payment history, and printable itemized tax statements.
                  </p>
                </div>
                <Link
                  to="/customer/invoices"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1 shrink-0"
                >
                  <span>View Invoices</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Save Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200 hover:shadow-indigo-300 flex items-center gap-2 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile & Security Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
