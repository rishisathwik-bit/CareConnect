import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Wrench,
  Bell,
  LogOut,
  User,
  Shield,
  Activity,
  Headphones,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  FileText,
  DollarSign,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, location.pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      // ignore in background
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLinks = () => {
    if (role === 'customer') {
      return [
        { label: 'Find Pros', path: '/providers' },
        { label: 'Dashboard', path: '/customer/dashboard' },
        { label: 'AI Book Service', path: '/customer/new-request', highlight: true },
        { label: 'Invoices', path: '/customer/invoices' }
      ];
    }
    if (role === 'provider') {
      return [
        { label: 'Dashboard', path: '/provider/dashboard' },
        { label: 'Job Opportunities', path: '/provider/opportunities' },
        { label: 'My Schedule', path: '/provider/schedule' },
        { label: 'Profile & Skills', path: '/provider/profile' },
        { label: 'Reviews', path: '/provider/reviews' }
      ];
    }
    if (role === 'operations') {
      return [
        { label: 'Live Dispatch Board', path: '/operations/dashboard' }
      ];
    }
    if (role === 'support') {
      return [
        { label: 'Disputes & Refunds', path: '/support/disputes' }
      ];
    }
    if (role === 'admin') {
      return [
        { label: 'Analytics', path: '/admin/dashboard' },
        { label: 'Categories & Skills', path: '/admin/categories' },
        { label: 'Provider Verification', path: '/admin/verification' },
        { label: 'Staff Approvals', path: '/admin/staff-approvals' },
        { label: 'Pricing Rules', path: '/admin/pricing' },
        { label: 'Audit Trail', path: '/admin/audit' }
      ];
    }
    return [
      { label: 'Find Pros', path: '/providers' },
      { label: 'Services', path: '/#services' },
      { label: 'How It Works', path: '/#how-it-works' }
    ];
  };

  const links = getRoleLinks();

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
                  CareConnect
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-600 -mt-1">
                  Home Operations
                </span>
              </div>
            </Link>

            {/* Role Badge Indicator */}
            {user && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ml-2">
                {role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                {role === 'operations' && <Activity className="w-3 h-3 mr-1" />}
                {role === 'support' && <Headphones className="w-3 h-3 mr-1" />}
                {role === 'provider' && <Wrench className="w-3 h-3 mr-1" />}
                {role === 'customer' && <User className="w-3 h-3 mr-1" />}
                {role.charAt(0).toUpperCase() + role.slice(1)} Portal
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    link.highlight
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm hover:from-indigo-700 hover:to-indigo-800 flex items-center gap-1.5 ml-1'
                      : isActive
                      ? 'bg-slate-100 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.highlight && <Sparkles className="w-3.5 h-3.5" />}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                        <span className="font-semibold text-sm text-slate-800">
                          Notifications ({unreadCount} unread)
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n._id}
                              onClick={() => {
                                setShowNotifications(false);
                                if (n.link) navigate(n.link);
                              }}
                              className={`p-3.5 hover:bg-slate-50 transition cursor-pointer text-xs ${
                                !n.isRead ? 'bg-indigo-50/50' : ''
                              }`}
                            >
                              <div className="font-semibold text-slate-900 mb-0.5">
                                {n.title}
                              </div>
                              <div className="text-slate-600 leading-relaxed">
                                {n.message}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info & Avatar (clickable to /profile) */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition group"
                  title="Account & Profile Settings"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs overflow-hidden border border-indigo-200 group-hover:border-indigo-400">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="block text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 capitalize">
                      {role}
                    </span>
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  link.highlight
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 border-t border-slate-100 mt-2 pt-2"
              >
                Account & Profile Settings
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
