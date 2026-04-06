// // App.tsx (updated)
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// //import React from "react";
// import { AuthProvider } from "./contexts/AuthContext";

// // Import your actual components
// import LandingPage from "./components/LandingPage";
// import { KeyManagement } from "./components/KeyManagement";
// import ApiMigration from "./components/ApiMigration";
// import Analytics from "./components/Analytics";
// // import { DpApprovalScreen } from "./components/DpApprovalScreen"; // Add this import
// import DpApprovalScreen from "./components/DpApprovalScreen";

// import Layout from "./components/Layout";
// import ProtectedRoute from "./components/ProtectedRoute";

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Layout>
//           <Routes>
//             {/* 1. Default Route: Shows the LandingPage */}
//             <Route path="/" element={<LandingPage />} />

//             {/* 2. Route for API Migration Approval */}
//             <Route
//               path="/api-migration-approval"
//               element={
//                 <ProtectedRoute>
//                   <ApiMigration />
//                 </ProtectedRoute>
//               }
//             />

//             {/* 3. Route: Key Management Screen */}
//             <Route
//               path="/key-management"
//               element={
//                 <ProtectedRoute>
//                   <KeyManagement />
//                 </ProtectedRoute>
//               }
//             />

//             {/* 4. Route: Analytics Dashboard */}
//             <Route
//               path="/analytics"
//               element={
//                 <ProtectedRoute>
//                   <Analytics />
//                 </ProtectedRoute>
//               }
//             />

//             {/* 5. NEW Route: DP Approval Screen */}
//             <Route
//               path="/dp-approval"
//               element={
//                 <ProtectedRoute>
//                   <DpApprovalScreen />
//                 </ProtectedRoute>
//               }
//             />

//             {/* Catch-all route for unknown paths */}
//             <Route
//               path="*"
//               element={
//                 <div className="p-10 text-center text-red-600">
//                   404: Page Not Found
//                 </div>
//               }
//             />
//           </Routes>
//         </Layout>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

// App.tsx (updated)
// App.tsx (updated)
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Import your actual components
import LandingPage from "./components/LandingPage";
import { KeyManagement } from "./components/KeyManagement";
import Analytics from "./components/Analytics";
import DpApprovalScreen from "./components/DpApprovalScreen";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Import API Migration components
import Environments from "./components/ApiMigration/Environments";
import Migration from "./components/ApiMigration/Migration";
import Gitlab from "./components/ApiMigration/Gitlab";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* 1. Default Route: Shows the LandingPage */}
            <Route path="/" element={<LandingPage />} />

            {/* 2. API Migration Sub-routes */}
            <Route
              path="/api-migration/environments"
              element={
                <ProtectedRoute>
                  <Environments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-migration/migration"
              element={
                <ProtectedRoute>
                  <Migration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-migration/gitlab"
              element={
                <ProtectedRoute>
                  <Gitlab />
                </ProtectedRoute>
              }
            />

            {/* 3. Route: Key Management Screen */}
            <Route
              path="/key-management"
              element={
                <ProtectedRoute>
                  <KeyManagement />
                </ProtectedRoute>
              }
            />

            {/* 4. Route: Analytics Dashboard */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* 5. Route: DP Approval Screen */}
            <Route
              path="/dp-approval"
              element={
                <ProtectedRoute>
                  <DpApprovalScreen />
                </ProtectedRoute>
              }
            />

            {/* 6. Settings and Help pages */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
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
                <ProtectedRoute>
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

            {/* Redirect old API migration route to environments */}
            <Route
              path="/api-migration-approval"
              element={
                <ProtectedRoute>
                  <Environments />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route for unknown paths */}
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
