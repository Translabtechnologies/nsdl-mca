// import React from "react";
// import { useAuth } from "../contexts/AuthContext";

// interface ProtectedRouteProps {
//   children: React.ReactNode;
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
//   const { isAuthenticated } = useAuth();

//   // React.useEffect(() => {
//   //   if (!isAuthenticated) {
//   //     login();
//   //   }
//   // }, [isAuthenticated, login]);

//   if (!isAuthenticated) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           <p className="text-lg mt-3">Authenticating...</p>
//         </div>
//       </div>
//     );
//   }

//   return <>{children}</>;
// };

// export default ProtectedRoute;

import React from "react";
// import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // const { isAuthenticated } = useAuth();

  // // If not authenticated, you can now redirect to a local login page
  // // or return null. The Keycloak "Authenticating..." spinner is removed.
  // if (!isAuthenticated) {
  //   return null;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;
