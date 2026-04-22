import React, { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const APPROVE_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subscription {
  service_name: string;
  service_id?: string;
  route_ids?: string[];
  routes?: Array<{ route_name: string }>;
  callbacks?: { success: string; failure: string };
}

interface Project {
  id: string;
  project_name: string;
  organisation_id: string;
  organisation_name: string;
  organisation_type: string;
  role: string;
  first_name: string;
  last_name: string;
  mobile_no: string;
  email_id: string;
  security?: {
    signingKey?: string;
    ipWhitelist?: string;
    encryptionKey?: string;
    signingKeyName?: string;
    encryptionKeyName?: string;
  };
  credentials_management?: {
    secretKey?: string;
    publicKeyId?: string;
  };
  subscriptions: Subscription[];
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  reason?: string | null;
}

interface ApiResponse {
  success: boolean;
  data: Project[];
  counts: {
    pending: string;
    inprogress: string;
    approved: string;
    rejected: string;
    total: string;
  };
}

interface ApprovalDetails {
  id: string;
  org_id: string;
  email: string;
  create_cons_group: boolean;
  consumer_groupid: string | null;
  create_cons_group_err: string | null;
  add_cons_to_group: boolean;
  add_cons_to_group_err: string | null;
  add_plugins: boolean;
  add_plugins_err: string | null;
  vault_status: boolean;
  vault_status_err: string | null;
  key_status: boolean;
  key_id: string | null;
  key_secret: string | null;
  key_status_err: string | null;
  mail_status: boolean;
  mail_status_err: string | null;
  created_at: string;
  updated_at: string;
}

interface FilterState {
  name: string;
  date: string;
  statuses: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeStatus = (s: string) => s.toLowerCase();

const formatDate = (iso: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = normalizeStatus(status);
  const map: Record<string, React.CSSProperties> = {
    pending: {
      background: "#FFF3CD",
      color: "#92600A",
      border: "1px solid #FFD97D",
    },
    approved: {
      background: "#D1FAE5",
      color: "#065F46",
      border: "1px solid #6EE7B7",
    },
    rejected: {
      background: "#FEE2E2",
      color: "#991B1B",
      border: "1px solid #FCA5A5",
    },
    completed: {
      background: "#D1FAE5",
      color: "#065F46",
      border: "1px solid #6EE7B7",
    },
    "in-progress": {
      background: "#FFF3E0",
      color: "#8B5000",
      border: "1px solid #FFB74D",
    },
    "in progress": {
      background: "#FFF3E0",
      color: "#8B5000",
      border: "1px solid #FFB74D",
    },
    inprogress: {
      background: "#FFF3E0",
      color: "#8B5000",
      border: "1px solid #FFB74D",
    },
  };
  const style = map[s] || {
    background: "#F3F4F6",
    color: "#374151",
    border: "1px solid #D1D5DB",
  };
  return (
    <span
      style={{
        ...style,
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        fontFamily: "'Roboto Flex', sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{
  type: "approve" | "reject";
  onConfirm: (reason?: string) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ type, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const isApprove = type === "approve";

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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", marginTop: "36px" }}>
        <div
          style={{
            position: "absolute",
            top: "-36px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: isApprove ? "#22C55E" : "#EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 20px ${
              isApprove ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"
            }`,
            zIndex: 81,
          }}
        >
          {isApprove ? (
            <CheckCircleSolid
              style={{ width: "40px", height: "40px", color: "white" }}
            />
          ) : (
            <XMarkIcon
              style={{
                width: "40px",
                height: "40px",
                color: "white",
                strokeWidth: 3,
              }}
            />
          )}
        </div>

        <div
          style={{
            background: "#FFF",
            borderRadius: "20px",
            width: "420px",
            padding: "52px 32px 32px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
            }}
          >
            <XMarkIcon style={{ width: "20px", height: "20px" }} />
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "16px",
                background: "#FFF8EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect
                  x="4"
                  y="10"
                  width="20"
                  height="14"
                  rx="3"
                  stroke="#FF9800"
                  strokeWidth="2"
                />
                <rect
                  x="16"
                  y="18"
                  width="20"
                  height="14"
                  rx="3"
                  stroke="#FF9800"
                  strokeWidth="2"
                />
                <path
                  d="M10 22v-8M10 14l-3 3M10 14l3 3"
                  stroke="#FF9800"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <h3
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              textAlign: "center",
              margin: "0 0 8px",
            }}
          >
            Request{" "}
            <span style={{ color: "#FF9800" }}>
              {isApprove ? "Approved" : "Rejection"}
            </span>
          </h3>
          <p
            style={{
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "14px",
              color: "#6B7280",
              textAlign: "center",
              margin: "0 0 24px",
            }}
          >
            {isApprove
              ? "Are you sure you want to approve request ?"
              : "Are you sure you want to reject request ?"}
          </p>

          {!isApprove && (
            <div
              style={{
                background: "#F9F9F9",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF9800"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#1A1A1A",
                    fontFamily: "'Roboto Flex', sans-serif",
                  }}
                >
                  Reason <span style={{ color: "#EF4444" }}>*</span>
                </span>
              </div>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter rejection reason..."
                rows={3}
                style={{
                  width: "100%",
                  border: error ? "1px solid #EF4444" : "none",
                  background: "transparent",
                  fontFamily: "'Roboto Flex', sans-serif",
                  fontSize: "13px",
                  color: "#374151",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {error && (
                <div
                  style={{
                    color: "#EF4444",
                    fontSize: "12px",
                    marginTop: "8px",
                    fontFamily: "'Roboto Flex', sans-serif",
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => {
                onClose();
              }}
              style={{
                background: "none",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                padding: "12px 32px",
                cursor: "pointer",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#6B7280",
                letterSpacing: "0.5px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#9CA3AF";
                e.currentTarget.style.backgroundColor = "#F9FAFB";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                background: loading
                  ? "#D1D5DB"
                  : "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                color: "#FFF",
                border: "none",
                borderRadius: "12px",
                padding: "13px 36px",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.8px",
              }}
            >
              {loading ? "Processing..." : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// ─── Read-only Field ──────────────────────────────────────────────────────────

const ReadonlyField: React.FC<{
  label: string;
  icon?: React.ReactNode;
  value: React.ReactNode;
}> = ({ label, icon, value }) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "8px",
      }}
    >
      {icon && (
        <span style={{ color: "#8B5000", display: "flex" }}>{icon}</span>
      )}
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#6B7280",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          fontFamily: "'Roboto Flex', sans-serif",
        }}
      >
        {label}
      </span>
    </div>
    <div
      style={{
        background: "#F5F5F0",
        borderRadius: "10px",
        padding: "13px 16px",
        fontSize: "14px",
        color: "#374151",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      {value || "—"}
    </div>
  </div>
);

const IconUser = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconCard = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);
const IconDoc = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconHome = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
const IconCog = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
  </svg>
);
const IconMail = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconPhone = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.38a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.83-.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16a2 2 0 0 1 .27.92z" />
  </svg>
);
const IconShield = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ─── Org Detail View ──────────────────────────────────────────────────────────

const OrgDetailView: React.FC<{
  project: Project;
  onBack: () => void;
  onActionDone: () => void;
}> = ({ project, onBack, onActionDone }) => {
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [expandedSubscription, setExpandedSubscription] = useState<
    number | null
  >(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${APPROVE_BASE}/dp/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: project.project_name,
          digiPluginsRequire: "true",
          serviceType: "all",
          organisation_id: project.organisation_id,
          email: project.email_id,
          project_name: project.project_name,
        }),
      });
      const json = await res.json();
      showToast(json.message || "Approved successfully", true);
      setConfirmType(null);
      setTimeout(() => onActionDone(), 1500);
    } catch {
      showToast("Failed to approve. Please try again.", false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${APPROVE_BASE}/projects/${project.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      showToast(json.message || "Rejected successfully", true);
      setConfirmType(null);
      setTimeout(() => onActionDone(), 1500);
    } catch {
      showToast("Failed to reject. Please try again.", false);
    } finally {
      setActionLoading(false);
    }
  };

  const isPending = normalizeStatus(project.status) === "pending";

  return (
    <div
      style={{
        flex: 1,
        background: "#F5F5F0",
        minHeight: "100vh",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 100,
            background: toast.ok ? "#065F46" : "#991B1B",
            color: "#FFF",
            padding: "14px 24px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div
        style={{
          background: "#FFF",
          borderBottom: "1px solid #E9ECF1",
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#374151",
            }}
          >
            <ArrowLeftIcon style={{ width: "20px", height: "20px" }} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "#FFF8EE",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF9800"
                strokeWidth="2"
              >
                <rect x="2" y="7" width="10" height="8" rx="2" />
                <rect x="12" y="11" width="10" height="8" rx="2" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: "26px",
                fontWeight: 700,
                color: "#1A1A1A",
                margin: 0,
              }}
            >
              Organization <span style={{ color: "#FF9800" }}>Details</span>
            </h1>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div style={{ padding: "32px 40px", maxWidth: "1000px" }}>
        {/* Basic Details */}
        <div
          style={{
            background: "#FFF",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              margin: "0 0 28px",
            }}
          >
            Basic Details
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <ReadonlyField
              label="Organization Name"
              icon={<IconUser />}
              value={project.organisation_name || project.project_name}
            />
            <ReadonlyField
              label="Organization ID"
              icon={<IconCard />}
              value={project.organisation_id}
            />
            <ReadonlyField
              label="Project Name"
              icon={<IconDoc />}
              value={project.project_name}
            />
            <ReadonlyField
              label="Organization Type"
              icon={<IconHome />}
              value={project.organisation_type}
            />
            {/* <ReadonlyField
              label="Role"
              icon={<IconCog />}
              value={project.role}
            /> */}
            <ReadonlyField
              label="Email ID"
              icon={<IconMail />}
              value={project.email_id}
            />
            <ReadonlyField
              label="Mobile No."
              icon={<IconPhone />}
              value={project.mobile_no}
            />
          </div>
        </div>

        {/* <div
          style={{
            background: "#FFF",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        > */}
        {/* <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              margin: "0 0 28px",
            }}
          >
            Basic Details
          </h2> */}
        {/* <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "20px",
            }}
          >
            <ReadonlyField
              label="Project Name"
              icon={<IconDoc />}
              value={project.project_name}
            />
          </div>
        </div> */}

        {/* Security Management */}
        <div
          style={{
            background: "#FFF",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              margin: "0 0 28px",
            }}
          >
            Security Management
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "12px",
                }}
              >
                <span style={{ color: "#8B5000" }}>
                  <IconUser />
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#6B7280",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  IP ADDRESSES
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {project.security?.ipWhitelist ? (
                  project.security.ipWhitelist.split(",").map((ip) => (
                    <span
                      key={ip.trim()}
                      style={{
                        background: "#F5F5F0",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "13px",
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {ip.trim()}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      color: "#9CA3AF",
                      fontSize: "13px",
                      fontStyle: "italic",
                    }}
                  >
                    No IP addresses configured
                  </span>
                )}
              </div>
            </div>

            <ReadonlyField
              label="Encryption Public Key"
              icon={<IconShield />}
              value={project.security?.encryptionKeyName || "No Encryption Key"}
            />

            <div style={{ gridColumn: "1 / -1" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "12px",
                }}
              >
                <span style={{ color: "#8B5000" }}>
                  <IconShield />
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#6B7280",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  DIGITAL SIGNATURE PUBLIC KEY
                </span>
              </div>
              <div
                style={{
                  background: "#F5F5F0",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  fontSize: "14px",
                  color: "#1A1A1A",
                  fontFamily: "'Roboto Flex', sans-serif",
                }}
              >
                {project.security?.signingKeyName ? (
                  project.security.signingKeyName
                ) : (
                  <strong>No Digital Signature Public Key provided</strong>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* rejected reason section */}
        {project.status?.toLowerCase() === "rejected" && project.reason && (
          <div
            style={{
              background: "#FFF",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid #FEE2E2",
            }}
          >
            <h2
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "#1A1A1A",
                margin: "0 0 20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <ExclamationCircleIcon
                style={{ width: "24px", height: "24px", color: "#EF4444" }}
              />
              Rejection <span style={{ color: "#EF4444" }}>Reason</span>
            </h2>
            <div
              style={{
                background: "#FEF2F2",
                borderRadius: "12px",
                padding: "20px",
                borderLeft: "4px solid #EF4444",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#991B1B",
                  lineHeight: 1.6,
                  fontFamily: "'Roboto Flex', sans-serif",
                }}
              >
                Reason: {project.reason}
              </div>
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "#B91C1C",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CalendarDaysIcon style={{ width: "14px", height: "14px" }} />
                Rejected on: {formatDate(project.updated_at)}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Management - Collapsible */}
        <div
          style={{
            background: "#FFF",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              margin: "0 0 20px",
            }}
          >
            Subscription Management
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {project.subscriptions?.length > 0 ? (
              project.subscriptions.map((sub, i) => (
                <div
                  key={i}
                  style={{
                    background: "#F5F5F0",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    onClick={() =>
                      setExpandedSubscription(
                        expandedSubscription === i ? null : i
                      )
                    }
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "#EBEBDF";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "transparent";
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "14px",
                          color: "#1A1A1A",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Service Name:{""}
                        {sub.service_name ||
                          sub.service_id ||
                          `Subscription ${i + 1}`}
                      </div>
                    </div>
                    <div
                      style={{
                        transform:
                          expandedSubscription === i
                            ? "rotate(90deg)"
                            : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <ChevronRightIcon
                        style={{
                          width: "18px",
                          height: "18px",
                          color: "#9CA3AF",
                        }}
                      />
                    </div>
                  </div>

                  {expandedSubscription === i && (
                    <div
                      style={{
                        padding: "0 20px 18px 20px",
                        borderTop: "1px solid #E5E7EB",
                      }}
                    >
                      <div
                        style={{
                          paddingTop: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {sub.callbacks && (
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#6B7280",
                                letterSpacing: "0.8px",
                                textTransform: "uppercase",
                                marginBottom: "8px",
                              }}
                            >
                              CALLBACKS
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              {sub.callbacks.success && (
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      fontSize: "12px",
                                      color: "#374151",
                                      letterSpacing: "0.5px",
                                      minWidth: "70px",
                                      paddingTop: "2px",
                                    }}
                                  >
                                    Success:
                                  </span>
                                  <span
                                    style={{
                                      wordBreak: "break-all",
                                      color: "#374151",
                                      fontFamily: "monospace",
                                      fontSize: "12px",
                                      flex: 1,
                                    }}
                                  >
                                    {sub.callbacks.success}
                                  </span>
                                </div>
                              )}
                              {sub.callbacks.failure && (
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      fontSize: "12px",
                                      color: "#374151",
                                      letterSpacing: "0.5px",
                                      minWidth: "70px",
                                      paddingTop: "2px",
                                    }}
                                  >
                                    Failure:
                                  </span>
                                  <span
                                    style={{
                                      wordBreak: "break-all",
                                      color: "#374151",
                                      fontFamily: "monospace",
                                      fontSize: "12px",
                                      flex: 1,
                                    }}
                                  >
                                    {sub.callbacks.failure}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {sub.routes && sub.routes.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#6B7280",
                                letterSpacing: "0.8px",
                                textTransform: "uppercase",
                                marginBottom: "8px",
                              }}
                            >
                              ROUTES
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                              }}
                            >
                              {sub.routes.map((route, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    background: "#FFF",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "6px",
                                    padding: "4px 10px",
                                    fontSize: "12px",
                                    color: "#374151",
                                  }}
                                >
                                  {route.route_name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {!sub.callbacks && !sub.routes?.length && (
                          <div
                            style={{
                              color: "#9CA3AF",
                              fontSize: "13px",
                              fontStyle: "italic",
                              padding: "8px 0",
                            }}
                          >
                            No additional details available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  color: "#9CA3AF",
                  fontSize: "14px",
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                No subscriptions
              </div>
            )}
          </div>
        </div>

        {isPending && (
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={() => setConfirmType("reject")}
              style={{
                background: "none",
                border: "1px solid #6B7280",
                borderRadius: "12px",
                padding: "14px 40px",
                cursor: "pointer",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "#6B7280",
                letterSpacing: "0.8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#EF4444";
                e.currentTarget.style.color = "#EF4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#6B7280";
                e.currentTarget.style.color = "#6B7280";
              }}
            >
              REJECT
            </button>
            <button
              onClick={() => setConfirmType("approve")}
              style={{
                background:
                  "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                color: "#FFF",
                border: "none",
                borderRadius: "12px",
                padding: "14px 40px",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.8px",
              }}
            >
              APPROVE
            </button>
          </div>
        )}
      </div>

      {confirmType && (
        <ConfirmModal
          type={confirmType}
          onConfirm={confirmType === "approve" ? handleApprove : handleReject}
          onClose={() => setConfirmType(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

// ─── Steps definition ─────────────────────────────────────────────────────────

interface Step {
  key: keyof ApprovalDetails;
  errKey: keyof ApprovalDetails;
  label: string;
  description: string;
  serviceType: string;
}

const STEPS: Step[] = [
  {
    key: "create_cons_group",
    errKey: "create_cons_group_err",
    label: "Create Consumer Group",
    description: "Creates a Kong consumer group for the organization.",
    serviceType: "create_consumer_group",
  },
  {
    key: "add_cons_to_group",
    errKey: "add_cons_to_group_err",
    label: "Add Consumer to Group",
    description: "Adds the consumer to the newly created group.",
    serviceType: "add_consumer_to_group",
  },
  {
    key: "add_plugins",
    errKey: "add_plugins_err",
    label: "Attach Plugins",
    description: "Attaches required API plugins to the consumer group.",
    serviceType: "attach_plugins",
  },
  {
    key: "vault_status",
    errKey: "vault_status_err",
    label: "Vault Certificate",
    description: "Stores encryption certificates in the secure vault.",
    serviceType: "vault_cert",
  },
  {
    key: "key_status",
    errKey: "key_status_err",
    label: "Generate Credentials",
    description: "Generates API key and secret for the organization.",
    serviceType: "generate_credentials",
  },
  {
    key: "mail_status",
    errKey: "mail_status_err",
    label: "Send Welcome Email",
    description: "Sends onboarding confirmation email to the organization.",
    serviceType: "mail",
  },
];

// ─── Onboarding Progress View ─────────────────────────────────────────────────

const OnboardingProgressView: React.FC<{
  project: Project;
  onBack: () => void;
}> = ({ project, onBack }) => {
  const [details, setDetails] = useState<ApprovalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepLoading, setStepLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${APPROVE_BASE}/dp/get_approval_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation_id: project.organisation_id,
          email_id: project.email_id,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDetails(await res.json());
    } catch {
      showToast("Could not load approval details", false);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRetry = async (serviceType: string) => {
    setStepLoading(serviceType);
    try {
      const res = await fetch(`${APPROVE_BASE}/dp/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: project.project_name,
          digiPluginsRequire: "true",
          serviceType,
          organisation_id: project.organisation_id,
          email: project.email_id,
          project_name: project.project_name,
        }),
      });
      const json = await res.json();
      showToast(json.message || "Step retried", true);
      await fetchDetails();
    } catch {
      showToast("Retry failed", false);
    } finally {
      setStepLoading(null);
    }
  };

  const handleManual = async (serviceType: string) => {
    setStepLoading(`manual_${serviceType}`);
    try {
      const res = await fetch(`${APPROVE_BASE}/dp/manual_approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation_id: project.organisation_id,
          email: project.email_id,
          serviceType,
          groupName: project.project_name,
        }),
      });
      const json = await res.json();
      showToast(json.message || "Manual step completed", true);
      await fetchDetails();
    } catch {
      showToast("Manual action failed", false);
    } finally {
      setStepLoading(null);
    }
  };

  const completedCount = details
    ? STEPS.filter((s) => details[s.key] === true).length
    : 0;

  return (
    <div
      style={{
        flex: 1,
        background: "#F5F5F0",
        minHeight: "100vh",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 100,
            background: toast.ok ? "#065F46" : "#991B1B",
            color: "#FFF",
            padding: "14px 24px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div
        style={{
          background: "#FFF",
          borderBottom: "1px solid #E9ECF1",
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#374151",
          }}
        >
          <ArrowLeftIcon style={{ width: "20px", height: "20px" }} />
        </button>
        <h1
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "26px",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: 0,
          }}
        >
          Onboarding <span style={{ color: "#FF9800" }}>In Progress...</span>
        </h1>
      </div>

      <div style={{ padding: "40px" }}>
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "60px", color: "#9CA3AF" }}
          >
            <ArrowPathIcon
              style={{
                width: "32px",
                height: "32px",
                margin: "0 auto 12px",
                display: "block",
                animation: "spin 1s linear infinite",
              }}
            />
            Loading onboarding details...
          </div>
        ) : (
          <>
            <div
              style={{
                background: "#FFF",
                borderRadius: "16px",
                padding: "20px 28px",
                marginBottom: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#1A1A1A",
                  }}
                >
                  {project.organisation_name || project.project_name}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6B7280",
                    marginTop: "4px",
                  }}
                >
                  {project.organisation_id} · {project.email_id}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#FF9800",
                  }}
                >
                  {completedCount}/{STEPS.length}
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                  steps completed
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr",
                alignItems: "start",
              }}
            >
              {STEPS.map((step, i) => {
                const done = details?.[step.key] === true;
                const err = details?.[step.errKey] as string | null;
                const isRetrying = stepLoading === step.serviceType;
                const isManual = stepLoading === `manual_${step.serviceType}`;
                const isLast = i === STEPS.length - 1;

                return (
                  <React.Fragment key={step.key}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        paddingRight: "24px",
                        paddingTop: "12px",
                        position: "relative",
                        minHeight: "120px",
                      }}
                    >
                      {!isLast && (
                        <div
                          style={{
                            position: "absolute",
                            right: "36px",
                            top: "60px",
                            width: "2px",
                            height: "calc(100% - 16px)",
                            background: done ? "#22C55E" : "#E5E7EB",
                          }}
                        />
                      )}
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#374151",
                          whiteSpace: "nowrap",
                          textAlign: "right",
                        }}
                      >
                        {details
                          ? new Date(details.updated_at).toLocaleDateString(
                              "en-IN",
                              { day: "numeric", month: "long", year: "numeric" }
                            )
                          : "—"}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9CA3AF",
                          textAlign: "right",
                        }}
                      >
                        {details
                          ? new Date(details.updated_at).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )
                          : ""}
                      </div>
                      <div
                        style={{
                          marginTop: "10px",
                          width: "34px",
                          height: "34px",
                          borderRadius: "50%",
                          background: done ? "#22C55E" : "#E5E7EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {done ? (
                          <CheckCircleSolid
                            style={{
                              width: "20px",
                              height: "20px",
                              color: "white",
                            }}
                          />
                        ) : (
                          <ExclamationCircleIcon
                            style={{
                              width: "18px",
                              height: "18px",
                              color: "#9CA3AF",
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#FFF",
                        borderRadius: "16px",
                        padding: "20px 24px",
                        marginBottom: "16px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        border: done
                          ? "1px solid #D1FAE5"
                          : err
                          ? "1px solid #FEE2E2"
                          : "1px solid #F0F0F0",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: done ? "#D1FAE5" : "#FEE2E2",
                          color: done ? "#065F46" : "#991B1B",
                        }}
                      >
                        {done ? "Completed" : "Failed"}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "12px",
                            background: "#FFF8EE",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {done ? (
                            <CheckCircleIcon
                              style={{
                                width: "28px",
                                height: "28px",
                                color: "#FF9800",
                              }}
                            />
                          ) : (
                            <ExclamationCircleIcon
                              style={{
                                width: "28px",
                                height: "28px",
                                color: "#EF4444",
                              }}
                            />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "13px",
                              color: "#1A1A1A",
                              textTransform: "uppercase",
                              letterSpacing: "0.6px",
                              marginBottom: "4px",
                            }}
                          >
                            {step.label}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#6B7280",
                              lineHeight: 1.5,
                            }}
                          >
                            {step.description}
                          </div>

                          {!done && err && (
                            <div
                              style={{
                                marginTop: "10px",
                                background: "#FEF2F2",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "12px",
                                color: "#991B1B",
                                fontFamily: "monospace",
                              }}
                            >
                              {err}
                            </div>
                          )}

                          {!done && (
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                marginTop: "14px",
                              }}
                            >
                              <button
                                onClick={() => handleRetry(step.serviceType)}
                                disabled={!!stepLoading}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "8px 16px",
                                  borderRadius: "8px",
                                  border: "none",
                                  background:
                                    "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                                  color: "#FFF",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: stepLoading
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: stepLoading ? 0.7 : 1,
                                  fontFamily: "'Roboto Flex', sans-serif",
                                }}
                              >
                                <ArrowPathIcon
                                  style={{
                                    width: "13px",
                                    height: "13px",
                                    animation: isRetrying
                                      ? "spin 1s linear infinite"
                                      : "none",
                                  }}
                                />
                                {isRetrying ? "Retrying..." : "Retry"}
                              </button>
                              <button
                                onClick={() => handleManual(step.serviceType)}
                                disabled={!!stepLoading}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "8px 16px",
                                  borderRadius: "8px",
                                  border: "1px solid #E5E7EB",
                                  background: "#FFF",
                                  color: "#374151",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: stepLoading
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: stepLoading ? 0.7 : 1,
                                  fontFamily: "'Roboto Flex', sans-serif",
                                }}
                              >
                                <WrenchScrewdriverIcon
                                  style={{
                                    width: "13px",
                                    height: "13px",
                                    animation: isManual
                                      ? "spin 1s linear infinite"
                                      : "none",
                                  }}
                                />
                                {isManual ? "Processing..." : "Mark Manual"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <button
              onClick={onBack}
              style={{
                marginTop: "8px",
                background:
                  "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                color: "#FFF",
                border: "none",
                borderRadius: "12px",
                padding: "14px 40px",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.8px",
              }}
            >
              DONE
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── Filter Modal ─────────────────────────────────────────────────────────────

const FilterModal: React.FC<{
  filters: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
}> = ({ filters, onApply, onClose }) => {
  const [tab, setTab] = useState<"Project name" | "date" | "status">(
    "Project name"
  );
  const [local, setLocal] = useState<FilterState>({ ...filters });

  const toggleStatus = (s: string) =>
    setLocal((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(s)
        ? prev.statuses.filter((x) => x !== s)
        : [...prev.statuses, s],
    }));

  const statusOptions = [
    { value: "approved", label: "Approved", bg: "#D1FAE5", color: "#065F46" },
    { value: "rejected", label: "Rejected", bg: "#FEE2E2", color: "#991B1B" },
    { value: "pending", label: "Pending", bg: "#FFF3CD", color: "#92600A" },
    {
      value: "in-progress",
      label: "In Progress",
      bg: "#FFF3E0",
      color: "#8B5000",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#FFF",
          borderRadius: "16px",
          width: "420px",
          padding: "28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            Filters
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
            }}
          >
            <XMarkIcon style={{ width: "20px", height: "20px" }} />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: "24px",
            borderBottom: "1px solid #E5E7EB",
            marginBottom: "24px",
          }}
        >
          {(["Project name", "date", "status"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "15px",
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? "#1A1A1A" : "#6B7280",
                paddingBottom: "12px",
                borderBottom:
                  tab === t ? "2px solid #FF9800" : "2px solid transparent",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "Project name" && (
          <div>
            <p
              style={{
                fontFamily: "'Roboto Flex', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                color: "#1A1A1A",
                marginBottom: "12px",
              }}
            >
              Filter by Project name
            </p>
            <div style={{ position: "relative" }}>
              <MagnifyingGlassIcon
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "16px",
                  height: "16px",
                  color: "#9CA3AF",
                }}
              />
              <input
                type="text"
                placeholder="Search Project name"
                value={local.name}
                onChange={(e) => setLocal({ ...local, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 36px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  fontFamily: "'Roboto Flex', sans-serif",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
          </div>
        )}
        {tab === "date" && (
          <div>
            <p
              style={{
                fontFamily: "'Roboto Flex', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                color: "#1A1A1A",
                marginBottom: "12px",
              }}
            >
              Filter by date
            </p>
            <input
              type="date"
              value={local.date}
              onChange={(e) => setLocal({ ...local, date: e.target.value })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        )}
        {tab === "status" && (
          <div>
            <p
              style={{
                fontFamily: "'Roboto Flex', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                color: "#1A1A1A",
                marginBottom: "16px",
              }}
            >
              Filter by status
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {statusOptions.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={local.statuses.includes(opt.value)}
                    onChange={() => toggleStatus(opt.value)}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "#FF9800",
                      cursor: "pointer",
                    }}
                  />
                  <span
                    style={{
                      background: opt.bg,
                      color: opt.color,
                      padding: "4px 14px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: "'Roboto Flex', sans-serif",
                    }}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "32px",
          }}
        >
          <button
            onClick={() => {
              setLocal({ name: "", date: "", statuses: [] });
              onApply({ name: "", date: "", statuses: [] });
              onClose();
            }}
            style={{
              background: "none",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              padding: "12px 32px",
              cursor: "pointer",
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#6B7280",
              letterSpacing: "0.5px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#9CA3AF";
              e.currentTarget.style.backgroundColor = "#F9FAFB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              onApply(local);
              onClose();
            }}
            style={{
              background: "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
              color: "#FFF",
              border: "none",
              borderRadius: "10px",
              padding: "12px 32px",
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            APPLY
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pagination Button ────────────────────────────────────────────────────────

const PagBtn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, active, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      minWidth: "34px",
      height: "34px",
      padding: "0 8px",
      borderRadius: "8px",
      border: active ? "none" : "1px solid #E5E7EB",
      background: active
        ? "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)"
        : "#FFFFFF",
      color: active ? "#FFF" : disabled ? "#D1D5DB" : "#374151",
      fontSize: "13px",
      fontWeight: active ? 700 : 400,
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Roboto Flex', sans-serif",
    }}
  >
    {children}
  </button>
);

// ─── Main List Component ──────────────────────────────────────────────────────

type ViewMode = "list" | "detail" | "onboarding";

const DpApprovalScreen: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [counts, setCounts] = useState({
    pending: "0",
    in_progress: "0",
    approved: "0",
    rejected: "0",
    total: "0",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    name: "",
    date: "",
    statuses: [],
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // const fetchProjects = useCallback(async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     const params = new URLSearchParams();

  //     if (filters.name) {
  //       params.append("name", filters.name);
  //     }
  //     if (filters.date) {
  //       params.append("date", filters.date);
  //     }
  //     if (filters.statuses.length > 0) {
  //       params.append("status", filters.statuses.join(","));
  //     }

  //     params.append("sort_by", "updated_at");
  //     params.append("order", sortOrder === "asc" ? "asc" : "desc");

  //     const url = `${API_BASE_URL}/projects?${params.toString()}`;
  //     const res = await fetch(url);
  //     if (!res.ok) throw new Error(`HTTP ${res.status}`);
  //     const json: ApiResponse = await res.json();
  //     setProjects(json.data || []);
  //     setCounts(
  //       json.counts || {
  //         pending: "0",
  //         in_progress: "0",
  //         approved: "0",
  //         rejected: "0",
  //         total: "0",
  //       }
  //     );
  //   } catch (e) {
  //     setError(e instanceof Error ? e.message : "Failed to load data");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [filters, sortOrder]);
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      // Use search parameter for global search
      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      // Apply individual filters
      if (filters.name) {
        params.append("project_name", filters.name);
      }
      if (filters.date) {
        params.append("updated_at", filters.date);
      }
      if (filters.statuses.length > 0) {
        params.append("status", filters.statuses.join(","));
      }

      params.append("sort_by", "updated_at");
      params.append("order", sortOrder === "asc" ? "asc" : "desc");

      const url = `${API_BASE_URL}/projects?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setProjects(json.data || []);
      setCounts(
        json.counts || {
          pending: "0",
          in_progress: "0",
          approved: "0",
          rejected: "0",
          total: "0",
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortOrder, debouncedSearchTerm]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update fetchProjects to use debouncedSearchTerm
  // useEffect(() => {
  //   fetchProjects();
  // }, [fetchProjects, debouncedSearchTerm]);
  const handleViewClick = (p: Project) => {
    setSelectedProject(p);
    const s = normalizeStatus(p.status);
    const isInProgress =
      s.includes("progress") || s === "inprogress" || s === "completed";
    setViewMode(isInProgress ? "onboarding" : "detail");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedProject(null);
  };
  const handleActionDone = () => {
    fetchProjects();
    setViewMode("list");
    setSelectedProject(null);
  };

  if (viewMode === "detail" && selectedProject)
    return (
      <OrgDetailView
        project={selectedProject}
        onBack={handleBack}
        onActionDone={handleActionDone}
      />
    );
  if (viewMode === "onboarding" && selectedProject)
    return (
      <OnboardingProgressView project={selectedProject} onBack={handleBack} />
    );

  // const filtered = projects.filter((p) => {
  //   const term = searchTerm.toLowerCase();
  //   return (
  //     !term ||
  //     p.organisation_name.toLowerCase().includes(term) ||
  //     p.organisation_id.toLowerCase().includes(term) ||
  //     p.project_name.toLowerCase().includes(term) ||
  //     p.first_name.toLowerCase().includes(term) ||
  //     p.last_name.toLowerCase().includes(term) ||
  //     p.email_id.toLowerCase().includes(term)
  //   );
  // });

  const filtered = projects;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };
  const activeFilterCount =
    (filters.statuses.length > 0 ? 1 : 0) +
    (filters.name ? 1 : 0) +
    (filters.date ? 1 : 0);

  const statCards = [
    {
      label: "Pending",
      value: counts.pending,
      icon: "⏳",
      iconBg: "#FFE599",
      color: "#92600A",
    },
    {
      label: "Inprogress",
      value: counts.in_progress,
      icon: "⟳",
      iconBg: "#FFE599",
      color: "#92600A",
    },
    {
      label: "Approved",
      value: counts.approved,
      icon: "✓",
      iconBg: "#D1FAE5",
      color: "#065F46",
    },
    {
      label: "Rejected",
      value: counts.rejected,
      icon: "✕",
      iconBg: "#FEE2E2",
      color: "#991B1B",
    },
    {
      label: "Total",
      value: counts.total,
      icon: "≡",
      iconBg: "#EDE9FE",
      color: "#4C1D95",
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        background: "#F9F9F9",
        minHeight: "100vh",
        padding: "36px 40px",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "32px",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Subscription{" "}
          <span style={{ color: "#FF9800" }}>Approval Management</span>
        </h1>
        <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px" }}>
          Review and approve/reject Subscriptions.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid #F0F0F0",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#1A1A1A",
                  lineHeight: 1,
                }}
              >
                {String(card.value).padStart(2, "0")}
              </div>
              <div
                style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}
              >
                {card.label}
              </div>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: card.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                color: card.color,
                fontWeight: 700,
              }}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <MagnifyingGlassIcon
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "#9CA3AF",
              }}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "300px",
                padding: "11px 12px 11px 36px",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                fontSize: "14px",
                fontFamily: "'Roboto Flex', sans-serif",
                outline: "none",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9CA3AF",
                }}
              >
                <XMarkIcon style={{ width: "16px", height: "16px" }} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            title="Filters"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              background: activeFilterCount > 0 ? "#FFF8EE" : "#FFFFFF",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <FunnelIcon
              style={{
                width: "18px",
                height: "18px",
                color: activeFilterCount > 0 ? "#FF9800" : "#6B7280",
              }}
            />
            {activeFilterCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "#FF9800",
                  color: "#FFF",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "10px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={fetchProjects}
          disabled={isLoading}
          title="Refresh"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            background: "#FFFFFF",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          <ArrowPathIcon
            style={{
              width: "18px",
              height: "18px",
              color: "#6B7280",
              animation: isLoading ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid #F0F0F0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1.5fr 1fr 1.5fr 1.5fr 1fr 1fr",
            padding: "14px 24px",
            background: "#F9F9F9",
            borderBottom: "1px solid #F0F0F0",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.6px",
              fontFamily: "'Roboto Flex', sans-serif",
            }}
          >
            ORG NAME
          </div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.6px",
              fontFamily: "'Roboto Flex', sans-serif",
            }}
          >
            PROJECT NAME
          </div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.6px",
              fontFamily: "'Roboto Flex', sans-serif",
            }}
          >
            ORG ID
          </div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.6px",
              fontFamily: "'Roboto Flex', sans-serif",
            }}
          >
            EMAIL
          </div>
          <div
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.6px",
              fontFamily: "'Roboto Flex', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            LAST UPDATED
            <span style={{ fontSize: "15px" }}>
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          </div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.6px",
              fontFamily: "'Roboto Flex', sans-serif",
            }}
          >
            STATUS
          </div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.6px",
              fontFamily: "'Roboto Flex', sans-serif",
            }}
          >
            ACTIONS
          </div>
        </div>

        {isLoading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: "14px",
            }}
          >
            <ArrowPathIcon
              style={{
                width: "24px",
                height: "24px",
                margin: "0 auto 8px",
                display: "block",
                animation: "spin 1s linear infinite",
              }}
            />
            Loading...
          </div>
        ) : paginated.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: "14px",
            }}
          >
            No records found.
          </div>
        ) : (
          paginated.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1.5fr 1fr 1.5fr 1.5fr 1fr 1fr",
                padding: "18px 24px",
                borderBottom: "1px solid #F0F0F0",
                alignItems: "center",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "#FAFAFA";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent";
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#1A1A1A",
                  }}
                >
                  {p.organisation_name || p.project_name || "—"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9CA3AF",
                    marginTop: "2px",
                  }}
                >
                  {p.first_name} {p.last_name}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#1A1A1A",
                  }}
                >
                  {p.project_name || "—"}
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span style={{ fontSize: "13px", color: "#374151" }}>
                  {" "}
                  {p.organisation_id.length > 12
                    ? p.organisation_id.slice(0, 12) + "…"
                    : p.organisation_id}
                </span>
                {/* {p.subscriptions?.length > 1 && (
                  <span
                    style={{
                      background: "#F3F4F6",
                      color: "#374151",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      fontSize: "10px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +{p.subscriptions.length - 1}
                  </span>
                )} */}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                {p.email_id || "—"}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                <CalendarDaysIcon
                  style={{
                    width: "14px",
                    height: "14px",
                    color: "#9CA3AF",
                    flexShrink: 0,
                  }}
                />
                {formatDate(p.updated_at)}
              </div>
              <div>
                <StatusBadge status={p.status} />
              </div>
              <div>
                <button
                  onClick={() => handleViewClick(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#2563EB",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "'Roboto Flex', sans-serif",
                    padding: "4px 0",
                  }}
                >
                  <EyeIcon style={{ width: "15px", height: "15px" }} /> View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          <div style={{ fontSize: "13px", color: "#6B7280" }}>
            Showing{" "}
            {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–
            {Math.min(currentPage * pageSize, filtered.length)} of{" "}
            {filtered.length} results
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <PagBtn
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronDoubleLeftIcon
                style={{ width: "14px", height: "14px" }}
              />
            </PagBtn>
            <PagBtn
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon style={{ width: "14px", height: "14px" }} />
            </PagBtn>
            {getPageNumbers().map((n) => (
              <PagBtn
                key={n}
                onClick={() => setCurrentPage(n)}
                active={currentPage === n}
              >
                {n}
              </PagBtn>
            ))}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span style={{ color: "#9CA3AF", fontSize: "13px" }}>...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PagBtn onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </PagBtn>
            )}
            <PagBtn
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon style={{ width: "14px", height: "14px" }} />
            </PagBtn>
            <PagBtn
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronDoubleRightIcon
                style={{ width: "14px", height: "14px" }}
              />
            </PagBtn>
          </div>
        </div>
      )}

      {showFilterModal && (
        <FilterModal
          filters={filters}
          onApply={(f) => {
            setFilters(f);
            setCurrentPage(1);
          }}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DpApprovalScreen;
