import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const getRoleHome = (role: string | undefined): string => {
  if (role === "kong_admin") return "/user-management";
  return "/";
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // 1. Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role as string | undefined;

  // 2. Role-based guard (only when allowedRoles is specified)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to the user's appropriate home instead of a blank 403
    return <Navigate to={getRoleHome(role)} replace />;
  }

  // 3. Accessing "/" as kong_admin → redirect to their home
  //    (handles the root LandingPage route)
  if (!allowedRoles && role === "kong_admin") {
    return <Navigate to="/user-management" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
