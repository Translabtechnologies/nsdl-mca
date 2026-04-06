// // Layout.tsx - Updated version
// import React from "react";
// import { useLocation } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import Sidebar from "./Sidebar";
// import nsdlLogo from "../assets/nsdl-logo.png";

// interface LayoutProps {
//   children: React.ReactNode;
// }

// const Layout: React.FC<LayoutProps> = ({ children }) => {
//   const { isAuthenticated, user, logout } = useAuth();
//   const location = useLocation();
//   const showSidebar = isAuthenticated && location.pathname !== "/";

//   return (
//     <div className="flex h-screen bg-gray-50 overflow-hidden">
//       {/* Full Height Sidebar */}
//       {showSidebar && <Sidebar />}

//       <div className="flex flex-col flex-1 min-w-0">
//         {/* Top Header - Now only spans the content area */}
//         <header className="bg-white border-b border-gray-200 z-10">
//           <div className="px-4 sm:px-6 lg:px-8">
//             <div className="flex justify-between items-center h-16">
//               {/* If Sidebar is hidden, show logo here instead */}
//               {!showSidebar && (
//                 <div className="flex items-center gap-3">
//                   <img src={nsdlLogo} alt="NSDL" className="h-12 w-auto" />
//                 </div>
//               )}

//               <div className="flex-1"></div>

//               {isAuthenticated && (
//                 <div className="flex items-center space-x-4">
//                   <span className="text-sm text-[#52555D] hidden md:block">
//                     {user?.name}
//                   </span>
//                   <button
//                     onClick={logout}
//                     className="bg-[#8E211B] text-white py-2 px-4 rounded text-sm hover:bg-[#701a15] transition-colors"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </header>

//         {/* Main Content Scroll Area */}
//         <main className="flex-1 overflow-y-auto focus:outline-none">
//           <div className="p-4 sm:p-6 lg:p-8">{children}</div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Layout;

import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";
import nsdlLogo from "../assets/nsdl-logo.png";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const showSidebar = isAuthenticated && location.pathname !== "/";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {showSidebar && <Sidebar />}

      <div className="flex flex-col flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {!showSidebar && (
                <div className="flex items-center gap-3">
                  <img src={nsdlLogo} alt="NSDL" className="h-12 w-auto" />
                </div>
              )}
              <div className="flex-1"></div>
              {isAuthenticated && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-[#52555D] hidden md:block">
                    {user?.name}
                  </span>
                  <button
                    onClick={logout} // Ensure AuthContext handles local cleanup only
                    className="bg-[#8E211B] text-white py-2 px-4 rounded text-sm hover:bg-[#701a15] transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
