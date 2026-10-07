import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, Headphones, Wrench, User, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

export default function DemoRoleSwitcher() {
  const { user, role, demoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loadingRole, setLoadingRole] = useState(null);

  const ROLES = [
    {
      id: 'customer',
      title: 'Customer',
      name: 'Alice Johnson',
      icon: User,
      color: 'bg-emerald-500 text-white hover:bg-emerald-600',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-800 border-emerald-300',
      path: '/customer/dashboard'
    },
    {
      id: 'provider',
      title: 'Service Provider',
      name: 'David Miller (Plumbing Pro)',
      icon: Wrench,
      color: 'bg-indigo-500 text-white hover:bg-indigo-600',
      activeColor: 'ring-2 ring-indigo-500 bg-indigo-50 text-indigo-800 border-indigo-300',
      path: '/provider/dashboard'
    },
    {
      id: 'operations',
      title: 'Operations Manager',
      name: 'Marcus Brody',
      icon: Activity,
      color: 'bg-sky-500 text-white hover:bg-sky-600',
      activeColor: 'ring-2 ring-sky-500 bg-sky-50 text-sky-800 border-sky-300',
      path: '/operations/dashboard'
    },
    {
      id: 'support',
      title: 'Support Agent',
      name: 'Sarah Chen',
      icon: Headphones,
      color: 'bg-amber-500 text-white hover:bg-amber-600',
      activeColor: 'ring-2 ring-amber-500 bg-amber-50 text-amber-800 border-amber-300',
      path: '/support/disputes'
    },
    {
      id: 'admin',
      title: 'Platform Admin',
      name: 'Victoria Vance',
      icon: Shield,
      color: 'bg-violet-600 text-white hover:bg-violet-700',
      activeColor: 'ring-2 ring-violet-500 bg-violet-50 text-violet-800 border-violet-300',
      path: '/admin/dashboard'
    }
  ];

  const handleSwitch = async (roleObj) => {
    if (user?.role === roleObj.id) {
      navigate(roleObj.path);
      return;
    }

    try {
      setLoadingRole(roleObj.id);
      const res = await demoLogin(roleObj.id);
      if (res.success) {
        success(`Switched role to ${roleObj.title} (${res.user.name})`);
        navigate(roleObj.path);
      }
    } catch (err) {
      error(`Failed to switch to ${roleObj.title}: ${err.message}`);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-2 max-w-4xl w-[94vw] sm:w-auto">
        <div className="flex items-center justify-between px-3 py-1 mb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              CareConnect Demo Persona Switcher
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (1-Click Role Simulation)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-slate-500 hidden md:inline">
                Active: <strong className="text-slate-800">{user.name}</strong> ({role})
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
              title={collapsed ? 'Expand bar' : 'Collapse bar'}
            >
              {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 pb-1">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = role === r.id;
              const isLoading = loadingRole === r.id;

              return (
                <button
                  key={r.id}
                  onClick={() => handleSwitch(r)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    isActive
                      ? r.activeColor
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-current' : 'text-slate-500'}`} />
                  <span>{r.title}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
