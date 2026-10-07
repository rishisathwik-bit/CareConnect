import React from 'react';

const STATUS_CONFIG = {
  // Booking / Request statuses
  open: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Open' },
  quoted: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Quoted' },
  booked: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Booked' },
  scheduled: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Scheduled' },
  en_route: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En Route' },
  in_progress: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', label: 'In Progress' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', label: 'Cancelled' },
  disputed: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Disputed' },

  // Verification statuses
  verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Verified Pro' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending Review' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Rejected' },

  // Payment statuses
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Paid' },
  refunded: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Refunded' },

  // Urgency
  emergency: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Emergency' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', label: 'High' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Medium' },
  low: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Low' }
};

export default function StatusBadge({ status, className = '' }) {
  const normalized = (status || '').toLowerCase();
  const config = STATUS_CONFIG[normalized] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: status || 'Unknown'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {config.label}
    </span>
  );
}
