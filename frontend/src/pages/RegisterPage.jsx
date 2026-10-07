import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Wrench,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  ArrowRight,
  Shield,
  Activity,
  Headphones,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Key
} from 'lucide-react';

const ROLE_CONFIGS = [
  {
    id: 'customer',
    label: 'Customer',
    icon: User,
    color: 'indigo',
    badge: 'Instant Access',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Hire verified pros, book home services & track jobs'
  },
  {
    id: 'provider',
    label: 'Service Provider',
    icon: Wrench,
    color: 'teal',
    badge: 'Pro Onboarding',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Receive job leads, manage calendar & get paid'
  },
  {
    id: 'operations',
    label: 'Operations Manager',
    icon: Activity,
    color: 'amber',
    badge: 'Admin Approval Req.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Live field dispatch, tech fleet tracking & emergency routing'
  },
  {
    id: 'support',
    label: 'Support Agent',
    icon: Headphones,
    color: 'sky',
    badge: 'Admin Approval Req.',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    description: '3-way dispute mediation, customer claims & refund engine'
  },
  {
    id: 'admin',
    label: 'Platform Admin',
    icon: Shield,
    color: 'purple',
    badge: 'Admin Approval Req.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Global GMV metrics, service catalog, pricing & staff approvals'
  }
];

export default function RegisterPage() {
  const [role, setRole] = useState('customer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    street: '',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    businessName: '',
    hourlyRate: 55,
    registrationNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [pendingApprovalResult, setPendingApprovalResult] = useState(null);

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const isStaffRole = ['operations', 'support', 'admin'].includes(role);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role,
      phone: formData.phone,
      registrationNotes: formData.registrationNotes,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
      }
    };

    if (role === 'provider') {
      payload.businessName = formData.businessName || `${formData.name}'s Services`;
      payload.hourlyRate = Number(formData.hourlyRate) || 50;
      payload.serviceAreas = [formData.zipCode, formData.city];
    }

    try {
      const res = await register(payload);
      if (res.success) {
        if (res.pendingApproval) {
          // Staff role submitted for approval
          setPendingApprovalResult({
            name: formData.name,
            email: formData.email,
            role,
            message: res.message
          });
          success(`Registration request submitted for Admin review!`);
        } else {
          // Instant active user
          success(`Account created! Welcome, ${res.user?.name || formData.name}`);
          if (role === 'provider') {
            navigate('/provider/dashboard');
          } else {
            navigate('/customer/dashboard');
          }
        }
      } else {
        error(res.message || 'Registration failed');
      }
    } catch (err) {
      error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // If staff registration is submitted, show confirmation screen
  if (pendingApprovalResult) {
    const selectedConfig = ROLE_CONFIGS.find((r) => r.id === pendingApprovalResult.role) || ROLE_CONFIGS[2];
    const Icon = selectedConfig.icon;

    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <Clock className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
              <Clock className="w-3 h-3" />
              Pending Admin Review
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Registration Request Submitted
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your application for <strong className="text-slate-800 capitalize">{selectedConfig.label}</strong> has been logged in the system.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant:</span>
              <strong className="text-slate-900 font-semibold">{pendingApprovalResult.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <strong className="text-slate-900 font-mono">{pendingApprovalResult.email}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Role:</span>
              <span className="font-bold text-indigo-700 capitalize flex items-center gap-1">
                <Icon className="w-3.5 h-3.5" />
                {selectedConfig.label}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Status:</span>
              <span className="text-amber-600 font-bold uppercase tracking-wider text-[11px]">
                Pending Acceptance
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed text-left flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Next Step:</strong> A <strong>Platform Administrator</strong> must review and accept your registration in the Admin Review Queue (<strong>/admin/staff-approvals</strong>). Once accepted, you can log in immediately using your registered email and password.
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to="/login"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[11px] text-slate-400">
              Need immediate testing? Switch to pre-seeded admin/staff accounts using the Demo Persona Switcher docked below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-100">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Create your Account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Select your platform role to configure permissions and onboarding
          </p>
        </div>

        {/* 5-Role Selection Grid */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Select Your Role
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {ROLE_CONFIGS.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${r.badgeColor}`}
                    >
                      {r.badge}
                    </span>
                  </div>
                  <div>
                    <h4
                      className={`text-xs font-bold leading-tight ${
                        isSelected ? 'text-indigo-950' : 'text-slate-800'
                      }`}
                    >
                      {r.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                      {r.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Staff Approval Notice Banner */}
        {isStaffRole && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Administrator Approval Required:</strong>
              <span>
                As an internal staff role, your registration will be reviewed and approved by a <strong>Platform Administrator</strong> before your login credentials are activated.
              </span>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              required
              minLength="6"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              You will use this password together with your email to log in once approved.
            </span>
          </div>

          {/* Provider specific fields */}
          {role === 'provider' && (
            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 space-y-3">
              <span className="text-xs font-bold text-teal-900 block">
                Trade Business Profile
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business / Trade Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Morgan Rapid Plumbing & Rooter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standard Hourly Rate ($/hr)
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  min="20"
                  max="300"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          )}

          {/* Staff specific application note */}
          {isStaffRole && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application / Qualification Note (For Admin Review)
              </label>
              <textarea
                rows="2"
                name="registrationNotes"
                value={formData.registrationNotes}
                onChange={handleChange}
                placeholder="e.g. 5 years dispatch experience, managing San Francisco field team..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          )}

          {/* Address fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="123 Market St"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ZIP / City
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="94102"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2 ${
              isStaffRole
                ? 'bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 shadow-amber-200'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {loading ? (
              'Submitting...'
            ) : isStaffRole ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Submit {ROLE_CONFIGS.find((r) => r.id === role)?.label} Application</span>
              </>
            ) : (
              <>
                <span>Register as {ROLE_CONFIGS.find((r) => r.id === role)?.label}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
