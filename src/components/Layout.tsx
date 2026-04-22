import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";
import nsdlLogo from "../assets/nsdl-logo.png";
import { BellIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

interface LayoutProps {
  children: React.ReactNode;
}

// ── Page metadata map ─────────────────────────────────────────────────────────
const PAGE_META: Record<string, { title: string; crumbs: string[] }> = {
  "/": { title: "Dashboard", crumbs: ["Home"] },
  "/dp-approval": { title: "Org Approval", crumbs: ["Home", "Org Approval"] },
  "/analytics": { title: "Analytics", crumbs: ["Home", "Analytics"] },
  "/api-migration/environments": {
    title: "Environments",
    crumbs: ["Home", "API Migration", "Environments"],
  },
  "/api-migration/migration": {
    title: "Migration",
    crumbs: ["Home", "API Migration", "Migration"],
  },
  "/api-migration/gitlab": {
    title: "GitLab",
    crumbs: ["Home", "API Migration", "GitLab"],
  },
  "/user-management": {
    title: "User Management",
    crumbs: ["Home", "User Management"],
  },
  "/settings": { title: "Settings", crumbs: ["Home", "Settings"] },
  "/help": { title: "Help & Support", crumbs: ["Home", "Help & Support"] },
};

// ── Role pill config ──────────────────────────────────────────────────────────
const ROLE_STYLE: Record<string, { label: string; bg: string; color: string }> =
  {
    super_admin: { label: "Super Admin", bg: "#FFF5E6", color: "#C97100" },
    checker: { label: "Checker", bg: "#E6F4F1", color: "#008A70" },
    maker: { label: "Maker", bg: "#EEF2FF", color: "#4F46E5" },
    kong_admin: { label: "Kong Admin", bg: "#FEF2F2", color: "#DC2626" },
  };

// ── Avatar initials ───────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = (name || "U").trim().split(" ");
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

// ── Layout ────────────────────────────────────────────────────────────────────
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { showWarning, extendSession } = useSessionTimeout();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };
  const handleCancelLogout = () => setShowLogoutConfirm(false);
  const role = (user?.role as string) || "";
  const isKongAdmin = role === "kong_admin";
  const isLoginPage = location.pathname === "/login";

  const showSidebar =
    isAuthenticated &&
    !isLoginPage &&
    location.pathname !== "/" &&
    (isKongAdmin ? location.pathname === "/user-management" : true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // Login page — bare render, no chrome
  if (isLoginPage) return <>{children}</>;

  const meta = PAGE_META[location.pathname] ?? {
    title: "MCA Portal",
    crumbs: ["Home"],
  };
  const rolePill = ROLE_STYLE[role];
  const initials = getInitials(user?.name ?? "");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#F7F8FA",
        overflow: "hidden",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      {showSidebar && <Sidebar onLogoutClick={handleLogoutClick} />}

      {/* ── Main column ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* ── Top Header ── */}
        <header
          style={{
            height: "64px",
            background: "#FFFFFF",
            borderBottom: "1px solid #ECEEF2",
            display: "flex",
            alignItems: "center",
            padding: "0 28px",
            gap: "16px",
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            zIndex: 20,
          }}
        >
          {/* Logo — only when sidebar is hidden */}
          {!showSidebar && (
            <img
              src={nsdlLogo}
              alt="NSDL"
              style={{
                height: "32px",
                width: "auto",
                objectFit: "contain",
                marginRight: "8px",
              }}
            />
          )}

          {/* Page title + breadcrumb */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {/* {meta.title} */}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "2px",
              }}
            >
              {meta.crumbs.map((crumb, i) => (
                <React.Fragment key={crumb}>
                  {i > 0 && (
                    <ChevronRightIcon
                      style={{
                        width: "11px",
                        height: "11px",
                        color: "#CBD5E1",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "11px",
                      color:
                        i === meta.crumbs.length - 1 ? "#FF9800" : "#94A3B8",
                      fontWeight: i === meta.crumbs.length - 1 ? 600 : 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {/* {crumb} */}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right side */}
          {isAuthenticated && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              {/* Notification bell */}
              {/* <button
                title="Notifications"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "1px solid #ECEEF2",
                  background: "#FAFAFA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#FFF5E6")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#FAFAFA")
                }
              >
                <BellIcon
                  style={{ width: "17px", height: "17px", color: "#6B7280" }}
                />
              </button> */}

              <div
                style={{ width: "1px", height: "28px", background: "#ECEEF2" }}
              />

              {/* Role pill */}
              {rolePill && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: rolePill.bg,
                    color: rolePill.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {rolePill.label}
                </span>
              )}

              {/* Name + email + avatar */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div style={{ textAlign: "right", lineHeight: 1.3 }}>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#111827",
                      margin: 0,
                      whiteSpace: "nowrap",
                      maxWidth: "140px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user?.name}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#9CA3AF",
                      margin: 0,
                      whiteSpace: "nowrap",
                      maxWidth: "140px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {/* {(user as any)?.username} */}
                  </p>
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, #FF9800 0%, #8B5000 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    flexShrink: 0,
                    userSelect: "none",
                    boxShadow: "0 2px 6px rgba(255,152,0,0.35)",
                  }}
                >
                  {initials}
                </div>
              </div>

              <div
                style={{ width: "1px", height: "28px", background: "#ECEEF2" }}
              />

              {/* Sign out */}
              <button
                onClick={handleLogoutClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid #ECEEF2",
                  background: "#FFFFFF",
                  color: "#52555D",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = "#FFF5E6";
                  b.style.borderColor = "#FF9800";
                  b.style.color = "#C97100";
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = "#FFFFFF";
                  b.style.borderColor = "#ECEEF2";
                  b.style.color = "#52555D";
                }}
              >
                {/* Logout icon */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </header>

        {/* ── Page content ── */}
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>

      {/* ── Session timeout warning modal ── */}
      {showWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "32px 28px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "28px",
                background: "#FFF5E6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF9800"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "#1A1A1A",
                marginBottom: "8px",
              }}
            >
              Session About to Expire
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6B7280",
                marginBottom: "28px",
                lineHeight: 1.5,
              }}
            >
              You will be logged out in 1 minute due to inactivity.
            </p>
            <button
              onClick={extendSession}
              style={{
                background:
                  "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                padding: "12px 32px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.2s",
                boxShadow: "0 4px 12px rgba(139,80,0,0.3)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
              }
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}

      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "32px 28px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "28px",
                background: "#FFF5E6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF9800"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "#1A1A1A",
                marginBottom: "8px",
              }}
            >
              Confirm Logout
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6B7280",
                marginBottom: "28px",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to log out? You will be redirected to the
              login page.
            </p>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button
                onClick={handleCancelLogout}
                style={{
                  background: "#FFFFFF",
                  color: "#52555D",
                  border: "1px solid #ECEEF2",
                  borderRadius: "12px",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F9FAFB";
                  e.currentTarget.style.borderColor = "#D1D5DB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#ECEEF2";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                style={{
                  background:
                    "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 32px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  boxShadow: "0 4px 12px rgba(139,80,0,0.3)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
