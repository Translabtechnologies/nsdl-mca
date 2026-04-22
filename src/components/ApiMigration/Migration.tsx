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

// // Migration Interfaces
// interface MigrationRequest {
//   id: string;
//   status:
//     | "pending_approval"
//     | "APPROVED_PREP"
//     | "PREP_COMPLETED"
//     | "APPROVED_SYNC"
//     | "SYNC_COMPLETED"
//     | "rejected"
//     | "failed";
//   source_env_id: string;
//   target_env_id: string;
//   source_env_name: string;
//   target_env_name: string;
//   source_admin_url: string;
//   target_admin_url: string;
//   source_workspace: string;
//   target_workspace: string;
//   created_by: string;
//   created_at: string;
//   updated_at: string;
//   env1_config_path?: string;
//   env2_config_path?: string;
//   gitlab_env1_commit?: string;
//   gitlab_env2_commit?: string;
//   approved_by?: string;
//   rejected_by?: string;
//   rejection_reason?: string;
//   branch?: string;
//   sync_logs?: string;
//   diff_logs?: string;
// }

// interface MigrationResponse {
//   success: boolean;
//   message: string;
//   data: MigrationRequest | MigrationRequest[];
// }

// const Migration: React.FC = () => {
//   // Tab State
//   const [activeTab, setActiveTab] = useState<"create" | "requests">("create");

//   // Environment States
//   const [environments, setEnvironments] = useState<Environment[]>([]);

//   // Migration States
//   const [migrationRequests, setMigrationRequests] = useState<
//     MigrationRequest[]
//   >([]);
//   const [isLoadingMigration, setIsLoadingMigration] = useState(false);
//   const [migrationError, setMigrationError] = useState<string | null>(null);
//   const [migrationSuccess, setMigrationSuccess] = useState<string | null>(null);

//   // Migration Form State
//   const [migrationForm, setMigrationForm] = useState({
//     sourceEnvId: "",
//     targetEnvId: "",
//     createdBy: "maker@example.com",
//   });

//   // New: Migration Action States
//   const [selectedMigration, setSelectedMigration] =
//     useState<MigrationRequest | null>(null);
//   const [rejectionReason, setRejectionReason] = useState("");
//   const [isActionLoading, setIsActionLoading] = useState(false);

//   // Fetch all environments
//   const fetchEnvironments = async () => {
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
//       console.error("Error fetching environments:", err);
//     }
//   };

//   // Fetch migration requests
//   const fetchMigrationRequests = async () => {
//     setIsLoadingMigration(true);
//     setMigrationError(null);

//     try {
//       const response = await fetch(`${API_BASE_URL}/v1/api/migration`);
//       const data: MigrationResponse = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           data.message || `HTTP error! status: ${response.status}`
//         );
//       }

//       if (data.success) {
//         setMigrationRequests(
//           Array.isArray(data.data) ? data.data : [data.data]
//         );
//       } else {
//         throw new Error(data.message || "Failed to fetch migration requests");
//       }
//     } catch (err) {
//       setMigrationError(
//         err instanceof Error ? err.message : "An unexpected error occurred"
//       );
//     } finally {
//       setIsLoadingMigration(false);
//     }
//   };

//   // Create Migration Request
//   const handleCreateMigration = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setMigrationError(null);
//     setMigrationSuccess(null);

//     if (migrationForm.sourceEnvId === migrationForm.targetEnvId) {
//       setMigrationError("Source and target environments cannot be the same.");
//       return;
//     }

//     try {
//       const response = await fetch(`${API_BASE_URL}/v1/api/migration`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(migrationForm),
//       });

//       const data: MigrationResponse = await response.json();

//       if (!response.ok) {
//         // Use the backend error message if available
//         throw new Error(
//           data.message || `HTTP error! status: ${response.status}`
//         );
//       }

//       if (data.success) {
//         setMigrationSuccess(
//           "Migration request created successfully! Awaiting approval."
//         );
//         setMigrationForm({
//           ...migrationForm,
//           sourceEnvId: "",
//           targetEnvId: "",
//         });
//         await fetchMigrationRequests();

//         // Switch to requests tab after successful creation
//         setActiveTab("requests");
//       } else {
//         // Handle case where success is false but status code might still be 200
//         throw new Error(data.message || "Failed to create migration request");
//       }
//     } catch (err) {
//       setMigrationError(
//         err instanceof Error ? err.message : "An unexpected error occurred"
//       );
//     }
//   };

//   // NEW: Handle Migration Action (Approve Prep/Reject/Approve Sync)
//   const handleMigrationAction = async (
//     action: "APPROVED_PREP" | "APPROVED_SYNC" | "REJECTED"
//   ) => {
//     if (!selectedMigration) return;

//     // For rejection, require reason
//     if (action === "REJECTED" && !rejectionReason.trim()) {
//       setMigrationError("Rejection reason is required");
//       return;
//     }

//     setIsActionLoading(true);
//     setMigrationError(null);
//     setMigrationSuccess(null);

//     try {
//       const payload: any = { status: action };
//       if (action === "REJECTED") {
//         payload.rejectionReason = rejectionReason;
//       }

//       const response = await fetch(
//         `${API_BASE_URL}/v1/api/migration/status/${selectedMigration.id}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           data.message || `HTTP error! status: ${response.status}`
//         );
//       }

//       if (data.success) {
//         setMigrationSuccess(
//           action === "REJECTED"
//             ? "Migration rejected successfully!"
//             : action === "APPROVED_PREP"
//             ? "Migration approved for preparation! Jenkins job triggered."
//             : "Migration approved for sync! Jenkins job triggered."
//         );

//         setSelectedMigration(null);
//         setRejectionReason("");
//         await fetchMigrationRequests();

//         // Auto-refresh after 3 seconds to check for status updates
//         setTimeout(() => {
//           fetchMigrationRequests();
//         }, 3000);
//       } else {
//         throw new Error(data.message || "Failed to update migration status");
//       }
//     } catch (err) {
//       setMigrationError(
//         err instanceof Error ? err.message : "An unexpected error occurred"
//       );
//     } finally {
//       setIsActionLoading(false);
//     }
//   };

//   // NEW: Handle Migration Sync (Run Kong Sync - for approved migrations)
//   const handleRunKongSync = async (migrationId: string, approvedBy: string) => {
//     setIsActionLoading(true);
//     setMigrationError(null);
//     setMigrationSuccess(null);

//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/v1/api/migration/approve/${migrationId}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ approvedBy }),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           data.message || `HTTP error! status: ${response.status}`
//         );
//       }

//       if (data.success) {
//         setMigrationSuccess("Kong sync completed successfully!");
//         await fetchMigrationRequests();
//       } else {
//         throw new Error(data.message || "Failed to run Kong sync");
//       }
//     } catch (err) {
//       setMigrationError(
//         err instanceof Error ? err.message : "An unexpected error occurred"
//       );
//     } finally {
//       setIsActionLoading(false);
//     }
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

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "pending_approval":
//         return "bg-yellow-100 text-yellow-800";
//       case "APPROVED_PREP":
//         return "bg-blue-100 text-blue-800";
//       case "PREP_COMPLETED":
//         return "bg-purple-100 text-purple-800";
//       case "APPROVED_SYNC":
//         return "bg-indigo-100 text-indigo-800";
//       case "SYNC_COMPLETED":
//         return "bg-green-100 text-green-800";
//       case "rejected":
//         return "bg-red-100 text-red-800";
//       case "failed":
//         return "bg-gray-100 text-gray-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getStatusText = (status: string) => {
//     const statusMap: Record<string, string> = {
//       pending_approval: "Pending Approval",
//       APPROVED_PREP: "Prep Approved",
//       PREP_COMPLETED: "Prep Completed",
//       APPROVED_SYNC: "Sync Approved",
//       SYNC_COMPLETED: "Sync Completed",
//       rejected: "Rejected",
//       failed: "Failed",
//     };
//     return statusMap[status] || status;
//   };

//   useEffect(() => {
//     fetchEnvironments();
//     fetchMigrationRequests();
//   }, []);

//   // Render Create Migration Tab with Process Guide
//   const renderCreateTab = () => (
//     <>
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Create Migration Form */}
//         <div className="nsdl-card p-6 lg:col-span-2">
//           <h3 className="nsdl-heading-3 text-gray-900 mb-6">
//             Create Migration Request
//           </h3>

//           <form onSubmit={handleCreateMigration} className="space-y-4">
//             <div>
//               <label htmlFor="sourceEnv" className="nsdl-label">
//                 Source Environment *
//               </label>
//               <select
//                 id="sourceEnv"
//                 required
//                 className="nsdl-input w-full"
//                 value={migrationForm.sourceEnvId}
//                 onChange={(e) =>
//                   setMigrationForm({
//                     ...migrationForm,
//                     sourceEnvId: e.target.value,
//                   })
//                 }
//               >
//                 <option value="">Select source environment</option>
//                 {environments.map((env) => (
//                   <option key={env.id} value={env.id}>
//                     {env.name} ({env.workspace})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label htmlFor="targetEnv" className="nsdl-label">
//                 Target Environment *
//               </label>
//               <select
//                 id="targetEnv"
//                 required
//                 className="nsdl-input w-full"
//                 value={migrationForm.targetEnvId}
//                 onChange={(e) =>
//                   setMigrationForm({
//                     ...migrationForm,
//                     targetEnvId: e.target.value,
//                   })
//                 }
//               >
//                 <option value="">Select target environment</option>
//                 {environments.map((env) => (
//                   <option key={env.id} value={env.id}>
//                     {env.name} ({env.workspace})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label htmlFor="createdBy" className="nsdl-label">
//                 Requested By *
//               </label>
//               <input
//                 type="email"
//                 id="createdBy"
//                 required
//                 className="nsdl-input w-full"
//                 value={migrationForm.createdBy}
//                 onChange={(e) =>
//                   setMigrationForm({
//                     ...migrationForm,
//                     createdBy: e.target.value,
//                   })
//                 }
//                 placeholder="maker@example.com"
//               />
//             </div>

//             <div className="pt-4">
//               <button
//                 type="submit"
//                 className="nsdl-btn-primary w-full"
//                 disabled={
//                   !migrationForm.sourceEnvId || !migrationForm.targetEnvId
//                 }
//               >
//                 Create Migration Request
//               </button>
//             </div>
//           </form>
//         </div>

//         {/* Migration Process Guide - Only in Create tab */}
//         <div className="nsdl-card p-6">
//           <h3 className="nsdl-heading-3 text-gray-900 mb-4">
//             Migration Process Guide
//           </h3>
//           <div className="space-y-6">
//             <div className="flex items-start space-x-3">
//               <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
//                 1
//               </div>
//               <div>
//                 <div className="font-medium text-gray-900">Create Request</div>
//                 <div className="text-gray-600 text-sm mt-1">
//                   Select source and target environments to create a migration
//                   request
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-start space-x-3">
//               <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">
//                 2
//               </div>
//               <div>
//                 <div className="font-medium text-gray-900">Await Approval</div>
//                 <div className="text-gray-600 text-sm mt-1">
//                   Request enters pending approval state for checker review
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-start space-x-3">
//               <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
//                 3
//               </div>
//               <div>
//                 <div className="font-medium text-gray-900">
//                   Configuration Sync
//                 </div>
//                 <div className="text-gray-600 text-sm mt-1">
//                   Kong configuration is synchronized between environments
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-start space-x-3">
//               <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
//                 4
//               </div>
//               <div>
//                 <div className="font-medium text-gray-900">Completion</div>
//                 <div className="text-gray-600 text-sm mt-1">
//                   Migration is completed and configurations are stored in GitLab
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );

//   // Render Migration Requests Tab
//   const renderRequestsTab = () => (
//     <div className="nsdl-card p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h3 className="nsdl-heading-3 text-gray-900">
//           Migration Requests ({migrationRequests.length})
//         </h3>
//         <button
//           onClick={fetchMigrationRequests}
//           disabled={isLoadingMigration}
//           className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center text-sm font-medium"
//         >
//           {isLoadingMigration ? (
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

//       {isLoadingMigration ? (
//         <div className="text-center py-8">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//           <p className="mt-3 text-gray-500 font-medium">
//             Loading migration requests...
//           </p>
//         </div>
//       ) : migrationRequests.length > 0 ? (
//         <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 -mr-2">
//           {migrationRequests.map((request) => (
//             <div
//               key={request.id}
//               className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
//             >
//               <div className="flex justify-between items-start mb-2">
//                 <div>
//                   <h4 className="font-semibold text-gray-900">
//                     {request.source_env_name} → {request.target_env_name}
//                   </h4>
//                   <p className="text-sm text-gray-600 mt-1">ID: {request.id}</p>
//                 </div>
//                 <span
//                   className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
//                     request.status
//                   )}`}
//                 >
//                   {getStatusText(request.status)}
//                 </span>
//               </div>

//               <div className="text-sm text-gray-600 mb-2">
//                 <div className="grid grid-cols-2 gap-2">
//                   <div>
//                     <strong>Source:</strong> {request.source_env_name} (
//                     {request.source_workspace})
//                   </div>
//                   <div>
//                     <strong>Target:</strong> {request.target_env_name} (
//                     {request.target_workspace})
//                   </div>
//                 </div>
//               </div>

//               <div className="text-xs text-gray-500 mb-2">
//                 <div>Created by: {request.created_by}</div>
//                 {request.approved_by && (
//                   <div>Approved by: {request.approved_by}</div>
//                 )}
//                 {request.rejected_by && (
//                   <div>
//                     Rejected by: {request.rejected_by} -{" "}
//                     {request.rejection_reason}
//                   </div>
//                 )}
//               </div>

//               {/* Action buttons based on status */}
//               <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
//                 <div className="text-xs text-gray-500">
//                   {request.updated_at !== request.created_at && (
//                     <span>Updated: {formatDate(request.updated_at)}</span>
//                   )}
//                 </div>

//                 <div className="flex space-x-2">
//                   {/* Show action button based on status */}
//                   {(request.status === "pending_approval" ||
//                     request.status === "PREP_COMPLETED" ||
//                     request.status === "APPROVED_SYNC") && (
//                     <button
//                       onClick={() => setSelectedMigration(request)}
//                       className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
//                     >
//                       {request.status === "pending_approval"
//                         ? "Review"
//                         : request.status === "PREP_COMPLETED"
//                         ? "Approve Sync"
//                         : request.status === "APPROVED_SYNC"
//                         ? "Run Sync"
//                         : "View"}
//                     </button>
//                   )}

//                   {/* View Logs button for completed/failed migrations */}
//                   {(request.status === "SYNC_COMPLETED" ||
//                     request.status === "failed" ||
//                     request.sync_logs) && (
//                     <button
//                       onClick={() => {
//                         console.log("View logs for:", request.id);
//                       }}
//                       className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
//                     >
//                       View Logs
//                     </button>
//                   )}
//                 </div>
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
//                 d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
//               />
//             </svg>
//           </div>
//           <h4 className="text-lg font-semibold text-gray-700 mb-2">
//             No Migration Requests
//           </h4>
//           <p className="text-gray-500 max-w-md mx-auto">
//             No migration requests have been created yet. Create your first
//             migration request to get started.
//           </p>
//           <button
//             onClick={() => setActiveTab("create")}
//             className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
//           >
//             Create First Migration Request
//           </button>
//         </div>
//       )}
//     </div>
//   );

//   // Migration Action Modal
//   const MigrationActionModal = () => (
//     <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
//         <div className="p-4 border-b flex justify-between items-center">
//           <h2 className="text-xl font-semibold text-gray-800">
//             {selectedMigration?.status === "pending_approval"
//               ? "Review Migration"
//               : selectedMigration?.status === "PREP_COMPLETED"
//               ? "Approve Sync"
//               : "Migration Actions"}
//           </h2>
//           <button
//             onClick={() => {
//               setSelectedMigration(null);
//               setRejectionReason("");
//             }}
//             className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
//           >
//             ×
//           </button>
//         </div>

//         <div className="p-6 space-y-4">
//           {selectedMigration && (
//             <>
//               <div className="bg-gray-50 p-4 rounded-lg">
//                 <h3 className="font-medium text-gray-900 mb-2">
//                   {selectedMigration.source_env_name} →{" "}
//                   {selectedMigration.target_env_name}
//                 </h3>
//                 <p className="text-sm text-gray-600">
//                   ID: {selectedMigration.id} • Created:{" "}
//                   {formatDate(selectedMigration.created_at)}
//                 </p>
//                 <p className="text-sm text-gray-600 mt-1">
//                   Created by: {selectedMigration.created_by}
//                 </p>
//               </div>

//               {selectedMigration.status === "pending_approval" && (
//                 <>
//                   <div>
//                     <label htmlFor="rejectionReason" className="nsdl-label">
//                       Rejection Reason (Required if rejecting)
//                     </label>
//                     <textarea
//                       id="rejectionReason"
//                       rows={3}
//                       className="nsdl-input w-full"
//                       value={rejectionReason}
//                       onChange={(e) => setRejectionReason(e.target.value)}
//                       placeholder="Enter reason for rejection..."
//                     />
//                   </div>

//                   <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
//                     <p className="text-sm text-yellow-700">
//                       <strong>Note:</strong> Approving will trigger Jenkins PREP
//                       job which will:
//                     </p>
//                     <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
//                       <li>Dump source environment configuration</li>
//                       <li>Create GitLab merge request</li>
//                       <li>Update status to PREP_COMPLETED when done</li>
//                     </ul>
//                   </div>
//                 </>
//               )}

//               {selectedMigration.status === "PREP_COMPLETED" && (
//                 <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
//                   <p className="text-sm text-blue-700">
//                     <strong>Note:</strong> Approving sync will trigger Jenkins
//                     SYNC job which will:
//                   </p>
//                   <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
//                     <li>Apply configuration to target environment</li>
//                     <li>Dump target configuration for verification</li>
//                     <li>Commit configurations to GitLab</li>
//                     <li>Update status to SYNC_COMPLETED when done</li>
//                   </ul>
//                 </div>
//               )}

//               {selectedMigration.status === "APPROVED_SYNC" && (
//                 <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
//                   <p className="text-sm text-green-700">
//                     <strong>Ready for Kong Sync:</strong> This migration has
//                     been approved for sync. You can now run the Kong sync to
//                     apply the configuration.
//                   </p>
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         <div className="p-4 border-t flex justify-end space-x-3">
//           {selectedMigration?.status === "pending_approval" && (
//             <>
//               <button
//                 onClick={() => handleMigrationAction("REJECTED")}
//                 disabled={isActionLoading || !rejectionReason.trim()}
//                 className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
//               >
//                 {isActionLoading ? "Processing..." : "Reject"}
//               </button>
//               <button
//                 onClick={() => handleMigrationAction("APPROVED_PREP")}
//                 disabled={isActionLoading}
//                 className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
//               >
//                 {isActionLoading ? "Processing..." : "Approve Prep"}
//               </button>
//             </>
//           )}

//           {selectedMigration?.status === "PREP_COMPLETED" && (
//             <button
//               onClick={() => handleMigrationAction("APPROVED_SYNC")}
//               disabled={isActionLoading}
//               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//             >
//               {isActionLoading ? "Processing..." : "Approve Sync"}
//             </button>
//           )}

//           {selectedMigration?.status === "APPROVED_SYNC" && (
//             <button
//               onClick={() =>
//                 handleRunKongSync(selectedMigration.id, "checker@example.com")
//               }
//               disabled={isActionLoading}
//               className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
//             >
//               {isActionLoading ? "Running..." : "Run Kong Sync"}
//             </button>
//           )}

//           <button
//             onClick={() => {
//               setSelectedMigration(null);
//               setRejectionReason("");
//             }}
//             className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="p-8">
//       {/* Header */}
//       <div className="mb-8">
//         <h2 className="nsdl-heading-2 text-gray-900 mb-4">
//           API Migration Management
//         </h2>
//         <p className="nsdl-body text-gray-600 mb-6">
//           Create and manage migration requests between Kong environments. Track
//           the status of your migration requests.
//         </p>

//         {/* Tabs Navigation */}
//         <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-1 max-w-md">
//           <nav className="flex space-x-1" aria-label="Tabs">
//             <button
//               onClick={() => setActiveTab("create")}
//               className={`${
//                 activeTab === "create"
//                   ? "bg-[#8E211B] text-white border-[#8E211B]"
//                   : "text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-50"
//               } flex-1 py-3 px-4 text-center text-sm font-medium rounded-lg border transition-all duration-200`}
//             >
//               <div className="flex items-center justify-center space-x-2">
//                 {activeTab === "create" ? (
//                   <svg
//                     className="w-4 h-4"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 ) : (
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                     />
//                   </svg>
//                 )}
//                 <span>Create Migration</span>
//               </div>
//             </button>
//             <button
//               onClick={() => setActiveTab("requests")}
//               className={`${
//                 activeTab === "requests"
//                   ? "bg-[#8E211B] text-white border-[#8E211B]"
//                   : "text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-50"
//               } flex-1 py-3 px-4 text-center text-sm font-medium rounded-lg border transition-all duration-200`}
//             >
//               <div className="flex items-center justify-center space-x-2">
//                 {activeTab === "requests" ? (
//                   <svg
//                     className="w-4 h-4"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 ) : (
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                     />
//                   </svg>
//                 )}
//                 <span>Migration Requests ({migrationRequests.length})</span>
//               </div>
//             </button>
//           </nav>
//         </div>
//       </div>

//       {/* Success/Error Messages */}
//       {migrationError && (
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
//             <div className="mt-1 text-sm">{migrationError}</div>
//           </div>
//         </div>
//       )}

//       {migrationSuccess && (
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
//             <div className="mt-1 text-sm">{migrationSuccess}</div>
//           </div>
//         </div>
//       )}

//       {/* Tab Content */}
//       {activeTab === "create" ? renderCreateTab() : renderRequestsTab()}

//       {/* Render modal */}
//       {selectedMigration && <MigrationActionModal />}
//     </div>
//   );
// };

// export default Migration;

import React from "react";
import { useNavigate } from "react-router-dom";
import { NSDLButton } from "./NSDLComponents";

const Migration: React.FC = () => {
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

export default Migration;
