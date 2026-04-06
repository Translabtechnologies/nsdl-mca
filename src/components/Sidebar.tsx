// // Sidebar.tsx
// import React, { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import NSDLLogo from "../assets/nsdl-logo.png";
// import {
//   // KeyIcon,
//   CheckBadgeIcon,
//   ArrowsRightLeftIcon,
//   ChartBarIcon,
//   HomeIcon,
//   Cog6ToothIcon,
//   QuestionMarkCircleIcon,
//   ArrowRightOnRectangleIcon,
//   ChevronDownIcon,
//   ChevronRightIcon,
//   ServerIcon,
//   DocumentDuplicateIcon,
//   CodeBracketIcon,
// } from "@heroicons/react/24/outline";

// const Sidebar: React.FC = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { logout } = useAuth();

//   // Check if API migration sub-items are active
//   const isApiMigrationSubItemActive =
//     location.pathname.startsWith("/api-migration");
//   const [isApiMigrationOpen, setIsApiMigrationOpen] = useState(
//     isApiMigrationSubItemActive
//   );

//   const menuItems = [
//     { name: "Main", path: "/", icon: HomeIcon },
//     { name: "DP Approval", path: "/dp-approval", icon: CheckBadgeIcon },
//     // { name: "Key Management", path: "/key-management", icon: KeyIcon },
//     { name: "Analytics", path: "/analytics", icon: ChartBarIcon },
//   ];

//   const bottomItems = [
//     { name: "Settings", path: "/settings", icon: Cog6ToothIcon },
//     { name: "Help & Support", path: "/help", icon: QuestionMarkCircleIcon },
//   ];

//   const apiMigrationItems = [
//     {
//       name: "Environments",
//       path: "/api-migration/environments",
//       icon: ServerIcon,
//     },
//     {
//       name: "Migration",
//       path: "/api-migration/migration",
//       icon: DocumentDuplicateIcon,
//     },
//     {
//       name: "GitLab",
//       path: "/api-migration/gitlab",
//       icon: CodeBracketIcon,
//     },
//   ];

//   const isActive = (path: string) => location.pathname === path;

//   // Check if any main menu item is active (excluding API Migration)
//   const isAnyMainMenuActive = menuItems.some((item) => isActive(item.path));

//   // API Migration should be highlighted only when:
//   // 1. A sub-item is active, OR
//   // 2. It's open AND no other main menu is active
//   const shouldHighlightApiMigration =
//     isApiMigrationSubItemActive || (isApiMigrationOpen && !isAnyMainMenuActive);

//   const handleLogout = () => {
//     logout();
//   };

//   // Toggle API Migration menu
//   const toggleApiMigration = () => {
//     setIsApiMigrationOpen(!isApiMigrationOpen);
//   };

//   // Handle navigation to other menu items - close API migration if open
//   const handleMainMenuNavigation = (path: string) => {
//     // If navigating to another main menu and API migration is open, close it
//     if (isApiMigrationOpen && !path.startsWith("/api-migration")) {
//       setIsApiMigrationOpen(false);
//     }
//     navigate(path);
//   };

//   return (
//     <div
//       className="
//       w-[18rem]
//       min-w-[18rem]
//       max-w-[18rem]
//       bg-white
//       border-r
//       border-gray-200
//       flex
//       flex-col
//       h-screen
//       sticky
//       top-0
//       whitespace-nowrap
//     "
//     >
//       {/* Branding Section */}
//       <div className="px-6 py-8 flex justify-center">
//         <img src={NSDLLogo} alt="NSDL" className="h-10 w-auto object-contain" />
//       </div>

//       {/* Main Navigation */}
//       <nav className="px-4 space-y-1">
//         {menuItems.map((item) => {
//           const active = isActive(item.path);
//           return (
//             <button
//               key={item.name}
//               onClick={() => handleMainMenuNavigation(item.path)}
//               title={item.name}
//               className={`w-full flex items-center px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
//                 active
//                   ? "bg-[#8E211B] text-white shadow-md"
//                   : "text-gray-700 hover:bg-gray-50"
//               }`}
//             >
//               <item.icon
//                 className={`h-6 w-6 mr-4 shrink-0 ${
//                   active ? "text-white" : "text-[#8E211B]"
//                 }`}
//               />
//               <span className="font-semibold truncate">{item.name}</span>
//             </button>
//           );
//         })}

//         {/* API Migration with sub-items */}
//         <div className="mt-2">
//           <button
//             onClick={toggleApiMigration}
//             title="API Migration"
//             className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
//               shouldHighlightApiMigration
//                 ? "bg-[#8E211B] text-white shadow-md"
//                 : "text-gray-700 hover:bg-gray-50"
//             }`}
//           >
//             <div className="flex items-center">
//               <ArrowsRightLeftIcon
//                 className={`h-6 w-6 mr-4 shrink-0 ${
//                   shouldHighlightApiMigration ? "text-white" : "text-[#8E211B]"
//                 }`}
//               />
//               <span className="font-semibold truncate">API Migration</span>
//             </div>
//             {isApiMigrationOpen ? (
//               <ChevronDownIcon className="h-5 w-5 shrink-0" />
//             ) : (
//               <ChevronRightIcon className="h-5 w-5 shrink-0" />
//             )}
//           </button>

//           {/* API Migration Sub-menu */}
//           {isApiMigrationOpen && (
//             <div className="ml-8 mt-1 space-y-1">
//               {apiMigrationItems.map((item) => {
//                 const active = isActive(item.path);
//                 return (
//                   <button
//                     key={item.name}
//                     onClick={() => navigate(item.path)}
//                     title={item.name}
//                     className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-all text-sm whitespace-nowrap ${
//                       active
//                         ? "bg-[#8E211B]/10 text-[#8E211B] border border-[#8E211B]/20"
//                         : "text-gray-600 hover:bg-gray-50"
//                     }`}
//                   >
//                     <item.icon
//                       className={`h-5 w-5 mr-3 shrink-0 ${
//                         active ? "text-[#8E211B]" : "text-gray-500"
//                       }`}
//                     />
//                     <span className="font-medium truncate">{item.name}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </nav>

//       {/* Spacer */}
//       <div className="flex-grow" />

//       {/* Bottom Section */}
//       <div className="p-4 mb-6 space-y-1">
//         <div className="border-t border-gray-100 pt-4 mb-4">
//           {bottomItems.map((item) => (
//             <button
//               key={item.name}
//               onClick={() => navigate(item.path)}
//               title={item.name}
//               className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm whitespace-nowrap"
//             >
//               <item.icon className="h-5 w-5 mr-4 shrink-0 text-[#8E211B]" />
//               <span className="font-medium truncate">{item.name}</span>
//             </button>
//           ))}

//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm whitespace-nowrap"
//           >
//             <ArrowRightOnRectangleIcon className="h-5 w-5 mr-4 shrink-0 text-[#8E211B]" />
//             <span className="font-medium truncate">Logout</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

// // Sidebar.tsx
// import React, { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import NSDLLogo from "../assets/nsdl-logo.png";
// import {
//   // KeyIcon,
//   CheckBadgeIcon,
//   ArrowsRightLeftIcon,
//   ChartBarIcon,
//   HomeIcon,
//   Cog6ToothIcon,
//   QuestionMarkCircleIcon,
//   ArrowRightOnRectangleIcon,
//   ChevronDownIcon,
//   ChevronRightIcon,
//   ServerIcon,
//   DocumentDuplicateIcon,
//   CodeBracketIcon,
// } from "@heroicons/react/24/outline";

// const Sidebar: React.FC = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { logout } = useAuth();

//   // Check if API migration sub-items are active
//   const isApiMigrationSubItemActive =
//     location.pathname.startsWith("/api-migration");
//   const [isApiMigrationOpen, setIsApiMigrationOpen] = useState(
//     isApiMigrationSubItemActive
//   );

//   const menuItems = [
//     { name: "Main", path: "/", icon: HomeIcon },
//     { name: "DP Approval", path: "/dp-approval", icon: CheckBadgeIcon },
//     // { name: "Key Management", path: "/key-management", icon: KeyIcon },
//     { name: "Analytics", path: "/analytics", icon: ChartBarIcon },
//   ];

//   const bottomItems = [
//     { name: "Settings", path: "/settings", icon: Cog6ToothIcon },
//     { name: "Help & Support", path: "/help", icon: QuestionMarkCircleIcon },
//   ];

//   const apiMigrationItems = [
//     {
//       name: "Environments",
//       path: "/api-migration/environments",
//       icon: ServerIcon,
//     },
//     {
//       name: "Migration",
//       path: "/api-migration/migration",
//       icon: DocumentDuplicateIcon,
//     },
//     {
//       name: "GitLab",
//       path: "/api-migration/gitlab",
//       icon: CodeBracketIcon,
//     },
//   ];

//   const isActive = (path: string) => location.pathname === path;

//   // Check if any main menu item is active (excluding API Migration)
//   const isAnyMainMenuActive = menuItems.some((item) => isActive(item.path));

//   // API Migration should be highlighted only when:
//   // 1. A sub-item is active, OR
//   // 2. It's open AND no other main menu is active
//   const shouldHighlightApiMigration =
//     isApiMigrationSubItemActive || (isApiMigrationOpen && !isAnyMainMenuActive);

//   const handleLogout = () => {
//     logout();
//   };

//   // Toggle API Migration menu
//   const toggleApiMigration = () => {
//     setIsApiMigrationOpen(!isApiMigrationOpen);
//   };

//   // Handle navigation to other menu items - close API migration if open
//   const handleMainMenuNavigation = (path: string) => {
//     // If navigating to another main menu and API migration is open, close it
//     if (isApiMigrationOpen && !path.startsWith("/api-migration")) {
//       setIsApiMigrationOpen(false);
//     }
//     navigate(path);
//   };

//   return (
//     <div
//       className="
//       w-[18rem]
//       min-w-[18rem]
//       max-w-[18rem]
//       bg-white
//       border-r
//       border-gray-200
//       flex
//       flex-col
//       h-screen
//       sticky
//       top-0
//       whitespace-nowrap
//     "
//     >
//       {/* Branding Section */}
//       <div className="px-6 py-8 flex justify-center">
//         <img src={NSDLLogo} alt="NSDL" className="h-10 w-auto object-contain" />
//       </div>

//       {/* Main Navigation */}
//       <nav className="px-4 space-y-1">
//         {menuItems.map((item) => {
//           const active = isActive(item.path);
//           return (
//             <button
//               key={item.name}
//               onClick={() => handleMainMenuNavigation(item.path)}
//               title={item.name}
//               className={`w-full flex items-center px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
//                 active
//                   ? "bg-[#8E211B] text-white shadow-md"
//                   : "text-gray-700 hover:bg-gray-50"
//               }`}
//             >
//               <item.icon
//                 className={`h-6 w-6 mr-4 shrink-0 ${
//                   active ? "text-white" : "text-[#8E211B]"
//                 }`}
//               />
//               <span className="font-semibold truncate">{item.name}</span>
//             </button>
//           );
//         })}

//         {/* API Migration with sub-items */}
//         <div className="mt-2">
//           <button
//             onClick={toggleApiMigration}
//             title="API Migration"
//             className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
//               shouldHighlightApiMigration
//                 ? "bg-[#8E211B] text-white shadow-md"
//                 : "text-gray-700 hover:bg-gray-50"
//             }`}
//           >
//             <div className="flex items-center">
//               <ArrowsRightLeftIcon
//                 className={`h-6 w-6 mr-4 shrink-0 ${
//                   shouldHighlightApiMigration ? "text-white" : "text-[#8E211B]"
//                 }`}
//               />
//               <span className="font-semibold truncate">API Migration</span>
//             </div>
//             {isApiMigrationOpen ? (
//               <ChevronDownIcon className="h-5 w-5 shrink-0" />
//             ) : (
//               <ChevronRightIcon className="h-5 w-5 shrink-0" />
//             )}
//           </button>

//           {/* API Migration Sub-menu */}
//           {isApiMigrationOpen && (
//             <div className="ml-8 mt-1 space-y-1">
//               {apiMigrationItems.map((item) => {
//                 const active = isActive(item.path);
//                 return (
//                   <button
//                     key={item.name}
//                     onClick={() => navigate(item.path)}
//                     title={item.name}
//                     className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-all text-sm whitespace-nowrap ${
//                       active
//                         ? "bg-[#8E211B]/10 text-[#8E211B] border border-[#8E211B]/20"
//                         : "text-gray-600 hover:bg-gray-50"
//                     }`}
//                   >
//                     <item.icon
//                       className={`h-5 w-5 mr-3 shrink-0 ${
//                         active ? "text-[#8E211B]" : "text-gray-500"
//                       }`}
//                     />
//                     <span className="font-medium truncate">{item.name}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </nav>

//       {/* Spacer */}
//       <div className="flex-grow" />

//       {/* Bottom Section */}
//       <div className="p-4 mb-6 space-y-1">
//         <div className="border-t border-gray-100 pt-4 mb-4">
//           {bottomItems.map((item) => (
//             <button
//               key={item.name}
//               onClick={() => navigate(item.path)}
//               title={item.name}
//               className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm whitespace-nowrap"
//             >
//               <item.icon className="h-5 w-5 mr-4 shrink-0 text-[#8E211B]" />
//               <span className="font-medium truncate">{item.name}</span>
//             </button>
//           ))}

//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm whitespace-nowrap"
//           >
//             <ArrowRightOnRectangleIcon className="h-5 w-5 mr-4 shrink-0 text-[#8E211B]" />
//             <span className="font-medium truncate">Logout</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

// Sidebar.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NSDLLogo from "../assets/nsdl-logo.png";
import {
  CheckBadgeIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ServerIcon,
  DocumentDuplicateIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isApiMigrationSubItemActive =
    location.pathname.startsWith("/api-migration");
  const [isApiMigrationOpen, setIsApiMigrationOpen] = useState(
    isApiMigrationSubItemActive
  );

  const menuItems = [
    { name: "Org Approval", path: "/dp-approval", icon: CheckBadgeIcon },
    { name: "Analytics", path: "/analytics", icon: ChartBarIcon },
  ];

  const bottomItems = [
    { name: "Settings", path: "/settings", icon: Cog6ToothIcon },
    { name: "Help & Support", path: "/help", icon: QuestionMarkCircleIcon },
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

  const isActive = (path: string) => location.pathname === path;
  const isAnyMainMenuActive = menuItems.some((item) => isActive(item.path));
  const shouldHighlightApiMigration =
    isApiMigrationSubItemActive || (isApiMigrationOpen && !isAnyMainMenuActive);

  const toggleApiMigration = () => setIsApiMigrationOpen(!isApiMigrationOpen);

  const handleMainMenuNavigation = (path: string) => {
    if (isApiMigrationOpen && !path.startsWith("/api-migration")) {
      setIsApiMigrationOpen(false);
    }
    navigate(path);
  };

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
      <div
        style={{ padding: "28px 20px 20px", borderBottom: "1px solid #F3F4F6" }}
      >
        <img
          src={NSDLLogo}
          alt="NSDL"
          style={{ height: "36px", width: "auto", objectFit: "contain" }}
        />
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
        {menuItems.map((item) => {
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
                if (!active)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#FFF8EE";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
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

        {/* API Migration */}
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
              if (!shouldHighlightApiMigration)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#FFF8EE";
            }}
            onMouseLeave={(e) => {
              if (!shouldHighlightApiMigration)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                      if (!active)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "#FFF8EE";
                    }}
                    onMouseLeave={(e) => {
                      if (!active)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
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
      </nav>

      {/* Bottom */}
      <div style={{ padding: "10px", borderTop: "1px solid #F3F4F6" }}>
        {[...bottomItems].map((item) => (
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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#FFF8EE";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
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
          onClick={() => logout()}
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
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#FFF8EE";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <ArrowRightOnRectangleIcon
            style={{
              width: "18px",
              height: "18px",
              flexShrink: 0,
              color: "#000000",
            }}
          />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
