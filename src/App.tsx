import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import React from "react";

import LandingPage from "./components/LandingPage";
import Analytics from "./components/Analytics";
import DpApprovalScreen from "./components/DpApprovalScreen";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./components/AdminDashboard";
import Audit from "./components/Audit";

import Environments from "./components/ApiMigration/Environments";
import Migration from "./components/ApiMigration/Migration";
import Gitlab from "./components/ApiMigration/Gitlab";
import Login from "./components/Login";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* 1. Login — public */}
            <Route path="/login" element={<Login />} />

            {/* 2. Root redirect — role-aware */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <LandingPage />
                </ProtectedRoute>
              }
            />

            {/* 3. Org Approval — super_admin, checker */}
            <Route
              path="/dp-approval"
              element={
                <ProtectedRoute
                  allowedRoles={["super_admin", "checker", "kong_admin"]}
                >
                  <DpApprovalScreen />
                </ProtectedRoute>
              }
            />

            {/* 4. Analytics — super_admin, checker */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute
                  allowedRoles={["super_admin", "checker", "kong_admin"]}
                >
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* 5. Audit — super_admin, checker */}
            <Route
              path="/audit"
              element={
                <ProtectedRoute
                  allowedRoles={["super_admin"]}
                >
                  <Audit />
                </ProtectedRoute>
              }
            />

            {/* 6. API Migration — super_admin, checker */}
            <Route
              path="/api-migration/environments"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "checker"]}>
                  <Environments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-migration/migration"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "checker"]}>
                  <Migration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-migration/gitlab"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "checker"]}>
                  <Gitlab />
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-migration-approval"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "checker"]}>
                  <Environments />
                </ProtectedRoute>
              }
            />

            {/* 6. Admin Dashboard — kong_admin only */}
            <Route
              path="/user-management"
              element={
                <ProtectedRoute allowedRoles={["kong_admin", "super_admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 7. Settings & Help — super_admin, checker, maker */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute
                  allowedRoles={["super_admin", "checker", "maker"]}
                >
                  <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Settings
                    </h1>
                    <p className="text-gray-600 mt-2">
                      Settings page coming soon...
                    </p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute
                  allowedRoles={["super_admin", "checker", "maker"]}
                >
                  <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Help & Support
                    </h1>
                    <p className="text-gray-600 mt-2">
                      Help page coming soon...
                    </p>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route
              path="*"
              element={
                <div className="p-10 text-center text-red-600">
                  404: Page Not Found
                </div>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
