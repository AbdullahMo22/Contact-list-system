import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faDesktop, faUser, faSearch } from '@fortawesome/free-solid-svg-icons';
import { apiClient } from '../../../stores/authStore';

function formatTimestamp(ts: string) {
  if (!ts) return 'N/A';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
  });
}

function getActionBadgeStyles(action: string) {
  const a = (action || '').toUpperCase();
  if (a.includes('DELETE') || a.includes('REMOVE')) return 'bg-red-50 text-red-700 border-red-100';
  if (a.includes('CREATE') || a.includes('ADD') || a.includes('INSERT')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (a.includes('UPDATE') || a.includes('EDIT')) return 'bg-blue-50 text-blue-700 border-blue-100';
  if (a.includes('LOGIN')) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (a.includes('LOGOUT')) return 'bg-slate-50 text-slate-600 border-slate-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type AuditLogRow = {
  log_id: number;
  timestamp_utc: string;
  user_id: number | null;
  username: string | null;
  action_name: string;
  entity_type: string | null;
  entity_id: number | string | null;
  success: 0 | 1 | boolean;
  error_message: string | null;
  ip_address: string | null;
  device_name: string | null;
};

type AuditLogsResponse = {
  data: AuditLogRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export default function Audit() {
  const [rows, setRows] = React.useState<AuditLogRow[]>([]);
  const [meta, setMeta] = React.useState<AuditLogsResponse['meta']>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loading, setLoading] = React.useState(true);

  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(25);

  const fetchLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<AuditLogsResponse>('/auth/audit-logs', {
        params: { page, limit, q: debouncedSearch || undefined },
      });

      setRows(res.data?.data ?? []);
      setMeta(res.data?.meta ?? { total: 0, page, limit, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
      setRows([]);
      setMeta({ total: 0, page, limit, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // لما السيرش يتغير: ارجع لأول صفحة
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limit]);

  const canPrev = page > 1;
  const canNext = page < meta.totalPages;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">System Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">Track and monitor system activities.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 shadow-sm"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>

            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 shadow-sm whitespace-nowrap">
              Total: <span className="text-indigo-600 ml-1">{meta.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 pl-6 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Client</th>
                <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records found.</td></tr>
              ) : (
                rows.map((r) => {
                  const details =
                    r.error_message
                      ? `Error: ${r.error_message}`
                      : (r.entity_type || r.entity_id)
                        ? `${r.entity_type ?? ''} ${r.entity_id ?? ''}`.trim()
                        : 'No additional details';

                  return (
                    <tr key={r.log_id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5 text-slate-600">
                          <FontAwesomeIcon icon={faClock} className="text-slate-400 text-xs" />
                          <span className="text-sm font-medium">{formatTimestamp(r.timestamp_utc)}</span>
                        </div>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getActionBadgeStyles(r.action_name)}`}>
                          {r.action_name?.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                            <FontAwesomeIcon icon={faUser} className="text-xs" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 leading-none mb-1">
                              {r.username || 'System'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID: {r.user_id ? r.user_id : '#SYS'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-600">
                            <FontAwesomeIcon icon={faDesktop} className="text-slate-400 text-xs w-3" />
                            <span className="text-sm">{r.ip_address || '127.0.0.1'}</span>
                          </div>
                          <span
                            className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 truncate max-w-[180px]"
                            title={r.device_name || 'Unknown'}
                          >
                            {r.device_name ? 'Web Client' : 'Unknown'}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <span className="text-sm text-slate-600 block max-w-md truncate" title={details}>
                          {details}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {!loading && meta.total > 0 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/30">
            <span className="text-xs text-slate-500">
              Showing page {meta.page} of {meta.totalPages} • {meta.total} records
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => canPrev && setPage(p => p - 1)}
                disabled={!canPrev}
                className={`px-3 py-1 border rounded text-xs bg-white ${
                  canPrev ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Previous
              </button>

              <button
                onClick={() => canNext && setPage(p => p + 1)}
                disabled={!canNext}
                className={`px-3 py-1 border rounded text-xs bg-white ${
                  canNext ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-600">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-600">No records found.</div>
        ) : (
          rows.map((r) => {
            const details =
              r.error_message
                ? `Error: ${r.error_message}`
                : (r.entity_type || r.entity_id)
                  ? `${r.entity_type ?? ''} ${r.entity_id ?? ''}`.trim()
                  : 'No additional details';

            return (
              <div key={r.log_id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FontAwesomeIcon icon={faClock} className="text-slate-400 text-xs" />
                    <span className="text-sm font-medium">{formatTimestamp(r.timestamp_utc)}</span>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getActionBadgeStyles(r.action_name)}`}>
                    {r.action_name?.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                    <FontAwesomeIcon icon={faUser} className="text-xs" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{r.username || 'System'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">ID: {r.user_id ? r.user_id : '#SYS'}</div>
                  </div>
                </div>

                <div className="mt-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faDesktop} className="text-slate-400 text-xs w-3" />
                    <span className="truncate">{r.ip_address || '127.0.0.1'}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 break-words">
                    {details}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {!loading && meta.total > 0 && (
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
            <span className="text-xs text-slate-500">
              Page {meta.page}/{meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => canPrev && setPage(p => p - 1)}
                disabled={!canPrev}
                className={`px-3 py-1 border rounded text-xs bg-white ${
                  canPrev ? 'border-slate-200 text-slate-700' : 'border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Prev
              </button>
              <button
                onClick={() => canNext && setPage(p => p + 1)}
                disabled={!canNext}
                className={`px-3 py-1 border rounded text-xs bg-white ${
                  canNext ? 'border-slate-200 text-slate-700' : 'border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}