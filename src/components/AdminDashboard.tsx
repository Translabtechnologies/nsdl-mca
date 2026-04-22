import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  ClipboardList,
  CheckCircle2,
  Clock,
  Upload,
  ListChecks,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const THEME = {
  cardWrapperBg: "#F3F4F6",
  cardPendingBg: "#FFF5E6",
  cardPendingText: "#FF9800",
  cardApprovedBg: "#E6F4F1",
  cardApprovedText: "#008A70",
  cardRejectedBg: "#FEE2E2",
  cardRejectedText: "#EF4444",
  cardAvgTimeBg: "#EEF2FF",
  cardAvgTimeText: "#6366F1",
  cardTitleText: "#6B7280",
  cardValueText: "#111827",
};

const ANIM = `
  @keyframes fadeInBg { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp  { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes toastIn  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const getToken = () => sessionStorage.getItem("access_token");

// ── Sub-components ───────────────────────────────────────────────────────────

const ConfirmModal = ({
  isOpen,
  type,
  user,
  users,
  onConfirm,
  onCancel,
  isProcessing,
}: any) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;
  const isApprove = type === "approve";
  const isBatch = !!users;
  const label = isBatch
    ? `${users.length} selected user${users.length !== 1 ? "s" : ""}`
    : `${user?.first_name} ${user?.last_name}`;

  const handleConfirm = () => {
    if (!isApprove && !reason.trim()) {
      setError("Please enter a rejection reason");
      return;
    }
    setError("");
    onConfirm(reason);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        animation: "fadeInBg 0.18s ease",
      }}
    >
      <style>{ANIM}</style>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div
          className={`h-1.5 w-full ${
            isApprove ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <div className="p-8">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 mx-auto ${
              isApprove ? "bg-green-50" : "bg-red-50"
            }`}
          >
            {isApprove ? (
              <Check size={28} className="text-green-500" strokeWidth={2.5} />
            ) : (
              <X size={28} className="text-red-500" strokeWidth={2.5} />
            )}
          </div>
          <h3 className="text-[18px] font-bold text-gray-900 text-center mb-2">
            {isApprove ? "Approve Request?" : "Reject Request?"}
          </h3>
          <p className="text-[13px] text-gray-500 text-center leading-relaxed mb-6">
            {isApprove ? (
              <>
                You&apos;re about to approve{" "}
                <strong className="text-gray-700">{label}</strong>. Accounts
                will be created and credentials emailed.
              </>
            ) : (
              <>
                You&apos;re about to reject{" "}
                <strong className="text-gray-700">{label}</strong>. This cannot
                be undone.
              </>
            )}
          </p>

          {/* Reason input for reject */}
          {!isApprove && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter rejection reason..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60 shadow-md ${
                isApprove
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {isProcessing
                ? "..."
                : isApprove
                ? "Yes, Approve"
                : "Yes, Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BatchModal = ({
  isOpen,
  selectedIds,
  pendingRequests,
  onConfirm,
  onCancel,
  isProcessing,
}: any) => {
  const [action, setAction] = useState("approve");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (action === "reject" && !reason.trim()) {
      setError("Please enter a rejection reason");
      return;
    }
    setError("");
    onConfirm(action, reason);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        animation: "fadeInBg 0.18s ease",
      }}
    >
      <style>{ANIM}</style>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-red-500" />
        <div className="p-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 mx-auto bg-orange-50">
            <ListChecks size={28} className="text-orange-500" />
          </div>
          <h3 className="text-[18px] font-bold text-gray-900 text-center mb-1">
            Batch Process
          </h3>
          <p className="text-[13px] text-gray-500 text-center mb-5">
            {selectedIds.length === 0
              ? "No users selected. Please select users from the table first."
              : `${selectedIds.length} user${
                  selectedIds.length !== 1 ? "s" : ""
                } selected`}
          </p>
          {selectedIds.length > 0 && (
            <>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => {
                    setAction("approve");
                    setError("");
                  }}
                  className={`flex-1 h-10 rounded-xl text-sm font-semibold border-2 transition-all ${
                    action === "approve"
                      ? "bg-green-50 border-green-400 text-green-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  ✓ Approve All
                </button>
                <button
                  onClick={() => {
                    setAction("reject");
                    setError("");
                  }}
                  className={`flex-1 h-10 rounded-xl text-sm font-semibold border-2 transition-all ${
                    action === "reject"
                      ? "bg-red-50 border-red-400 text-red-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  ✕ Reject All
                </button>
              </div>

              {/* Reason input for batch reject */}
              {action === "reject" && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter rejection reason for all selected users..."
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      error ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  )}
                </div>
              )}

              <div className="max-h-40 overflow-y-auto mb-5 rounded-xl border border-gray-100">
                {pendingRequests
                  .filter((r: any) => selectedIds.includes(r.id))
                  .map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold">
                        {(r.first_name || "").charAt(0)}
                        {(r.last_name || "").charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {r.first_name} {r.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{r.email}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-60 ${
                  action === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isProcessing
                  ? "Processing..."
                  : `Confirm ${action === "approve" ? "Approve" : "Reject"}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type }: any) => (
  <div
    className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white text-sm font-semibold ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`}
    style={{ animation: "toastIn 0.3s ease" }}
  >
    {type === "success" ? (
      <CheckCircle2 size={18} />
    ) : (
      <AlertCircle size={18} />
    )}
    {message}
  </div>
);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DateRangePicker = ({ startDate, endDate, onChange, onClose }: any) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selecting, setSelecting] = useState("start");
  const [hover, setHover] = useState<string | null>(null);

  const prevMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();
  const firstDow = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  ).getDay();

  const parseD = (str: string | null) =>
    str ? new Date(str + "T00:00:00") : null;
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const handleDay = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const iso = toIso(d);
    if (selecting === "start") {
      onChange(iso, endDate && iso > endDate ? iso : endDate);
      setSelecting("end");
    } else {
      if (iso < startDate) onChange(iso, startDate);
      else onChange(startDate, iso);
      setSelecting("start");
    }
  };

  const sd = parseD(startDate),
    ed = parseD(endDate);

  const isInRange = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const h = hover ? new Date(hover + "T00:00:00") : null;
    if (sd && h && selecting === "end") return d >= sd && d <= h;
    if (sd && ed) return d >= sd && d <= ed;
    return false;
  };
  const isStart = (day: number) =>
    sd &&
    toIso(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) ===
      startDate;
  const isEnd = (day: number) =>
    ed &&
    toIso(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) ===
      endDate;

  const presets = [
    {
      label: "Last 7 days",
      fn: () => {
        const s = new Date(today);
        s.setDate(today.getDate() - 6);
        onChange(toIso(s), toIso(today));
      },
    },
    {
      label: "Last 30 days",
      fn: () => {
        const s = new Date(today);
        s.setDate(today.getDate() - 29);
        onChange(toIso(s), toIso(today));
      },
    },
    {
      label: "Last 90 days",
      fn: () => {
        const s = new Date(today);
        s.setDate(today.getDate() - 89);
        onChange(toIso(s), toIso(today));
      },
    },
    {
      label: "This month",
      fn: () => {
        onChange(
          toIso(new Date(today.getFullYear(), today.getMonth(), 1)),
          toIso(today)
        );
      },
    },
  ];

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-[380px]"
      style={{ animation: "slideUp 0.2s ease" }}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={p.fn}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-gray-800">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-bold text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array(firstDow)
          .fill(null)
          .map((_, i) => (
            <div key={`e${i}`} />
          ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dayIso = toIso(
            new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
          );
          const inRange = isInRange(day);
          const start = isStart(day),
            end = isEnd(day);
          return (
            <button
              key={day}
              onClick={() => handleDay(day)}
              onMouseEnter={() => setHover(dayIso)}
              onMouseLeave={() => setHover(null)}
              className={`h-8 text-[13px] font-medium rounded-lg transition-all ${
                start || end
                  ? "text-white font-bold"
                  : inRange
                  ? "text-orange-700 bg-orange-50"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={start || end ? { backgroundColor: "#FF9800" } : {}}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>
          <span className="font-semibold text-gray-700">From:</span>{" "}
          {startDate || "—"}
        </span>
        <span>
          <span className="font-semibold text-gray-700">To:</span>{" "}
          {endDate || "—"}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onChange(null, null)}
          className="flex-1 h-9 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
        >
          Clear
        </button>
        <button
          onClick={onClose}
          className="flex-1 h-9 rounded-lg text-xs font-semibold text-white"
          style={{ backgroundColor: "#FF9800" }}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

const DeleteModal = ({
  isOpen,
  user,
  onConfirm,
  onCancel,
  isProcessing,
}: any) => {
  if (!isOpen || !user) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        animation: "fadeInBg 0.18s ease",
      }}
    >
      <style>{ANIM}</style>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div className="h-1.5 w-full bg-red-500" />
        <div className="p-8">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5 mx-auto">
            <Trash2 size={26} className="text-red-500" strokeWidth={2} />
          </div>
          <h3 className="text-[18px] font-bold text-gray-900 text-center mb-2">
            Delete User?
          </h3>
          <p className="text-[13px] text-gray-500 text-center leading-relaxed mb-6">
            You&apos;re about to permanently delete{" "}
            <strong className="text-gray-700">
              {user.first_name} {user.last_name}
            </strong>
            . This will remove them from{" "}
            <strong className="text-gray-700">the system</strong>. This cannot
            be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60 shadow-md"
            >
              {isProcessing ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const token = getToken();

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const [startDate, setStartDate] = useState(toIso(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(toIso(today));
  const [showCalendar, setShowCalendar] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState("pending");
  const [metrics, setMetrics] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    averageReviewTime: "-",
  });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting states
  const [pendingSort, setPendingSort] = useState<{
    field: string;
    order: "asc" | "desc";
  }>({
    field: "created_at",
    order: "desc",
  });
  const [approvedSort, setApprovedSort] = useState<{
    field: string;
    order: "asc" | "desc";
  }>({
    field: "approved_at",
    order: "desc",
  });
  const [rejectedSort, setRejectedSort] = useState<{
    field: string;
    order: "asc" | "desc";
  }>({
    field: "updated_at",
    order: "desc",
  });

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: string | null;
    user: any;
    reason?: string;
  }>({ isOpen: false, type: null, user: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: any;
  }>({ isOpen: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatch, setShowBatch] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null
  );

  const showToast = (message: string, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node))
        setShowCalendar(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);
    return p.toString();
  }, [startDate, endDate]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = buildParams();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch metrics
      const mRes = await fetch(`${apiBase}/keycloak/admin/metrics?${qs}`, {
        headers,
      });
      if (mRes.ok) {
        const metricsData = await mRes.json();
        setMetrics(metricsData);
      }

      const pendingUrl = `${apiBase}/keycloak/admin/pending?${qs}&sort_by=${pendingSort.field}&order=${pendingSort.order}`;
      const pRes = await fetch(pendingUrl, { headers });
      if (pRes.ok) {
        setPendingRequests(await pRes.json());
        setSelectedIds([]);
      }

      const approvedUrl = `${apiBase}/keycloak/admin/approved?${qs}&sort_by=${approvedSort.field}&order=${approvedSort.order}`;
      const aRes = await fetch(approvedUrl, { headers });
      if (aRes.ok) {
        setApprovedUsers(await aRes.json());
      }

      const rejectedUrl = `${apiBase}/keycloak/admin/rejected?${qs}&sort_by=${rejectedSort.field}&order=${rejectedSort.order}`;
      const rRes = await fetch(rejectedUrl, { headers });
      if (rRes.ok) {
        setRejectedUsers(await rRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token, buildParams, apiBase, pendingSort, approvedSort, rejectedSort]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleExportCSV = () => {
    const qs = buildParams();
    const status =
      activeTab === "approved"
        ? "approved"
        : activeTab === "rejected"
        ? "rejected"
        : "pending";
    fetch(`${apiBase}/keycloak/admin/export-csv?${qs}&status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        const bUrl = URL.createObjectURL(blob);
        a.href = bUrl;
        a.download = `${status}_users_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(bUrl);
        showToast("CSV exported successfully!");
      })
      .catch(() => showToast("Export failed.", "error"));
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${apiBase}/keycloak/admin/delete/${deleteModal.user.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        showToast("User deleted successfully!");
        setDeleteModal({ isOpen: false, user: null });
        await fetchDashboardData();
      } else {
        const err = await res.json();
        showToast(err.error || "Delete failed.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const openModal = (type: string, user: any) =>
    setModal({ isOpen: true, type, user });
  const closeModal = () => setModal({ isOpen: false, type: null, user: null });

  const doAction = async (ids: string[], action: string, reason?: string) => {
    setIsProcessing(true);
    try {
      let res;
      if (ids.length === 1) {
        if (action === "reject") {
          res = await fetch(`${apiBase}/keycloak/admin/reject/${ids[0]}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason }),
          });
        } else {
          res = await fetch(`${apiBase}/keycloak/admin/${action}/${ids[0]}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } else {
        res = await fetch(`${apiBase}/keycloak/admin/batch`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids, action, reason }),
        });
      }
      if (res.ok) {
        showToast(
          `${action === "approve" ? "Approved" : "Rejected"} successfully!`
        );
        closeModal();
        setShowBatch(false);
        await fetchDashboardData();
      } else {
        const err = await res.json();
        showToast(err.error || "Action failed.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRowConfirm = (reason?: string) =>
    doAction([modal.user.id], modal.type!, reason);
  const handleBatchConfirm = (action: string, reason?: string) =>
    doAction(selectedIds, action, reason);
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const toggleAll = () =>
    setSelectedIds((prev) =>
      prev.length === pendingRequests.length
        ? []
        : pendingRequests.map((r) => r.id)
    );
  const getInitials = (f: string, l: string) =>
    `${(f || "").charAt(0)}${(l || "").charAt(0)}`.toUpperCase();
  const dateLabel =
    startDate && endDate ? `${startDate} → ${endDate}` : "Last 30 Days";

  // Sorting handlers
  const handlePendingSort = (field: string) => {
    setPendingSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleApprovedSort = (field: string) => {
    setApprovedSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleRejectedSort = (field: string) => {
    setRejectedSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({
    field,
    currentSort,
  }: {
    field: string;
    currentSort: { field: string; order: "asc" | "desc" };
  }) => {
    if (currentSort.field !== field) {
      return <ArrowUpDown size={14} style={{ marginLeft: "4px" }} />;
    }
    return currentSort.order === "asc" ? (
      <ArrowUp size={14} style={{ marginLeft: "4px" }} />
    ) : (
      <ArrowDown size={14} style={{ marginLeft: "4px" }} />
    );
  };

  const metricCards = [
    {
      icon: <ClipboardList />,
      iconBg: THEME.cardPendingBg,
      iconColor: THEME.cardPendingText,
      label: "Total Pending",
      value: metrics.totalPending,
    },
    {
      icon: <CheckCircle2 />,
      iconBg: THEME.cardApprovedBg,
      iconColor: THEME.cardApprovedText,
      label: "Total Approved",
      value: metrics.totalApproved,
    },
    {
      icon: <X />,
      iconBg: THEME.cardRejectedBg,
      iconColor: THEME.cardRejectedText,
      label: "Total Rejected",
      value: metrics.totalRejected,
    },
    {
      icon: <Clock />,
      iconBg: THEME.cardAvgTimeBg,
      iconColor: THEME.cardAvgTimeText,
      label: "Average Review Time",
      value: metrics.averageReviewTime,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FAFAFA",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      <style>{ANIM}</style>

      {/* Modals */}
      <ConfirmModal
        isOpen={modal.isOpen}
        type={modal.type}
        user={modal.user}
        onConfirm={handleRowConfirm}
        onCancel={closeModal}
        isProcessing={isProcessing}
      />
      <BatchModal
        isOpen={showBatch}
        selectedIds={selectedIds}
        pendingRequests={pendingRequests}
        onConfirm={handleBatchConfirm}
        onCancel={() => setShowBatch(false)}
        isProcessing={isProcessing}
      />
      <DeleteModal
        isOpen={deleteModal.isOpen}
        user={deleteModal.user}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteModal({ isOpen: false, user: null })}
        isProcessing={isDeleting}
      />
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div
        style={{ padding: "32px 24px", maxWidth: "1200px", margin: "0 auto" }}
      >
        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              User Management
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              Review and manage pending user registrations and API access
              requests.
            </p>
          </div>

          {/* Date range picker */}
          <div className="relative" ref={calRef}>
            <button
              onClick={() => setShowCalendar((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Calendar size={15} className="text-orange-400" />
              {dateLabel}
            </button>
            {showCalendar && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(s: string, e: string) => {
                    setStartDate(s);
                    setEndDate(e);
                  }}
                  onClose={() => {
                    setShowCalendar(false);
                    fetchDashboardData();
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div
          className="rounded-2xl mb-10 overflow-hidden"
          style={{ backgroundColor: THEME.cardWrapperBg }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
            {metricCards.map((card, i) => (
              <div
                key={i}
                className="bg-white"
                style={{
                  borderRadius: "8px",
                  padding: "20px 24px",
                  minHeight: "139px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "22px",
                      backgroundColor: card.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: card.iconColor,
                    }}
                  >
                    {React.cloneElement(card.icon as React.ReactElement, {
                      size: 22,
                    })}
                  </div>
                  <span
                    style={{
                      color: THEME.cardTitleText,
                      fontWeight: 500,
                      fontSize: "14px",
                    }}
                  >
                    {card.label}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      color: THEME.cardValueText,
                      fontSize: "36px",
                      fontWeight: 700,
                      lineHeight: "100%",
                    }}
                  >
                    {card.value ?? 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Toggle ── */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div
            className="flex items-center gap-0 border-b border-gray-200"
            style={{ marginBottom: "-1px" }}
          >
            {[
              {
                id: "pending",
                label: "Pending Approval Requests",
                icon: <ClipboardList size={15} />,
              },
              {
                id: "approved",
                label: "Approved Users",
                icon: <Users size={15} />,
              },
              {
                id: "rejected",
                label: "Rejected Users",
                icon: <X size={15} />,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    color: isActive ? "#FF9800" : "#6B7280",
                    borderBottom: isActive
                      ? "2px solid #FF9800"
                      : "2px solid transparent",
                    background: "none",
                    outline: "none",
                  }}
                >
                  <span style={{ color: isActive ? "#FF9800" : "#9CA3AF" }}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {tab.id === "pending" && pendingRequests.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600">
                      {pendingRequests.length}
                    </span>
                  )}
                  {tab.id === "approved" && approvedUsers.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-600">
                      {approvedUsers.length}
                    </span>
                  )}
                  {tab.id === "rejected" && rejectedUsers.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                      {rejectedUsers.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Upload size={15} className="text-gray-400" />
              Export CSV
            </button>
            {activeTab === "pending" && (
              <button
                onClick={() => setShowBatch(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-all"
                style={{
                  background:
                    "linear-gradient(90deg, #8B5000 0%, #FF9800 100%)",
                }}
              >
                <ListChecks size={15} />
                Batch Process{" "}
                {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Sub-description */}
        {activeTab === "pending" && (
          <p className="text-[13px] text-gray-500 mb-4">
            {selectedIds.length > 0 && (
              <span className="font-semibold text-orange-600">
                {selectedIds.length} selected ·{" "}
              </span>
            )}
            Action required for the following applications
          </p>
        )}
        {activeTab === "approved" && (
          <p className="text-[13px] text-gray-500 mb-4">
            All approved users. Deleting a user will remove them from the
            system.
          </p>
        )}
        {activeTab === "rejected" && (
          <p className="text-[13px] text-gray-500 mb-4">
            All rejected users and their rejection reasons.
          </p>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {/* PENDING TABLE */}
            {activeTab === "pending" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={
                          pendingRequests.length > 0 &&
                          selectedIds.length === pendingRequests.length
                        }
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">
                      Applicant Details
                    </th>
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">
                      Organization
                    </th>
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">
                      Request Type
                    </th>
                    <th
                      className="py-4 px-4 text-[13px] font-semibold text-gray-500 cursor-pointer hover:text-gray-700"
                      onClick={() => handlePendingSort("created_at")}
                    >
                      <div className="flex items-center">
                        Date Submitted
                        <SortIcon
                          field="created_at"
                          currentSort={pendingSort}
                        />
                      </div>
                    </th>
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-gray-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center">
                        <CheckCircle2
                          size={36}
                          className="mx-auto mb-3 text-green-300"
                        />
                        <p className="text-gray-400 font-medium">
                          No pending requests in this period.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((req) => (
                      <tr
                        key={req.id}
                        className={`hover:bg-gray-50/60 transition-colors ${
                          selectedIds.includes(req.id) ? "bg-orange-50/30" : ""
                        }`}
                      >
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedIds.includes(req.id)}
                            onChange={() => toggleSelect(req.id)}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#FFF5E6] text-[#FF9800] flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {getInitials(req.first_name, req.last_name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {req.first_name} {req.last_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {req.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-semibold text-gray-800">
                            {req.org_name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {req.org_type || "General"}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E6F4F1] text-[#008A70]">
                            Onboarding
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              {new Date(req.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              <Clock size={11} />
                              {new Date(req.created_at).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openModal("approve", req)}
                              className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
                              title="Approve"
                            >
                              <Check size={16} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => openModal("reject", req)}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                              title="Reject"
                            >
                              <X size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* APPROVED TABLE */}
            {activeTab === "approved" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">
                      User Details
                    </th>
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">
                      Organization
                    </th>
                    {/* <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">
                      Role
                    </th> */}
                    <th
                      className="py-4 px-4 text-[13px] font-semibold text-gray-500 cursor-pointer hover:text-gray-700"
                      onClick={() => handleApprovedSort("approved_at")}
                    >
                      <div className="flex items-center">
                        Approved On
                        <SortIcon
                          field="approved_at"
                          currentSort={approvedSort}
                        />
                      </div>
                    </th>
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-gray-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : approvedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 text-center">
                        <Users
                          size={36}
                          className="mx-auto mb-3 text-gray-200"
                        />
                        <p className="text-gray-400 font-medium">
                          No approved users in this period.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    approvedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#E6F4F1] text-[#008A70] flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {getInitials(user.first_name, user.last_name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-semibold text-gray-800">
                            {user.org_name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {user.org_type || "General"}
                          </p>
                        </td>
                        {/* <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
                            {user.role || "User"}
                          </span>
                        </td> */}
                        <td className="py-4 px-4">
                          {user.approved_at ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">
                                {new Date(user.approved_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                <Clock size={11} />
                                {new Date(user.approved_at).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() =>
                                setDeleteModal({ isOpen: true, user })
                              }
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={15} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* REJECTED TABLE */}
            {activeTab === "rejected" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">
                      User Details
                    </th>
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">
                      Organization
                    </th>
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">
                      Rejection Reason
                    </th>
                    <th
                      className="py-4 px-4 text-[13px] font-semibold text-gray-500 cursor-pointer hover:text-gray-700"
                      onClick={() => handleRejectedSort("updated_at")}
                    >
                      <div className="flex items-center">
                        Rejected On
                        <SortIcon
                          field="updated_at"
                          currentSort={rejectedSort}
                        />
                      </div>
                    </th>
                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-gray-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : rejectedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 text-center">
                        <X size={36} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-gray-400 font-medium">
                          No rejected users in this period.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    rejectedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {getInitials(user.first_name, user.last_name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-semibold text-gray-800">
                            {user.org_name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {user.org_type || "General"}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-700 break-words">
                              {user.reason || "No reason provided"}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {user.updated_at ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">
                                {new Date(user.updated_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                <Clock size={11} />
                                {new Date(user.updated_at).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() =>
                                setDeleteModal({ isOpen: true, user })
                              }
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={15} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-400 bg-white">
            <span>
              {activeTab === "pending"
                ? `${pendingRequests.length} result${
                    pendingRequests.length !== 1 ? "s" : ""
                  }`
                : activeTab === "approved"
                ? `${approvedUsers.length} result${
                    approvedUsers.length !== 1 ? "s" : ""
                  }`
                : `${rejectedUsers.length} result${
                    rejectedUsers.length !== 1 ? "s" : ""
                  }`}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Per page</span>
                <select className="border border-gray-200 rounded px-2 py-1 bg-white text-xs focus:outline-none">
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
              </div>
              <div className="flex gap-1">
                <button className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:bg-gray-50 text-xs">
                  &lt;
                </button>
                <button className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:bg-gray-50 text-xs">
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
