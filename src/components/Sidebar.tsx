import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NSDLLogo from "../assets/nsdl-logo.png";
import {
  CheckBadgeIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ServerIcon,
  DocumentDuplicateIcon,
  CodeBracketIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  onLogoutClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogoutClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const role = (user?.role as string) || "";
  const isKongAdmin = role === "kong_admin";

  const isApiMigrationSubItemActive =
    location.pathname.startsWith("/api-migration");
  const [isApiMigrationOpen, setIsApiMigrationOpen] = useState(
    isApiMigrationSubItemActive
  );

  // ── Menu definitions ────────────────────────────────────────────────────────

  /** Items visible to super_admin, checker (NOT kong_admin) */
  const mainMenuItems = [
    {
      name: "Subscription Approval",
      path: "/dp-approval",
      icon: CheckBadgeIcon,
    },
    { name: "Analytics", path: "/analytics", icon: ChartBarIcon },
  ];

  const apiMigrationItems = [
    {
      name: "Environments",
      path: "/api-migration/environments",
      icon: ServerIcon,
    },
    {
      name: "Migration",
      path: "/api-migration/migration",
      icon: DocumentDuplicateIcon,
    },
    { name: "GitLab", path: "/api-migration/gitlab", icon: CodeBracketIcon },
  ];

  /** Item visible only to kong_admin */
  const kongAdminItems = [
    { name: "User Management", path: "/user-management", icon: UsersIcon },
  ];

  const bottomItems = [
    // { name: "Settings", path: "/settings", icon: Cog6ToothIcon },
    // { name: "Help & Support", path: "/help", icon: QuestionMarkCircleIcon },
  ];

  // ── Style helpers ────────────────────────────────────────────────────────────

  const isActive = (path: string) => location.pathname === path;

  const isAnyMainMenuActive = mainMenuItems.some((item) => isActive(item.path));
  const shouldHighlightApiMigration =
    isApiMigrationSubItemActive || (isApiMigrationOpen && !isAnyMainMenuActive);

  const activeStyle = {
    background: "linear-gradient(39.34deg, #FF9800 0%, #FF9800 100%)",
    color: "#000000",
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(255,152,0,0.30)",
  };
  const inactiveStyle = {
    background: "transparent",
    color: "#52555D",
    fontWeight: 500,
    boxShadow: "none",
  };

  const hoverOn = (e: React.MouseEvent<HTMLButtonElement>) =>
    ((e.currentTarget as HTMLButtonElement).style.background = "#FFF8EE");
  const hoverOff = (e: React.MouseEvent<HTMLButtonElement>) =>
    ((e.currentTarget as HTMLButtonElement).style.background = "transparent");

  const toggleApiMigration = () => setIsApiMigrationOpen((v) => !v);

  const handleMainMenuNavigation = (path: string) => {
    if (isApiMigrationOpen && !path.startsWith("/api-migration")) {
      setIsApiMigrationOpen(false);
    }
    navigate(path);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        width: "240px",
        minWidth: "240px",
        maxWidth: "240px",
        background: "#FFFFFF",
        borderRight: "1px solid #E9ECF1",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      {/* <div
        style={{ padding: "28px 20px 20px", borderBottom: "1px solid #F3F4F6" }}
      >
        <img
          src={NSDLLogo}
          alt="NSDL"
          style={{ height: "36px", width: "auto", objectFit: "contain" }}
        />
      </div> */}

      <div
        style={{ padding: "28px 20px 20px", borderBottom: "1px solid #F3F4F6" }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "block",
          }}
        >
          <img
            src={NSDLLogo}
            alt="NSDL"
            style={{ height: "36px", width: "auto", objectFit: "contain" }}
          />
        </button>
      </div>

      {/* Main Nav */}
      <nav
        style={{
          padding: "16px 10px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {/* ── kong_admin: only User Management ── */}
        {isKongAdmin &&
          kongAdminItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 14px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "'Roboto Flex', sans-serif",
                  fontSize: "14px",
                  textAlign: "left",
                  ...(active ? activeStyle : inactiveStyle),
                }}
                onMouseEnter={(e) => {
                  if (!active) hoverOn(e);
                }}
                onMouseLeave={(e) => {
                  if (!active) hoverOff(e);
                }}
              >
                <item.icon
                  style={{
                    width: "20px",
                    height: "20px",
                    flexShrink: 0,
                    color: active ? "#FFFFFF" : "#000000",
                  }}
                />
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.name}
                </span>
              </button>
            );
          })}

        {/* ── non-kong_admin: Org Approval + Analytics ── */}
        {!isKongAdmin &&
          mainMenuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.name}
                onClick={() => handleMainMenuNavigation(item.path)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 14px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "'Roboto Flex', sans-serif",
                  fontSize: "14px",
                  textAlign: "left",
                  ...(active ? activeStyle : inactiveStyle),
                }}
                onMouseEnter={(e) => {
                  if (!active) hoverOn(e);
                }}
                onMouseLeave={(e) => {
                  if (!active) hoverOff(e);
                }}
              >
                <item.icon
                  style={{
                    width: "20px",
                    height: "20px",
                    flexShrink: 0,
                    color: active ? "#FFFFFF" : "#000000",
                  }}
                />
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.name}
                </span>
              </button>
            );
          })}

        {/* ── API Migration (non-kong_admin) ── */}
        {!isKongAdmin && (
          <div>
            <button
              onClick={toggleApiMigration}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                textAlign: "left",
                ...(shouldHighlightApiMigration ? activeStyle : inactiveStyle),
              }}
              onMouseEnter={(e) => {
                if (!shouldHighlightApiMigration) hoverOn(e);
              }}
              onMouseLeave={(e) => {
                if (!shouldHighlightApiMigration) hoverOff(e);
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <ArrowsRightLeftIcon
                  style={{
                    width: "20px",
                    height: "20px",
                    flexShrink: 0,
                    color: shouldHighlightApiMigration ? "#FFFFFF" : "#000000",
                  }}
                />
                <span style={{ whiteSpace: "nowrap" }}>API Migration</span>
              </div>
              {isApiMigrationOpen ? (
                <ChevronDownIcon
                  style={{ width: "15px", height: "15px", flexShrink: 0 }}
                />
              ) : (
                <ChevronRightIcon
                  style={{ width: "15px", height: "15px", flexShrink: 0 }}
                />
              )}
            </button>

            {isApiMigrationOpen && (
              <div
                style={{
                  marginLeft: "14px",
                  marginTop: "4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {apiMigrationItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.path)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "9px 12px",
                        borderRadius: "10px",
                        border: active
                          ? "1px solid rgba(255,152,0,0.3)"
                          : "1px solid transparent",
                        cursor: "pointer",
                        background: active
                          ? "rgba(255,152,0,0.08)"
                          : "transparent",
                        color: active ? "#8B5000" : "#6B7280",
                        fontFamily: "'Roboto Flex', sans-serif",
                        fontSize: "13px",
                        fontWeight: active ? 600 : 400,
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) hoverOn(e);
                      }}
                      onMouseLeave={(e) => {
                        if (!active) hoverOff(e);
                      }}
                    >
                      <item.icon
                        style={{
                          width: "15px",
                          height: "15px",
                          flexShrink: 0,
                          color: active ? "#FF9800" : "#000000",
                        }}
                      />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom items */}
      <div style={{ padding: "10px", borderTop: "1px solid #F3F4F6" }}>
        {bottomItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: "#52555D",
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              textAlign: "left",
              transition: "background 0.2s ease",
              marginBottom: "2px",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "#FFF8EE")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "transparent")
            }
          >
            <item.icon
              style={{
                width: "18px",
                height: "18px",
                flexShrink: 0,
                color: "#000000",
              }}
            />
            <span>{item.name}</span>
          </button>
        ))}

        <button
          onClick={() => (onLogoutClick ? onLogoutClick() : logout())}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "7px 14px",
            borderRadius: "8px",
            border: "1px solid #ECEEF2",
            background: "#FFFFFF",
            color: "#52555D",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "'Roboto Flex', sans-serif",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget;
            btn.style.background = "#FFF5E6";
            btn.style.borderColor = "#FF9800";
            btn.style.color = "#C97100";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget;
            btn.style.background = "#FFFFFF";
            btn.style.borderColor = "#ECEEF2";
            btn.style.color = "#52555D";
          }}
        >
          <ArrowRightOnRectangleIcon
            style={{
              width: "14px",
              height: "14px",
              flexShrink: 0,
              color: "currentColor",
            }}
          />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
