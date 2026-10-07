import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  History,
  Shield,
  Search,
  RefreshCw,
  ArrowLeft,
  Filter,
  User,
  Activity,
  FileCode
} from 'lucide-react';

export default function AdminAuditPage() {
  const { error } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/audit-logs');
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      error(`Failed to load audit logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.performedBy?.name?.toLowerCase().includes(term) ||
      log.performedBy?.role?.toLowerCase().includes(term) ||
      log.targetResource?.toLowerCase().includes(term)
    );
  });

  const getActionColor = (action) => {
    if (action.includes('VERIFIED') || action.includes('APPROVED')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (action.includes('REJECTED') || action.includes('CANCELLED')) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (action.includes('DISPATCH') || action.includes('ASSIGN')) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (action.includes('PRICING')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Enterprise Audit & Security Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {logs.length} Recorded Events
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Immutable log of system dispatches, provider verifications, financial adjustments, and user actions.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, user name, role, or resource..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Audit Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading audit log entries...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No audit logs matching search parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {log.performedBy?.name || 'System Auto'}
                          </div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {log.performedBy?.role || 'Daemon'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-800 font-semibold">
                            {log.targetResource || 'General'}
                          </div>
                          {log.targetId && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {String(log.targetId).slice(-6).toUpperCase()}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                              <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Payload Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-slate-900 p-4 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto">
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
