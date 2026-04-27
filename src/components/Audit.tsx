// components/Audit.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  LockClosedIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const socketServer = apiBase.replace("/api", "");

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

interface ActorResource {
  actor_id: string;
  actor_email: string | null;
  actor_name: string | null;
  event_count: string;
  last_seen: string;
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
  live_stream: AuditLog[];
}

interface EventDetail {
  event: AuditLog & {
    payload?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  };
  trail: { field_name: string; field_before: string | null; field_after: string | null }[];
  related: AuditLog[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeader() {
  return { Authorization: `Bearer ${sessionStorage.getItem("access_token")}` };
}

/** "26-04-2026 | 15 : 30 : 34" — exact format shown in Logs table */
function fmtLogDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} | ${p(d.getHours())} : ${p(d.getMinutes())} : ${p(d.getSeconds())}`;
}

/** "15 : 30 : 34" — time-only for Live Stream rows */
function fmtLiveTime(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())} : ${p(d.getMinutes())} : ${p(d.getSeconds())}`;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function initials(name: string | null, id: string | null) {
  const src = name || id || "?";
  return src
    .split(/[\s._@-]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// ─── Atom components ──────────────────────────────────────────────────────────

/** Neutral rounded-full pill — matches the reference design exactly */
const Pill: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <span
    className={`inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs text-gray-600 whitespace-nowrap font-normal ${className}`}
  >
    {children}
  </span>
);

/** Coloured status pill with an inner dot — used in Trail timeline rows */
const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { dot: string; wrap: string; label: string }> = {
    Success: { dot: "bg-green-500", wrap: "border-green-200 bg-green-50 text-green-600", label: "Success" },
    Failure: { dot: "bg-red-500",   wrap: "border-red-200   bg-red-50   text-red-500",   label: "Failed"  },
    Pending: { dot: "bg-yellow-400",wrap: "border-yellow-200 bg-yellow-50 text-yellow-600",label:"Pending"},
  };
  const c = map[status] ?? map.Success;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${c.wrap}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
};

/** Simple status dot — used in the Logs table Status column */
const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const col = status === "Success" ? "bg-green-500" : status === "Failure" ? "bg-red-500" : "bg-yellow-400";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${col}`} />;
};

const ActorAvatar: React.FC<{ name: string | null; id: string | null }> = ({ name, id }) => (
  <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5000] to-[#FF9800] text-xs font-bold text-white">
    {initials(name, id)}
  </span>
);

// ─── Event Detail Drawer ──────────────────────────────────────────────────────

const EventDetailDrawer: React.FC<{ eventId: string | null; onClose: () => void }> = ({
  eventId,
  onClose,
}) => {
  const [data, setData] = useState<EventDetail | null>(null);
  const [tab, setTab] = useState("Summary");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setData(null);
    setTab("Summary");
    fetch(`${apiBase}/audit/event/${eventId}`, { headers: authHeader() })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [eventId, onClose]);

  if (!eventId) return null;
  const ev = data?.event;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-[480px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            {ev && <StatusDot status={ev.status} />}
            {ev && <Pill>{ev.category}</Pill>}
            {ev && <span className="truncate text-sm font-semibold text-gray-800">{ev.event_type}</span>}
            {!ev && <span className="text-sm text-gray-400">Loading…</span>}
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0 overflow-x-auto border-b border-gray-200">
          {["Summary", "Payload", "Diff", "Context", "Related"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                tab === t
                  ? "border-[#FF9800] text-[#8B5000]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 text-sm">
          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          )}

          {!loading && data && ev && tab === "Summary" && (
            <div className="space-y-5">
              <p className="font-semibold text-gray-800">
                {ev.event_type.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
              <div className="space-y-2">
                {(
                  [
                    ["Event ID", ev.event_id],
                    ["Request ID", ev.request_id],
                    ["Timestamp", ev.created_dt ? fmtLogDate(ev.created_dt) : null],
                    ["Action", ev.action],
                    ["Status", ev.status],
                  ] as [string, string | null][]
                ).map(([k, v]) =>
                  v ? (
                    <div key={k} className="flex gap-3">
                      <span className="w-24 flex-shrink-0 text-xs text-gray-400">{k}</span>
                      <span className="break-all font-mono text-xs text-gray-800">{v}</span>
                    </div>
                  ) : null
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Actor</p>
                <div className="flex items-start gap-3">
                  <ActorAvatar name={ev.actor_name} id={ev.actor_id} />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-semibold text-gray-800">{ev.actor_name || ev.actor_id || "—"}</p>
                    {ev.actor_email && <p className="text-gray-500">{ev.actor_email}</p>}
                    <div className="flex items-center gap-2 pt-0.5">
                      {ev.actor_role && <Pill>{ev.actor_role}</Pill>}
                      {ev.org_name && <span className="text-gray-500">{ev.org_name}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {(ev.resource_type || ev.resource_id || ev.resource_name) && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Resource</p>
                  <div className="space-y-1">
                    {(
                      [
                        ["Type", ev.resource_type],
                        ["ID", ev.resource_id],
                        ["Name", ev.resource_name],
                      ] as [string, string | null][]
                    ).map(([k, v]) =>
                      v ? (
                        <div key={k} className="flex gap-3">
                          <span className="w-10 flex-shrink-0 text-xs text-gray-400">{k}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">{v}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {ev.error_message && (
                <div className="rounded border border-red-200 bg-red-50 p-3 font-mono text-xs text-red-700">
                  {ev.error_message}
                </div>
              )}

              {ev.email_triggered && (
                <div className="rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                  Email triggered — Status: <strong>{ev.email_status}</strong>
                </div>
              )}
            </div>
          )}

          {!loading && data && tab === "Payload" && (
            <div>
              {(ev as any)?.payload ? (
                <pre className="overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
                  {JSON.stringify((ev as any).payload, null, 2)}
                </pre>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">No payload recorded</p>
              )}
            </div>
          )}

          {!loading && data && tab === "Diff" && (
            <div>
              {data.trail.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">No field-level changes recorded</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-400">
                      <th className="pb-2 font-semibold">Field</th>
                      <th className="pb-2 font-semibold">Before</th>
                      <th className="pb-2 font-semibold">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trail.map((t, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-2 pr-3 font-medium text-gray-600">{t.field_name}</td>
                        <td className="max-w-[140px] truncate py-2 text-red-500 line-through" title={t.field_before ?? ""}>{t.field_before ?? "—"}</td>
                        <td className="max-w-[140px] truncate py-2 font-medium text-green-600" title={t.field_after ?? ""}>{t.field_after ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {!loading && data && ev && tab === "Context" && (
            <div className="space-y-2 text-xs">
              {(
                [
                  ["HTTP Method", ev.http_method],
                  ["HTTP Code", ev.http_code?.toString()],
                  ["Endpoint", ev.endpoint],
                  ["IP Address", ev.ip_address],
                  ["Journey", ev.journey_name],
                  ["Request ID", ev.request_id],
                  ["Created By", ev.created_by],
                ] as [string, string | null | undefined][]
              ).map(([k, v]) =>
                v ? (
                  <div key={k} className="flex gap-3">
                    <span className="w-24 flex-shrink-0 text-gray-400">{k}</span>
                    <span className="break-all font-mono text-gray-800">{v}</span>
                  </div>
                ) : null
              )}
              {(ev as any)?.metadata && (
                <div className="mt-3">
                  <p className="mb-1 text-gray-400">Metadata</p>
                  <pre className="rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700">
                    {JSON.stringify((ev as any).metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {!loading && data && tab === "Related" && (
            <div className="space-y-2">
              {data.related.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">No related events</p>
              ) : (
                data.related.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 rounded border border-gray-100 p-2 hover:bg-gray-50">
                    <StatusDot status={r.status} />
                    <Pill>{r.category}</Pill>
                    <span className="flex-1 text-xs font-medium text-gray-700">{r.event_type}</span>
                    <span className="flex-shrink-0 text-xs text-gray-400">{timeAgo(r.created_dt)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-gray-200 bg-gray-50 p-3">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded border border-gray-200 bg-white px-3 py-2 text-xs hover:bg-gray-50"
            onClick={() => ev && navigator.clipboard.writeText(ev.event_id)}
          >
            🔗 Copy permalink
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded border border-gray-200 bg-white px-3 py-2 text-xs hover:bg-gray-50"
            onClick={() => {
              if (!data) return;
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `audit-evidence-${ev?.event_id ?? "unknown"}.json`;
              a.click();
            }}
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Export evidence
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Pagination bar ───────────────────────────────────────────────────────────

const PaginationBar: React.FC<{
  page: number;
  limit: number;
  total: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}> = ({ page, limit, total, onPage, onLimit }) => {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit);
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
      <span>
        {from} to {to} of {total} results
      </span>
      <div className="flex items-center gap-2">
        <span>Show per page</span>
        <select
          value={limit}
          onChange={(e) => { onLimit(Number(e.target.value)); onPage(1); }}
          className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600 focus:outline-none"
        >
          {[10, 25, 50].map((n) => <option key={n} value={n}>{String(n).padStart(2, "0")}</option>)}
        </select>
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded border border-gray-200 p-1 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded border border-gray-200 p-1 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ onSelectEvent: (id: string) => void }> = ({ onSelectEvent }) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lsPage, setLsPage] = useState(1);
  const [lsLimit, setLsLimit] = useState(10);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch_ = useCallback(() => {
    setLoading(true);
    fetch(`${apiBase}/audit/overview?time_range=7d`, { headers: authHeader() })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch_();

    const socket = io(socketServer);

    socket.on("connect", () => {
      console.log("Connected to audit WebSocket");
    });

    socket.on("new-audit-event", (event: AuditLog) => {
      console.log("New audit event received:", event);
      setData((prev) => {
        if (!prev) return prev;

        // Update live stream
        const updatedLiveStream = [event, ...prev.live_stream].slice(0, 50);

        // Update KPIs (simplified increment/update)
        const updatedKpi = { ...prev.kpi };
        updatedKpi.total_events = (parseInt(updatedKpi.total_events) + 1).toString();
        
        if (event.status === "Failure") {
          updatedKpi.failures = (parseInt(updatedKpi.failures) + 1).toString();
        }
        
        if (event.category === "Credentials") {
          updatedKpi.credential_access = (parseInt(updatedKpi.credential_access) + 1).toString();
        }

        if (event.actor_role === "super_admin" || event.actor_role === "kong_admin") {
          updatedKpi.admin_actions = (parseInt(updatedKpi.admin_actions) + 1).toString();
        }

        // Recalculate failure rate
        const total = parseInt(updatedKpi.total_events);
        const fails = parseInt(updatedKpi.failures);
        updatedKpi.failure_rate = total > 0 ? ((fails / total) * 100).toFixed(1) : "0.0";

        return {
          ...prev,
          kpi: updatedKpi,
          live_stream: updatedLiveStream,
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetch_]);

  if (loading && !data)
    return <div className="flex flex-1 items-center justify-center text-gray-400">Loading overview…</div>;
  if (!data) return null;

  const { kpi, live_stream } = data;

  const kpiCards = [
    { label: "Events in window", value: parseInt(kpi.total_events).toLocaleString(), sub: `${kpi.unique_actors} unique actors`, color: "text-gray-900" },
    { label: "Failures",          value: parseInt(kpi.failures).toLocaleString(),       sub: `${kpi.failure_rate}% failures rate`, color: "text-red-500" },
    { label: "Credential Access", value: parseInt(kpi.credential_access).toLocaleString(), sub: "Sensitive events",           color: "text-orange-500" },
    { label: "Admin Actions",     value: parseInt(kpi.admin_actions).toLocaleString(),   sub: "super_admin / kong_admin",    color: "text-green-600" },
  ];

  const lsTotal = live_stream.length;
  const lsFrom  = (lsPage - 1) * lsLimit;
  const lsRows  = live_stream.slice(lsFrom, lsFrom + lsLimit);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-600">{c.label}</p>
              {/* <LockClosedIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" /> */}
            </div>
            <p className={`mt-2 text-4xl font-bold ${c.color}`}>{c.value}</p>
            <p className="mt-1 text-sm text-gray-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Live Stream card */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-800">Live Stream</h3>
          <div className="flex items-center gap-1.5 text-sm text-green-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Real time
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="px-5 py-3 font-semibold uppercase tracking-wider w-10">Status</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider w-32">Time</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider w-40">Category</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Event Type</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Actor</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right pr-9">Resource / Org</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lsRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No recent events</td>
                </tr>
              )}
              {lsRows.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => onSelectEvent(ev.event_id)}
                  className="cursor-pointer group hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 align-middle">
                    <StatusDot status={ev.status} />
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap font-mono text-gray-500">
                    {fmtLiveTime(ev.created_dt)}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Pill className="!bg-blue-50 !border-blue-100 !text-blue-600">{ev.category}</Pill>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Pill>{ev.event_type}</Pill>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="font-semibold text-gray-800">
                      {ev.actor_name || ev.actor_id || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle text-right relative">
                    <span className="text-gray-500 truncate inline-block max-w-[200px] align-middle mr-6">
                      {ev.resource_name || ev.org_name || "—"}
                    </span>
                    {/* <ChevronRightIcon className="h-4 w-4 text-gray-300 absolute right-4 top-1/2 -translate-y-1/2 group-hover:text-orange-400 transition-colors" /> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={lsPage} limit={lsLimit} total={lsTotal}
          onPage={setLsPage} onLimit={setLsLimit}
        />
      </div>
    </div>
  );
};

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

const LogsTab: React.FC<{
  onSelectEvent: (id: string) => void;
  selectedEventId: string | null;
}> = ({ onSelectEvent, selectedEventId }) => {
  const [data, setData] = useState<{
    total: number; failures: number; unique_actors: number; data: AuditLog[];
  } | null>(null);
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: String(limit), time_range: "all" });
    fetch(`${apiBase}/audit/logs?${qs}`, { headers: authHeader() })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, limit]);

  useEffect(() => { setPage(1); }, [limit]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const total        = data?.total ?? 0;
  const failures     = data?.failures ?? 0;
  const uniqueActors = data?.unique_actors ?? 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Summary bar */}
      <div className="border-b border-gray-200 px-5 py-3">
        <p className="text-sm text-gray-600">
          <strong className="font-semibold text-gray-900">{total.toLocaleString()} Events</strong>
          <span className="mx-2 text-gray-300">|</span>
          <strong className="font-semibold text-gray-900">{failures.toLocaleString()} Failure</strong>
          <span className="mx-2 text-gray-300">|</span>
          <strong className="font-semibold text-gray-900">{uniqueActors.toLocaleString()} Unique Actors</strong>
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        )}
        {!loading && (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-400">
                {["Time Stamp","Status","Method","Code","Event Type","Actor","Role","Org","Resource","Endpoint"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-gray-400">
                    No events found
                  </td>
                </tr>
              ) : (
                (data?.data ?? []).map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => onSelectEvent(log.event_id)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedEventId === log.event_id ? "bg-orange-50" : ""
                    }`}
                  >
                    {/* Time Stamp */}
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-600">
                      {fmtLogDate(log.created_dt)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusDot status={log.status} />
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3">
                      {log.http_method ? <Pill>{log.http_method}</Pill> : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Code */}
                    <td className="px-4 py-3 text-gray-600">{log.http_code ?? "—"}</td>

                    {/* Event Type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Pill>{log.category}</Pill>
                        <Pill>{log.event_type}</Pill>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{log.actor_name || log.actor_id || "—"}</p>
                      {log.actor_email && (
                        <p className="text-gray-400">{log.actor_email}</p>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3 text-gray-500">{log.actor_role || "—"}</td>

                    {/* Org */}
                    <td className="px-4 py-3">
                      {log.org_name ? (
                        <>
                          <p className="text-gray-800">{log.org_name.split(" ").slice(0, 1).join(" ")}</p>
                          <p className="text-gray-400">{log.org_name.split(" ").slice(1).join(" ")}</p>
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Resource */}
                    <td className="px-4 py-3">
                      {log.resource_type && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                          {log.resource_type}
                        </span>
                      )}
                      {(log.resource_name || log.resource_id) && (
                        <p className="mt-0.5 font-mono text-xs text-gray-700">
                          {log.resource_name || log.resource_id}
                        </p>
                      )}
                    </td>

                    {/* Endpoint */}
                    <td className="max-w-[140px] truncate px-4 py-3 font-mono text-gray-500">
                      {log.endpoint || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <PaginationBar
        page={page} limit={limit} total={total}
        onPage={setPage} onLimit={setLimit}
      />
    </div>
  );
};

// ─── Trail Tab ────────────────────────────────────────────────────────────────

const TrailTab: React.FC<{ onSelectEvent: (id: string) => void; exportRef?: React.MutableRefObject<(() => void) | null> }> = ({ onSelectEvent, exportRef }) => {
  const [resources,       setResources]       = useState<ActorResource[]>([]);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [timeline,        setTimeline]        = useState<TrailEvent[]>([]);
  const [filterText,      setFilterText]      = useState("");
  const [loading,         setLoading]         = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/audit/resources`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => {
        const list: ActorResource[] = d.resources || [];
        setResources(list);
        if (list.length > 0 && !selectedActorId) setSelectedActorId(list[0].actor_id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedActorId) return;
    setLoading(true);
    fetch(`${apiBase}/audit/trail/${encodeURIComponent(selectedActorId)}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setTimeline(d.timeline || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedActorId]);

  const filteredResources = resources.filter(
    (r) =>
      !filterText ||
      [r.actor_id, r.actor_email, r.actor_name].some((v) =>
        v?.toLowerCase().includes(filterText.toLowerCase())
      )
  );

  const selectedActor = resources.find((r) => r.actor_id === selectedActorId);

  const exportTrail = useCallback(() => {
    if (!selectedActorId) return;
    const blob = new Blob([JSON.stringify(timeline, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `trail-${selectedActorId}.json`;
    a.click();
  }, [selectedActorId, timeline]);

  useEffect(() => {
    if (exportRef) {
      exportRef.current = exportTrail;
    }
  }, [exportTrail, exportRef]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left sidebar ──────────────────────────────── */}
      <div className="flex w-69 flex-shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-700">Resources</p>
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter"
            className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-300"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredResources.map((r) => (
            <div
              key={r.actor_id}
              onClick={() => setSelectedActorId(r.actor_id)}
              className={`cursor-pointer border-b border-gray-100 px-3 py-3 transition-colors hover:bg-orange-50 ${
                selectedActorId === r.actor_id
                  ? "border-l-2 border-l-orange-400 bg-orange-50"
                  : ""
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                  User
                </span>
                <span className="text-xs text-gray-400">{timeAgo(r.last_seen)}</span>
              </div>
              <p className="truncate text-xs font-semibold text-gray-800">{r.actor_name || r.actor_id}</p>
              <p className="truncate text-xs text-gray-500">{r.actor_email || r.actor_id}</p>
              <p className="mt-0.5 text-xs text-gray-400">{r.event_count} Events</p>
            </div>
          ))}
          {filteredResources.length === 0 && (
            <p className="py-8 text-center text-xs text-gray-400">No actors found</p>
          )}
        </div>
      </div>

      {/* ── Right timeline ────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Header */}
        {selectedActor && (
          <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-gray-800">
                {selectedActor.actor_email || selectedActor.actor_id}
              </span>
              <span className="text-xs text-gray-400">
                API : GET /api/audit/trail/{selectedActorId} &nbsp;|&nbsp; {timeline.length} Event
              </span>
            </div>
          </div>
        )}

        {/* Events */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" /> Loading timeline…
            </div>
          )}
          {!loading && !selectedActorId && (
            <p className="py-16 text-center text-sm text-gray-400">Select an actor from the left panel</p>
          )}
          {!loading && selectedActorId && timeline.length === 0 && (
            <p className="py-16 text-center text-sm text-gray-400">No events for this actor</p>
          )}

          {!loading && timeline.map((ev, idx) => (
            <div
              key={ev.id}
              className={`flex gap-4 px-6 py-4 ${idx < timeline.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              {/* Dot */}
              <div className="flex flex-shrink-0 flex-col items-center pt-1">
                <StatusDot status={ev.status} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {/* Row 1: pills + date */}
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Pill>{ev.event_type.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Pill>
                    <Pill>{ev.category}</Pill>
                    <StatusPill status={ev.status} />
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {fmtLogDate(ev.created_dt)}&nbsp;&nbsp;|&nbsp;&nbsp;{timeAgo(ev.created_dt)}
                  </div>
                </div>

                {/* Row 2: actor + details */}
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-gray-800">{ev.actor_name || ev.actor_id}</span>
                  {ev.actor_role && <span className="text-gray-500">{ev.actor_role}</span>}
                  {ev.ip_address && <span className="text-gray-400">{ev.ip_address}</span>}
                  {ev.http_method && <Pill>{ev.http_method}</Pill>}
                  {ev.endpoint && (
                    <span className="max-w-[200px] truncate font-mono text-gray-500">{ev.endpoint}</span>
                  )}
                  {ev.http_code && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        ev.http_code >= 400
                          ? "border-red-200 bg-red-50 text-red-600"
                          : "border-green-200 bg-green-50 text-green-600"
                      }`}
                    >
                      {ev.http_code}
                    </span>
                  )}
                </div>

                {/* Error */}
                {ev.error_message && (
                  <div className="mb-2 rounded border border-red-100 bg-red-50 px-2 py-1 font-mono text-xs text-red-600">
                    {ev.error_message}
                  </div>
                )}

                {/* Field diffs */}
                {ev.trail && ev.trail.length > 0 && (
                  <div className="mb-2 overflow-hidden rounded border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr className="text-gray-400">
                          <th className="px-3 py-1.5 text-left font-semibold">FIELD</th>
                          <th className="px-3 py-1.5 text-left font-semibold">BEFORE</th>
                          <th className="px-3 py-1.5 text-left font-semibold">AFTER</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ev.trail.map((t, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-1.5 font-medium text-gray-600">{t.field}</td>
                            <td className="max-w-[140px] truncate px-3 py-1.5 text-red-500" title={t.before ?? ""}>{t.before ?? "—"}</td>
                            <td className="max-w-[140px] truncate px-3 py-1.5 font-medium text-green-600" title={t.after ?? ""}>{t.after ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer row */}
                <div className="flex items-center justify-between">
                  <button
                    className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-800"
                    onClick={() => onSelectEvent(ev.event_id)}
                  >
                    See details
                  </button>
                  {ev.request_id && (
                    <span className="font-mono text-xs text-gray-400">
                      request ID&nbsp;{ev.request_id.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Audit Component ─────────────────────────────────────────────────

const Audit: React.FC = () => {
  const [activeTab,       setActiveTab]       = useState<"Overview" | "Logs" | "Trail">("Overview");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const trailExportRef = useRef<(() => void) | null>(null);

  const exportCSV = async () => {
    try {
      const response = await fetch(`${apiBase}/audit/export-csv?time_range=all`, { headers: authHeader() });
      if (!response.ok) throw new Error("Failed to export CSV");
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "audit-logs.csv";
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50" style={{ height: "calc(100vh - 64px)" }}>
      {/* ── Top bar ──────────────────────────────────── */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-2.5">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          {(["Overview", "Logs", "Trail"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border border-gray-300 bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Export button */}
        {activeTab === "Logs" && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Export CSV
          </button>
        )}
        {activeTab === "Trail" && (
          <button
            onClick={() => trailExportRef.current && trailExportRef.current()}
            className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Export trail
          </button>
        )}
      </div>

      {/* ── Tab content ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "Overview" && <OverviewTab onSelectEvent={setSelectedEventId} />}
        {activeTab === "Logs"     && <LogsTab onSelectEvent={setSelectedEventId} selectedEventId={selectedEventId} />}
        {activeTab === "Trail"    && <TrailTab onSelectEvent={setSelectedEventId} exportRef={trailExportRef} />}
      </div>

      {/* ── Detail drawer (fixed overlay, any tab) ───── */}
      <EventDetailDrawer
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
};

export default Audit;
