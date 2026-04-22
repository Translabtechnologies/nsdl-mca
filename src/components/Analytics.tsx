// components/Analytics.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  event_id: string;
  request_id: string | null;
  journey_id: string | null;
  journey_name: string | null;
  event_type: string;
  category: string;
  action: string;
  status: string;
  http_method: string | null;
  http_code: number | null;
  endpoint: string | null;
  ip_address: string | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  org_id: string | null;
  org_name: string | null;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  email_triggered: boolean;
  email_status: string | null;
  error_message: string | null;
  created_dt: string;
  created_by: string | null;
}

interface TrailEvent extends AuditLog {
  trail: { field: string; before: string | null; after: string | null }[];
  payload?: Record<string, unknown> | null;
}

interface OverviewData {
  kpi: {
    total_events: string;
    failures: string;
    credential_access: string;
    admin_actions: string;
    unique_actors: string;
    failure_rate: string;
  };
  heatmap: { category: string; hour: number; event_count: string }[];
  top_actors: {
    actor_id: string;
    actor_name: string | null;
    actor_role: string | null;
    org_name: string | null;
    total_events: string;
    failed_events: string;
  }[];
  live_stream: AuditLog[];
  recent_failures: AuditLog[];
}

interface EventDetail {
  event: AuditLog & { payload?: Record<string, unknown> | null; metadata?: Record<string, unknown> | null };
  trail: { field_name: string; field_before: string | null; field_after: string | null }[];
  related: AuditLog[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["Auth", "User", "Project", "Credentials", "Admin", "Frontend"];
const ACTIONS    = ["create", "read", "update", "delete", "approve", "reject", "login", "logout", "view"];
const ROLES      = ["super_admin", "checker", "maker", "kong_admin"];
const STATUSES   = ["Success", "Failure", "Pending"];

const CATEGORY_COLORS: Record<string, string> = {
  Auth:        "bg-purple-100 text-purple-700",
  User:        "bg-blue-100 text-blue-700",
  Project:     "bg-teal-100 text-teal-700",
  Credentials: "bg-yellow-100 text-yellow-700",
  Admin:       "bg-orange-100 text-orange-700",
  Frontend:    "bg-gray-100 text-gray-700",
};

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-blue-50 text-blue-700 border border-blue-200",
  POST:   "bg-green-50 text-green-700 border border-green-200",
  PUT:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
  PATCH:  "bg-orange-50 text-orange-700 border border-orange-200",
  DELETE: "bg-red-50 text-red-700 border border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  Success: "bg-green-500",
  Failure: "bg-red-500",
  Pending: "bg-yellow-500",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700",
  checker:     "bg-blue-100 text-blue-700",
  maker:       "bg-green-100 text-green-700",
  kong_admin:  "bg-purple-100 text-purple-700",
};

// ─── Utility helpers ──────────────────────────────────────────────────────────

function authHeader() {
  return { Authorization: `Bearer ${sessionStorage.getItem("access_token")}` };
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).replace(",", "");
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function initials(name: string | null, id: string | null) {
  const src = name || id || "?";
  return src.split(/[\s._-]/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusDot: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_DOT[status] || "bg-gray-400"}`} />
);

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[category] || "bg-gray-100 text-gray-700"}`}>
    {category}
  </span>
);

const MethodBadge: React.FC<{ method: string | null }> = ({ method }) =>
  method ? (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${METHOD_COLORS[method] || "bg-gray-100 text-gray-600"}`}>
      {method}
    </span>
  ) : null;

const RoleBadge: React.FC<{ role: string | null }> = ({ role }) =>
  role ? (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[role] || "bg-gray-100 text-gray-700"}`}>
      {role}
    </span>
  ) : null;

const ActorAvatar: React.FC<{ name: string | null; id: string | null }> = ({ name, id }) => (
  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#8B5000] to-[#FF9800] text-white text-xs font-bold flex-shrink-0">
    {initials(name, id)}
  </span>
);

// ─── Sidebar Filters ──────────────────────────────────────────────────────────

interface SidebarFiltersProps {
  timeRange: string;
  setTimeRange: (v: string) => void;
  selectedStatuses: string[];
  toggleStatus: (v: string) => void;
  statusCounts: Record<string, number>;
  selectedCategories: string[];
  toggleCategory: (v: string) => void;
  categoryCounts: Record<string, number>;
  selectedActions: string[];
  toggleAction: (v: string) => void;
  actionCounts: Record<string, number>;
  selectedRoles: string[];
  toggleRole: (v: string) => void;
}

const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  timeRange, setTimeRange,
  selectedStatuses, toggleStatus, statusCounts,
  selectedCategories, toggleCategory, categoryCounts,
  selectedActions, toggleAction, actionCounts,
  selectedRoles, toggleRole,
}) => (
  <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
    <div className="p-4 space-y-5 text-sm">
      {/* Time Range */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Time Range</p>
        <div className="grid grid-cols-2 gap-1">
          {[["1h","Last 1h"],["24h","Last 24h"],["7d","Last 7d"],["30d","Last 30d"],["all","All time"]].map(([v,l]) => (
            <button
              key={v}
              onClick={() => setTimeRange(v)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${timeRange === v ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} ${v === "all" ? "col-span-2" : ""}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
        <div className="space-y-1">
          {STATUSES.map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selectedStatuses.includes(s)} onChange={() => toggleStatus(s)} className="rounded" />
              <StatusDot status={s} />
              <span className="flex-1 text-gray-700">{s}</span>
              <span className="text-gray-400 text-xs">{statusCounts[s] ?? 0}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</p>
        <div className="space-y-1">
          {CATEGORIES.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selectedCategories.includes(c)} onChange={() => toggleCategory(c)} className="rounded" />
              <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
              <span className="flex-1 text-gray-700">{c}</span>
              <span className="text-gray-400 text-xs">{categoryCounts[c] ?? 0}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Action</p>
        <div className="flex flex-wrap gap-1">
          {ACTIONS.map(a => (
            <button
              key={a}
              onClick={() => toggleAction(a)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${selectedActions.includes(a) ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Actor Role */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Actor Role</p>
        <div className="flex flex-wrap gap-1">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => toggleRole(r)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${selectedRoles.includes(r) ? "bg-gray-700 text-white" : `${ROLE_COLORS[r]} opacity-80 hover:opacity-100`}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  </aside>
);

// ─── Event Detail Panel ───────────────────────────────────────────────────────

const EventDetailPanel: React.FC<{ eventId: string | null; onClose: () => void }> = ({ eventId, onClose }) => {
  const [data, setData] = useState<EventDetail | null>(null);
  const [tab, setTab] = useState("Summary");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setTab("Summary");
    fetch(`${apiBase}/audit/event/${eventId}`, { headers: authHeader() })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (!eventId) return null;

  const ev = data?.event;

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {ev && <StatusDot status={ev.status} />}
          {ev && <CategoryBadge category={ev.category} />}
          {ev && <span className="text-sm font-medium text-gray-800">{ev.event_type}</span>}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {["Summary", "Payload", "Diff", "Context", "Related"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${tab === t ? "border-[#FF9800] text-[#8B5000]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {loading && <p className="text-gray-400 text-center py-8">Loading…</p>}
        {!loading && data && tab === "Summary" && ev && (
          <div className="space-y-4">
            <p className="text-gray-800 font-semibold">
              {ev.event_type === "page.viewed" ? "Page navigated to" :
               ev.event_type.replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </p>
            <div className="space-y-2">
              {[
                ["Event ID",   ev.event_id],
                ["Request ID", ev.request_id],
                ["Timestamp",  ev.created_dt ? fmtTime(ev.created_dt) : null],
                ["Action",     ev.action],
                ["Status",     ev.status],
              ].map(([k, v]) => v ? (
                <div key={k as string} className="flex gap-3">
                  <span className="text-gray-400 w-24 flex-shrink-0">{k}</span>
                  <span className="text-gray-800 break-all font-mono text-xs">{v as string}</span>
                </div>
              ) : null)}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Actor</p>
              <div className="space-y-1">
                {[
                  ["actor_id", ev.actor_id],
                  ["email",    ev.actor_email],
                  ["role",     ev.actor_role],
                  ["org",      ev.org_name],
                ].map(([k, v]) => v ? (
                  <div key={k as string} className="flex gap-3">
                    <span className="text-gray-400 w-16 flex-shrink-0 text-xs">{k}</span>
                    <span className="text-gray-800 text-xs">{k === "role" ? <RoleBadge role={v} /> : v as string}</span>
                  </div>
                ) : null)}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Resource</p>
              <div className="space-y-1">
                {[
                  ["resource_type", ev.resource_type],
                  ["resource_id",   ev.resource_id],
                  ["resource_name", ev.resource_name],
                ].map(([k, v]) => v ? (
                  <div key={k as string} className="flex gap-3">
                    <span className="text-gray-400 w-24 flex-shrink-0 text-xs">{k}</span>
                    <span className="text-gray-800 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{v as string}</span>
                  </div>
                ) : null)}
              </div>
              {ev.resource_id && (
                <button
                  className="mt-2 text-xs text-[#FF9800] hover:underline"
                  onClick={() => window.open(`/analytics#trail-${ev.resource_id}`, "_blank")}
                >
                  ↗ View field-level trail for this resource
                </button>
              )}
            </div>

            {ev.error_message && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono">
                {ev.error_message}
              </div>
            )}

            {ev.email_triggered && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                Email triggered — Status: <strong>{ev.email_status}</strong>
              </div>
            )}
          </div>
        )}

        {!loading && data && tab === "Diff" && (
          <div>
            {data.trail.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No field-level changes recorded</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="pb-2 font-medium">Field</th>
                    <th className="pb-2 font-medium">Before</th>
                    <th className="pb-2 font-medium">After</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trail.map((t, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="py-1.5 text-gray-600 font-medium">{t.field_name}</td>
                      <td className="py-1.5 text-red-600 line-through">{t.field_before ?? "—"}</td>
                      <td className="py-1.5 text-green-600 font-medium">{t.field_after ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!loading && data && tab === "Payload" && ev && (
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto text-gray-700">
            {ev.payload ? JSON.stringify(ev.payload, null, 2) : "No payload recorded"}
          </pre>
        )}

        {!loading && data && tab === "Context" && ev && (
          <div className="space-y-2 text-xs">
            {[
              ["HTTP Method",  ev.http_method],
              ["HTTP Code",    ev.http_code?.toString()],
              ["Endpoint",     ev.endpoint],
              ["IP Address",   ev.ip_address],
              ["Journey",      ev.journey_name],
              ["Request ID",   ev.request_id],
            ].map(([k, v]) => v ? (
              <div key={k as string} className="flex gap-3">
                <span className="text-gray-400 w-24 flex-shrink-0">{k}</span>
                <span className="text-gray-800 font-mono break-all">{v as string}</span>
              </div>
            ) : null)}
          </div>
        )}

        {!loading && data && tab === "Related" && (
          <div className="space-y-2">
            {data.related.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No related events</p>
            ) : data.related.map(r => (
              <div key={r.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <StatusDot status={r.status} />
                <CategoryBadge category={r.category} />
                <span className="text-xs text-gray-700 flex-1">{r.event_type}</span>
                <span className="text-xs text-gray-400">{timeAgo(r.created_dt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 p-3 border-t border-gray-200">
        <button
          className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => { if (ev) navigator.clipboard.writeText(ev.event_id); }}
        >
          🔗 Copy permalink
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 rounded px-3 py-2 hover:bg-gray-50"
          onClick={() => {
            if (!data) return;
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
            a.download = `audit-evidence-${ev?.event_id ?? "unknown"}.json`; a.click();
          }}
        >
          <ArrowDownTrayIcon className="w-3 h-3" /> Export evidence
        </button>
      </div>
    </div>
  );
};

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

const LogsTab: React.FC<{
  filters: Record<string, string>;
  onSelectEvent: (id: string) => void;
  selectedEventId: string | null;
}> = ({ filters, onSelectEvent, selectedEventId }) => {
  const [data, setData] = useState<{ total: number; failures: number; unique_actors: number; data: AuditLog[] } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 50;

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ ...filters, page: String(page), limit: String(limit) });
    fetch(`${apiBase}/audit/logs?${qs}`, { headers: authHeader() })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const exportCSV = () => {
    const qs = new URLSearchParams(filters);
    const url = `${apiBase}/audit/export-csv?${qs}`;
    const a = document.createElement("a"); a.href = url; a.download = "audit-logs.csv"; a.click();
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white text-sm">
        {data ? (
          <span className="text-gray-600">
            <strong>{data.total.toLocaleString()}</strong> events &nbsp;·&nbsp;
            <strong className="text-red-600">{data.failures}</strong> failures &nbsp;·&nbsp;
            <strong>{data.unique_actors}</strong> unique actors
          </span>
        ) : <span />}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>GET /api/audit/logs · live · 30s</span>
          <button onClick={exportCSV} className="flex items-center gap-1 text-gray-600 hover:text-gray-800 border border-gray-200 rounded px-2 py-1">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading && <div className="text-center py-12 text-gray-400">Loading audit logs…</div>}
        {!loading && (
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-gray-500 text-left">
                {["TIMESTAMP","STATUS","METHOD","CODE","EVENT TYPE","ACTOR","ROLE","ORG","RESOURCE","ENDPOINT"].map(h => (
                  <th key={h} className="px-3 py-2 font-semibold tracking-wide whitespace-nowrap border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">No events found for the selected filters</td></tr>
              ) : (data?.data || []).map(log => (
                <tr
                  key={log.id}
                  onClick={() => onSelectEvent(log.event_id)}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-orange-50 transition-colors ${selectedEventId === log.event_id ? "bg-orange-50" : ""}`}
                >
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap font-mono">{fmtTime(log.created_dt)}</td>
                  <td className="px-3 py-2"><StatusDot status={log.status} /></td>
                  <td className="px-3 py-2"><MethodBadge method={log.http_method} /></td>
                  <td className="px-3 py-2 font-mono text-gray-600">{log.http_code ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <CategoryBadge category={log.category} />
                      <span className="text-gray-800 font-medium">{log.event_type}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <ActorAvatar name={log.actor_name} id={log.actor_id} />
                      <div>
                        <div className="text-gray-800 font-medium">{log.actor_name || log.actor_id || "—"}</div>
                        <div className="text-gray-400">{log.actor_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2"><RoleBadge role={log.actor_role} /></td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{log.org_name || "—"}</td>
                  <td className="px-3 py-2">
                    {log.resource_id && (
                      <div>
                        <div className="text-gray-400">{log.resource_type}</div>
                        <div className="font-mono text-gray-800 bg-gray-100 px-1 rounded">{log.resource_id}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-500 font-mono max-w-xs truncate">{log.endpoint || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white text-xs text-gray-500">
          <span>Page {page} of {Math.ceil(data.total / limit)}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(data.total / limit)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Trail Tab ────────────────────────────────────────────────────────────────

const TrailTab: React.FC<{ filters: Record<string, string> }> = ({ filters }) => {
  const [resources, setResources] = useState<{ resource_type: string; resource_id: string; resource_name: string; actor_id: string; actor_email: string; event_count: string; last_seen: string }[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TrailEvent[]>([]);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams(filters);
    fetch(`${apiBase}/audit/resources?${qs}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        setResources(d.resources || []);
        if (d.resources?.length > 0 && !selectedResource) {
          const first = d.resources[0].actor_id || d.resources[0].resource_id;
          setSelectedResource(first);
        }
      })
      .catch(console.error);
  }, [filters]);

  useEffect(() => {
    if (!selectedResource) return;
    setLoading(true);
    const qs = new URLSearchParams(filters);
    fetch(`${apiBase}/audit/trail/${encodeURIComponent(selectedResource)}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => setTimeline(d.timeline || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedResource, filters]);

  const filteredResources = resources.filter(r =>
    !filterText || [r.resource_id, r.resource_name, r.actor_id, r.actor_email].some(v => v?.toLowerCase().includes(filterText.toLowerCase()))
  );

  const selectedRes = resources.find(r => (r.actor_id || r.resource_id) === selectedResource);

  const exportTrail = () => {
    if (!selectedResource) return;
    const blob = new Blob([JSON.stringify(timeline, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `trail-${selectedResource}.json`; a.click();
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Resources list */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="p-2 border-b border-gray-200">
          <input
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter…"
            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#FF9800]"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredResources.map(r => {
            const key = r.actor_id || r.resource_id;
            return (
              <div
                key={`${r.resource_type}-${r.resource_id}`}
                onClick={() => setSelectedResource(key)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-orange-50 ${selectedResource === key ? "bg-orange-50 border-l-2 border-l-[#FF9800]" : ""}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{r.resource_type}</span>
                  <span className="text-xs text-gray-400">{timeAgo(r.last_seen)}</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate">{r.actor_id || r.resource_id}</p>
                <p className="text-xs text-gray-500 truncate">{r.actor_email || r.resource_name}</p>
                <p className="text-xs text-gray-400">{r.event_count} events</p>
              </div>
            );
          })}
          {filteredResources.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No resources found</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {selectedRes && (
          <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">{selectedRes.resource_type} · {selectedRes.actor_id}</p>
              <h2 className="text-xl font-bold text-gray-900">{selectedRes.actor_email || selectedRes.resource_name || selectedRes.resource_id}</h2>
              <p className="text-xs text-gray-400 mt-1">
                API: GET /api/audit/trail/{selectedResource} · {timeline.length} events
              </p>
            </div>
            <button
              onClick={exportTrail}
              className="flex items-center gap-1 text-xs border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-600"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Export trail
            </button>
          </div>
        )}

        <div className="px-6 py-4 space-y-4">
          {loading && <p className="text-center text-gray-400 py-8">Loading timeline…</p>}
          {!loading && timeline.map(ev => (
            <div
              key={ev.id}
              className={`bg-white border rounded-lg p-4 ${ev.status === "Failure" ? "border-red-200 bg-red-50" : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusDot status={ev.status} />
                  <CategoryBadge category={ev.category} />
                  <span className="font-semibold text-gray-800 text-sm">{ev.event_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ev.status === "Failure" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                    {ev.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{fmtTime(ev.created_dt)}</span>
                  <span>· {timeAgo(ev.created_dt)}</span>
                </div>
              </div>

              {/* Actor line */}
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <ActorAvatar name={ev.actor_name} id={ev.actor_id} />
                <strong>{ev.actor_name || ev.actor_id}</strong>
                <RoleBadge role={ev.actor_role} />
                {ev.ip_address && <span className="text-gray-400">· {ev.ip_address} ·</span>}
                <MethodBadge method={ev.http_method} />
                {ev.endpoint && <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{ev.endpoint}</code>}
                {ev.http_code && <span className={`font-bold ${ev.http_code >= 400 ? "text-red-600" : "text-green-600"}`}>{ev.http_code}</span>}
              </div>

              {/* Error */}
              {ev.error_message && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs font-mono text-red-700">
                  {ev.error_message}
                </div>
              )}

              {/* Field-level diff */}
              {ev.trail && ev.trail.length > 0 && (
                <div className="mt-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left py-1 font-medium">FIELD</th>
                        <th className="text-left py-1 font-medium">BEFORE</th>
                        <th className="text-left py-1 font-medium">AFTER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ev.trail.map((t, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-1 text-gray-600">{t.field}</td>
                          <td className="py-1 text-red-500">{t.before ?? "—"}</td>
                          <td className="py-1 text-green-600 font-medium">{t.after ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between text-xs">
                <button className="text-[#FF9800] hover:underline">Full detail →</button>
                {ev.request_id && <span className="text-gray-400">request_id {ev.request_id.slice(0, 8)}</span>}
              </div>
            </div>
          ))}
          {!loading && timeline.length === 0 && selectedResource && (
            <p className="text-center text-gray-400 py-12">No events for this resource</p>
          )}
          {!selectedResource && (
            <p className="text-center text-gray-400 py-12">Select a resource from the left panel</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ timeRange: string }> = ({ timeRange }) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOverview = useCallback(() => {
    setLoading(true);
    fetch(`${apiBase}/audit/overview?time_range=${timeRange}`, { headers: authHeader() })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeRange]);

  useEffect(() => {
    fetchOverview();
    intervalRef.current = setInterval(fetchOverview, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchOverview]);

  if (loading && !data) return <div className="flex-1 flex items-center justify-center text-gray-400">Loading overview…</div>;
  if (!data) return null;

  const { kpi, heatmap, top_actors, live_stream, recent_failures } = data;

  // Build heatmap matrix
  const heatCats = [...new Set(heatmap.map(h => h.category))];
  const heatMap: Record<string, Record<number, number>> = {};
  for (const h of heatmap) {
    if (!heatMap[h.category]) heatMap[h.category] = {};
    heatMap[h.category][h.hour] = parseInt(h.event_count);
  }
  const heatMax = Math.max(1, ...heatmap.map(h => parseInt(h.event_count)));

  const kpiCards = [
    { label: "Events in Window",   value: parseInt(kpi.total_events).toLocaleString(),    sub: `${kpi.unique_actors} unique actors`,       color: "text-gray-800" },
    { label: "Failures",           value: parseInt(kpi.failures).toLocaleString(),         sub: `${kpi.failure_rate}% failure rate`,          color: "text-red-500" },
    { label: "Credential Access",  value: parseInt(kpi.credential_access).toLocaleString(), sub: "sensitive events",                         color: "text-yellow-500" },
    { label: "Admin Actions",      value: parseInt(kpi.admin_actions).toLocaleString(),    sub: "super_admin / kong_admin",                    color: "text-blue-600" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color} mb-1`}>{card.value}</p>
            <p className="text-xs text-gray-500">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Activity Heatmap */}
        <div className="col-span-3 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Activity by hour</h3>
            <span className="text-xs text-gray-400">category × hour-of-day</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <td className="w-20" />
                  {Array.from({ length: 24 }, (_, i) => (
                    <td key={i} className="text-center text-gray-400 w-6 pb-1">
                      {String(i).padStart(2, "0")}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatCats.map(cat => (
                  <tr key={cat}>
                    <td className="text-gray-600 font-medium pr-2 py-1">
                      <CategoryBadge category={cat} />
                    </td>
                    {Array.from({ length: 24 }, (_, h) => {
                      const count = heatMap[cat]?.[h] ?? 0;
                      const intensity = count === 0 ? 0 : Math.max(0.1, count / heatMax);
                      return (
                        <td key={h} className="p-0.5">
                          <div
                            className="w-5 h-5 rounded-sm"
                            style={{ backgroundColor: `rgba(255, 152, 0, ${intensity})`, border: "1px solid rgba(0,0,0,0.05)" }}
                            title={`${cat} @ ${h}:00 — ${count} events`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Stream */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Live stream</h3>
            <div className="flex items-center gap-1 text-xs text-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              REAL-TIME
            </div>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-72">
            {live_stream.map(ev => (
              <div key={ev.id} className="flex items-center gap-2 text-xs hover:bg-gray-50 rounded p-1 cursor-pointer">
                <StatusDot status={ev.status} />
                <span className="text-gray-400 w-12 flex-shrink-0">{new Date(ev.created_dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</span>
                <CategoryBadge category={ev.category} />
                <span className="text-gray-800 font-medium flex-1 truncate">{ev.event_type}</span>
                <span className="text-gray-500 truncate">{ev.actor_name || ev.actor_id}</span>
                <ChevronRightIcon className="w-3 h-3 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Actors */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Top actors</h3>
          <span className="text-xs text-gray-400">by event volume</span>
        </div>
        <div className="space-y-3">
          {top_actors.map((actor, i) => {
            const total = parseInt(actor.total_events);
            const failed = parseInt(actor.failed_events);
            const maxTotal = parseInt(top_actors[0]?.total_events || "1");
            const pct = Math.round((total / maxTotal) * 100);
            return (
              <div key={actor.actor_id} className="flex items-center gap-3">
                <ActorAvatar name={actor.actor_name} id={actor.actor_id} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{actor.actor_name || actor.actor_id}</span>
                    <RoleBadge role={actor.actor_role} />
                    <span className="ml-auto text-xs text-gray-500 font-semibold">{total} events</span>
                    {failed > 0 && (
                      <span className="text-xs text-red-500 font-medium">{failed} failed</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#8B5000] to-[#FF9800] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {top_actors.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No data in selected time range</p>}
        </div>
      </div>

      {/* Recent Failures */}
      {recent_failures.length > 0 && (
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Recent failures</h3>
            <span className="text-xs text-red-400">status = failure</span>
          </div>
          <div className="space-y-2">
            {recent_failures.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 p-2 bg-red-50 rounded text-xs">
                <StatusDot status="Failure" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <CategoryBadge category={ev.category} />
                    <span className="font-medium text-gray-800">{ev.event_type}</span>
                    <span className="text-gray-400">{timeAgo(ev.created_dt)}</span>
                  </div>
                  <div className="text-gray-600">{ev.actor_name || ev.actor_id}</div>
                  {ev.error_message && <div className="text-red-600 font-mono mt-0.5">{ev.error_message}</div>}
                </div>
                {ev.http_code && <span className="text-red-600 font-bold">{ev.http_code}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Analytics Component ─────────────────────────────────────────────────

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Logs" | "Trail" | "Overview">("Logs");
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedStatuses,   setSelectedStatuses]   = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedActions,    setSelectedActions]    = useState<string[]>([]);
  const [selectedRoles,      setSelectedRoles]      = useState<string[]>([]);
  const [selectedEventId,    setSelectedEventId]    = useState<string | null>(null);

  // Counts are populated from the Logs response — approximated here
  const statusCounts:   Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const actionCounts:   Record<string, number> = {};

  const toggle = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, v: string) =>
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const reset = () => {
    setSearch(""); setTimeRange("7d");
    setSelectedStatuses([]); setSelectedCategories([]);
    setSelectedActions([]); setSelectedRoles([]);
    setSelectedEventId(null);
  };

  const filters: Record<string, string> = {
    time_range: timeRange,
    ...(search              && { search }),
    ...(selectedStatuses.length   && { status:     selectedStatuses.join(",") }),
    ...(selectedCategories.length && { category:   selectedCategories.join(",") }),
    ...(selectedActions.length    && { action:     selectedActions.join(",") }),
    ...(selectedRoles.length      && { actor_role: selectedRoles.join(",") }),
  };

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100vh - 64px)" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 mr-2 font-medium">Audit</span>
          {(["Logs", "Trail", "Overview"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors border ${
                activeTab === tab
                  ? "bg-white border-gray-300 text-gray-800 shadow-sm"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
          <span className="ml-4 flex items-center gap-1 text-xs text-green-600 border border-green-200 bg-green-50 px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Append-only
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search event_type, actor_id, resource_id, request_id, endpoint…"
              className="pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded w-96 focus:outline-none focus:ring-1 focus:ring-[#FF9800]"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300 font-mono">⌘K</span>
          </div>
          <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
            <ArrowPathIcon className="w-3.5 h-3.5" /> Reset
          </button>
          {activeTab === "Logs" && (
            <button
              onClick={() => {
                const qs = new URLSearchParams(filters);
                const url = `${apiBase}/audit/export-csv?${qs}`;
                const a = document.createElement("a"); a.href = url; a.download = "audit-logs.csv"; a.click();
              }}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded px-2 py-1.5"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar filters (Logs + Trail only) */}
        {activeTab !== "Overview" && (
          <SidebarFilters
            timeRange={timeRange} setTimeRange={setTimeRange}
            selectedStatuses={selectedStatuses} toggleStatus={v => toggle(selectedStatuses, setSelectedStatuses, v)} statusCounts={statusCounts}
            selectedCategories={selectedCategories} toggleCategory={v => toggle(selectedCategories, setSelectedCategories, v)} categoryCounts={categoryCounts}
            selectedActions={selectedActions} toggleAction={v => toggle(selectedActions, setSelectedActions, v)} actionCounts={actionCounts}
            selectedRoles={selectedRoles} toggleRole={v => toggle(selectedRoles, setSelectedRoles, v)}
          />
        )}

        {/* Tab content */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === "Logs" && (
            <>
              <LogsTab
                filters={filters}
                onSelectEvent={setSelectedEventId}
                selectedEventId={selectedEventId}
              />
              <EventDetailPanel eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
            </>
          )}
          {activeTab === "Trail" && <TrailTab filters={filters} />}
          {activeTab === "Overview" && <OverviewTab timeRange={timeRange} />}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
