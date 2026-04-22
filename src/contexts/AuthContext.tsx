import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  name: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

function decodeRoleFromToken(accessToken: string): string {
  try {
    const base64Payload = accessToken.split(".")[1];
    const base64 = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    const knownRoles = ["super_admin", "checker", "maker", "kong_admin"];

    const clientRoles: string[] =
      payload?.resource_access?.["mca-portal"]?.roles ?? [];
    // console.log("[decodeRole] clientRoles:", clientRoles);

    const clientRole = clientRoles.find((r) => knownRoles.includes(r));
    if (clientRole) return clientRole;

    const realmRoles: string[] = payload?.realm_access?.roles ?? [];
    // console.log("[decodeRole] realmRoles:", realmRoles);
    const realmRole = realmRoles.find((r) => knownRoles.includes(r));
    if (realmRole) return realmRole;

    // Additional fallback: some tokens put roles directly at top level
    const topLevelRoles: string[] = payload?.roles ?? [];
    const topRole = topLevelRoles.find((r) => knownRoles.includes(r));
    if (topRole) return topRole;

    return "";
  } catch (err) {
    // console.error("[decodeRole] Error:", err);
    return "";
  }
}

function buildUserFromToken(accessToken: string): User {
  try {
    const base64Payload = accessToken.split(".")[1];
    const base64 = base64Payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(
        base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
        "="
      );
    const payload = JSON.parse(atob(base64));
    // console.log("[buildUser] Decoded payload:", payload);
    const role = decodeRoleFromToken(accessToken);
    // console.log("[buildUser] Extracted role:", role);
    return {
      name: payload.name ?? payload.preferred_username ?? "",
      username: payload.preferred_username ?? "",
      email: payload.email ?? "",
      role: role,
    };
  } catch (err) {
    // console.error("[buildUser] Error:", err);
    return { name: "", username: "", email: "", role: "" };
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Use sessionStorage instead of localStorage
  // useEffect(() => {
  //   const accessToken = sessionStorage.getItem("access_token");
  //   if (accessToken) {
  //     const restoredUser = buildUserFromToken(accessToken);
  //     if (restoredUser.role) {
  //       setUser(restoredUser);
  //       setIsAuthenticated(true);
  //     } else {
  //       // Invalid token – clear it
  //       sessionStorage.removeItem("access_token");
  //       sessionStorage.removeItem("refresh_token");
  //     }
  //   }
  // }, []);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("access_token");
    if (accessToken) {
      const restoredUser = buildUserFromToken(accessToken);
      if (restoredUser.role) {
        setUser(restoredUser);
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
      }
    }
    setIsLoading(false); // ← done restoring
  }, []);

  const login = async (_username: string, _password: string): Promise<void> => {
    // Tokens are already stored in sessionStorage by Login.tsx
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) throw new Error("No access token found after login.");

    const loggedInUser = buildUserFromToken(accessToken);
    if (!loggedInUser.role) {
      throw new Error("Your account does not have a recognised role.");
    }

    setUser(loggedInUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear sessionStorage for this tab only
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("remember_me");
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
