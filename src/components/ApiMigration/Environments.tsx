// import React, { useState, useEffect } from "react";

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

// // Environment Interfaces
// interface Environment {
//   id: string;
//   name: string;
//   admin_url: string;
//   workspace: string;
//   created_at: string;
//   updated_at: string;
// }

// interface EnvironmentResponse {
//   success: boolean;
//   message: string;
//   data: Environment | Environment[];
// }

// const Environments: React.FC = () => {
//   // Environment States
//   const [environments, setEnvironments] = useState<Environment[]>([]);
//   const [isLoadingEnvironments, setIsLoadingEnvironments] = useState(false);
//   const [environmentError, setEnvironmentError] = useState<string | null>(null);
//   const [environmentSuccess, setEnvironmentSuccess] = useState<string | null>(
//     null
//   );

//   // Environment Form State
//   const [environmentForm, setEnvironmentForm] = useState({
//     name: "",
//     admin_url: "",
//     workspace: "default",
//   });
//   const [isSubmittingEnvironment, setIsSubmittingEnvironment] = useState(false);
//   const [editingEnvironment, setEditingEnvironment] =
//     useState<Environment | null>(null);

//   // Tab State
//   const [activeTab, setActiveTab] = useState<"add" | "list">("add");

//   // Fetch all environments
//   const fetchEnvironments = async () => {
//     setIsLoadingEnvironments(true);
//     setEnvironmentError(null);

//     try {
//       const response = await fetch(`${API_BASE_URL}/v1/api/environments`);
//       if (!response.ok)
//         throw new Error(`HTTP error! status: ${response.status}`);

//       const data: EnvironmentResponse = await response.json();
//       if (data.success) {
//         setEnvironments(Array.isArray(data.data) ? data.data : [data.data]);
//       } else {
//         throw new Error(data.message || "Failed to fetch environments");
//       }
//     } catch (err) {
//       setEnvironmentError(
//         err instanceof Error ? err.message : "An unexpected error occurred"
//       );
//     } finally {
//       setIsLoadingEnvironments(false);
//     }
//   };

//   // Environment Form Handlers
//   const handleEnvironmentSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmittingEnvironment(true);
//     setEnvironmentError(null);
//     setEnvironmentSuccess(null);

//     try {
//       const url = editingEnvironment
//         ? `${API_BASE_URL}/v1/api/environments/${editingEnvironment.id}`
//         : `${API_BASE_URL}/v1/api/environments`;
//       const method = editingEnvironment ? "PUT" : "POST";

//       const response = await fetch(url, {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(environmentForm),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data: EnvironmentResponse = await response.json();

//       if (data.success) {
//         setEnvironmentSuccess(
//           editingEnvironment
//             ? "Environment updated successfully!"
//             : "Environment created successfully!"
//         );
//         setEnvironmentForm({ name: "", admin_url: "", workspace: "default" });
//         setEditingEnvironment(null);
//         await fetchEnvironments();

//         // Switch to list tab after successful creation/update
//         setActiveTab("list");
//       } else {
//         throw new Error(data.message || "Environment operation failed");
//       }
//     } catch (err) {
//       setEnvironmentError(
//         err instanceof Error ? err.message : "An unexpected error occurred"
//       );
//     } finally {
//       setIsSubmittingEnvironment(false);
//     }
//   };

//   // Delete Environment
//   const handleDeleteEnvironment = async (id: string) => {
//     if (!confirm("Are you sure you want to delete this environment?")) {
//       return;
//     }

//     setEnvironmentError(null);
//     setEnvironmentSuccess(null);

//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/v1/api/environments/${id}`,
//         {
//           method: "DELETE",
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data: EnvironmentResponse = await response.json();

//       if (data.success) {
//         setEnvironmentSuccess("Environment deleted successfully!");
//         await fetchEnvironments();
//       } else {
//         throw new Error(data.message || "Failed to delete environment");
//       }
//     } catch (err) {
//       setEnvironmentError(
//         err instanceof Error ? err.message : "An unexpected error occurred"
//       );
//     }
//   };

//   // Edit Environment
//   const handleEditEnvironment = (environment: Environment) => {
//     setEditingEnvironment(environment);
//     setEnvironmentForm({
//       name: environment.name,
//       admin_url: environment.admin_url,
//       workspace: environment.workspace,
//     });
//     setActiveTab("add");
//   };

//   // Cancel Edit
//   const handleCancelEdit = () => {
//     setEditingEnvironment(null);
//     setEnvironmentForm({ name: "", admin_url: "", workspace: "default" });
//   };

//   // Helper functions
//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   useEffect(() => {
//     fetchEnvironments();
//   }, []);

//   // Render Add/Edit Environment Tab
//   const renderAddEditTab = () => (
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//       {/* Add/Edit Form */}
//       <div className="nsdl-card p-6">
//         <h3 className="nsdl-heading-3 text-gray-900 mb-6">
//           {editingEnvironment ? "Edit Environment" : "Add New Environment"}
//         </h3>

//         <form onSubmit={handleEnvironmentSubmit} className="space-y-4">
//           <div>
//             <label htmlFor="name" className="nsdl-label">
//               Environment Name *
//             </label>
//             <input
//               type="text"
//               id="name"
//               required
//               className="nsdl-input w-full"
//               value={environmentForm.name}
//               onChange={(e) =>
//                 setEnvironmentForm({
//                   ...environmentForm,
//                   name: e.target.value,
//                 })
//               }
//               placeholder="e.g., Development, Production, UAT"
//             />
//           </div>

//           <div>
//             <label htmlFor="admin_url" className="nsdl-label">
//               Admin URL *
//             </label>
//             <input
//               type="url"
//               id="admin_url"
//               required
//               className="nsdl-input w-full"
//               value={environmentForm.admin_url}
//               onChange={(e) =>
//                 setEnvironmentForm({
//                   ...environmentForm,
//                   admin_url: e.target.value,
//                 })
//               }
//               placeholder="e.g., http://kong-dev:8001"
//             />
//           </div>

//           <div>
//             <label htmlFor="workspace" className="nsdl-label">
//               Workspace
//             </label>
//             <input
//               type="text"
//               id="workspace"
//               className="nsdl-input w-full"
//               value={environmentForm.workspace}
//               onChange={(e) =>
//                 setEnvironmentForm({
//                   ...environmentForm,
//                   workspace: e.target.value,
//                 })
//               }
//               placeholder="e.g., default, production, development"
//             />
//           </div>

//           <div className="flex space-x-3 pt-4">
//             <button
//               type="submit"
//               disabled={isSubmittingEnvironment}
//               className="nsdl-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isSubmittingEnvironment ? (
//                 <span className="flex items-center">
//                   <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                   {editingEnvironment ? "Updating..." : "Creating..."}
//                 </span>
//               ) : editingEnvironment ? (
//                 "Update Environment"
//               ) : (
//                 "Create Environment"
//               )}
//             </button>

//             {editingEnvironment && (
//               <button
//                 type="button"
//                 onClick={handleCancelEdit}
//                 className="nsdl-btn-secondary"
//               >
//                 Cancel
//               </button>
//             )}
//           </div>
//         </form>
//       </div>

//       {/* Guide Panel */}
//       <div className="nsdl-card p-6">
//         <h3 className="nsdl-heading-3 text-gray-900 mb-4">
//           Environment Configuration Guide
//         </h3>
//         <div className="space-y-6">
//           <div className="flex items-start space-x-3">
//             <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
//               1
//             </div>
//             <div>
//               <div className="font-medium text-gray-900">
//                 Register Environments
//               </div>
//               <div className="text-gray-600 text-sm mt-1">
//                 Add all your Kong gateway environments (Development, Staging,
//                 Production). Each environment should have a unique name and its
//                 Kong Admin API URL.
//               </div>
//             </div>
//           </div>
//           <div className="flex items-start space-x-3">
//             <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">
//               2
//             </div>
//             <div>
//               <div className="font-medium text-gray-900">
//                 Verify Connectivity
//               </div>
//               <div className="text-gray-600 text-sm mt-1">
//                 Ensure Admin URLs are accessible and workspaces are correctly
//                 configured. The system will validate connectivity when you
//                 perform migrations.
//               </div>
//             </div>
//           </div>
//           <div className="flex items-start space-x-3">
//             <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
//               3
//             </div>
//             <div>
//               <div className="font-medium text-gray-900">
//                 Ready for Migration
//               </div>
//               <div className="text-gray-600 text-sm mt-1">
//                 Once environments are set up, you can create migration requests
//                 between them. Migrate APIs, plugins, and configurations from
//                 source to target environments.
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="mt-8 pt-6 border-t border-gray-200">
//           <h4 className="font-medium text-gray-900 mb-3">
//             Tips & Best Practices
//           </h4>
//           <ul className="space-y-2 text-sm text-gray-600">
//             <li className="flex items-start">
//               <svg
//                 className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//               <span>
//                 Use descriptive names like "Production", "Staging-US",
//                 "Development-EU"
//               </span>
//             </li>
//             <li className="flex items-start">
//               <svg
//                 className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//               <span>Include protocol (http:// or https://) in Admin URLs</span>
//             </li>
//             <li className="flex items-start">
//               <svg
//                 className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//               <span>
//                 Default workspace is "default" if not specified in Kong
//               </span>
//             </li>
//             <li className="flex items-start">
//               <svg
//                 className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//               <span>Test connectivity after adding each environment</span>
//             </li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );

//   // Render Environments List Tab
//   const renderListTab = () => (
//     <div className="nsdl-card p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h3 className="nsdl-heading-3 text-gray-900">
//           Registered Environments ({environments.length})
//         </h3>
//         <button
//           onClick={fetchEnvironments}
//           disabled={isLoadingEnvironments}
//           className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center text-sm font-medium"
//         >
//           {isLoadingEnvironments ? (
//             <>
//               <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
//               Refreshing...
//             </>
//           ) : (
//             <>
//               <svg
//                 className="w-4 h-4 mr-2"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
//                 />
//               </svg>
//               Refresh
//             </>
//           )}
//         </button>
//       </div>

//       {isLoadingEnvironments ? (
//         <div className="text-center py-8">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//           <p className="mt-3 text-gray-500 font-medium">
//             Loading environments...
//           </p>
//         </div>
//       ) : environments.length > 0 ? (
//         <div className="space-y-4">
//           {environments.map((env) => (
//             <div
//               key={env.id}
//               className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
//             >
//               <div className="flex justify-between items-start mb-2">
//                 <div>
//                   <h4 className="font-semibold text-gray-900">{env.name}</h4>
//                   <p className="text-sm text-gray-600 mt-1">
//                     Workspace: {env.workspace}
//                   </p>
//                 </div>
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={() => handleEditEnvironment(env)}
//                     className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDeleteEnvironment(env.id)}
//                     className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>

//               <div className="text-xs text-gray-500 mb-2 break-all">
//                 {env.admin_url}
//               </div>

//               <div className="flex justify-between text-xs text-gray-500">
//                 <span>Created: {formatDate(env.created_at)}</span>
//                 <span>Updated: {formatDate(env.updated_at)}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="text-center py-8">
//           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg
//               className="w-8 h-8 text-gray-400"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2H7a2 2 0 012 2h10a2 2 0 012 2v16m-2 0a2 2 0 01-2 2H7a2 2 0 01-2-2m0 0V5a2 2 0 012-2h10a2 2 0 012 2v16M9 7h6m-6 4h6m-6 4h6"
//               />
//             </svg>
//           </div>
//           <h4 className="text-lg font-semibold text-gray-700 mb-2">
//             No Environments
//           </h4>
//           <p className="text-gray-500 max-w-md mx-auto">
//             No Kong environments have been registered yet. Add your first
//             environment to get started with API migrations.
//           </p>
//           <button
//             onClick={() => setActiveTab("add")}
//             className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
//           >
//             Add First Environment
//           </button>
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="p-8">
//       {/* Header */}
//       <div className="mb-8">
//         <h2 className="nsdl-heading-2 text-gray-900 mb-4">
//           Kong Environment Management
//         </h2>
//         <p className="nsdl-body text-gray-600 mb-6">
//           Manage your Kong gateway environments. Add, edit, or remove
//           environment configurations for API migrations.
//         </p>

//         {/* Tabs Navigation */}
//         <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-1 max-w-md">
//           <nav className="flex space-x-1" aria-label="Tabs">
//             <button
//               onClick={() => setActiveTab("add")}
//               className={`${
//                 activeTab === "add"
//                   ? "bg-[#8E211B] text-white border-[#8E211B] shadow-sm"
//                   : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400"
//               } flex-1 py-3 px-4 text-center text-sm font-medium rounded-lg border transition-all duration-200`}
//             >
//               <div className="flex items-center justify-center space-x-2">
//                 <svg
//                   className="w-4 h-4"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                   />
//                 </svg>
//                 <span>
//                   {editingEnvironment ? "Edit Environment" : "Add Environment"}
//                 </span>
//               </div>
//             </button>
//             <button
//               onClick={() => setActiveTab("list")}
//               className={`${
//                 activeTab === "list"
//                   ? "bg-[#8E211B] text-white border-[#8E211B] shadow-sm"
//                   : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400"
//               } flex-1 py-3 px-4 text-center text-sm font-medium rounded-lg border transition-all duration-200`}
//             >
//               <div className="flex items-center justify-center space-x-2">
//                 <svg
//                   className="w-4 h-4"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                   />
//                 </svg>
//                 <span>View Environments ({environments.length})</span>
//               </div>
//             </button>
//           </nav>
//         </div>
//       </div>

//       {/* Success/Error Messages */}
//       {environmentError && (
//         <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
//           <div className="flex-shrink-0">
//             <svg
//               className="h-5 w-5 text-red-400"
//               viewBox="0 0 20 20"
//               fill="currentColor"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                 clipRule="evenodd"
//               />
//             </svg>
//           </div>
//           <div className="ml-3">
//             <strong className="font-medium">Error</strong>
//             <div className="mt-1 text-sm">{environmentError}</div>
//           </div>
//         </div>
//       )}

//       {environmentSuccess && (
//         <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-start">
//           <div className="flex-shrink-0">
//             <svg
//               className="h-5 w-5 text-emerald-400"
//               viewBox="0 0 20 20"
//               fill="currentColor"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                 clipRule="evenodd"
//               />
//             </svg>
//           </div>
//           <div className="ml-3">
//             <strong className="font-medium">Success</strong>
//             <div className="mt-1 text-sm">{environmentSuccess}</div>
//           </div>
//         </div>
//       )}

//       {/* Tab Content */}
//       {activeTab === "add" ? renderAddEditTab() : renderListTab()}
//     </div>
//   );
// };

// export default Environments;

// components/Analytics.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { NSDLButton } from "./NSDLComponents";

const Environments: React.FC = () => {
  const navigate = useNavigate();

  const publicDashboardUrl = import.meta.env.VITE_GRAFANA_PUBLIC_DASHBOARD_URL;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        Coming Soon...
        {/* <div className="flex items-center mb-4">
          <NSDLButton
            variant="secondary"
            onClick={() => navigate("/")}
            className="mr-4"
          >
            ← Back
          </NSDLButton>
          <h1 className="nsdl-heading-1 text-[#383838]">Analytics</h1>
        </div> */}
        {/* Grafana Frame Only */}
        {/* <div className="bg-white rounded-lg shadow-lg">
          <iframe
            src={publicDashboardUrl}
            width="100%"
            height="800"
            frameBorder="0"
            title="Grafana Analytics Dashboard"
          />
        </div> */}
      </div>
    </div>
  );
};

export default Environments;
