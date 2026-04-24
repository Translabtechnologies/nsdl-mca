import React, { useState, useMemo } from "react";
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

// ============================================================================
// Types & Configuration
// ============================================================================

type Role = "super_admin" | "kong_admin" | "checker" | "maker";

interface MenuItemConfig {
  id: string;
  label: string;
  path?: string; // if present, it's a leaf node
  icon?: React.ElementType;
  allowedRoles: Role[]; // which roles can see this item
  children?: MenuItemConfig[]; // for sub-menus
}

// Single source of truth for all navigation
const MENU_CONFIG: MenuItemConfig[] = [
  {
    id: "subscription-approval",
    label: "Subscription Approval",
    path: "/dp-approval",
    icon: CheckBadgeIcon,
    allowedRoles: ["super_admin", "kong_admin", "checker", "maker"],
  },
  {
    id: "user-management",
    label: "User Management",
    path: "/user-management",
    icon: UsersIcon,
    allowedRoles: ["super_admin", "kong_admin"],
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/analytics",
    icon: ChartBarIcon,
    allowedRoles: ["super_admin", "kong_admin", "checker", "maker"],
  },
  {
    id: "api-migration",
    label: "API Migration",
    icon: ArrowsRightLeftIcon,
    allowedRoles: ["super_admin", "checker", "maker"],
    children: [
      {
        id: "environments",
        label: "Environments",
        path: "/api-migration/environments",
        icon: ServerIcon,
        allowedRoles: ["super_admin", "checker", "maker"],
      },
      {
        id: "migration",
        label: "Migration",
        path: "/api-migration/migration",
        icon: DocumentDuplicateIcon,
        allowedRoles: ["super_admin", "checker", "maker"],
      },
      {
        id: "gitlab",
        label: "GitLab",
        path: "/api-migration/gitlab",
        icon: CodeBracketIcon,
        allowedRoles: ["super_admin", "checker", "maker"],
      },
    ],
  },
];

// ============================================================================
// Helper: filter menu by user role
// ============================================================================
function filterMenuByRole(
  items: MenuItemConfig[],
  userRole: Role
): MenuItemConfig[] {
  return items.reduce<MenuItemConfig[]>((acc, item) => {
    const hasAccess = item.allowedRoles.includes(userRole);
    if (!hasAccess) return acc;

    const filteredChildren = item.children
      ? filterMenuByRole(item.children, userRole)
      : undefined;
    acc.push({
      ...item,
      children: filteredChildren?.length ? filteredChildren : undefined,
    });
    return acc;
  }, []);
}

// ============================================================================
// Style constants (extracted for consistency)
// ============================================================================
const styles = {
  sidebar: {
    width: "240px",
    minWidth: "240px",
    maxWidth: "240px",
    background: "#FFFFFF",
    borderRight: "1px solid #E9ECF1",
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    position: "sticky" as const,
    top: 0,
  },
  logoContainer: {
    padding: "28px 20px 20px",
    borderBottom: "1px solid #F3F4F6",
  },
  nav: {
    padding: "16px 10px",
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  activeItem: {
    background: "linear-gradient(39.34deg, #FF9800 0%, #FF9800 100%)",
    color: "#000000",
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(255,152,0,0.30)",
  },
  inactiveItem: {
    background: "transparent",
    color: "#52555D",
    fontWeight: 500,
    boxShadow: "none",
  },
  buttonBase: {
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
    textAlign: "left" as const,
  },
};

// ============================================================================
// Sub-components
// ============================================================================

interface MenuItemProps {
  item: MenuItemConfig;
  isActive: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, isActive, onClick }) => {
  const Icon = item.icon!;
  const [isHovered, setIsHovered] = React.useState(false);

  const style = {
    ...styles.buttonBase,
    ...(isActive ? styles.activeItem : styles.inactiveItem),
    background:
      isHovered && !isActive
        ? "#FFF8EE"
        : isActive
        ? styles.activeItem.background
        : "transparent",
  };

  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon
        style={{
          width: "20px",
          height: "20px",
          flexShrink: 0,
          color: isActive ? "#FFFFFF" : "#000000",
        }}
      />
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.label}
      </span>
    </button>
  );
};

interface SubMenuProps {
  item: MenuItemConfig;
  isAnyChildActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onChildClick: (path: string) => void;
}

const SubMenu: React.FC<SubMenuProps> = ({
  item,
  isAnyChildActive,
  isOpen,
  onToggle,
  onChildClick,
}) => {
  const Icon = item.icon!;
  const [isHovered, setIsHovered] = React.useState(false);
  const shouldHighlight = isAnyChildActive || (isOpen && !isAnyChildActive);

  const parentStyle = {
    ...styles.buttonBase,
    justifyContent: "space-between" as const,
    ...(shouldHighlight ? styles.activeItem : styles.inactiveItem),
    background:
      isHovered && !shouldHighlight
        ? "#FFF8EE"
        : shouldHighlight
        ? styles.activeItem.background
        : "transparent",
  };

  return (
    <div>
      <button
        onClick={onToggle}
        style={parentStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Icon
            style={{
              width: "20px",
              height: "20px",
              flexShrink: 0,
              color: shouldHighlight ? "#FFFFFF" : "#000000",
            }}
          />
          <span>{item.label}</span>
        </div>
        {isOpen ? (
          <ChevronDownIcon style={{ width: "15px", height: "15px" }} />
        ) : (
          <ChevronRightIcon style={{ width: "15px", height: "15px" }} />
        )}
      </button>

      {isOpen && item.children && (
        <div
          style={{
            marginLeft: "14px",
            marginTop: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {item.children.map((child) => {
            const active = location.pathname === child.path;
            return (
              <button
                key={child.id}
                onClick={() => onChildClick(child.path!)}
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
                  background: active ? "rgba(255,152,0,0.08)" : "transparent",
                  color: active ? "#8B5000" : "#6B7280",
                  fontFamily: "'Roboto Flex', sans-serif",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "#FFF8EE";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                {child.icon && (
                  <child.icon
                    style={{
                      width: "15px",
                      height: "15px",
                      flexShrink: 0,
                      color: active ? "#FF9800" : "#000000",
                    }}
                  />
                )}
                <span>{child.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Sidebar Component
// ============================================================================

interface SidebarProps {
  onLogoutClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogoutClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const userRole = user?.role as Role;

  // Filter menu based on user's role (memoized for performance)
  const visibleMenu = useMemo(
    () => filterMenuByRole(MENU_CONFIG, userRole),
    [userRole]
  );

  // Sub-menu open state (only for API Migration)
  const [openSubMenuId, setOpenSubMenuId] = useState<string | null>(() => {
    // Auto-open if any child is active
    const apiMigration = visibleMenu.find(
      (item) => item.id === "api-migration"
    );
    if (
      apiMigration?.children?.some((child) => location.pathname === child.path)
    ) {
      return "api-migration";
    }
    return null;
  });

  const toggleSubMenu = (id: string) => {
    setOpenSubMenuId((prev) => (prev === id ? null : id));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleChildClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    if (onLogoutClick) onLogoutClick();
    else logout();
  };

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoContainer}>
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

      {/* Navigation */}
      <nav style={styles.nav}>
        {visibleMenu.map((item) => {
          if (item.path) {
            // Leaf node
            return (
              <MenuItem
                key={item.id}
                item={item}
                isActive={location.pathname === item.path}
                onClick={() => handleNavigate(item.path!)}
              />
            );
          } else if (item.children) {
            // Parent with children
            const isAnyChildActive = item.children.some(
              (child) => location.pathname === child.path
            );
            return (
              <SubMenu
                key={item.id}
                item={item}
                isAnyChildActive={isAnyChildActive}
                isOpen={openSubMenuId === item.id}
                onToggle={() => toggleSubMenu(item.id)}
                onChildClick={handleChildClick}
              />
            );
          }
          return null;
        })}
      </nav>

      {/* Sign Out Button */}
      <div style={{ padding: "10px", borderTop: "1px solid #F3F4F6" }}>
        <button
          onClick={handleLogout}
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
