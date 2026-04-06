// import React, { useState, useEffect, useCallback, useRef } from "react";

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

// // --- TYPE DEFINITIONS ---
// interface AuthenticationDetails {
//   username: string;
//   password?: string;
// }

// interface DpDetail {
//   id: string;
//   dp_name: string;
//   email_id: string;
//   ip_address: string;
//   callback_url: string;
//   authentication_details: AuthenticationDetails;
//   rsa_public_key?: string;
//   cert_serial_number?: string;
//   certificate_file?: string;
//   cm_bp_id?: string;
//   segment?: string;
//   exchange_code?: string;
//   business_lead_name?: string;
//   technical_lead_name?: string;
//   rsa_key_status: "approved" | "pending" | "rejected" | "not approved";
//   status: "approved" | "pending" | "rejected";
//   environment: string;
//   requestor_id?: string | null;
//   created_at: string;
//   updated_at: string;
// }

// // --- PAGINATION TYPES ---
// interface PaginationInfo {
//   totalRecords: number;
//   totalPages: number;
//   currentPage: number;
//   limit: number;
// }

// interface PaginatedApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: {
//     data: T[];
//     pagination: PaginationInfo;
//   };
// }

// // --- ERROR HANDLING TYPES ---
// interface AppError {
//   id?: string;
//   type: "network" | "validation" | "api" | "timeout" | "auth" | "unknown";
//   message: string;
//   severity: "low" | "medium" | "high" | "critical";
//   timestamp: string;
//   retryable: boolean;
//   details?: Record<string, unknown>;
//   action?: "retry" | "refresh" | "contact_support" | "none";
// }

// // --- TOAST TYPES ---
// interface ToastProps {
//   id: string;
//   message: string;
//   type: "success" | "error" | "warning" | "info";
//   duration?: number;
//   onClose: (id: string) => void;
// }

// // --- API CONFIGURATION ---
// const BACKEND_API_URL_UAT = `${API_BASE_URL}/v1/api/dp`;
// const BACKEND_API_URL_STAGING = `${API_BASE_URL}/v1/api/dp-staging`;

// // --- DEBOUNCE UTILITY ---
// const debounce = <T extends (...args: any[]) => any>(
//   func: T,
//   wait: number
// ): ((...args: Parameters<T>) => void) => {
//   let timeout: NodeJS.Timeout | null = null;

//   return (...args: Parameters<T>) => {
//     if (timeout) clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// // --- ENHANCED API WRAPPER ---
// const apiCall = async <T,>(
//   url: string,
//   options: RequestInit = {}
// ): Promise<{ data: T; ok: true } | { error: AppError; ok: false }> => {
//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 30000);

//   try {
//     const response = await fetch(url, {
//       ...options,
//       signal: controller.signal,
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//     });

//     clearTimeout(timeoutId);

//     if (!response.ok) {
//       const errorText = await response.text();
//       let parsedError = { message: errorText };

//       try {
//         parsedError = JSON.parse(errorText) as { message: string };
//       } catch {
//         // Keep text as is
//       }

//       return {
//         ok: false,
//         error: {
//           type: "api",
//           message: parsedError.message || `HTTP ${response.status}`,
//           severity: response.status >= 500 ? "high" : "medium",
//           retryable: response.status >= 500,
//           timestamp: new Date().toISOString(),
//           action:
//             response.status === 401
//               ? "auth"
//               : response.status >= 500
//               ? "retry"
//               : "none",
//           details: {
//             statusCode: response.status,
//             endpoint: url,
//             method: options.method || "GET",
//           },
//         },
//       };
//     }

//     const data = (await response.json()) as T;
//     return { ok: true, data };
//   } catch (error) {
//     clearTimeout(timeoutId);

//     let errorType: AppError["type"] = "unknown";
//     let message = "An unexpected error occurred";
//     let retryable = false;

//     if (error instanceof DOMException && error.name === "AbortError") {
//       errorType = "timeout";
//       message = "Request timed out. Please check your connection.";
//       retryable = true;
//     } else if (
//       error instanceof TypeError &&
//       error.message.includes("Failed to fetch")
//     ) {
//       errorType = "network";
//       message = "Network error. Please check your internet connection.";
//       retryable = true;
//     } else if (error instanceof Error) {
//       message = error.message;
//     }

//     return {
//       ok: false,
//       error: {
//         type: errorType,
//         message,
//         severity: "high",
//         retryable,
//         timestamp: new Date().toISOString(),
//         action: retryable ? "retry" : "contact_support",
//         details: { originalError: error },
//       },
//     };
//   }
// };

// // --- HELPER FUNCTIONS ---
// const normalizeStatus = (status: string): string => status.toLowerCase();

// const formatStatus = (status: string): string => {
//   return status.charAt(0).toUpperCase() + status.slice(1);
// };

// interface RawDpData {
//   id?: string;
//   dp_name?: string;
//   ip_address?: string;
//   callback_url?: string;
//   email_id?: string;
//   authentication_details?: AuthenticationDetails;
//   rsa_public_key?: string;
//   cert_serial_number?: string;
//   certificate_file?: string;
//   cm_bp_id?: string;
//   segment?: string;
//   exchange_code?: string;
//   business_lead_name?: string;
//   technical_lead_name?: string;
//   rsa_key_status?: string;
//   status?: string;
//   requestor_id?: string | null;
//   created_at?: string;
//   updated_at?: string;
// }

// const normalizeDpDetails = (
//   rawDetails: unknown,
//   environment: string
// ): DpDetail[] => {
//   if (!Array.isArray(rawDetails)) {
//     console.warn(`Expected array for DP details, got:`, rawDetails);
//     return [];
//   }

//   return rawDetails
//     .filter(
//       (dp: unknown): dp is RawDpData =>
//         dp !== null &&
//         typeof dp === "object" &&
//         "id" in dp &&
//         typeof (dp as RawDpData).id === "string"
//     )
//     .map((dp: RawDpData) => ({
//       id: dp.id || "",
//       dp_name: dp.dp_name || "",
//       ip_address: dp.ip_address || "",
//       callback_url: dp.callback_url || "",
//       email_id: dp.email_id || "",
//       authentication_details: dp.authentication_details || {
//         username: "",
//         password: "",
//       },
//       rsa_public_key: dp.rsa_public_key,
//       cert_serial_number: dp.cert_serial_number,
//       certificate_file: dp.certificate_file,
//       cm_bp_id: dp.cm_bp_id,
//       segment: dp.segment,
//       exchange_code: dp.exchange_code,
//       business_lead_name: dp.business_lead_name,
//       technical_lead_name: dp.technical_lead_name,
//       rsa_key_status: normalizeStatus(
//         dp.rsa_key_status || "pending"
//       ) as DpDetail["rsa_key_status"],
//       status: normalizeStatus(
//         dp.status || dp.rsa_key_status || "pending"
//       ) as DpDetail["status"],
//       environment: environment,
//       requestor_id: dp.requestor_id,
//       created_at: dp.created_at || new Date().toISOString(),
//       updated_at: dp.updated_at || new Date().toISOString(),
//     }));
// };

// // --- API CALLS WITH PAGINATION & SEARCH ---
// interface FetchDpOptions {
//   environment: string;
//   status?: string;
//   page?: number;
//   limit?: number;
//   searchTerm?: string;
// }

// const fetchDpDetailsWithPagination = async (
//   options: FetchDpOptions
// ): Promise<
//   { data: DpDetail[]; pagination: PaginationInfo } | { error: AppError }
// > => {
//   const {
//     environment = "UAT",
//     status,
//     page = 1,
//     limit = 10,
//     searchTerm,
//   } = options;

//   try {
//     const baseUrl =
//       environment.toUpperCase() === "UAT"
//         ? `${API_BASE_URL}/v1/api/dp`
//         : `${API_BASE_URL}/v1/api/dp-staging`;

//     const params = new URLSearchParams();

//     if (status && status !== "all") {
//       params.append("status", status.toUpperCase());
//     }

//     if (searchTerm?.trim()) {
//       params.append("search", searchTerm.trim());
//     }

//     params.append("page", page.toString());
//     params.append("limit", limit.toString());

//     const url = `${baseUrl}?${params.toString()}`;
//     const result = await apiCall<PaginatedApiResponse<unknown>>(url);

//     if (!result.ok) {
//       console.error(`Failed to fetch ${environment} DP details:`, result.error);
//       return { error: result.error };
//     }

//     const responseData = result.data;

//     if (!responseData?.data) {
//       console.error(`Invalid response from ${url}:`, responseData);
//       return {
//         error: {
//           type: "api",
//           message: "Invalid response from server",
//           severity: "medium",
//           retryable: true,
//           timestamp: new Date().toISOString(),
//           action: "retry",
//         },
//       };
//     }

//     const pagination = responseData.data.pagination || {
//       totalRecords: 0,
//       totalPages: 0,
//       currentPage: page,
//       limit: limit,
//     };

//     let rawDetails: unknown = [];

//     if (Array.isArray(responseData.data.data)) {
//       rawDetails = responseData.data.data;
//     } else if (Array.isArray(responseData.data)) {
//       rawDetails = responseData.data;
//     } else {
//       console.warn(`Unexpected data structure from ${url}:`, responseData.data);
//       return {
//         data: [],
//         pagination: {
//           totalRecords: 0,
//           totalPages: 0,
//           currentPage: page,
//           limit: limit,
//         },
//       };
//     }

//     const dpDetails = normalizeDpDetails(rawDetails, environment);

//     return { data: dpDetails, pagination };
//   } catch (error) {
//     console.error("Error fetching DP details with pagination:", error);
//     return {
//       error: {
//         type: "network",
//         message: "Failed to fetch DP details",
//         severity: "high",
//         retryable: true,
//         timestamp: new Date().toISOString(),
//         action: "retry",
//       },
//     };
//   }
// };

// const approveDp = async (
//   dpId: string,
//   environment: string = "UAT"
// ): Promise<{ success: boolean; error?: AppError }> => {
//   const approveUrl = `${API_BASE_URL}/v1/api/dp/approve/${dpId}`;

//   const requestBody = {
//     status: "APPROVED",
//     environment: environment.toUpperCase(),
//   };

//   const result = await apiCall<{
//     success: boolean;
//     message?: string;
//     data?: any;
//   }>(approveUrl, {
//     method: "POST",
//     body: JSON.stringify(requestBody),
//   });

//   if (!result.ok) {
//     return { success: false, error: result.error };
//   }

//   if (!result.data.success) {
//     return {
//       success: false,
//       error: {
//         type: "api",
//         message: result.data.message || "Failed to approve DP",
//         severity: "medium",
//         retryable: true,
//         timestamp: new Date().toISOString(),
//         action: "retry",
//       },
//     };
//   }

//   return { success: true };
// };

// const rejectDp = async (
//   dpId: string,
//   environment: string = "UAT"
// ): Promise<{ success: boolean; error?: AppError }> => {
//   const rejectUrl = `${API_BASE_URL}/v1/api/dp/approve/${dpId}`;

//   const requestBody = {
//     status: "REJECTED",
//     environment: environment.toUpperCase(),
//   };

//   const result = await apiCall<{
//     success: boolean;
//     message?: string;
//     data?: any;
//   }>(rejectUrl, {
//     method: "POST",
//     body: JSON.stringify(requestBody),
//   });

//   if (!result.ok) {
//     return { success: false, error: result.error };
//   }

//   if (!result.data.success) {
//     return {
//       success: false,
//       error: {
//         type: "api",
//         message: result.data.message || "Failed to reject DP",
//         severity: "medium",
//         retryable: true,
//         timestamp: new Date().toISOString(),
//         action: "retry",
//       },
//     };
//   }

//   return { success: true };
// };

// // --- ICON COMPONENTS ---
// const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M5 13l4 4L19 7"
//     />
//   </svg>
// );

// const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M6 18L18 6M6 6l12 12"
//     />
//   </svg>
// );

// const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//     />
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//     />
//   </svg>
// );

// const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
//     />
//   </svg>
// );

// const RefreshIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
//     />
//   </svg>
// );

// const ServerIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
//     />
//   </svg>
// );

// const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//     />
//   </svg>
// );

// const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//     />
//   </svg>
// );

// const FilterIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
//     />
//   </svg>
// );

// const CertificateIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// );

// const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//     />
//   </svg>
// );

// const BusinessIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
//     />
//   </svg>
// );

// const ExchangeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
//     />
//   </svg>
// );

// const PeopleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 6.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
//     />
//   </svg>
// );

// const SegmentIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
//     />
//   </svg>
// );

// const AlertTriangleIcon = ({
//   className = "w-5 h-5",
// }: {
//   className?: string;
// }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.347 16.5c-.77.833.192 2.5 1.732 2.5z"
//     />
//   </svg>
// );

// const InfoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// );

// const ChevronLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M15 19l-7-7 7-7"
//     />
//   </svg>
// );

// const ChevronRightIcon = ({
//   className = "w-5 h-5",
// }: {
//   className?: string;
// }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 5l7 7-7 7"
//     />
//   </svg>
// );

// const ChevronDoubleLeftIcon = ({
//   className = "w-5 h-5",
// }: {
//   className?: string;
// }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
//     />
//   </svg>
// );

// const ChevronDoubleRightIcon = ({
//   className = "w-5 h-5",
// }: {
//   className?: string;
// }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M13 5l7 7-7 7M5 5l7 7-7 7"
//     />
//   </svg>
// );

// // --- TOAST COMPONENT ---
// const Toast: React.FC<ToastProps> = ({
//   id,
//   message,
//   type,
//   duration = 5000,
//   onClose,
// }) => {
//   useEffect(() => {
//     const timer = setTimeout(() => onClose(id), duration);
//     return () => clearTimeout(timer);
//   }, [id, duration, onClose]);

//   const typeClasses = {
//     success: "bg-emerald-100 border-emerald-300 text-emerald-700",
//     error: "bg-red-100 border-red-300 text-red-700",
//     warning: "bg-amber-100 border-amber-300 text-amber-700",
//     info: "bg-blue-100 border-blue-300 text-blue-700",
//   };

//   const icons = {
//     success: <CheckIcon className="w-4 h-4" />,
//     error: <XIcon className="w-4 h-4" />,
//     warning: <AlertTriangleIcon className="w-4 h-4" />,
//     info: <InfoIcon className="w-4 h-4" />,
//   };

//   return (
//     <div
//       className={`fixed top-4 right-4 z-50 border rounded-lg p-4 shadow-lg ${typeClasses[type]} animate-slide-in`}
//     >
//       <div className="flex items-center">
//         {icons[type]}
//         <span className="ml-2 text-sm font-medium">{message}</span>
//         <button
//           onClick={() => onClose(id)}
//           className="ml-4 text-gray-400 hover:text-gray-600"
//         >
//           <XIcon className="w-3 h-3" />
//         </button>
//       </div>
//     </div>
//   );
// };

// // --- TOAST CONTAINER ---
// const ToastContainer: React.FC<{
//   toasts: ToastProps[];
//   onClose: (id: string) => void;
// }> = ({ toasts, onClose }) => (
//   <div className="fixed top-4 right-4 z-50 space-y-2">
//     {toasts.map((toast) => (
//       <Toast key={toast.id} {...toast} onClose={onClose} />
//     ))}
//   </div>
// );

// // --- ERROR DISPLAY COMPONENT ---
// interface ErrorDisplayProps {
//   error: AppError;
//   onAction?: (action: AppError["action"]) => void;
//   onDismiss?: () => void;
// }

// const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
//   error,
//   onAction,
//   onDismiss,
// }) => {
//   const getErrorIcon = () => {
//     switch (error.type) {
//       case "network":
//         return <ServerIcon className="w-5 h-5" />;
//       case "timeout":
//         return <RefreshIcon className="w-5 h-5" />;
//       case "auth":
//         return <ShieldIcon className="w-5 h-5" />;
//       default:
//         return <XIcon className="w-5 h-5" />;
//     }
//   };

//   const getActionButton = () => {
//     if (!error.action || error.action === "none") return null;

//     const actionConfig = {
//       retry: {
//         text: "Retry",
//         className: "bg-blue-600 text-white hover:bg-blue-700",
//       },
//       refresh: {
//         text: "Refresh Page",
//         className: "bg-gray-600 text-white hover:bg-gray-700",
//       },
//       contact_support: {
//         text: "Contact Support",
//         className: "bg-amber-600 text-white hover:bg-amber-700",
//       },
//     };

//     const config = actionConfig[error.action];
//     if (!config) return null;

//     return (
//       <button
//         onClick={() => onAction?.(error.action)}
//         className={`px-4 py-2 rounded-lg text-sm font-medium ${config.className} ml-2 transition-colors`}
//       >
//         {config.text}
//       </button>
//     );
//   };

//   const getSeverityColor = () => {
//     switch (error.severity) {
//       case "critical":
//         return "bg-red-50 border-red-200";
//       case "high":
//         return "bg-amber-50 border-amber-200";
//       case "medium":
//         return "bg-yellow-50 border-yellow-200";
//       default:
//         return "bg-gray-50 border-gray-200";
//     }
//   };

//   return (
//     <div className={`p-4 rounded-lg border ${getSeverityColor()}`}>
//       <div className="flex items-start">
//         <div className="p-2 rounded-full bg-white border">{getErrorIcon()}</div>
//         <div className="ml-3 flex-1">
//           <p className="font-medium text-gray-900">{error.message}</p>
//         </div>
//         <div className="flex items-center">
//           {getActionButton()}
//           {onDismiss && (
//             <button
//               onClick={onDismiss}
//               className="ml-2 text-gray-400 hover:text-gray-600 p-1"
//               aria-label="Dismiss error"
//             >
//               <XIcon className="w-4 h-4" />
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- ERROR BOUNDARY ---
// class DpApprovalErrorBoundary extends React.Component<
//   { children: React.ReactNode },
//   { hasError: boolean; error: Error | null }
// > {
//   constructor(props: { children: React.ReactNode }) {
//     super(props);
//     this.state = { hasError: false, error: null };
//   }

//   static getDerivedStateFromError(error: Error) {
//     return { hasError: true, error };
//   }

//   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
//     console.error("DP Approval Error:", error, errorInfo);
//   }

//   handleRetry = () => {
//     this.setState({ hasError: false, error: null });
//     window.location.reload();
//   };

//   handleContactSupport = () => {
//     const subject = encodeURIComponent("DP Approval Screen Error");
//     const body = encodeURIComponent(
//       `Error: ${this.state.error?.message}\n\nUser Agent: ${navigator.userAgent}`
//     );
//     window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
//   };

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//           <div className="nsdl-card p-8 max-w-md text-center">
//             <ShieldIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
//             <h3 className="nsdl-heading-3 text-gray-900 mb-2">
//               Something went wrong
//             </h3>
//             <p className="text-gray-600 mb-6">
//               We encountered an error while loading the DP approval screen.
//             </p>
//             <div className="space-y-3">
//               <button
//                 onClick={this.handleRetry}
//                 className="px-6 py-2.5 nsdl-btn-primary rounded-lg w-full"
//               >
//                 Reload Page
//               </button>
//               <button
//                 onClick={this.handleContactSupport}
//                 className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg w-full hover:bg-gray-300 transition-colors"
//               >
//                 Contact Support
//               </button>
//             </div>
//             <p className="text-xs text-gray-400 mt-4">
//               Error: {this.state.error?.message}
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return this.props.children;
//   }
// }

// // --- LOADING SKELETONS ---
// const StatsSkeleton: React.FC = () => (
//   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//     {Array.from({ length: 4 }).map((_, i) => (
//       <div key={i} className="nsdl-card p-6 animate-pulse">
//         <div className="flex items-center">
//           <div className="p-3 bg-gray-200 rounded-lg"></div>
//           <div className="ml-4">
//             <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
//             <div className="h-6 bg-gray-200 rounded w-8"></div>
//           </div>
//         </div>
//       </div>
//     ))}
//   </div>
// );

// const DpListSkeleton: React.FC = () => (
//   <div className="space-y-2">
//     {Array.from({ length: 5 }).map((_, i) => (
//       <div key={i} className="nsdl-card p-6 animate-pulse">
//         <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
//           <div className="h-4 bg-gray-200 rounded"></div>
//           <div className="h-4 bg-gray-200 rounded"></div>
//           <div className="h-4 bg-gray-200 rounded"></div>
//           <div className="h-4 bg-gray-200 rounded"></div>
//           <div className="h-4 bg-gray-200 rounded w-20"></div>
//           <div className="h-4 bg-gray-200 rounded w-24"></div>
//         </div>
//       </div>
//     ))}
//   </div>
// );

// // --- DP LIST ITEM COMPONENT ---
// interface DpListItemProps {
//   dp: DpDetail;
//   onAction: (dp: DpDetail, action: "approve" | "reject" | "view") => void;
//   isProcessing: boolean;
// }

// const DpListItem: React.FC<DpListItemProps> = ({
//   dp,
//   onAction,
//   isProcessing,
// }) => {
//   if (!dp) {
//     return null;
//   }

//   const getStatusClasses = (status: DpDetail["status"]) => {
//     switch (normalizeStatus(status)) {
//       case "approved":
//         return "bg-green-100 text-green-800 border border-green-200";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800 border border-yellow-200";
//       case "rejected":
//         return "bg-red-100 text-red-800 border border-red-200";
//       default:
//         return "bg-gray-100 text-gray-800 border border-gray-200";
//     }
//   };

//   const formattedDate = dp.updated_at
//     ? new Date(dp.updated_at).toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       })
//     : "N/A";

//   return (
//     <div className="nsdl-card p-6 mb-4 hover:shadow-md transition-shadow duration-200">
//       <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
//         {/* DP Name */}
//         <div className="font-semibold text-gray-900 truncate">
//           {dp.dp_name || "Unnamed DP"}
//         </div>

//         {/* DP ID */}
//         <div className="font-mono text-sm truncate">{dp.id || "N/A"}</div>

//         {/* IP Address */}
//         <div className="text-gray-900">{dp.ip_address || "N/A"}</div>

//         {/* Last Updated */}
//         <div className="text-gray-900">{formattedDate}</div>

//         {/* Status */}
//         <div>
//           <div
//             className={`px-3 py-1.5 text-xs font-medium rounded-full inline-block ${getStatusClasses(
//               dp.status
//             )}`}
//           >
//             {formatStatus(dp.status)}
//           </div>
//         </div>

//         {/* Actions */}
//         <div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => onAction(dp, "view")}
//               disabled={isProcessing}
//               className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               <EyeIcon className="w-3 h-3 mr-1" />
//               View
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- DP DETAIL MODAL COMPONENT ---
// interface DpDetailModalProps {
//   dp: DpDetail;
//   onClose: () => void;
//   onValidate: () => void;
//   onAction: (dp: DpDetail, action: "approve" | "reject") => void;
//   isProcessing: boolean;
// }

// const DpDetailModal: React.FC<DpDetailModalProps> = ({
//   dp,
//   onClose,
//   onValidate,
//   onAction,
//   isProcessing,
// }) => {
//   if (!dp) {
//     return null;
//   }

//   const getStatusClasses = (status: DpDetail["status"]) => {
//     switch (normalizeStatus(status)) {
//       case "approved":
//         return "bg-green-100 text-green-800 border border-green-200";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800 border border-yellow-200";
//       case "rejected":
//         return "bg-red-100 text-red-800 border border-red-200";
//       default:
//         return "bg-gray-100 text-gray-800 border border-gray-200";
//     }
//   };

//   const getEnvironmentBadgeColor = (env: string) => {
//     switch (env?.toUpperCase()) {
//       case "UAT":
//         return "bg-blue-100 text-blue-800 border border-blue-200";
//       case "STAGING":
//         return "bg-purple-100 text-purple-800 border border-purple-200";
//       case "PRODUCTION":
//         return "bg-green-100 text-green-800 border border-green-200";
//       default:
//         return "bg-gray-100 text-gray-800 border border-gray-200";
//     }
//   };

//   const formattedCreatedDate = dp.created_at
//     ? new Date(dp.created_at).toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       })
//     : "N/A";

//   const formattedUpdatedDate = dp.updated_at
//     ? new Date(dp.updated_at).toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       })
//     : "N/A";

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
//       <div className="nsdl-card w-full max-w-5xl max-h-[90vh] overflow-y-auto">
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <div className="p-2 bg-blue-100 rounded-lg">
//                 <ServerIcon className="w-6 h-6 text-blue-600" />
//               </div>
//               <div className="ml-4">
//                 <h3 className="nsdl-heading-3 text-gray-900">DP Details</h3>
//                 <p className="text-sm text-gray-500 mt-1">
//                   {dp.dp_name || "Unnamed DP"}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span
//                 className={`px-3 py-1.5 text-xs font-medium rounded-full ${getStatusClasses(
//                   dp.status
//                 )}`}
//               >
//                 {formatStatus(dp.status)}
//               </span>
//               <span
//                 className={`px-3 py-1 text-xs font-medium rounded-full ${getEnvironmentBadgeColor(
//                   dp.environment
//                 )}`}
//               >
//                 {dp.environment || "UAT"}
//               </span>
//               <button
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
//               >
//                 <XIcon className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="p-6">
//           <div className="space-y-8">
//             {/* Basic Information */}
//             <div>
//               <h4 className="nsdl-body-bold text-gray-700 mb-4">
//                 Basic Information
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="nsdl-label text-xs">DP Name</label>
//                   <p className="nsdl-body font-semibold">
//                     {dp.dp_name || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">DP ID</label>
//                   <p className="nsdl-body font-mono">{dp.id || "N/A"}</p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">IP Address</label>
//                   <p className="nsdl-body flex items-center">
//                     <ServerIcon className="w-3 h-3 mr-1" />
//                     {dp.ip_address || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Callback URL</label>
//                   <p className="nsdl-body truncate">
//                     {dp.callback_url || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Email</label>
//                   <p className="flex items-center">{dp.email_id}</p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Environment</label>
//                   <p className="nsdl-body flex items-center">
//                     <span
//                       className={`px-2 py-1 text-xs rounded ${getEnvironmentBadgeColor(
//                         dp.environment
//                       )}`}
//                     >
//                       {dp.environment || "UAT"}
//                     </span>
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">
//                     Certificate Serial
//                   </label>
//                   <p className="nsdl-body font-mono flex items-center">
//                     <CertificateIcon className="w-3 h-3 mr-1" />
//                     {dp.cert_serial_number || "Not Available"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Business Information */}
//             <div>
//               <h4 className="nsdl-body-bold text-gray-700 mb-4 flex items-center">
//                 <BusinessIcon className="w-4 h-4 mr-2" />
//                 Business Information
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="nsdl-label text-xs">CM BP ID</label>
//                   <p className="nsdl-body flex items-center">
//                     <BusinessIcon className="w-3 h-3 mr-1" />
//                     {dp.cm_bp_id || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Segment</label>
//                   <p className="nsdl-body flex items-center">
//                     <SegmentIcon className="w-3 h-3 mr-1" />
//                     {dp.segment || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Exchange Code</label>
//                   <p className="nsdl-body flex items-center">
//                     <ExchangeIcon className="w-3 h-3 mr-1" />
//                     {dp.exchange_code || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">
//                     Business Lead Name
//                   </label>
//                   <p className="nsdl-body flex items-center">
//                     <PeopleIcon className="w-3 h-3 mr-1" />
//                     {dp.business_lead_name || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">
//                     Technical Lead Name
//                   </label>
//                   <p className="nsdl-body flex items-center">
//                     <PeopleIcon className="w-3 h-3 mr-1" />
//                     {dp.technical_lead_name || "N/A"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Timestamps & Metadata */}
//             <div>
//               <h4 className="nsdl-body-bold text-gray-700 mb-4">
//                 Timestamps & Metadata
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="nsdl-label text-xs">Created At</label>
//                   <p className="nsdl-body flex items-center">
//                     <CalendarIcon className="w-3 h-3 mr-1" />
//                     {formattedCreatedDate}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Last Updated</label>
//                   <p className="nsdl-body flex items-center">
//                     <CalendarIcon className="w-3 h-3 mr-1" />
//                     {formattedUpdatedDate}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">RSA Key Status</label>
//                   <p className="nsdl-body">
//                     <span
//                       className={`px-2 py-1 text-xs rounded ${getStatusClasses(
//                         dp.rsa_key_status
//                       )}`}
//                     >
//                       {formatStatus(dp.rsa_key_status)}
//                     </span>
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Requestor ID</label>
//                   <p className="nsdl-body font-mono">
//                     {dp.requestor_id || "N/A"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Validation Section */}
//             <div className="pt-6 border-t border-gray-200">
//               <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
//                 <div className="flex items-center">
//                   <ShieldIcon className="w-5 h-5 text-blue-600 mr-3" />
//                   <div>
//                     <p className="nsdl-body-bold">DP Validation</p>
//                     <p className="text-sm text-gray-500">
//                       Validate the DP configuration before approval
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={onValidate}
//                   className="px-6 py-2.5 nsdl-btn-primary rounded-lg transition-colors flex items-center"
//                 >
//                   <ShieldIcon className="w-4 h-4 mr-2" />
//                   Validate
//                 </button>
//               </div>
//             </div>

//             {/* Action Buttons - Only show for pending status */}
//             {normalizeStatus(dp.status) === "pending" && (
//               <div className="pt-4 border-t border-gray-200">
//                 <div className="flex justify-end space-x-3">
//                   <button
//                     onClick={() => onAction(dp, "reject")}
//                     disabled={isProcessing}
//                     className="px-6 py-2.5 nsdl-btn-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
//                   >
//                     {isProcessing ? (
//                       <>
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
//                         Processing...
//                       </>
//                     ) : (
//                       <>
//                         <XIcon className="w-4 h-4 mr-2" />
//                         Reject
//                       </>
//                     )}
//                   </button>
//                   <button
//                     onClick={() => onAction(dp, "approve")}
//                     disabled={isProcessing}
//                     className="px-6 py-2.5 nsdl-btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
//                   >
//                     {isProcessing ? (
//                       <>
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                         Processing...
//                       </>
//                     ) : (
//                       <>
//                         <CheckIcon className="w-4 h-4 mr-2" />
//                         Approve
//                       </>
//                     )}
//                   </button>
//                 </div>
//                 <p className="text-sm text-gray-500 mt-2 text-right">
//                   This will approve/reject the DP for {dp.environment || "UAT"}{" "}
//                   environment
//                 </p>
//               </div>
//             )}

//             {/* Status Message for non-pending DPs */}
//             {normalizeStatus(dp.status) !== "pending" && (
//               <div className="pt-4 border-t border-gray-200">
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="flex items-center">
//                     {normalizeStatus(dp.status) === "approved" ? (
//                       <>
//                         <CheckIcon className="w-5 h-5 text-emerald-600 mr-3" />
//                         <div>
//                           <p className="nsdl-body-bold text-emerald-700">
//                             DP Already Approved for {dp.environment || "UAT"}
//                           </p>
//                           <p className="text-sm text-gray-500">
//                             This DP has been approved on {formattedUpdatedDate}
//                           </p>
//                           {dp.requestor_id && (
//                             <p className="text-sm text-gray-500 mt-1">
//                               Requestor ID: {dp.requestor_id}
//                             </p>
//                           )}
//                         </div>
//                       </>
//                     ) : (
//                       <>
//                         <XIcon className="w-5 h-5 text-red-600 mr-3" />
//                         <div>
//                           <p className="nsdl-body-bold text-red-700">
//                             DP {formatStatus(dp.status)} for{" "}
//                             {dp.environment || "UAT"}
//                           </p>
//                           <p className="text-sm text-gray-500">
//                             This DP was {normalizeStatus(dp.status)} on{" "}
//                             {formattedUpdatedDate}
//                           </p>
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- MAIN COMPONENT: DpApprovalScreen WITH LIVE SEARCH ---
// export const DpApprovalScreen: React.FC = () => {
//   const [dpDetails, setDpDetails] = useState<DpDetail[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [errors, setErrors] = useState<AppError[]>([]);
//   const [toasts, setToasts] = useState<ToastProps[]>([]);
//   const [processingId, setProcessingId] = useState<string | null>(null);
//   const [selectedDp, setSelectedDp] = useState<DpDetail | null>(null);
//   const [statusFilter, setStatusFilter] = useState<"all" | DpDetail["status"]>(
//     "all"
//   );
//   const [environmentFilter, setEnvironmentFilter] = useState<string>("UAT");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchLoading, setSearchLoading] = useState(false);

//   // Pagination state
//   const [pagination, setPagination] = useState<PaginationInfo>({
//     totalRecords: 0,
//     totalPages: 0,
//     currentPage: 1,
//     limit: 10,
//   });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   // Stats state
//   const [stats, setStats] = useState({
//     pending: 0,
//     approved: 0,
//     rejected: 0,
//     total: 0,
//   });

//   // Refs for debouncing
//   const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   // Add error utility
//   const addError = useCallback((error: Omit<AppError, "id" | "timestamp">) => {
//     const newError: AppError = {
//       ...error,
//       id: Date.now().toString(),
//       timestamp: new Date().toISOString(),
//     };
//     setErrors((prev) => [newError, ...prev.slice(0, 4)]);
//   }, []);

//   // Add toast utility
//   const addToast = useCallback((toast: Omit<ToastProps, "id" | "onClose">) => {
//     const id = Date.now().toString();
//     setToasts((prev) => [
//       ...prev,
//       { ...toast, id, onClose: () => removeToast(id) },
//     ]);
//   }, []);

//   const removeToast = useCallback((id: string) => {
//     setToasts((prev) => prev.filter((toast) => toast.id !== id));
//   }, []);

//   // Load DP details with pagination
//   const loadDpDetails = useCallback(
//     async (page: number = currentPage, limit: number = pageSize) => {
//       setIsLoading(true);
//       setErrors([]);

//       // Only set search loading if there's a search term
//       if (searchTerm.trim()) {
//         setSearchLoading(true);
//       }

//       const result = await fetchDpDetailsWithPagination({
//         environment: environmentFilter,
//         status: statusFilter === "all" ? undefined : statusFilter,
//         page: page,
//         limit: limit,
//         searchTerm: searchTerm.trim() || undefined,
//       });

//       if ("error" in result) {
//         addError(result.error);
//         setDpDetails([]);
//         setPagination({
//           totalRecords: 0,
//           totalPages: 0,
//           currentPage: page,
//           limit: limit,
//         });
//         setStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
//       } else {
//         setDpDetails(result.data);
//         setPagination(result.pagination);
//         setCurrentPage(page);

//         // Calculate stats from the current data
//         const pendingCount = result.data.filter(
//           (dp) => normalizeStatus(dp.status) === "pending"
//         ).length;
//         const approvedCount = result.data.filter(
//           (dp) => normalizeStatus(dp.status) === "approved"
//         ).length;
//         const rejectedCount = result.data.filter(
//           (dp) => normalizeStatus(dp.status) === "rejected"
//         ).length;

//         setStats({
//           pending: pendingCount,
//           approved: approvedCount,
//           rejected: rejectedCount,
//           total: result.data.length,
//         });

//         // Only show toast for search results or no results
//         if (searchTerm.trim() && result.data.length === 0) {
//           addToast({
//             message: `No DPs found for "${searchTerm}"`,
//             type: "info",
//             duration: 3000,
//           });
//         } else if (result.data.length === 0) {
//           addToast({
//             message: "No DP records found",
//             type: "info",
//             duration: 3000,
//           });
//         }
//       }

//       setIsLoading(false);
//       setSearchLoading(false);
//     },
//     [
//       environmentFilter,
//       statusFilter,
//       searchTerm,
//       currentPage,
//       pageSize,
//       addError,
//       addToast,
//     ]
//   );

//   // Handle live search with debouncing
//   const handleSearchChange = (value: string) => {
//     setSearchTerm(value);

//     // Clear previous timeout
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }

//     // Show loading indicator for non-empty queries
//     if (value.trim().length > 0) {
//       setSearchLoading(true);
//     }

//     // Set new timeout for debounced search (500ms delay)
//     searchTimeoutRef.current = setTimeout(() => {
//       setCurrentPage(1);
//       loadDpDetails(1, pageSize);
//     }, 500);
//   };

//   // Handle clear search
//   const handleClearSearch = () => {
//     setSearchTerm("");
//     setCurrentPage(1);
//     loadDpDetails(1, pageSize);

//     // Clear timeout if exists
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//       searchTimeoutRef.current = null;
//     }
//   };

//   // Handle keyboard shortcuts
//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       // Clear any pending debounced search
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//         searchTimeoutRef.current = null;
//       }

//       // Trigger immediate search
//       setCurrentPage(1);
//       loadDpDetails(1, pageSize);
//     }

//     if (e.key === "Escape" && searchTerm) {
//       handleClearSearch();
//     }
//   };

//   // Handle page change
//   const handlePageChange = (page: number) => {
//     if (page >= 1 && page <= pagination.totalPages) {
//       loadDpDetails(page, pageSize);
//     }
//   };

//   // Handle page size change
//   const handlePageSizeChange = (size: number) => {
//     setPageSize(size);
//     loadDpDetails(1, size);
//   };

//   // Handle error actions
//   const handleErrorAction = useCallback(
//     (errorId: string, action?: AppError["action"]) => {
//       const error = errors.find((e) => e.id === errorId);
//       if (!error) return;

//       switch (action) {
//         case "retry":
//           loadDpDetails(currentPage, pageSize);
//           break;
//         case "refresh":
//           window.location.reload();
//           break;
//         case "contact_support":
//           window.location.href = `mailto:support@example.com?subject=DP%20Approval%20Error&body=${encodeURIComponent(
//             error.message
//           )}`;
//           break;
//         default:
//           break;
//       }

//       setErrors((prev) => prev.filter((e) => e.id !== errorId));
//     },
//     [errors, currentPage, pageSize, loadDpDetails]
//   );

//   // Initialize on component mount
//   useEffect(() => {
//     loadDpDetails(1, pageSize);

//     // Cleanup timeout on unmount
//     return () => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Reload when filters change
//   useEffect(() => {
//     setCurrentPage(1);
//     loadDpDetails(1, pageSize);
//   }, [statusFilter, environmentFilter]);

//   const handleAction = useCallback(
//     async (dp: DpDetail, action: "approve" | "reject" | "view") => {
//       if (action === "view") {
//         setSelectedDp(dp);
//         return;
//       }

//       setProcessingId(dp.id);

//       try {
//         const result =
//           action === "approve"
//             ? await approveDp(dp.id, dp.environment || "UAT")
//             : await rejectDp(dp.id, dp.environment || "UAT");

//         if (result.success) {
//           // Show success toast
//           addToast({
//             message: `Successfully ${
//               action === "approve" ? "approved" : "rejected"
//             } ${dp.dp_name || "DP"}`,
//             type: "success",
//             duration: 3000,
//           });

//           // Close the modal
//           setSelectedDp(null);

//           // Reload data
//           await loadDpDetails(currentPage, pageSize);

//           // If we're on a page that might become empty after approval/reject,
//           // adjust the page number if needed
//           if (dpDetails.length <= 1 && currentPage > 1) {
//             const newPage = currentPage - 1;
//             loadDpDetails(newPage, pageSize);
//           }
//         } else if (result.error) {
//           // Show error toast
//           addToast({
//             message: result.error.message,
//             type: "error",
//             duration: 5000,
//           });
//         }
//       } catch (err) {
//         // Show error toast
//         const errorMessage =
//           err instanceof Error ? err.message : "Unknown error occurred";
//         addToast({
//           message: `Failed to ${action} DP: ${errorMessage}`,
//           type: "error",
//           duration: 5000,
//         });
//       } finally {
//         setProcessingId(null);
//       }
//     },
//     [currentPage, pageSize, loadDpDetails, addToast, dpDetails]
//   );

//   const handleValidate = () => {
//     alert(`Validating DP: ${selectedDp?.dp_name}`);
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pages = [];
//     const maxPagesToShow = 5;

//     if (pagination.totalPages <= maxPagesToShow) {
//       for (let i = 1; i <= pagination.totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//       let endPage = startPage + maxPagesToShow - 1;

//       if (endPage > pagination.totalPages) {
//         endPage = pagination.totalPages;
//         startPage = Math.max(1, endPage - maxPagesToShow + 1);
//       }

//       for (let i = startPage; i <= endPage; i++) {
//         pages.push(i);
//       }
//     }

//     return pages;
//   };

//   const startRecord = (currentPage - 1) * pagination.limit + 1;
//   const endRecord = Math.min(
//     currentPage * pagination.limit,
//     pagination.totalRecords
//   );

//   return (
//     <DpApprovalErrorBoundary>
//       <div className="min-h-screen bg-gray-50 py-10">
//         {/* Toast Container */}
//         <ToastContainer toasts={toasts} onClose={removeToast} />

//         {/* Error Display Area */}
//         {errors.length > 0 && (
//           <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-10 mb-6 space-y-2">
//             {errors.map((error) => (
//               <ErrorDisplay
//                 key={error.id}
//                 error={error}
//                 onAction={(action) =>
//                   error.id && handleErrorAction(error.id!, action)
//                 }
//                 onDismiss={() =>
//                   error.id &&
//                   setErrors((prev) => prev.filter((e) => e.id !== error.id))
//                 }
//               />
//             ))}
//           </div>
//         )}

//         <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-10">
//           {/* Header */}
//           <div className="mb-10">
//             <h1 className="nsdl-heading-1 text-gray-900 mb-3">
//               DP Approval Management
//             </h1>
//             <p className="nsdl-body text-gray-600">
//               Review and approve/reject Depository Participant registrations for
//               UAT and STAGING environments
//             </p>
//           </div>

//           {/* Stats Cards */}
//           {isLoading ? (
//             <StatsSkeleton />
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//               <div className="nsdl-card p-6">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-amber-100 rounded-lg">
//                     <ServerIcon className="w-6 h-6 text-amber-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="nsdl-body text-gray-600">Pending</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       {stats.pending}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               <div className="nsdl-card p-6">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-emerald-100 rounded-lg">
//                     <CheckIcon className="w-6 h-6 text-emerald-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="nsdl-body text-gray-600">Approved</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       {stats.approved}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               <div className="nsdl-card p-6">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-red-100 rounded-lg">
//                     <XIcon className="w-6 h-6 text-red-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="nsdl-body text-gray-600">Rejected</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       {stats.rejected}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               <div className="nsdl-card p-6">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-gray-100 rounded-lg">
//                     <ServerIcon className="w-6 h-6 text-gray-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="nsdl-body text-gray-600">Total</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       {stats.total}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Filters and Controls */}
//           <div className="nsdl-card p-6 mb-6">
//             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//               <div className="flex flex-col lg:flex-row lg:items-center gap-6">
//                 <div className="flex items-center">
//                   <FilterIcon className="w-5 h-5" />
//                   <span className="ml-3 nsdl-body-bold text-gray-700">
//                     Status:
//                   </span>
//                   <div className="flex flex-wrap gap-2 ml-4">
//                     {["all", "pending", "approved", "rejected"].map(
//                       (status) => (
//                         <button
//                           key={status}
//                           onClick={() =>
//                             setStatusFilter(
//                               status === "all"
//                                 ? "all"
//                                 : (status as DpDetail["status"])
//                             )
//                           }
//                           className={`px-4 py-2.5 nsdl-body rounded-lg transition-colors duration-200 ${
//                             statusFilter === (status === "all" ? "all" : status)
//                               ? "nsdl-btn-primary"
//                               : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                           }`}
//                         >
//                           {status === "all" ? "All" : formatStatus(status)}
//                         </button>
//                       )
//                     )}
//                   </div>
//                 </div>
//                 <div className="flex items-center">
//                   <ServerIcon className="w-5 h-5" />
//                   <span className="ml-3 nsdl-body-bold text-gray-700">
//                     Environment:
//                   </span>
//                   <div className="flex flex-wrap gap-2 ml-4">
//                     {["UAT", "STAGING"].map((env) => (
//                       <button
//                         key={env}
//                         onClick={() => setEnvironmentFilter(env)}
//                         className={`px-4 py-2.5 nsdl-body rounded-lg transition-colors duration-200 ${
//                           environmentFilter === env
//                             ? env === "UAT"
//                               ? "bg-blue-100 text-blue-700 border border-blue-300"
//                               : "bg-purple-100 text-purple-700 border border-purple-300"
//                             : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                         }`}
//                       >
//                         {env}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="flex flex-col sm:flex-row items-center gap-4">
//                 {/* Live Search Box */}
//                 <div className="flex items-center gap-3 w-full sm:w-auto">
//                   <div className="relative flex-1 sm:flex-initial min-w-[300px]">
//                     <input
//                       type="text"
//                       placeholder="Search by DP Name or ID"
//                       className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
//                       value={searchTerm}
//                       onChange={(e) => handleSearchChange(e.target.value)}
//                       onKeyDown={handleKeyDown}
//                       disabled={isLoading}
//                     />
//                     <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

//                     {/* Loading indicator */}
//                     {searchLoading && (
//                       <div className="absolute right-10 top-3">
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//                       </div>
//                     )}

//                     {/* Clear button */}
//                     {searchTerm && (
//                       <button
//                         onClick={handleClearSearch}
//                         className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
//                         disabled={isLoading}
//                         title="Clear search"
//                       >
//                         <XIcon className="w-4 h-4" />
//                       </button>
//                     )}
//                   </div>

//                   {/* Search status indicator */}
//                   {searchTerm && (
//                     <div className="text-sm text-gray-500 hidden sm:block">
//                       {dpDetails.length} result
//                       {dpDetails.length !== 1 ? "s" : ""} found
//                       {searchTerm && ` for "${searchTerm}"`}
//                     </div>
//                   )}
//                 </div>

//                 {/* Refresh Button */}
//                 <div className="flex items-center">
//                   <button
//                     onClick={() => loadDpDetails(currentPage, pageSize)}
//                     disabled={isLoading || searchLoading}
//                     className="flex items-center px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                     title="Refresh data"
//                   >
//                     <RefreshIcon className="w-4 h-4 mr-2" />
//                     Refresh
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Table Headings */}
//           <div className="bg-gray-50 rounded-t-lg border border-gray-200 p-4 mb-2">
//             <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
//               <div className="text-sm font-semibold text-gray-700">DP Name</div>
//               <div className="text-sm font-semibold text-gray-700">DP ID</div>
//               <div className="text-sm font-semibold text-gray-700">
//                 IP Address
//               </div>
//               <div className="text-sm font-semibold text-gray-700">
//                 Last Updated
//               </div>
//               <div className="text-sm font-semibold text-gray-700">Status</div>
//               <div className="text-sm font-semibold text-gray-700">Actions</div>
//             </div>
//           </div>

//           {/* DP List */}
//           {isLoading || searchLoading ? (
//             <DpListSkeleton />
//           ) : dpDetails.length > 0 ? (
//             <>
//               <div className="space-y-2">
//                 {dpDetails.map((dp) => (
//                   <DpListItem
//                     key={`${dp.id}-${dp.environment}-${dp.updated_at}`}
//                     dp={dp}
//                     onAction={handleAction}
//                     isProcessing={processingId === dp.id}
//                   />
//                 ))}
//               </div>

//               {/* Pagination Controls */}
//               {pagination.totalPages > 0 && (
//                 <div className="flex flex-col sm:flex-row items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
//                   <div className="flex items-center mb-4 sm:mb-0">
//                     <span className="text-sm text-gray-700 mr-3">
//                       Rows per page:
//                     </span>
//                     <select
//                       value={pageSize}
//                       onChange={(e) =>
//                         handlePageSizeChange(Number(e.target.value))
//                       }
//                       disabled={isLoading || searchLoading}
//                       className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       {[5, 10, 20, 50].map((size) => (
//                         <option key={size} value={size}>
//                           {size}
//                         </option>
//                       ))}
//                     </select>
//                     <span className="text-sm text-gray-600 ml-4">
//                       Showing {startRecord} to {endRecord} of{" "}
//                       {pagination.totalRecords} records
//                     </span>
//                   </div>

//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => handlePageChange(1)}
//                       disabled={currentPage === 1 || isLoading || searchLoading}
//                       className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                       title="First Page"
//                     >
//                       <ChevronDoubleLeftIcon className="w-4 h-4" />
//                     </button>

//                     <button
//                       onClick={() => handlePageChange(currentPage - 1)}
//                       disabled={currentPage === 1 || isLoading || searchLoading}
//                       className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                       title="Previous Page"
//                     >
//                       <ChevronLeftIcon className="w-4 h-4" />
//                     </button>

//                     <div className="flex items-center space-x-1">
//                       {getPageNumbers().map((page) => (
//                         <button
//                           key={page}
//                           onClick={() => handlePageChange(page)}
//                           disabled={isLoading || searchLoading}
//                           className={`min-w-[36px] px-3 py-1.5 text-sm border rounded ${
//                             currentPage === page
//                               ? "bg-blue-600 text-white border-blue-600"
//                               : "border-gray-300 hover:bg-gray-50"
//                           }`}
//                         >
//                           {page}
//                         </button>
//                       ))}
//                     </div>

//                     <button
//                       onClick={() => handlePageChange(currentPage + 1)}
//                       disabled={
//                         currentPage === pagination.totalPages ||
//                         isLoading ||
//                         searchLoading
//                       }
//                       className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                       title="Next Page"
//                     >
//                       <ChevronRightIcon className="w-4 h-4" />
//                     </button>

//                     <button
//                       onClick={() => handlePageChange(pagination.totalPages)}
//                       disabled={
//                         currentPage === pagination.totalPages ||
//                         isLoading ||
//                         searchLoading
//                       }
//                       className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                       title="Last Page"
//                     >
//                       <ChevronDoubleRightIcon className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="nsdl-card p-12 text-center">
//               <ServerIcon className="w-12 h-12 mx-auto text-gray-300" />
//               <h3 className="mt-4 nsdl-heading-3 text-gray-900">
//                 No DPs Found
//               </h3>
//               <p className="mt-2 text-gray-500 nsdl-body">
//                 {searchTerm
//                   ? "No DPs found matching your search criteria"
//                   : "No DP records found. Ensure the backend has data."}
//               </p>
//               {searchTerm && (
//                 <button
//                   onClick={handleClearSearch}
//                   className="mt-4 px-4 py-2 nsdl-btn-primary rounded-lg"
//                 >
//                   Clear Search
//                 </button>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Detail View Modal */}
//         {selectedDp && (
//           <DpDetailModal
//             dp={selectedDp}
//             onClose={() => setSelectedDp(null)}
//             onValidate={handleValidate}
//             onAction={handleAction}
//             isProcessing={processingId === selectedDp.id}
//           />
//         )}
//       </div>
//     </DpApprovalErrorBoundary>
//   );
// };

// export default DpApprovalScreen;

// import React, { useState, useEffect, useCallback, useRef } from "react";

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

// // --- TYPE DEFINITIONS ---
// interface AuthenticationDetails {
//   username: string;
//   password?: string;
// }

// interface DpDetail {
//   id: string;
//   dp_name: string;
//   email_id: string;
//   ip_address: string;
//   callback_url: string;
//   authentication_details: AuthenticationDetails;
//   rsa_public_key?: string;
//   cert_serial_number?: string;
//   certificate_file?: string;
//   cm_bp_id?: string;
//   segment?: string;
//   exchange_code?: string;
//   business_lead_name?: string;
//   technical_lead_name?: string;
//   rsa_key_status: "approved" | "pending" | "rejected" | "not approved";
//   status: "approved" | "pending" | "rejected";
//   environment: string;
//   requestor_id?: string | null;
//   created_at: string;
//   updated_at: string;
// }

// // --- PAGINATION TYPES ---
// interface PaginationInfo {
//   totalRecords: number;
//   totalPages: number;
//   currentPage: number;
//   limit: number;
// }

// interface PaginatedApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: {
//     data: T[];
//     pagination: PaginationInfo;
//   };
// }

// // --- ERROR HANDLING TYPES ---
// interface AppError {
//   id?: string;
//   type: "network" | "validation" | "api" | "timeout" | "auth" | "unknown";
//   message: string;
//   severity: "low" | "medium" | "high" | "critical";
//   timestamp: string;
//   retryable: boolean;
//   details?: Record<string, unknown>;
//   action?: "retry" | "refresh" | "contact_support" | "none";
// }

// // --- TOAST TYPES ---
// interface ToastProps {
//   id: string;
//   message: string;
//   type: "success" | "error" | "warning" | "info";
//   duration?: number;
//   onClose: (id: string) => void;
// }

// // --- API CONFIGURATION ---
// const BACKEND_API_URL_UAT = `${API_BASE_URL}/v1/api/dp`;
// const BACKEND_API_URL_STAGING = `${API_BASE_URL}/v1/api/dp-staging`;

// // --- DEBOUNCE UTILITY ---
// const debounce = <T extends (...args: any[]) => any>(
//   func: T,
//   wait: number
// ): ((...args: Parameters<T>) => void) => {
//   let timeout: NodeJS.Timeout | null = null;

//   return (...args: Parameters<T>) => {
//     if (timeout) clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// // --- ENHANCED API WRAPPER ---
// const apiCall = async <T,>(
//   url: string,
//   options: RequestInit = {}
// ): Promise<{ data: T; ok: true } | { error: AppError; ok: false }> => {
//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 30000);

//   try {
//     const response = await fetch(url, {
//       ...options,
//       signal: controller.signal,
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//     });

//     clearTimeout(timeoutId);

//     if (!response.ok) {
//       const errorText = await response.text();
//       let parsedError = { message: errorText };

//       try {
//         parsedError = JSON.parse(errorText) as { message: string };
//       } catch {
//         // Keep text as is
//       }

//       return {
//         ok: false,
//         error: {
//           type: "api",
//           message: parsedError.message || `HTTP ${response.status}`,
//           severity: response.status >= 500 ? "high" : "medium",
//           retryable: response.status >= 500,
//           timestamp: new Date().toISOString(),
//           action:
//             response.status === 401
//               ? "auth"
//               : response.status >= 500
//               ? "retry"
//               : "none",
//           details: {
//             statusCode: response.status,
//             endpoint: url,
//             method: options.method || "GET",
//           },
//         },
//       };
//     }

//     const data = (await response.json()) as T;
//     return { ok: true, data };
//   } catch (error) {
//     clearTimeout(timeoutId);

//     let errorType: AppError["type"] = "unknown";
//     let message = "An unexpected error occurred";
//     let retryable = false;

//     if (error instanceof DOMException && error.name === "AbortError") {
//       errorType = "timeout";
//       message = "Request timed out. Please check your connection.";
//       retryable = true;
//     } else if (
//       error instanceof TypeError &&
//       error.message.includes("Failed to fetch")
//     ) {
//       errorType = "network";
//       message = "Network error. Please check your internet connection.";
//       retryable = true;
//     } else if (error instanceof Error) {
//       message = error.message;
//     }

//     return {
//       ok: false,
//       error: {
//         type: errorType,
//         message,
//         severity: "high",
//         retryable,
//         timestamp: new Date().toISOString(),
//         action: retryable ? "retry" : "contact_support",
//         details: { originalError: error },
//       },
//     };
//   }
// };

// // --- HELPER FUNCTIONS ---
// const normalizeStatus = (status: string): string => status.toLowerCase();

// const formatStatus = (status: string): string => {
//   return status.charAt(0).toUpperCase() + status.slice(1);
// };

// interface RawDpData {
//   id?: string;
//   dp_name?: string;
//   ip_address?: string;
//   callback_url?: string;
//   email_id?: string;
//   authentication_details?: AuthenticationDetails;
//   rsa_public_key?: string;
//   cert_serial_number?: string;
//   certificate_file?: string;
//   cm_bp_id?: string;
//   segment?: string;
//   exchange_code?: string;
//   business_lead_name?: string;
//   technical_lead_name?: string;
//   rsa_key_status?: string;
//   status?: string;
//   requestor_id?: string | null;
//   created_at?: string;
//   updated_at?: string;
// }

// const normalizeDpDetails = (
//   rawDetails: unknown,
//   environment: string
// ): DpDetail[] => {
//   if (!Array.isArray(rawDetails)) {
//     console.warn(`Expected array for DP details, got:`, rawDetails);
//     return [];
//   }

//   return rawDetails
//     .filter(
//       (dp: unknown): dp is RawDpData =>
//         dp !== null &&
//         typeof dp === "object" &&
//         "id" in dp &&
//         typeof (dp as RawDpData).id === "string"
//     )
//     .map((dp: RawDpData) => ({
//       id: dp.id || "",
//       dp_name: dp.dp_name || "",
//       ip_address: dp.ip_address || "",
//       callback_url: dp.callback_url || "",
//       email_id: dp.email_id || "",
//       authentication_details: dp.authentication_details || {
//         username: "",
//         password: "",
//       },
//       rsa_public_key: dp.rsa_public_key,
//       cert_serial_number: dp.cert_serial_number,
//       certificate_file: dp.certificate_file,
//       cm_bp_id: dp.cm_bp_id,
//       segment: dp.segment,
//       exchange_code: dp.exchange_code,
//       business_lead_name: dp.business_lead_name,
//       technical_lead_name: dp.technical_lead_name,
//       rsa_key_status: normalizeStatus(
//         dp.rsa_key_status || "pending"
//       ) as DpDetail["rsa_key_status"],
//       status: normalizeStatus(
//         dp.status || dp.rsa_key_status || "pending"
//       ) as DpDetail["status"],
//       environment: environment,
//       requestor_id: dp.requestor_id,
//       created_at: dp.created_at || new Date().toISOString(),
//       updated_at: dp.updated_at || new Date().toISOString(),
//     }));
// };

// // --- API CALLS WITH PAGINATION & SEARCH ---
// interface FetchDpOptions {
//   environment: string;
//   status?: string;
//   page?: number;
//   limit?: number;
//   searchTerm?: string;
// }

// const fetchDpDetailsWithPagination = async (
//   options: FetchDpOptions
// ): Promise<
//   { data: DpDetail[]; pagination: PaginationInfo } | { error: AppError }
// > => {
//   const {
//     environment = "UAT",
//     status,
//     page = 1,
//     limit = 10,
//     searchTerm,
//   } = options;

//   try {
//     const baseUrl =
//       environment.toUpperCase() === "UAT"
//         ? `${API_BASE_URL}/v1/api/dp`
//         : `${API_BASE_URL}/v1/api/dp-staging`;

//     const params = new URLSearchParams();

//     if (status && status !== "all") {
//       params.append("status", status.toUpperCase());
//     }

//     if (searchTerm?.trim()) {
//       params.append("search", searchTerm.trim());
//     }

//     params.append("page", page.toString());
//     params.append("limit", limit.toString());

//     const url = `${baseUrl}?${params.toString()}`;
//     const result = await apiCall<PaginatedApiResponse<unknown>>(url);

//     if (!result.ok) {
//       console.error(`Failed to fetch ${environment} DP details:`, result.error);
//       return { error: result.error };
//     }

//     const responseData = result.data;

//     if (!responseData?.data) {
//       console.error(`Invalid response from ${url}:`, responseData);
//       return {
//         error: {
//           type: "api",
//           message: "Invalid response from server",
//           severity: "medium",
//           retryable: true,
//           timestamp: new Date().toISOString(),
//           action: "retry",
//         },
//       };
//     }

//     const pagination = responseData.data.pagination || {
//       totalRecords: 0,
//       totalPages: 0,
//       currentPage: page,
//       limit: limit,
//     };

//     let rawDetails: unknown = [];

//     if (Array.isArray(responseData.data.data)) {
//       rawDetails = responseData.data.data;
//     } else if (Array.isArray(responseData.data)) {
//       rawDetails = responseData.data;
//     } else {
//       console.warn(`Unexpected data structure from ${url}:`, responseData.data);
//       return {
//         data: [],
//         pagination: {
//           totalRecords: 0,
//           totalPages: 0,
//           currentPage: page,
//           limit: limit,
//         },
//       };
//     }

//     const dpDetails = normalizeDpDetails(rawDetails, environment);

//     return { data: dpDetails, pagination };
//   } catch (error) {
//     console.error("Error fetching DP details with pagination:", error);
//     return {
//       error: {
//         type: "network",
//         message: "Failed to fetch DP details",
//         severity: "high",
//         retryable: true,
//         timestamp: new Date().toISOString(),
//         action: "retry",
//       },
//     };
//   }
// };

// const approveDp = async (
//   dpId: string,
//   environment: string = "UAT"
// ): Promise<{ success: boolean; error?: AppError }> => {
//   const approveUrl = `${API_BASE_URL}/v1/api/dp/approve/${dpId}`;

//   const requestBody = {
//     status: "APPROVED",
//     environment: environment.toUpperCase(),
//   };

//   const result = await apiCall<{
//     success: boolean;
//     message?: string;
//     data?: any;
//   }>(approveUrl, {
//     method: "POST",
//     body: JSON.stringify(requestBody),
//   });

//   if (!result.ok) {
//     return { success: false, error: result.error };
//   }

//   if (!result.data.success) {
//     return {
//       success: false,
//       error: {
//         type: "api",
//         message: result.data.message || "Failed to approve DP",
//         severity: "medium",
//         retryable: true,
//         timestamp: new Date().toISOString(),
//         action: "retry",
//       },
//     };
//   }

//   return { success: true };
// };

// const rejectDp = async (
//   dpId: string,
//   environment: string = "UAT"
// ): Promise<{ success: boolean; error?: AppError }> => {
//   const rejectUrl = `${API_BASE_URL}/v1/api/dp/approve/${dpId}`;

//   const requestBody = {
//     status: "REJECTED",
//     environment: environment.toUpperCase(),
//   };

//   const result = await apiCall<{
//     success: boolean;
//     message?: string;
//     data?: any;
//   }>(rejectUrl, {
//     method: "POST",
//     body: JSON.stringify(requestBody),
//   });

//   if (!result.ok) {
//     return { success: false, error: result.error };
//   }

//   if (!result.data.success) {
//     return {
//       success: false,
//       error: {
//         type: "api",
//         message: result.data.message || "Failed to reject DP",
//         severity: "medium",
//         retryable: true,
//         timestamp: new Date().toISOString(),
//         action: "retry",
//       },
//     };
//   }

//   return { success: true };
// };

// // --- ICON COMPONENTS ---
// const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M5 13l4 4L19 7"
//     />
//   </svg>
// );

// const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M6 18L18 6M6 6l12 12"
//     />
//   </svg>
// );

// const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//     />
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//     />
//   </svg>
// );

// const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
//     />
//   </svg>
// );

// const RefreshIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
//     />
//   </svg>
// );

// const ServerIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
//     />
//   </svg>
// );

// const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//     />
//   </svg>
// );

// const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//     />
//   </svg>
// );

// const FilterIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
//     />
//   </svg>
// );

// const CertificateIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// );

// const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//     />
//   </svg>
// );

// const BusinessIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
//     />
//   </svg>
// );

// const ExchangeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
//     />
//   </svg>
// );

// const PeopleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 6.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
//     />
//   </svg>
// );

// const SegmentIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
//     />
//   </svg>
// );

// const AlertTriangleIcon = ({
//   className = "w-5 h-5",
// }: {
//   className?: string;
// }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.347 16.5c-.77.833.192 2.5 1.732 2.5z"
//     />
//   </svg>
// );

// const InfoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// );

// const ChevronLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M15 19l-7-7 7-7"
//     />
//   </svg>
// );

// const ChevronRightIcon = ({
//   className = "w-5 h-5",
// }: {
//   className?: string;
// }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 5l7 7-7 7"
//     />
//   </svg>
// );

// const ChevronDoubleLeftIcon = ({
//   className = "w-5 h-5",
// }: {
//   className?: string;
// }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
//     />
//   </svg>
// );

// const ChevronDoubleRightIcon = ({
//   className = "w-5 h-5",
// }: {
//   className?: string;
// }) => (
//   <svg
//     className={className}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M13 5l7 7-7 7M5 5l7 7-7 7"
//     />
//   </svg>
// );

// // --- TOAST COMPONENT ---
// const Toast: React.FC<ToastProps> = ({
//   id,
//   message,
//   type,
//   duration = 5000,
//   onClose,
// }) => {
//   useEffect(() => {
//     const timer = setTimeout(() => onClose(id), duration);
//     return () => clearTimeout(timer);
//   }, [id, duration, onClose]);

//   const typeClasses = {
//     success: "bg-emerald-100 border-emerald-300 text-emerald-700",
//     error: "bg-red-100 border-red-300 text-red-700",
//     warning: "bg-amber-100 border-amber-300 text-amber-700",
//     info: "bg-blue-100 border-blue-300 text-blue-700",
//   };

//   const icons = {
//     success: <CheckIcon className="w-4 h-4" />,
//     error: <XIcon className="w-4 h-4" />,
//     warning: <AlertTriangleIcon className="w-4 h-4" />,
//     info: <InfoIcon className="w-4 h-4" />,
//   };

//   return (
//     <div
//       className={`fixed top-4 right-4 z-50 border rounded-lg p-4 shadow-lg ${typeClasses[type]} animate-slide-in`}
//     >
//       <div className="flex items-center">
//         {icons[type]}
//         <span className="ml-2 text-sm font-medium">{message}</span>
//         <button
//           onClick={() => onClose(id)}
//           className="ml-4 text-gray-400 hover:text-gray-600"
//         >
//           <XIcon className="w-3 h-3" />
//         </button>
//       </div>
//     </div>
//   );
// };

// // --- TOAST CONTAINER ---
// const ToastContainer: React.FC<{
//   toasts: ToastProps[];
//   onClose: (id: string) => void;
// }> = ({ toasts, onClose }) => (
//   <div className="fixed top-4 right-4 z-50 space-y-2">
//     {toasts.map((toast) => (
//       <Toast key={toast.id} {...toast} onClose={onClose} />
//     ))}
//   </div>
// );

// // --- ERROR DISPLAY COMPONENT ---
// interface ErrorDisplayProps {
//   error: AppError;
//   onAction?: (action: AppError["action"]) => void;
//   onDismiss?: () => void;
// }

// const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
//   error,
//   onAction,
//   onDismiss,
// }) => {
//   const getErrorIcon = () => {
//     switch (error.type) {
//       case "network":
//         return <ServerIcon className="w-5 h-5" />;
//       case "timeout":
//         return <RefreshIcon className="w-5 h-5" />;
//       case "auth":
//         return <ShieldIcon className="w-5 h-5" />;
//       default:
//         return <XIcon className="w-5 h-5" />;
//     }
//   };

//   const getActionButton = () => {
//     if (!error.action || error.action === "none") return null;

//     const actionConfig = {
//       retry: {
//         text: "Retry",
//         className: "bg-blue-600 text-white hover:bg-blue-700",
//       },
//       refresh: {
//         text: "Refresh Page",
//         className: "bg-gray-600 text-white hover:bg-gray-700",
//       },
//       contact_support: {
//         text: "Contact Support",
//         className: "bg-amber-600 text-white hover:bg-amber-700",
//       },
//     };

//     const config = actionConfig[error.action];
//     if (!config) return null;

//     return (
//       <button
//         onClick={() => onAction?.(error.action)}
//         className={`px-4 py-2 rounded-lg text-sm font-medium ${config.className} ml-2 transition-colors`}
//       >
//         {config.text}
//       </button>
//     );
//   };

//   const getSeverityColor = () => {
//     switch (error.severity) {
//       case "critical":
//         return "bg-red-50 border-red-200";
//       case "high":
//         return "bg-amber-50 border-amber-200";
//       case "medium":
//         return "bg-yellow-50 border-yellow-200";
//       default:
//         return "bg-gray-50 border-gray-200";
//     }
//   };

//   return (
//     <div className={`p-4 rounded-lg border ${getSeverityColor()}`}>
//       <div className="flex items-start">
//         <div className="p-2 rounded-full bg-white border">{getErrorIcon()}</div>
//         <div className="ml-3 flex-1">
//           <p className="font-medium text-gray-900">{error.message}</p>
//         </div>
//         <div className="flex items-center">
//           {getActionButton()}
//           {onDismiss && (
//             <button
//               onClick={onDismiss}
//               className="ml-2 text-gray-400 hover:text-gray-600 p-1"
//               aria-label="Dismiss error"
//             >
//               <XIcon className="w-4 h-4" />
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- ERROR BOUNDARY ---
// class DpApprovalErrorBoundary extends React.Component<
//   { children: React.ReactNode },
//   { hasError: boolean; error: Error | null }
// > {
//   constructor(props: { children: React.ReactNode }) {
//     super(props);
//     this.state = { hasError: false, error: null };
//   }

//   static getDerivedStateFromError(error: Error) {
//     return { hasError: true, error };
//   }

//   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
//     console.error("DP Approval Error:", error, errorInfo);
//   }

//   handleRetry = () => {
//     this.setState({ hasError: false, error: null });
//     window.location.reload();
//   };

//   handleContactSupport = () => {
//     const subject = encodeURIComponent("DP Approval Screen Error");
//     const body = encodeURIComponent(
//       `Error: ${this.state.error?.message}\n\nUser Agent: ${navigator.userAgent}`
//     );
//     window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
//   };

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//           <div className="nsdl-card p-8 max-w-md text-center">
//             <ShieldIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
//             <h3 className="nsdl-heading-3 text-gray-900 mb-2">
//               Something went wrong
//             </h3>
//             <p className="text-gray-600 mb-6">
//               We encountered an error while loading the DP approval screen.
//             </p>
//             <div className="space-y-3">
//               <button
//                 onClick={this.handleRetry}
//                 className="px-6 py-2.5 nsdl-btn-primary rounded-lg w-full"
//               >
//                 Reload Page
//               </button>
//               <button
//                 onClick={this.handleContactSupport}
//                 className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg w-full hover:bg-gray-300 transition-colors"
//               >
//                 Contact Support
//               </button>
//             </div>
//             <p className="text-xs text-gray-400 mt-4">
//               Error: {this.state.error?.message}
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return this.props.children;
//   }
// }

// // --- LOADING SKELETONS ---
// const StatsSkeleton: React.FC = () => (
//   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//     {Array.from({ length: 4 }).map((_, i) => (
//       <div key={i} className="nsdl-card p-6 animate-pulse">
//         <div className="flex items-center">
//           <div className="p-3 bg-gray-200 rounded-lg"></div>
//           <div className="ml-4">
//             <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
//             <div className="h-6 bg-gray-200 rounded w-8"></div>
//           </div>
//         </div>
//       </div>
//     ))}
//   </div>
// );

// const DpListSkeleton: React.FC = () => (
//   <div className="space-y-2">
//     {Array.from({ length: 5 }).map((_, i) => (
//       <div key={i} className="nsdl-card p-6 animate-pulse">
//         <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
//           <div className="h-4 bg-gray-200 rounded"></div>
//           <div className="h-4 bg-gray-200 rounded"></div>
//           <div className="h-4 bg-gray-200 rounded"></div>
//           <div className="h-4 bg-gray-200 rounded"></div>
//           <div className="h-4 bg-gray-200 rounded w-20"></div>
//           <div className="h-4 bg-gray-200 rounded w-24"></div>
//         </div>
//       </div>
//     ))}
//   </div>
// );

// // --- DP LIST ITEM COMPONENT ---
// interface DpListItemProps {
//   dp: DpDetail;
//   onAction: (dp: DpDetail, action: "approve" | "reject" | "view") => void;
//   isProcessing: boolean;
// }

// const DpListItem: React.FC<DpListItemProps> = ({
//   dp,
//   onAction,
//   isProcessing,
// }) => {
//   if (!dp) {
//     return null;
//   }

//   const getStatusClasses = (status: DpDetail["status"]) => {
//     switch (normalizeStatus(status)) {
//       case "approved":
//         return "bg-green-100 text-green-800 border border-green-200";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800 border border-yellow-200";
//       case "rejected":
//         return "bg-red-100 text-red-800 border border-red-200";
//       default:
//         return "bg-gray-100 text-gray-800 border border-gray-200";
//     }
//   };

//   const formattedDate = dp.updated_at
//     ? new Date(dp.updated_at).toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       })
//     : "N/A";

//   return (
//     <div className="nsdl-card p-6 mb-4 hover:shadow-md transition-shadow duration-200">
//       <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
//         {/* DP Name */}
//         <div className="font-semibold text-gray-900 truncate">
//           {dp.dp_name || "Unnamed DP"}
//         </div>

//         {/* DP ID */}
//         <div className="font-mono text-sm truncate">{dp.id || "N/A"}</div>

//         {/* IP Address */}
//         <div className="text-gray-900">{dp.ip_address || "N/A"}</div>

//         {/* Last Updated */}
//         <div className="text-gray-900">{formattedDate}</div>

//         {/* Status */}
//         <div>
//           <div
//             className={`px-3 py-1.5 text-xs font-medium rounded-full inline-block ${getStatusClasses(
//               dp.status
//             )}`}
//           >
//             {formatStatus(dp.status)}
//           </div>
//         </div>

//         {/* Actions */}
//         <div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => onAction(dp, "view")}
//               disabled={isProcessing}
//               className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               <EyeIcon className="w-3 h-3 mr-1" />
//               View
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- DP DETAIL MODAL COMPONENT ---
// interface DpDetailModalProps {
//   dp: DpDetail;
//   onClose: () => void;
//   onValidate: () => void;
//   onAction: (dp: DpDetail, action: "approve" | "reject") => void;
//   isProcessing: boolean;
// }

// const DpDetailModal: React.FC<DpDetailModalProps> = ({
//   dp,
//   onClose,
//   onValidate,
//   onAction,
//   isProcessing,
// }) => {
//   if (!dp) {
//     return null;
//   }

//   const getStatusClasses = (status: DpDetail["status"]) => {
//     switch (normalizeStatus(status)) {
//       case "approved":
//         return "bg-green-100 text-green-800 border border-green-200";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800 border border-yellow-200";
//       case "rejected":
//         return "bg-red-100 text-red-800 border border-red-200";
//       default:
//         return "bg-gray-100 text-gray-800 border border-gray-200";
//     }
//   };

//   const getEnvironmentBadgeColor = (env: string) => {
//     switch (env?.toUpperCase()) {
//       case "UAT":
//         return "bg-blue-100 text-blue-800 border border-blue-200";
//       case "STAGING":
//         return "bg-purple-100 text-purple-800 border border-purple-200";
//       case "PRODUCTION":
//         return "bg-green-100 text-green-800 border border-green-200";
//       default:
//         return "bg-gray-100 text-gray-800 border border-gray-200";
//     }
//   };

//   const formattedCreatedDate = dp.created_at
//     ? new Date(dp.created_at).toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       })
//     : "N/A";

//   const formattedUpdatedDate = dp.updated_at
//     ? new Date(dp.updated_at).toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       })
//     : "N/A";

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
//       <div className="nsdl-card w-full max-w-5xl max-h-[90vh] overflow-y-auto">
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <div className="p-2 bg-blue-100 rounded-lg">
//                 <ServerIcon className="w-6 h-6 text-blue-600" />
//               </div>
//               <div className="ml-4">
//                 <h3 className="nsdl-heading-3 text-gray-900">DP Details</h3>
//                 <p className="text-sm text-gray-500 mt-1">
//                   {dp.dp_name || "Unnamed DP"}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span
//                 className={`px-3 py-1.5 text-xs font-medium rounded-full ${getStatusClasses(
//                   dp.status
//                 )}`}
//               >
//                 {formatStatus(dp.status)}
//               </span>
//               <span
//                 className={`px-3 py-1 text-xs font-medium rounded-full ${getEnvironmentBadgeColor(
//                   dp.environment
//                 )}`}
//               >
//                 {dp.environment || "UAT"}
//               </span>
//               <button
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
//               >
//                 <XIcon className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="p-6">
//           <div className="space-y-8">
//             {/* Basic Information */}
//             <div>
//               <h4 className="nsdl-body-bold text-gray-700 mb-4">
//                 Basic Information
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="nsdl-label text-xs">DP Name</label>
//                   <p className="nsdl-body font-semibold">
//                     {dp.dp_name || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">DP ID</label>
//                   <p className="nsdl-body font-mono">{dp.id || "N/A"}</p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">IP Address</label>
//                   <p className="nsdl-body flex items-center">
//                     <ServerIcon className="w-3 h-3 mr-1" />
//                     {dp.ip_address || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Callback URL</label>
//                   <p className="nsdl-body truncate">
//                     {dp.callback_url || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Email</label>
//                   <p className="flex items-center">{dp.email_id}</p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Environment</label>
//                   <p className="nsdl-body flex items-center">
//                     <span
//                       className={`px-2 py-1 text-xs rounded ${getEnvironmentBadgeColor(
//                         dp.environment
//                       )}`}
//                     >
//                       {dp.environment || "UAT"}
//                     </span>
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">
//                     Certificate Serial
//                   </label>
//                   <p className="nsdl-body font-mono flex items-center">
//                     <CertificateIcon className="w-3 h-3 mr-1" />
//                     {dp.cert_serial_number || "Not Available"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Business Information */}
//             <div>
//               <h4 className="nsdl-body-bold text-gray-700 mb-4 flex items-center">
//                 <BusinessIcon className="w-4 h-4 mr-2" />
//                 Business Information
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="nsdl-label text-xs">CM BP ID</label>
//                   <p className="nsdl-body flex items-center">
//                     <BusinessIcon className="w-3 h-3 mr-1" />
//                     {dp.cm_bp_id || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Segment</label>
//                   <p className="nsdl-body flex items-center">
//                     <SegmentIcon className="w-3 h-3 mr-1" />
//                     {dp.segment || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Exchange Code</label>
//                   <p className="nsdl-body flex items-center">
//                     <ExchangeIcon className="w-3 h-3 mr-1" />
//                     {dp.exchange_code || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">
//                     Business Lead Name
//                   </label>
//                   <p className="nsdl-body flex items-center">
//                     <PeopleIcon className="w-3 h-3 mr-1" />
//                     {dp.business_lead_name || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">
//                     Technical Lead Name
//                   </label>
//                   <p className="nsdl-body flex items-center">
//                     <PeopleIcon className="w-3 h-3 mr-1" />
//                     {dp.technical_lead_name || "N/A"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Timestamps & Metadata */}
//             <div>
//               <h4 className="nsdl-body-bold text-gray-700 mb-4">
//                 Timestamps & Metadata
//               </h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="nsdl-label text-xs">Created At</label>
//                   <p className="nsdl-body flex items-center">
//                     <CalendarIcon className="w-3 h-3 mr-1" />
//                     {formattedCreatedDate}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Last Updated</label>
//                   <p className="nsdl-body flex items-center">
//                     <CalendarIcon className="w-3 h-3 mr-1" />
//                     {formattedUpdatedDate}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">RSA Key Status</label>
//                   <p className="nsdl-body">
//                     <span
//                       className={`px-2 py-1 text-xs rounded ${getStatusClasses(
//                         dp.rsa_key_status
//                       )}`}
//                     >
//                       {formatStatus(dp.rsa_key_status)}
//                     </span>
//                   </p>
//                 </div>
//                 <div>
//                   <label className="nsdl-label text-xs">Requestor ID</label>
//                   <p className="nsdl-body font-mono">
//                     {dp.requestor_id || "N/A"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Validation Section */}
//             <div className="pt-6 border-t border-gray-200">
//               <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
//                 <div className="flex items-center">
//                   <ShieldIcon className="w-5 h-5 text-blue-600 mr-3" />
//                   <div>
//                     <p className="nsdl-body-bold">DP Validation</p>
//                     <p className="text-sm text-gray-500">
//                       Validate the DP configuration before approval
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={onValidate}
//                   className="px-6 py-2.5 nsdl-btn-primary rounded-lg transition-colors flex items-center"
//                 >
//                   <ShieldIcon className="w-4 h-4 mr-2" />
//                   Validate
//                 </button>
//               </div>
//             </div>

//             {/* Action Buttons - Only show for pending status */}
//             {normalizeStatus(dp.status) === "pending" && (
//               <div className="pt-4 border-t border-gray-200">
//                 <div className="flex justify-end space-x-3">
//                   <button
//                     onClick={() => onAction(dp, "reject")}
//                     disabled={isProcessing}
//                     className="px-6 py-2.5 nsdl-btn-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
//                   >
//                     {isProcessing ? (
//                       <>
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
//                         Processing...
//                       </>
//                     ) : (
//                       <>
//                         <XIcon className="w-4 h-4 mr-2" />
//                         Reject
//                       </>
//                     )}
//                   </button>
//                   <button
//                     onClick={() => onAction(dp, "approve")}
//                     disabled={isProcessing}
//                     className="px-6 py-2.5 nsdl-btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
//                   >
//                     {isProcessing ? (
//                       <>
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                         Processing...
//                       </>
//                     ) : (
//                       <>
//                         <CheckIcon className="w-4 h-4 mr-2" />
//                         Approve
//                       </>
//                     )}
//                   </button>
//                 </div>
//                 <p className="text-sm text-gray-500 mt-2 text-right">
//                   This will approve/reject the DP for {dp.environment || "UAT"}{" "}
//                   environment
//                 </p>
//               </div>
//             )}

//             {/* Status Message for non-pending DPs */}
//             {normalizeStatus(dp.status) !== "pending" && (
//               <div className="pt-4 border-t border-gray-200">
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="flex items-center">
//                     {normalizeStatus(dp.status) === "approved" ? (
//                       <>
//                         <CheckIcon className="w-5 h-5 text-emerald-600 mr-3" />
//                         <div>
//                           <p className="nsdl-body-bold text-emerald-700">
//                             DP Already Approved for {dp.environment || "UAT"}
//                           </p>
//                           <p className="text-sm text-gray-500">
//                             This DP has been approved on {formattedUpdatedDate}
//                           </p>
//                           {dp.requestor_id && (
//                             <p className="text-sm text-gray-500 mt-1">
//                               Requestor ID: {dp.requestor_id}
//                             </p>
//                           )}
//                         </div>
//                       </>
//                     ) : (
//                       <>
//                         <XIcon className="w-5 h-5 text-red-600 mr-3" />
//                         <div>
//                           <p className="nsdl-body-bold text-red-700">
//                             DP {formatStatus(dp.status)} for{" "}
//                             {dp.environment || "UAT"}
//                           </p>
//                           <p className="text-sm text-gray-500">
//                             This DP was {normalizeStatus(dp.status)} on{" "}
//                             {formattedUpdatedDate}
//                           </p>
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- MAIN COMPONENT: DpApprovalScreen WITH LIVE SEARCH ---
// export const DpApprovalScreen: React.FC = () => {
//   const [dpDetails, setDpDetails] = useState<DpDetail[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [errors, setErrors] = useState<AppError[]>([]);
//   const [toasts, setToasts] = useState<ToastProps[]>([]);
//   const [processingId, setProcessingId] = useState<string | null>(null);
//   const [selectedDp, setSelectedDp] = useState<DpDetail | null>(null);
//   const [statusFilter, setStatusFilter] = useState<"all" | DpDetail["status"]>(
//     "all"
//   );
//   const [environmentFilter, setEnvironmentFilter] = useState<string>("UAT");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchLoading, setSearchLoading] = useState(false);

//   // Pagination state
//   const [pagination, setPagination] = useState<PaginationInfo>({
//     totalRecords: 0,
//     totalPages: 0,
//     currentPage: 1,
//     limit: 10,
//   });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   // Stats state
//   const [stats, setStats] = useState({
//     pending: 0,
//     approved: 0,
//     rejected: 0,
//     total: 0,
//   });

//   // Refs for debouncing
//   const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   // Add error utility
//   const addError = useCallback((error: Omit<AppError, "id" | "timestamp">) => {
//     const newError: AppError = {
//       ...error,
//       id: Date.now().toString(),
//       timestamp: new Date().toISOString(),
//     };
//     setErrors((prev) => [newError, ...prev.slice(0, 4)]);
//   }, []);

//   // Add toast utility
//   const addToast = useCallback((toast: Omit<ToastProps, "id" | "onClose">) => {
//     const id = Date.now().toString();
//     setToasts((prev) => [
//       ...prev,
//       { ...toast, id, onClose: () => removeToast(id) },
//     ]);
//   }, []);

//   const removeToast = useCallback((id: string) => {
//     setToasts((prev) => prev.filter((toast) => toast.id !== id));
//   }, []);

//   // Load DP details with pagination
//   const loadDpDetails = useCallback(
//     async (page: number = currentPage, limit: number = pageSize) => {
//       setIsLoading(true);
//       setErrors([]);

//       // Only set search loading if there's a search term
//       if (searchTerm.trim()) {
//         setSearchLoading(true);
//       }

//       const result = await fetchDpDetailsWithPagination({
//         environment: environmentFilter,
//         status: statusFilter === "all" ? undefined : statusFilter,
//         page: page,
//         limit: limit,
//         searchTerm: searchTerm.trim() || undefined,
//       });

//       if ("error" in result) {
//         addError(result.error);
//         setDpDetails([]);
//         setPagination({
//           totalRecords: 0,
//           totalPages: 0,
//           currentPage: page,
//           limit: limit,
//         });
//         setStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
//       } else {
//         setDpDetails(result.data);
//         setPagination(result.pagination);
//         setCurrentPage(page);

//         // Calculate stats from the current data
//         const pendingCount = result.data.filter(
//           (dp) => normalizeStatus(dp.status) === "pending"
//         ).length;
//         const approvedCount = result.data.filter(
//           (dp) => normalizeStatus(dp.status) === "approved"
//         ).length;
//         const rejectedCount = result.data.filter(
//           (dp) => normalizeStatus(dp.status) === "rejected"
//         ).length;

//         setStats({
//           pending: pendingCount,
//           approved: approvedCount,
//           rejected: rejectedCount,
//           total: result.data.length,
//         });

//         // Only show toast for search results or no results
//         if (searchTerm.trim() && result.data.length === 0) {
//           addToast({
//             message: `No DPs found for "${searchTerm}"`,
//             type: "info",
//             duration: 3000,
//           });
//         } else if (result.data.length === 0) {
//           addToast({
//             message: "No DP records found",
//             type: "info",
//             duration: 3000,
//           });
//         }
//       }

//       setIsLoading(false);
//       setSearchLoading(false);
//     },
//     [
//       environmentFilter,
//       statusFilter,
//       searchTerm,
//       currentPage,
//       pageSize,
//       addError,
//       addToast,
//     ]
//   );

//   // Handle live search with debouncing
//   const handleSearchChange = (value: string) => {
//     setSearchTerm(value);

//     // Clear previous timeout
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }

//     // Show loading indicator for non-empty queries
//     if (value.trim().length > 0) {
//       setSearchLoading(true);
//     }

//     // Set new timeout for debounced search (500ms delay)
//     searchTimeoutRef.current = setTimeout(() => {
//       setCurrentPage(1);
//       loadDpDetails(1, pageSize);
//     }, 500);
//   };

//   // Handle clear search
//   const handleClearSearch = () => {
//     setSearchTerm("");
//     setCurrentPage(1);
//     loadDpDetails(1, pageSize);

//     // Clear timeout if exists
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//       searchTimeoutRef.current = null;
//     }
//   };

//   // Handle keyboard shortcuts
//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       // Clear any pending debounced search
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//         searchTimeoutRef.current = null;
//       }

//       // Trigger immediate search
//       setCurrentPage(1);
//       loadDpDetails(1, pageSize);
//     }

//     if (e.key === "Escape" && searchTerm) {
//       handleClearSearch();
//     }
//   };

//   // Handle page change
//   const handlePageChange = (page: number) => {
//     if (page >= 1 && page <= pagination.totalPages) {
//       loadDpDetails(page, pageSize);
//     }
//   };

//   // Handle page size change
//   const handlePageSizeChange = (size: number) => {
//     setPageSize(size);
//     loadDpDetails(1, size);
//   };

//   // Handle error actions
//   const handleErrorAction = useCallback(
//     (errorId: string, action?: AppError["action"]) => {
//       const error = errors.find((e) => e.id === errorId);
//       if (!error) return;

//       switch (action) {
//         case "retry":
//           loadDpDetails(currentPage, pageSize);
//           break;
//         case "refresh":
//           window.location.reload();
//           break;
//         case "contact_support":
//           window.location.href = `mailto:support@example.com?subject=DP%20Approval%20Error&body=${encodeURIComponent(
//             error.message
//           )}`;
//           break;
//         default:
//           break;
//       }

//       setErrors((prev) => prev.filter((e) => e.id !== errorId));
//     },
//     [errors, currentPage, pageSize, loadDpDetails]
//   );

//   // Initialize on component mount
//   useEffect(() => {
//     loadDpDetails(1, pageSize);

//     // Cleanup timeout on unmount
//     return () => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Reload when filters change
//   useEffect(() => {
//     setCurrentPage(1);
//     loadDpDetails(1, pageSize);
//   }, [statusFilter, environmentFilter]);

//   const handleAction = useCallback(
//     async (dp: DpDetail, action: "approve" | "reject" | "view") => {
//       if (action === "view") {
//         setSelectedDp(dp);
//         return;
//       }

//       setProcessingId(dp.id);

//       try {
//         const result =
//           action === "approve"
//             ? await approveDp(dp.id, dp.environment || "UAT")
//             : await rejectDp(dp.id, dp.environment || "UAT");

//         if (result.success) {
//           // Show success toast
//           addToast({
//             message: `Successfully ${
//               action === "approve" ? "approved" : "rejected"
//             } ${dp.dp_name || "DP"}`,
//             type: "success",
//             duration: 3000,
//           });

//           // Close the modal
//           setSelectedDp(null);

//           // Reload data
//           await loadDpDetails(currentPage, pageSize);

//           // If we're on a page that might become empty after approval/reject,
//           // adjust the page number if needed
//           if (dpDetails.length <= 1 && currentPage > 1) {
//             const newPage = currentPage - 1;
//             loadDpDetails(newPage, pageSize);
//           }
//         } else if (result.error) {
//           // Show error toast
//           addToast({
//             message: result.error.message,
//             type: "error",
//             duration: 5000,
//           });
//         }
//       } catch (err) {
//         // Show error toast
//         const errorMessage =
//           err instanceof Error ? err.message : "Unknown error occurred";
//         addToast({
//           message: `Failed to ${action} DP: ${errorMessage}`,
//           type: "error",
//           duration: 5000,
//         });
//       } finally {
//         setProcessingId(null);
//       }
//     },
//     [currentPage, pageSize, loadDpDetails, addToast, dpDetails]
//   );

//   const handleValidate = () => {
//     alert(`Validating DP: ${selectedDp?.dp_name}`);
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pages = [];
//     const maxPagesToShow = 5;

//     if (pagination.totalPages <= maxPagesToShow) {
//       for (let i = 1; i <= pagination.totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//       let endPage = startPage + maxPagesToShow - 1;

//       if (endPage > pagination.totalPages) {
//         endPage = pagination.totalPages;
//         startPage = Math.max(1, endPage - maxPagesToShow + 1);
//       }

//       for (let i = startPage; i <= endPage; i++) {
//         pages.push(i);
//       }
//     }

//     return pages;
//   };

//   const startRecord = (currentPage - 1) * pagination.limit + 1;
//   const endRecord = Math.min(
//     currentPage * pagination.limit,
//     pagination.totalRecords
//   );

//   return (
//     <DpApprovalErrorBoundary>
//       <div className="min-h-screen bg-gray-50 py-10">
//         {/* Toast Container */}
//         <ToastContainer toasts={toasts} onClose={removeToast} />

//         {/* Error Display Area */}
//         {errors.length > 0 && (
//           <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-10 mb-6 space-y-2">
//             {errors.map((error) => (
//               <ErrorDisplay
//                 key={error.id}
//                 error={error}
//                 onAction={(action) =>
//                   error.id && handleErrorAction(error.id!, action)
//                 }
//                 onDismiss={() =>
//                   error.id &&
//                   setErrors((prev) => prev.filter((e) => e.id !== error.id))
//                 }
//               />
//             ))}
//           </div>
//         )}

//         <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-10">
//           {/* Header */}
//           <div className="mb-10">
//             <h1 className="nsdl-heading-1 text-gray-900 mb-3">
//               DP Approval Management
//             </h1>
//             <p className="nsdl-body text-gray-600">
//               Review and approve/reject Depository Participant registrations for
//               UAT and STAGING environments
//             </p>
//           </div>

//           {/* Stats Cards */}
//           {isLoading ? (
//             <StatsSkeleton />
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//               <div className="nsdl-card p-6">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-amber-100 rounded-lg">
//                     <ServerIcon className="w-6 h-6 text-amber-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="nsdl-body text-gray-600">Pending</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       {stats.pending}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               <div className="nsdl-card p-6">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-emerald-100 rounded-lg">
//                     <CheckIcon className="w-6 h-6 text-emerald-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="nsdl-body text-gray-600">Approved</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       {stats.approved}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               <div className="nsdl-card p-6">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-red-100 rounded-lg">
//                     <XIcon className="w-6 h-6 text-red-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="nsdl-body text-gray-600">Rejected</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       {stats.rejected}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               <div className="nsdl-card p-6">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-gray-100 rounded-lg">
//                     <ServerIcon className="w-6 h-6 text-gray-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="nsdl-body text-gray-600">Total</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       {stats.total}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Filters and Controls */}
//           <div className="nsdl-card p-6 mb-6">
//             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//               <div className="flex flex-col lg:flex-row lg:items-center gap-6">
//                 <div className="flex items-center">
//                   <FilterIcon className="w-5 h-5" />
//                   <span className="ml-3 nsdl-body-bold text-gray-700">
//                     Status:
//                   </span>
//                   <div className="flex flex-wrap gap-2 ml-4">
//                     {["all", "pending", "approved", "rejected"].map(
//                       (status) => (
//                         <button
//                           key={status}
//                           onClick={() =>
//                             setStatusFilter(
//                               status === "all"
//                                 ? "all"
//                                 : (status as DpDetail["status"])
//                             )
//                           }
//                           className={`px-4 py-2.5 nsdl-body rounded-lg transition-colors duration-200 ${
//                             statusFilter === (status === "all" ? "all" : status)
//                               ? "nsdl-btn-primary"
//                               : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                           }`}
//                         >
//                           {status === "all" ? "All" : formatStatus(status)}
//                         </button>
//                       )
//                     )}
//                   </div>
//                 </div>
//                 <div className="flex items-center">
//                   <ServerIcon className="w-5 h-5" />
//                   <span className="ml-3 nsdl-body-bold text-gray-700">
//                     Environment:
//                   </span>
//                   <div className="flex flex-wrap gap-2 ml-4">
//                     {["UAT", "STAGING"].map((env) => (
//                       <button
//                         key={env}
//                         onClick={() => setEnvironmentFilter(env)}
//                         className={`px-4 py-2.5 nsdl-body rounded-lg transition-colors duration-200 ${
//                           environmentFilter === env
//                             ? env === "UAT"
//                               ? "bg-blue-100 text-blue-700 border border-blue-300"
//                               : "bg-purple-100 text-purple-700 border border-purple-300"
//                             : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                         }`}
//                       >
//                         {env}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="flex flex-col sm:flex-row items-center gap-4">
//                 {/* Live Search Box */}
//                 <div className="flex items-center gap-3 w-full sm:w-auto">
//                   <div className="relative flex-1 sm:flex-initial min-w-[300px]">
//                     <input
//                       type="text"
//                       placeholder="Search by DP Name or ID"
//                       className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
//                       value={searchTerm}
//                       onChange={(e) => handleSearchChange(e.target.value)}
//                       onKeyDown={handleKeyDown}
//                       disabled={isLoading}
//                     />
//                     <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

//                     {/* Loading indicator */}
//                     {searchLoading && (
//                       <div className="absolute right-10 top-3">
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//                       </div>
//                     )}

//                     {/* Clear button */}
//                     {searchTerm && (
//                       <button
//                         onClick={handleClearSearch}
//                         className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
//                         disabled={isLoading}
//                         title="Clear search"
//                       >
//                         <XIcon className="w-4 h-4" />
//                       </button>
//                     )}
//                   </div>

//                   {/* Search status indicator */}
//                   {searchTerm && (
//                     <div className="text-sm text-gray-500 hidden sm:block">
//                       {dpDetails.length} result
//                       {dpDetails.length !== 1 ? "s" : ""} found
//                       {searchTerm && ` for "${searchTerm}"`}
//                     </div>
//                   )}
//                 </div>

//                 {/* Refresh Button */}
//                 <div className="flex items-center">
//                   <button
//                     onClick={() => loadDpDetails(currentPage, pageSize)}
//                     disabled={isLoading || searchLoading}
//                     className="flex items-center px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                     title="Refresh data"
//                   >
//                     <RefreshIcon className="w-4 h-4 mr-2" />
//                     Refresh
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Table Headings */}
//           <div className="bg-gray-50 rounded-t-lg border border-gray-200 p-4 mb-2">
//             <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
//               <div className="text-sm font-semibold text-gray-700">DP Name</div>
//               <div className="text-sm font-semibold text-gray-700">DP ID</div>
//               <div className="text-sm font-semibold text-gray-700">
//                 IP Address
//               </div>
//               <div className="text-sm font-semibold text-gray-700">
//                 Last Updated
//               </div>
//               <div className="text-sm font-semibold text-gray-700">Status</div>
//               <div className="text-sm font-semibold text-gray-700">Actions</div>
//             </div>
//           </div>

//           {/* DP List */}
//           {isLoading || searchLoading ? (
//             <DpListSkeleton />
//           ) : dpDetails.length > 0 ? (
//             <>
//               <div className="space-y-2">
//                 {dpDetails.map((dp) => (
//                   <DpListItem
//                     key={`${dp.id}-${dp.environment}-${dp.updated_at}`}
//                     dp={dp}
//                     onAction={handleAction}
//                     isProcessing={processingId === dp.id}
//                   />
//                 ))}
//               </div>

//               {/* Pagination Controls */}
//               {pagination.totalPages > 0 && (
//                 <div className="flex flex-col sm:flex-row items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
//                   <div className="flex items-center mb-4 sm:mb-0">
//                     <span className="text-sm text-gray-700 mr-3">
//                       Rows per page:
//                     </span>
//                     <select
//                       value={pageSize}
//                       onChange={(e) =>
//                         handlePageSizeChange(Number(e.target.value))
//                       }
//                       disabled={isLoading || searchLoading}
//                       className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       {[5, 10, 20, 50].map((size) => (
//                         <option key={size} value={size}>
//                           {size}
//                         </option>
//                       ))}
//                     </select>
//                     <span className="text-sm text-gray-600 ml-4">
//                       Showing {startRecord} to {endRecord} of{" "}
//                       {pagination.totalRecords} records
//                     </span>
//                   </div>

//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => handlePageChange(1)}
//                       disabled={currentPage === 1 || isLoading || searchLoading}
//                       className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                       title="First Page"
//                     >
//                       <ChevronDoubleLeftIcon className="w-4 h-4" />
//                     </button>

//                     <button
//                       onClick={() => handlePageChange(currentPage - 1)}
//                       disabled={currentPage === 1 || isLoading || searchLoading}
//                       className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                       title="Previous Page"
//                     >
//                       <ChevronLeftIcon className="w-4 h-4" />
//                     </button>

//                     <div className="flex items-center space-x-1">
//                       {getPageNumbers().map((page) => (
//                         <button
//                           key={page}
//                           onClick={() => handlePageChange(page)}
//                           disabled={isLoading || searchLoading}
//                           className={`min-w-[36px] px-3 py-1.5 text-sm border rounded ${
//                             currentPage === page
//                               ? "bg-blue-600 text-white border-blue-600"
//                               : "border-gray-300 hover:bg-gray-50"
//                           }`}
//                         >
//                           {page}
//                         </button>
//                       ))}
//                     </div>

//                     <button
//                       onClick={() => handlePageChange(currentPage + 1)}
//                       disabled={
//                         currentPage === pagination.totalPages ||
//                         isLoading ||
//                         searchLoading
//                       }
//                       className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                       title="Next Page"
//                     >
//                       <ChevronRightIcon className="w-4 h-4" />
//                     </button>

//                     <button
//                       onClick={() => handlePageChange(pagination.totalPages)}
//                       disabled={
//                         currentPage === pagination.totalPages ||
//                         isLoading ||
//                         searchLoading
//                       }
//                       className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                       title="Last Page"
//                     >
//                       <ChevronDoubleRightIcon className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="nsdl-card p-12 text-center">
//               <ServerIcon className="w-12 h-12 mx-auto text-gray-300" />
//               <h3 className="mt-4 nsdl-heading-3 text-gray-900">
//                 No DPs Found
//               </h3>
//               <p className="mt-2 text-gray-500 nsdl-body">
//                 {searchTerm
//                   ? "No DPs found matching your search criteria"
//                   : "No DP records found. Ensure the backend has data."}
//               </p>
//               {searchTerm && (
//                 <button
//                   onClick={handleClearSearch}
//                   className="mt-4 px-4 py-2 nsdl-btn-primary rounded-lg"
//                 >
//                   Clear Search
//                 </button>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Detail View Modal */}
//         {selectedDp && (
//           <DpDetailModal
//             dp={selectedDp}
//             onClose={() => setSelectedDp(null)}
//             onValidate={handleValidate}
//             onAction={handleAction}
//             isProcessing={processingId === selectedDp.id}
//           />
//         )}
//       </div>
//     </DpApprovalErrorBoundary>
//   );
// };

// export default DpApprovalScreen;

import React, { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const APPROVE_BASE = "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subscription {
  name?: string;
  service_id?: string;
  route_ids?: string[];
  routes?: string[];
  callbacks?: { success: string; failure: string };
}

interface Project {
  id: string;
  project_name: string;
  organisation_id: string;
  organisation_name: string;
  organisation_type: string;
  role: string;
  first_name: string;
  last_name: string;
  mobile_no: string;
  email_id: string;
  subscriptions: Subscription[];
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data: Project[];
  counts: {
    pending: string;
    approved: string;
    rejected: string;
    total: string;
  };
}

interface ApprovalDetails {
  id: string;
  org_id: string;
  email: string;
  create_cons_group: boolean;
  consumer_groupid: string | null;
  create_cons_group_err: string | null;
  add_cons_to_group: boolean;
  add_cons_to_group_err: string | null;
  add_plugins: boolean;
  add_plugins_err: string | null;
  vault_status: boolean;
  vault_status_err: string | null;
  key_status: boolean;
  key_id: string | null;
  key_secret: string | null;
  key_status_err: string | null;
  mail_status: boolean;
  mail_status_err: string | null;
  created_at: string;
  updated_at: string;
}

interface FilterState {
  name: string;
  date: string;
  statuses: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeStatus = (s: string) => s.toLowerCase();

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = normalizeStatus(status);
  const map: Record<string, React.CSSProperties> = {
    pending: {
      background: "#FFF3CD",
      color: "#92600A",
      border: "1px solid #FFD97D",
    },
    approved: {
      background: "#D1FAE5",
      color: "#065F46",
      border: "1px solid #6EE7B7",
    },
    rejected: {
      background: "#FEE2E2",
      color: "#991B1B",
      border: "1px solid #FCA5A5",
    },
    completed: {
      background: "#D1FAE5",
      color: "#065F46",
      border: "1px solid #6EE7B7",
    },
    "in-progress": {
      background: "#FFF3E0",
      color: "#8B5000",
      border: "1px solid #FFB74D",
    },
    "in progress": {
      background: "#FFF3E0",
      color: "#8B5000",
      border: "1px solid #FFB74D",
    },
    inprogress: {
      background: "#FFF3E0",
      color: "#8B5000",
      border: "1px solid #FFB74D",
    },
  };
  const style = map[s] || {
    background: "#F3F4F6",
    color: "#374151",
    border: "1px solid #D1D5DB",
  };
  return (
    <span
      style={{
        ...style,
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        fontFamily: "'Roboto Flex', sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

const ConfirmModal: React.FC<{
  type: "approve" | "reject";
  onConfirm: (reason?: string) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ type, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState("");
  const isApprove = type === "approve";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", marginTop: "36px" }}>
        {/* Big floating icon */}
        <div
          style={{
            position: "absolute",
            top: "-36px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: isApprove ? "#22C55E" : "#EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 20px ${
              isApprove ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"
            }`,
            zIndex: 81,
          }}
        >
          {isApprove ? (
            <CheckCircleSolid
              style={{ width: "40px", height: "40px", color: "white" }}
            />
          ) : (
            <XMarkIcon
              style={{
                width: "40px",
                height: "40px",
                color: "white",
                strokeWidth: 3,
              }}
            />
          )}
        </div>

        <div
          style={{
            background: "#FFF",
            borderRadius: "20px",
            width: "420px",
            padding: "52px 32px 32px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
            }}
          >
            <XMarkIcon style={{ width: "20px", height: "20px" }} />
          </button>

          {/* Icon */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "16px",
                background: "#FFF8EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect
                  x="4"
                  y="10"
                  width="20"
                  height="14"
                  rx="3"
                  stroke="#FF9800"
                  strokeWidth="2"
                />
                <rect
                  x="16"
                  y="18"
                  width="20"
                  height="14"
                  rx="3"
                  stroke="#FF9800"
                  strokeWidth="2"
                />
                <path
                  d="M10 22v-8M10 14l-3 3M10 14l3 3"
                  stroke="#FF9800"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <h3
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              textAlign: "center",
              margin: "0 0 8px",
            }}
          >
            Request{" "}
            <span style={{ color: "#FF9800" }}>
              {isApprove ? "Approved" : "Rejection"}
            </span>
          </h3>
          <p
            style={{
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "14px",
              color: "#6B7280",
              textAlign: "center",
              margin: "0 0 24px",
            }}
          >
            {isApprove
              ? "Are you sure you want to approve request ?"
              : "Are you sure you want to reject request ?"}
          </p>

          {!isApprove && (
            <div
              style={{
                background: "#F9F9F9",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF9800"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#1A1A1A",
                    fontFamily: "'Roboto Flex', sans-serif",
                  }}
                >
                  Reason
                </span>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  fontFamily: "'Roboto Flex', sans-serif",
                  fontSize: "13px",
                  color: "#374151",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#6B7280",
                letterSpacing: "0.8px",
              }}
            >
              CANCEL
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={loading || (!isApprove && !reason.trim())}
              style={{
                background: loading
                  ? "#D1D5DB"
                  : "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                color: "#FFF",
                border: "none",
                borderRadius: "12px",
                padding: "13px 36px",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.8px",
              }}
            >
              {loading ? "Processing..." : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Read-only Field ──────────────────────────────────────────────────────────

const ReadonlyField: React.FC<{
  label: string;
  icon?: React.ReactNode;
  value: string;
}> = ({ label, icon, value }) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "8px",
      }}
    >
      {icon && (
        <span style={{ color: "#8B5000", display: "flex" }}>{icon}</span>
      )}
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#6B7280",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          fontFamily: "'Roboto Flex', sans-serif",
        }}
      >
        {label}
      </span>
    </div>
    <div
      style={{
        background: "#F5F5F0",
        borderRadius: "10px",
        padding: "13px 16px",
        fontSize: "14px",
        color: "#374151",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      {value || "—"}
    </div>
  </div>
);

const IconUser = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconCard = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);
const IconDoc = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconHome = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
const IconCog = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
  </svg>
);
const IconMail = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconPhone = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.38a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.83-.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16a2 2 0 0 1 .27.92z" />
  </svg>
);
const IconShield = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ─── Org Detail View ──────────────────────────────────────────────────────────

const OrgDetailView: React.FC<{
  project: Project;
  onBack: () => void;
  onActionDone: () => void;
}> = ({ project, onBack, onActionDone }) => {
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${APPROVE_BASE}/api/dp/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: project.project_name,
          digiPluginsRequire: "true",
          serviceType: "all",
          organisation_id: project.organisation_id,
          email: project.email_id,
        }),
      });
      const json = await res.json();
      showToast(json.message || "Approved successfully", true);
      setConfirmType(null);
      setTimeout(() => onActionDone(), 1500);
    } catch {
      showToast("Failed to approve. Please try again.", false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `${APPROVE_BASE}/api/projects/${project.id}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );
      const json = await res.json();
      showToast(json.message || "Rejected successfully", true);
      setConfirmType(null);
      setTimeout(() => onActionDone(), 1500);
    } catch {
      showToast("Failed to reject. Please try again.", false);
    } finally {
      setActionLoading(false);
    }
  };

  const isPending = normalizeStatus(project.status) === "pending";

  return (
    <div
      style={{
        flex: 1,
        background: "#F5F5F0",
        minHeight: "100vh",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 100,
            background: toast.ok ? "#065F46" : "#991B1B",
            color: "#FFF",
            padding: "14px 24px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div
        style={{
          background: "#FFF",
          borderBottom: "1px solid #E9ECF1",
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#374151",
            }}
          >
            <ArrowLeftIcon style={{ width: "20px", height: "20px" }} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "#FFF8EE",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF9800"
                strokeWidth="2"
              >
                <rect x="2" y="7" width="10" height="8" rx="2" />
                <rect x="12" y="11" width="10" height="8" rx="2" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: "26px",
                fontWeight: 700,
                color: "#1A1A1A",
                margin: 0,
              }}
            >
              Organization <span style={{ color: "#FF9800" }}>Details</span>
            </h1>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div style={{ padding: "32px 40px", maxWidth: "1000px" }}>
        {/* Basic Details */}
        <div
          style={{
            background: "#FFF",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              margin: "0 0 28px",
            }}
          >
            Basic Details
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <ReadonlyField
              label="Organization Name"
              icon={<IconUser />}
              value={project.organisation_name || project.project_name}
            />
            <ReadonlyField
              label="Organization ID"
              icon={<IconCard />}
              value={project.organisation_id}
            />
            <ReadonlyField
              label="Organization Details"
              icon={<IconDoc />}
              value={project.project_name}
            />
            <ReadonlyField
              label="Organization Type"
              icon={<IconHome />}
              value={project.organisation_type}
            />
            <ReadonlyField
              label="Select Role"
              icon={<IconCog />}
              value={project.role}
            />
            <ReadonlyField
              label="Email ID"
              icon={<IconMail />}
              value={project.email_id}
            />
            <ReadonlyField
              label="Mobile No."
              icon={<IconPhone />}
              value={project.mobile_no}
            />
          </div>
        </div>

        {/* Security Management */}
        <div
          style={{
            background: "#FFF",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              margin: "0 0 28px",
            }}
          >
            Security Management
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "12px",
                }}
              >
                <span style={{ color: "#8B5000" }}>
                  <IconUser />
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#6B7280",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  IP ADDRESS
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["192.168.1.1", "192.168.1.2"].map((ip) => (
                  <span
                    key={ip}
                    style={{
                      background: "#F5F5F0",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "13px",
                      color: "#374151",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {ip}{" "}
                    <XMarkIcon
                      style={{
                        width: "12px",
                        height: "12px",
                        color: "#9CA3AF",
                      }}
                    />
                  </span>
                ))}
              </div>
            </div>
            <ReadonlyField
              label="Encryption Public Key"
              icon={<IconShield />}
              value="Public key on file"
            />
            <ReadonlyField
              label="*** Digital Signature Public Key"
              icon={<IconShield />}
              value="Digital signature key on file"
            />
          </div>
        </div>

        {/* Subscription Management */}
        <div
          style={{
            background: "#FFF",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              margin: "0 0 20px",
            }}
          >
            Subscription Management
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {project.subscriptions?.length > 0 ? (
              project.subscriptions.map((sub, i) => (
                <div
                  key={i}
                  style={{
                    background: "#F5F5F0",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#1A1A1A",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {sub.name || sub.service_id || `Subscription ${i + 1}`}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        marginTop: "4px",
                      }}
                    >
                      {sub.callbacks?.success
                        ? `Success: ${sub.callbacks.success}`
                        : "No callback configured"}
                    </div>
                  </div>
                  <ChevronRightIcon
                    style={{ width: "18px", height: "18px", color: "#9CA3AF" }}
                  />
                </div>
              ))
            ) : (
              <div
                style={{
                  color: "#9CA3AF",
                  fontSize: "14px",
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                No subscriptions
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {isPending && (
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={() => setConfirmType("reject")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "#6B7280",
                letterSpacing: "0.8px",
              }}
            >
              REJECT
            </button>
            <button
              onClick={() => setConfirmType("approve")}
              style={{
                background:
                  "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                color: "#FFF",
                border: "none",
                borderRadius: "12px",
                padding: "14px 40px",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.8px",
              }}
            >
              APPROVE
            </button>
          </div>
        )}
      </div>

      {confirmType && (
        <ConfirmModal
          type={confirmType}
          onConfirm={confirmType === "approve" ? handleApprove : handleReject}
          onClose={() => setConfirmType(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

// ─── Steps definition ─────────────────────────────────────────────────────────

interface Step {
  key: keyof ApprovalDetails;
  errKey: keyof ApprovalDetails;
  label: string;
  description: string;
  serviceType: string;
}

const STEPS: Step[] = [
  {
    key: "create_cons_group",
    errKey: "create_cons_group_err",
    label: "Create Consumer Group",
    description: "Creates a Kong consumer group for the organization.",
    serviceType: "create_consumer_group",
  },
  {
    key: "add_cons_to_group",
    errKey: "add_cons_to_group_err",
    label: "Add Consumer to Group",
    description: "Adds the consumer to the newly created group.",
    serviceType: "add_consumer_to_group",
  },
  {
    key: "add_plugins",
    errKey: "add_plugins_err",
    label: "Attach Plugins",
    description: "Attaches required API plugins to the consumer group.",
    serviceType: "attach_plugins",
  },
  {
    key: "vault_status",
    errKey: "vault_status_err",
    label: "Vault Certificate",
    description: "Stores encryption certificates in the secure vault.",
    serviceType: "vault_cert",
  },
  {
    key: "key_status",
    errKey: "key_status_err",
    label: "Generate Credentials",
    description: "Generates API key and secret for the organization.",
    serviceType: "generate_credentials",
  },
  {
    key: "mail_status",
    errKey: "mail_status_err",
    label: "Send Welcome Email",
    description: "Sends onboarding confirmation email to the organization.",
    serviceType: "mail",
  },
];

// ─── Onboarding Progress View ─────────────────────────────────────────────────

const OnboardingProgressView: React.FC<{
  project: Project;
  onBack: () => void;
}> = ({ project, onBack }) => {
  const [details, setDetails] = useState<ApprovalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepLoading, setStepLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${APPROVE_BASE}/api/dp/get_approval_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation_id: project.organisation_id,
          email_id: project.email_id,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDetails(await res.json());
    } catch {
      showToast("Could not load approval details", false);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRetry = async (serviceType: string) => {
    setStepLoading(serviceType);
    try {
      const res = await fetch(`${APPROVE_BASE}/api/dp/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: project.project_name,
          digiPluginsRequire: "true",
          serviceType,
          organisation_id: project.organisation_id,
          email: project.email_id,
        }),
      });
      const json = await res.json();
      showToast(json.message || "Step retried", true);
      await fetchDetails();
    } catch {
      showToast("Retry failed", false);
    } finally {
      setStepLoading(null);
    }
  };

  const handleManual = async (serviceType: string) => {
    setStepLoading(`manual_${serviceType}`);
    try {
      const res = await fetch(`${APPROVE_BASE}/api/dp/manual_approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation_id: project.organisation_id,
          email: project.email_id,
          serviceType,
          groupName: project.project_name,
        }),
      });
      const json = await res.json();
      showToast(json.message || "Manual step completed", true);
      await fetchDetails();
    } catch {
      showToast("Manual action failed", false);
    } finally {
      setStepLoading(null);
    }
  };

  const completedCount = details
    ? STEPS.filter((s) => details[s.key] === true).length
    : 0;

  return (
    <div
      style={{
        flex: 1,
        background: "#F5F5F0",
        minHeight: "100vh",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 100,
            background: toast.ok ? "#065F46" : "#991B1B",
            color: "#FFF",
            padding: "14px 24px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div
        style={{
          background: "#FFF",
          borderBottom: "1px solid #E9ECF1",
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#374151",
          }}
        >
          <ArrowLeftIcon style={{ width: "20px", height: "20px" }} />
        </button>
        <h1
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "26px",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: 0,
          }}
        >
          Onboarding <span style={{ color: "#FF9800" }}>In Progress...</span>
        </h1>
      </div>

      <div style={{ padding: "40px" }}>
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "60px", color: "#9CA3AF" }}
          >
            <ArrowPathIcon
              style={{
                width: "32px",
                height: "32px",
                margin: "0 auto 12px",
                display: "block",
                animation: "spin 1s linear infinite",
              }}
            />
            Loading onboarding details...
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div
              style={{
                background: "#FFF",
                borderRadius: "16px",
                padding: "20px 28px",
                marginBottom: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#1A1A1A",
                  }}
                >
                  {project.organisation_name || project.project_name}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6B7280",
                    marginTop: "4px",
                  }}
                >
                  {project.organisation_id} · {project.email_id}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#FF9800",
                  }}
                >
                  {completedCount}/{STEPS.length}
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                  steps completed
                </div>
              </div>
            </div>

            {/* Timeline steps */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr",
                alignItems: "start",
              }}
            >
              {STEPS.map((step, i) => {
                const done = details?.[step.key] === true;
                const err = details?.[step.errKey] as string | null;
                const isRetrying = stepLoading === step.serviceType;
                const isManual = stepLoading === `manual_${step.serviceType}`;
                const isLast = i === STEPS.length - 1;

                return (
                  <React.Fragment key={step.key}>
                    {/* Left: time + circle */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        paddingRight: "24px",
                        paddingTop: "12px",
                        position: "relative",
                        minHeight: "120px",
                      }}
                    >
                      {!isLast && (
                        <div
                          style={{
                            position: "absolute",
                            right: "36px",
                            top: "60px",
                            width: "2px",
                            height: "calc(100% - 16px)",
                            background: done ? "#22C55E" : "#E5E7EB",
                          }}
                        />
                      )}
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#374151",
                          whiteSpace: "nowrap",
                          textAlign: "right",
                        }}
                      >
                        {details
                          ? new Date(details.updated_at).toLocaleDateString(
                              "en-IN",
                              { day: "numeric", month: "long", year: "numeric" }
                            )
                          : "—"}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9CA3AF",
                          textAlign: "right",
                        }}
                      >
                        {details
                          ? new Date(details.updated_at).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )
                          : ""}
                      </div>
                      <div
                        style={{
                          marginTop: "10px",
                          width: "34px",
                          height: "34px",
                          borderRadius: "50%",
                          background: done ? "#22C55E" : "#E5E7EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {done ? (
                          <CheckCircleSolid
                            style={{
                              width: "20px",
                              height: "20px",
                              color: "white",
                            }}
                          />
                        ) : (
                          <ExclamationCircleIcon
                            style={{
                              width: "18px",
                              height: "18px",
                              color: "#9CA3AF",
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Right: card */}
                    <div
                      style={{
                        background: "#FFF",
                        borderRadius: "16px",
                        padding: "20px 24px",
                        marginBottom: "16px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        border: done
                          ? "1px solid #D1FAE5"
                          : err
                          ? "1px solid #FEE2E2"
                          : "1px solid #F0F0F0",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: done ? "#D1FAE5" : "#FEE2E2",
                          color: done ? "#065F46" : "#991B1B",
                        }}
                      >
                        {done ? "Completed" : "Failed"}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "12px",
                            background: "#FFF8EE",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {done ? (
                            <CheckCircleIcon
                              style={{
                                width: "28px",
                                height: "28px",
                                color: "#FF9800",
                              }}
                            />
                          ) : (
                            <ExclamationCircleIcon
                              style={{
                                width: "28px",
                                height: "28px",
                                color: "#EF4444",
                              }}
                            />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "13px",
                              color: "#1A1A1A",
                              textTransform: "uppercase",
                              letterSpacing: "0.6px",
                              marginBottom: "4px",
                            }}
                          >
                            {step.label}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#6B7280",
                              lineHeight: 1.5,
                            }}
                          >
                            {step.description}
                          </div>

                          {!done && err && (
                            <div
                              style={{
                                marginTop: "10px",
                                background: "#FEF2F2",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "12px",
                                color: "#991B1B",
                                fontFamily: "monospace",
                              }}
                            >
                              {err}
                            </div>
                          )}

                          {!done && (
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                marginTop: "14px",
                              }}
                            >
                              <button
                                onClick={() => handleRetry(step.serviceType)}
                                disabled={!!stepLoading}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "8px 16px",
                                  borderRadius: "8px",
                                  border: "none",
                                  background:
                                    "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                                  color: "#FFF",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: stepLoading
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: stepLoading ? 0.7 : 1,
                                  fontFamily: "'Roboto Flex', sans-serif",
                                }}
                              >
                                <ArrowPathIcon
                                  style={{
                                    width: "13px",
                                    height: "13px",
                                    animation: isRetrying
                                      ? "spin 1s linear infinite"
                                      : "none",
                                  }}
                                />
                                {isRetrying ? "Retrying..." : "Retry"}
                              </button>
                              <button
                                onClick={() => handleManual(step.serviceType)}
                                disabled={!!stepLoading}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "8px 16px",
                                  borderRadius: "8px",
                                  border: "1px solid #E5E7EB",
                                  background: "#FFF",
                                  color: "#374151",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: stepLoading
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: stepLoading ? 0.7 : 1,
                                  fontFamily: "'Roboto Flex', sans-serif",
                                }}
                              >
                                <WrenchScrewdriverIcon
                                  style={{
                                    width: "13px",
                                    height: "13px",
                                    animation: isManual
                                      ? "spin 1s linear infinite"
                                      : "none",
                                  }}
                                />
                                {isManual ? "Processing..." : "Mark Manual"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <button
              onClick={onBack}
              style={{
                marginTop: "8px",
                background:
                  "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
                color: "#FFF",
                border: "none",
                borderRadius: "12px",
                padding: "14px 40px",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.8px",
              }}
            >
              DONE
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── Filter Modal ─────────────────────────────────────────────────────────────

const FilterModal: React.FC<{
  filters: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
}> = ({ filters, onApply, onClose }) => {
  const [tab, setTab] = useState<"name" | "date" | "status">("name");
  const [local, setLocal] = useState<FilterState>({ ...filters });

  const toggleStatus = (s: string) =>
    setLocal((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(s)
        ? prev.statuses.filter((x) => x !== s)
        : [...prev.statuses, s],
    }));

  const statusOptions = [
    { value: "approved", label: "Approved", bg: "#D1FAE5", color: "#065F46" },
    { value: "rejected", label: "Rejected", bg: "#FEE2E2", color: "#991B1B" },
    { value: "pending", label: "Pending", bg: "#FFF3CD", color: "#92600A" },
    {
      value: "in-progress",
      label: "In Progress",
      bg: "#FFF3E0",
      color: "#8B5000",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#FFF",
          borderRadius: "16px",
          width: "420px",
          padding: "28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            Filters
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
            }}
          >
            <XMarkIcon style={{ width: "20px", height: "20px" }} />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: "24px",
            borderBottom: "1px solid #E5E7EB",
            marginBottom: "24px",
          }}
        >
          {(["name", "date", "status"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "15px",
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? "#1A1A1A" : "#6B7280",
                paddingBottom: "12px",
                borderBottom:
                  tab === t ? "2px solid #FF9800" : "2px solid transparent",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "name" && (
          <div>
            <p
              style={{
                fontFamily: "'Roboto Flex', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                color: "#1A1A1A",
                marginBottom: "12px",
              }}
            >
              Filter by name
            </p>
            <div style={{ position: "relative" }}>
              <MagnifyingGlassIcon
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "16px",
                  height: "16px",
                  color: "#9CA3AF",
                }}
              />
              <input
                type="text"
                placeholder="Search name"
                value={local.name}
                onChange={(e) => setLocal({ ...local, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 36px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  fontFamily: "'Roboto Flex', sans-serif",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
          </div>
        )}
        {tab === "date" && (
          <div>
            <p
              style={{
                fontFamily: "'Roboto Flex', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                color: "#1A1A1A",
                marginBottom: "12px",
              }}
            >
              Filter by date
            </p>
            <input
              type="date"
              value={local.date}
              onChange={(e) => setLocal({ ...local, date: e.target.value })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        )}
        {tab === "status" && (
          <div>
            <p
              style={{
                fontFamily: "'Roboto Flex', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                color: "#1A1A1A",
                marginBottom: "16px",
              }}
            >
              Filter by status
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {statusOptions.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={local.statuses.includes(opt.value)}
                    onChange={() => toggleStatus(opt.value)}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "#FF9800",
                      cursor: "pointer",
                    }}
                  />
                  <span
                    style={{
                      background: opt.bg,
                      color: opt.color,
                      padding: "4px 14px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: "'Roboto Flex', sans-serif",
                    }}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "32px",
          }}
        >
          <button
            onClick={() => {
              setLocal({ name: "", date: "", statuses: [] });
              onApply({ name: "", date: "", statuses: [] });
              onClose();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#6B7280",
              letterSpacing: "0.5px",
            }}
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              onApply(local);
              onClose();
            }}
            style={{
              background: "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
              color: "#FFF",
              border: "none",
              borderRadius: "10px",
              padding: "12px 32px",
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            APPLY
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pagination Button ────────────────────────────────────────────────────────

const PagBtn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, active, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      minWidth: "34px",
      height: "34px",
      padding: "0 8px",
      borderRadius: "8px",
      border: active ? "none" : "1px solid #E5E7EB",
      background: active
        ? "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)"
        : "#FFFFFF",
      color: active ? "#FFF" : disabled ? "#D1D5DB" : "#374151",
      fontSize: "13px",
      fontWeight: active ? 700 : 400,
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Roboto Flex', sans-serif",
    }}
  >
    {children}
  </button>
);

// ─── Main List Component ──────────────────────────────────────────────────────

type ViewMode = "list" | "detail" | "onboarding";

const DpApprovalScreen: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [counts, setCounts] = useState({
    pending: "0",
    approved: "0",
    rejected: "0",
    total: "0",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    name: "",
    date: "",
    statuses: [],
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setProjects(json.data || []);
      setCounts(
        json.counts || {
          pending: "0",
          approved: "0",
          rejected: "0",
          total: "0",
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleViewClick = (p: Project) => {
    setSelectedProject(p);
    const s = normalizeStatus(p.status);
    const isInProgress =
      s.includes("progress") || s === "inprogress" || s === "completed";
    setViewMode(isInProgress ? "onboarding" : "detail");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedProject(null);
  };
  const handleActionDone = () => {
    fetchProjects();
    setViewMode("list");
    setSelectedProject(null);
  };

  if (viewMode === "detail" && selectedProject)
    return (
      <OrgDetailView
        project={selectedProject}
        onBack={handleBack}
        onActionDone={handleActionDone}
      />
    );
  if (viewMode === "onboarding" && selectedProject)
    return (
      <OnboardingProgressView project={selectedProject} onBack={handleBack} />
    );

  const filtered = projects.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      p.organisation_name.toLowerCase().includes(term) ||
      p.organisation_id.toLowerCase().includes(term) ||
      p.project_name.toLowerCase().includes(term) ||
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term);
    const matchName =
      !filters.name ||
      (p.organisation_name + " " + p.first_name + " " + p.last_name)
        .toLowerCase()
        .includes(filters.name.toLowerCase());
    const matchDate = !filters.date || p.updated_at.startsWith(filters.date);
    const matchStatus =
      filters.statuses.length === 0 ||
      filters.statuses.includes(normalizeStatus(p.status));
    return matchSearch && matchName && matchDate && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };
  const activeFilterCount =
    (filters.statuses.length > 0 ? 1 : 0) +
    (filters.name ? 1 : 0) +
    (filters.date ? 1 : 0);

  const statCards = [
    {
      label: "Pending",
      value: counts.pending,
      icon: "⏳",
      iconBg: "#FFE599",
      color: "#92600A",
    },
    {
      label: "Approved",
      value: counts.approved,
      icon: "✓",
      iconBg: "#D1FAE5",
      color: "#065F46",
    },
    {
      label: "Rejected",
      value: counts.rejected,
      icon: "✕",
      iconBg: "#FEE2E2",
      color: "#991B1B",
    },
    {
      label: "Total",
      value: counts.total,
      icon: "≡",
      iconBg: "#EDE9FE",
      color: "#4C1D95",
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        background: "#F9F9F9",
        minHeight: "100vh",
        padding: "36px 40px",
        fontFamily: "'Roboto Flex', sans-serif",
      }}
    >
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "32px",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Organization{" "}
          <span style={{ color: "#FF9800" }}>Approval Management</span>
        </h1>
        <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "6px" }}>
          Review and approve/reject organization registrations.
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid #F0F0F0",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#1A1A1A",
                  lineHeight: 1,
                }}
              >
                {String(card.value).padStart(2, "0")}
              </div>
              <div
                style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}
              >
                {card.label}
              </div>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: card.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                color: card.color,
                fontWeight: 700,
              }}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <MagnifyingGlassIcon
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "#9CA3AF",
              }}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "300px",
                padding: "11px 12px 11px 36px",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                fontSize: "14px",
                fontFamily: "'Roboto Flex', sans-serif",
                outline: "none",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9CA3AF",
                }}
              >
                <XMarkIcon style={{ width: "16px", height: "16px" }} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            title="Filters"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              background: activeFilterCount > 0 ? "#FFF8EE" : "#FFFFFF",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <FunnelIcon
              style={{
                width: "18px",
                height: "18px",
                color: activeFilterCount > 0 ? "#FF9800" : "#6B7280",
              }}
            />
            {activeFilterCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "#FF9800",
                  color: "#FFF",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "10px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={fetchProjects}
          disabled={isLoading}
          title="Refresh"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            background: "#FFFFFF",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          <ArrowPathIcon
            style={{
              width: "18px",
              height: "18px",
              color: "#6B7280",
              animation: isLoading ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid #F0F0F0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1.5fr 1.2fr 1fr",
            padding: "14px 24px",
            background: "#F9F9F9",
            borderBottom: "1px solid #F0F0F0",
          }}
        >
          {["ORG NAME", "ORG ID", "LAST UPDATED", "STATUS", "ACTIONS"].map(
            (h) => (
              <div
                key={h}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1A1A1A",
                  letterSpacing: "0.6px",
                  fontFamily: "'Roboto Flex', sans-serif",
                }}
              >
                {h}
              </div>
            )
          )}
        </div>

        {isLoading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: "14px",
            }}
          >
            <ArrowPathIcon
              style={{
                width: "24px",
                height: "24px",
                margin: "0 auto 8px",
                display: "block",
                animation: "spin 1s linear infinite",
              }}
            />
            Loading...
          </div>
        ) : paginated.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: "14px",
            }}
          >
            No records found.
          </div>
        ) : (
          paginated.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1.5fr 1.2fr 1fr",
                padding: "18px 24px",
                borderBottom: "1px solid #F0F0F0",
                alignItems: "center",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "#FAFAFA";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent";
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#1A1A1A",
                  }}
                >
                  {p.organisation_name || p.project_name || "—"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9CA3AF",
                    marginTop: "2px",
                  }}
                >
                  {p.first_name} {p.last_name}
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span style={{ fontSize: "13px", color: "#374151" }}>
                  ID:{" "}
                  {p.organisation_id.length > 12
                    ? p.organisation_id.slice(0, 12) + "…"
                    : p.organisation_id}
                </span>
                {p.subscriptions?.length > 1 && (
                  <span
                    style={{
                      background: "#F3F4F6",
                      color: "#374151",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      fontSize: "10px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +{p.subscriptions.length - 1}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                <CalendarDaysIcon
                  style={{
                    width: "14px",
                    height: "14px",
                    color: "#9CA3AF",
                    flexShrink: 0,
                  }}
                />
                {formatDate(p.updated_at)}
              </div>
              <div>
                <StatusBadge status={p.status} />
              </div>
              <div>
                <button
                  onClick={() => handleViewClick(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#2563EB",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "'Roboto Flex', sans-serif",
                    padding: "4px 0",
                  }}
                >
                  <EyeIcon style={{ width: "15px", height: "15px" }} /> View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          <div style={{ fontSize: "13px", color: "#6B7280" }}>
            Showing{" "}
            {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–
            {Math.min(currentPage * pageSize, filtered.length)} of{" "}
            {filtered.length} results
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <PagBtn
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronDoubleLeftIcon
                style={{ width: "14px", height: "14px" }}
              />
            </PagBtn>
            <PagBtn
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon style={{ width: "14px", height: "14px" }} />
            </PagBtn>
            {getPageNumbers().map((n) => (
              <PagBtn
                key={n}
                onClick={() => setCurrentPage(n)}
                active={currentPage === n}
              >
                {n}
              </PagBtn>
            ))}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span style={{ color: "#9CA3AF", fontSize: "13px" }}>...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PagBtn onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </PagBtn>
            )}
            <PagBtn
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon style={{ width: "14px", height: "14px" }} />
            </PagBtn>
            <PagBtn
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronDoubleRightIcon
                style={{ width: "14px", height: "14px" }}
              />
            </PagBtn>
          </div>
        </div>
      )}

      {showFilterModal && (
        <FilterModal
          filters={filters}
          onApply={(f) => {
            setFilters(f);
            setCurrentPage(1);
          }}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DpApprovalScreen;