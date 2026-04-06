import React, { useState, useEffect, useCallback, useRef } from "react";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

// --- TYPE DEFINITIONS ---
interface AuthenticationDetails {
  username: string;
  password?: string;
}

interface DpDetail {
  id: string;
  dp_name: string;
  ip_address: string;
  callback_url: string;
  authentication_details: AuthenticationDetails;
  created_at: string;
  updated_at: string;
  rsa_key_status: "APPROVED" | "PENDING" | "REJECTED" | "NOT APPROVED";
  environment?: string;
  rsa_public_key?: string;
  temp_rsa_key?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  db?: T;
}

// --- PAGINATION TYPES ---
interface PaginationInfo {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: {
    data: T[];
    pagination: PaginationInfo;
  };
}

// Interface for vault response
interface VaultResponse {
  success: boolean;
  data: {
    rsa_public_key: string;
    temp_rsa_key: string;
  };
}

// --- API CONFIGURATION ---
const BACKEND_API_URL = `${API_BASE_URL}/v1/api/dp`;

// --- API ERROR HANDLER ---
const handleApiError = async (response: Response): Promise<string> => {
  let errorText = await response.text();
  try {
    const errorJson = JSON.parse(errorText);
    errorText =
      errorJson.message || errorJson.error || errorJson.details || errorText;
  } catch (er) {
    // If not JSON, keep the text as is
  }
  return errorText || `HTTP ${response.status}: ${response.statusText}`;
};

// --- API CALLS ---
const submitKeyChangeRequest = async (
  dpId: string,
  newRsaKey: string,
  environment: string = "UAT"
): Promise<DpDetail> => {
  const updateUrl = `${API_BASE_URL}/v1/api/dp/request-rsa-change/${dpId}`;
  const payload = {
    rsa_public_key: newRsaKey,
    environment: environment,
  };

  const response = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await handleApiError(response);
    throw new Error(`Failed to submit key change request: ${errorText}`);
  }

  const result: ApiResponse<DpDetail> = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  if (result.db) {
    return result.db;
  }

  throw new Error("Invalid response format from server");
};

const approveRsaKey = async (
  dpId: string,
  environment: string = "UAT"
): Promise<DpDetail> => {
  const approveUrl = `${API_BASE_URL}/v1/api/dp/public-key/${dpId}`;
  const payload = { environment };

  const response = await fetch(approveUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await handleApiError(response);
    throw new Error(`Failed to approve RSA key: ${errorText}`);
  }

  const result: ApiResponse<{ db: DpDetail }> = await response.json();

  if (result.success && result.data?.db) {
    return result.data.db;
  }

  if (result.db) {
    return result.db;
  }

  throw new Error("Invalid response format from server");
};

const rejectRsaKey = async (
  dpId: string,
  environment: string = "UAT"
): Promise<DpDetail> => {
  const rejectUrl = `${API_BASE_URL}/v1/api/dp/reject-rsa-change/${dpId}`;
  const payload = { environment };

  const response = await fetch(rejectUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await handleApiError(response);
    throw new Error(`Failed to reject RSA key: ${errorText}`);
  }

  const result: ApiResponse<{ db: DpDetail }> = await response.json();

  if (result.success && result.data?.db) {
    return result.data.db;
  }

  if (result.db) {
    return result.db;
  }

  throw new Error("Invalid response format from server");
};

// Fetch RSA keys from vault
const fetchRsaKeysFromVault = async (
  dpId: string,
  environment: string = "UAT"
): Promise<{
  currentKey: string;
  tempKey: string;
} | null> => {
  const vaultUrl = `${API_BASE_URL}/v1/api/dp/public-key/${dpId}?environment=${environment}`;

  try {
    const response = await fetch(vaultUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      // If it's a 404, the keys might not exist in vault yet
      if (response.status === 404) {
        return null;
      }

      const errorText = await handleApiError(response);
      throw new Error(`Failed to fetch RSA keys from vault: ${errorText}`);
    }

    const result: VaultResponse = await response.json();

    if (result.success && result.data) {
      return {
        currentKey: result.data.rsa_public_key || "",
        tempKey: result.data.temp_rsa_key || "",
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching RSA keys from vault:", error);
    return null;
  }
};

// Paginated fetch function
const fetchDpDetailsWithPagination = async (
  options: {
    environment?: string;
    status?: string;
    page?: number;
    limit?: number;
    searchTerm?: string;
  } = {}
): Promise<{ data: DpDetail[]; pagination: PaginationInfo }> => {
  const {
    environment = "UAT",
    status,
    page = 1,
    limit = 10,
    searchTerm,
  } = options;

  const params = new URLSearchParams();

  if (status && status !== "all") {
    params.append("status", status.toUpperCase());
  }

  if (searchTerm) {
    params.append("id", searchTerm);
    params.append("dp_name", searchTerm);
  }

  params.append("page", page.toString());
  params.append("limit", limit.toString());

  // Add environment to the URL if needed
  let url = `${BACKEND_API_URL}`;
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await handleApiError(response);
      throw new Error(`Failed to load DP data: ${errorText}`);
    }

    const result: PaginatedApiResponse<any> = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch DP data");
    }

    let rawDetails: any[] = [];
    if (Array.isArray(result.data.data)) {
      rawDetails = result.data.data;
    } else if (Array.isArray(result.data)) {
      rawDetails = result.data;
    } else if (Array.isArray(result.db)) {
      rawDetails = result.db;
    }

    const validatedDetails = rawDetails.map((dp: any) => ({
      ...dp,
      rsa_key_status: dp.rsa_key_status || "PENDING",
      authentication_details: dp.authentication_details || {
        username: "Unknown",
      },
      environment: dp.environment || "UAT",
      rsa_public_key: dp.rsa_public_key || "",
      temp_rsa_key: dp.temp_rsa_key || "",
    }));

    const pagination = result.data.pagination || {
      totalRecords: validatedDetails.length,
      totalPages: Math.ceil(validatedDetails.length / limit),
      currentPage: page,
      limit: limit,
    };

    return { data: validatedDetails, pagination };
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};

// --- PROFESSIONAL ICONS COMPONENTS ---
const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  </svg>
);

const ServerIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
    />
  </svg>
);

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

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const RefreshIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const FilterIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

// Pagination Icons
const ChevronLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRightIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const ChevronDoubleLeftIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
    />
  </svg>
);

const ChevronDoubleRightIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 5l7 7-7 7M5 5l7 7-7 7"
    />
  </svg>
);

// --- STATUS BADGE COMPONENT ---
interface StatusBadgeProps {
  status: DpDetail["rsa_key_status"];
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const getStatusConfig = (status: DpDetail["rsa_key_status"]) => {
    switch (status) {
      case "APPROVED":
        return {
          className: "bg-green-50 text-green-700 border border-green-200",
          icon: <CheckIcon className="w-3 h-3 mr-1" />,
        };
      case "PENDING" || "Pending":
        return {
          className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
          icon: null,
        };
      case "REJECTED":
      case "NOT APPROVED":
        return {
          className: "bg-red-50 text-red-700 border border-red-200",
          icon: <XIcon className="w-3 h-3 mr-1" />,
        };
      default:
        return {
          className: "bg-gray-100 text-gray-700 border border-gray-200",
          icon: null,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}
    >
      {config.icon}
      {status}
    </span>
  );
};

// --- TOAST NOTIFICATION COMPONENT ---
interface ToastProps {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  const config = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      icon: <CheckIcon className="w-5 h-5 text-green-400" />,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      icon: <XIcon className="w-5 h-5 text-red-400" />,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      icon: null,
    },
  }[type];

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 mb-4`}>
      <div className="flex items-center">
        {config.icon && <div className="flex-shrink-0 mr-3">{config.icon}</div>}
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// --- LOADING SKELETONS ---
const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="nsdl-card p-6 animate-pulse">
        <div className="flex items-center">
          <div className="p-3 bg-gray-200 rounded-lg"></div>
          <div className="ml-4">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const DpListSkeleton: React.FC = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="nsdl-card p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    ))}
  </div>
);

// --- SUB-COMPONENT: DP List Item ---
interface DpListItemProps {
  dp: DpDetail;
  onAction?: (dp: DpDetail, action: "view" | "approve" | "reject") => void;
  role: "maker" | "checker";
  isProcessing?: boolean;
  onUpdateKey?: (dp: DpDetail) => void;
}

const DpListItem: React.FC<DpListItemProps> = ({
  dp,
  onAction,
  role,
  isProcessing = false,
  onUpdateKey,
}) => {
  const formattedDate = new Date(dp.updated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isPending = dp.rsa_key_status === "PENDING";

  return (
    <div className="nsdl-card p-6 mb-4 hover:shadow-md transition-shadow duration-200">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        {/* DP Name */}
        <div className="font-semibold text-gray-900 truncate">{dp.dp_name}</div>

        {/* DP ID */}
        <div className="font-mono text-sm truncate">{dp.id}</div>

        {/* IP Address */}
        <div className="text-gray-900">{dp.ip_address || "N/A"}</div>

        {/* Last Updated */}
        <div className="text-gray-900">{formattedDate}</div>

        {/* Status */}
        <div>
          <StatusBadge status={dp.rsa_key_status} />
        </div>

        {/* Actions */}
        <div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAction?.(dp, "view")}
              disabled={isProcessing}
              className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <EyeIcon className="w-3 h-3 mr-1" />
              View
            </button>

            {role === "maker" && !isPending && onUpdateKey && (
              <button
                onClick={() => onUpdateKey(dp)}
                disabled={isProcessing}
                className="px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <KeyIcon className="w-3 h-3 mr-1" />
                Update
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: DP Detail Modal ---
interface DpDetailModalProps {
  dp: DpDetail;
  onClose: () => void;
  role: "maker" | "checker";
  onAction?: (dp: DpDetail, action: "approve" | "reject") => void;
  isProcessing?: boolean;
}

const DpDetailModal: React.FC<DpDetailModalProps> = ({
  dp: initialDp,
  onClose,
  role,
  onAction,
  isProcessing = false,
}) => {
  const [dp, setDp] = useState<DpDetail>(initialDp);
  const [vaultKeys, setVaultKeys] = useState<{
    currentKey: string;
    tempKey: string;
  } | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [keysError, setKeysError] = useState<string | null>(null);

  const formattedCreatedDate = new Date(dp.created_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const formattedUpdatedDate = new Date(dp.updated_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  // Fetch keys from vault when modal opens
  useEffect(() => {
    const fetchKeys = async () => {
      // Only fetch for checker role when status is Pending or Approved
      if (
        role === "checker" &&
        (dp.rsa_key_status === "PENDING" || dp.rsa_key_status === "APPROVED")
      ) {
        setIsLoadingKeys(true);
        setKeysError(null);
        try {
          const keys = await fetchRsaKeysFromVault(
            dp.id,
            dp.environment || "UAT"
          );
          setVaultKeys(keys);
        } catch (error) {
          console.error("Error fetching keys from vault:", error);
          setKeysError(
            error instanceof Error
              ? error.message
              : "Failed to load RSA keys from vault"
          );
        } finally {
          setIsLoadingKeys(false);
        }
      }
    };

    fetchKeys();
  }, [dp.id, dp.environment, dp.rsa_key_status, role]);

  const handleRefreshKeys = async () => {
    setIsLoadingKeys(true);
    setKeysError(null);
    try {
      const keys = await fetchRsaKeysFromVault(dp.id, dp.environment || "UAT");
      setVaultKeys(keys);
    } catch (error) {
      console.error("Error refreshing keys from vault:", error);
      setKeysError(
        error instanceof Error
          ? error.message
          : "Failed to refresh RSA keys from vault"
      );
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // Update local dp state when prop changes
  useEffect(() => {
    setDp(initialDp);
  }, [initialDp]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="nsdl-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <KeyIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="nsdl-heading-3 text-gray-900">DP Details</h3>
                <p className="text-sm text-gray-500 mt-1">{dp.dp_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={dp.rsa_key_status} />
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="nsdl-body-bold text-gray-700 mb-4">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="nsdl-label text-xs">DP Name</label>
                  <p className="nsdl-body font-semibold">{dp.dp_name}</p>
                </div>
                <div>
                  <label className="nsdl-label text-xs">DP ID</label>
                  <p className="nsdl-body font-mono">{dp.id}</p>
                </div>
                <div>
                  <label className="nsdl-label text-xs">IP Address</label>
                  <p className="nsdl-body flex items-center">
                    <ServerIcon className="w-3 h-3 mr-1" />
                    {dp.ip_address}
                  </p>
                </div>
                <div>
                  <label className="nsdl-label text-xs">Callback URL</label>
                  <p className="nsdl-body truncate">{dp.callback_url}</p>
                </div>
                <div>
                  <label className="nsdl-label text-xs">Environment</label>
                  <p className="nsdl-body flex items-center">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {dp.environment || "UAT"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Authentication Details
            <div>
              <h4 className="nsdl-body-bold text-gray-700 mb-4">
                Authentication
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="nsdl-label text-xs">Username</label>
                  <p className="nsdl-body flex items-center">
                    <UserIcon className="w-3 h-3 mr-1" />
                    {dp.authentication_details.username}
                  </p>
                </div>
                <div>
                  <label className="nsdl-label text-xs">Password</label>
                  <p className="nsdl-body">
                    {dp.authentication_details.password
                      ? "••••••••"
                      : "Not Set"}
                  </p>
                </div>
              </div>
            </div> */}

            {/* Timestamps */}
            <div>
              <h4 className="nsdl-body-bold text-gray-700 mb-4">Timestamps</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="nsdl-label text-xs">Created At</label>
                  <p className="nsdl-body flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {formattedCreatedDate}
                  </p>
                </div>
                <div>
                  <label className="nsdl-label text-xs">Last Updated</label>
                  <p className="nsdl-body flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {formattedUpdatedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* RSA Keys Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="nsdl-body-bold text-gray-700">
                  RSA Public Keys
                </h4>
                {role === "checker" && (
                  <button
                    onClick={handleRefreshKeys}
                    disabled={isLoadingKeys}
                    className="flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshIcon className="w-4 h-4 mr-1" />
                    Refresh Keys
                  </button>
                )}
              </div>

              {isLoadingKeys ? (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-500">
                    Loading RSA keys from vault...
                  </p>
                </div>
              ) : keysError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <XIcon className="w-5 h-5 text-red-400 mr-2" />
                    <span className="text-red-700 text-sm">{keysError}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current RSA Key */}
                  {role === "checker" && vaultKeys?.currentKey && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="nsdl-label text-xs flex items-center">
                          <KeyIcon className="w-3 h-3 mr-1" />
                          Current RSA Key (From Vault)
                        </label>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                          Active
                        </span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-white p-3 rounded border border-gray-200 overflow-x-auto max-h-40">
                        {vaultKeys.currentKey}
                      </pre>
                    </div>
                  )}

                  {/* Temporary RSA Key */}
                  {role === "checker" && dp.rsa_key_status === "PENDING" && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="nsdl-label text-xs flex items-center">
                          <KeyIcon className="w-3 h-3 mr-1 text-yellow-600" />
                          Requested RSA Key Update
                        </label>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                          Pending Approval
                        </span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-white p-3 rounded border border-yellow-300 overflow-x-auto max-h-40">
                        {vaultKeys?.tempKey ||
                          dp.temp_rsa_key ||
                          "No update key requested"}
                      </pre>
                    </div>
                  )}

                  {/* For Maker role */}
                  {role === "maker" && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="nsdl-label text-xs mb-2 block">
                        Current RSA Public Key
                      </label>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-white p-3 rounded border border-gray-200 overflow-x-auto max-h-40">
                        {dp.rsa_public_key ||
                          "No RSA key available in database"}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons for Checker */}
            {role === "checker" && dp.rsa_key_status === "Pending" && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => onAction?.(dp, "reject")}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Reject"}
                  </button>
                  <button
                    onClick={() => onAction?.(dp, "approve")}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Approve"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Update Key Modal ---
interface UpdateKeyModalProps {
  dp: DpDetail;
  onClose: () => void;
  onSuccess: (updatedDp: DpDetail) => void;
}

const UpdateKeyModal: React.FC<UpdateKeyModalProps> = ({
  dp,
  onClose,
  onSuccess,
}) => {
  const [newRsaKey, setNewRsaKey] = useState("");
  const [environment, setEnvironment] = useState(dp.environment || "UAT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newRsaKey.trim()) {
      setError("RSA Public Key cannot be empty.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedDpData = await submitKeyChangeRequest(
        dp.id,
        newRsaKey,
        environment
      );
      onSuccess(updatedDpData);
      onClose();
    } catch (err) {
      console.error("Submission Error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during submission."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="nsdl-card w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <KeyIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="nsdl-heading-3 text-gray-900">Update RSA Key</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {dp.dp_name} • {dp.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Environment Selection */}
          <div className="mb-6">
            <label htmlFor="environment" className="nsdl-label">
              Environment
            </label>
            <select
              id="environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="nsdl-input w-full"
              disabled={isLoading}
            >
              <option value="UAT">UAT</option>
              <option value="STAGING">STAGING</option>
              <option value="PRODUCTION">PRODUCTION</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="rsaKey" className="nsdl-label">
              New RSA Public Key (BASE64 Encoded)
            </label>
            <textarea
              id="rsaKey"
              value={newRsaKey}
              onChange={(e) => {
                setNewRsaKey(e.target.value);
                setError(null);
              }}
              rows={8}
              placeholder="Paste the full new RSA Public Key here..."
              className="nsdl-input w-full font-mono resize-none"
              disabled={isLoading}
            />
          </div>

          {error && <Toast type="error" message={error} />}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 nsdl-body-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 nsdl-btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Key Change"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// MAIN COMPONENT: KeyManagement WITH PAGINATION
export const KeyManagement: React.FC = () => {
  const [dpDetails, setDpDetails] = useState<DpDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"maker" | "checker">("maker");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedDp, setSelectedDp] = useState<DpDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | DpDetail["rsa_key_status"]
  >("all");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("UAT");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDpForView, setSelectedDpForView] = useState<DpDetail | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalRecords: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load DP details with pagination
  const loadDpDetails = useCallback(
    async (page: number = currentPage, limit: number = pageSize) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchDpDetailsWithPagination({
          environment: environmentFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          page: page,
          limit: limit,
          searchTerm: searchTerm.trim() || undefined,
        });

        setDpDetails(result.data);
        setPagination(result.pagination);
        setCurrentPage(page);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load DP data. Please check your connection."
        );
        setDpDetails([]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, pageSize, environmentFilter, statusFilter, searchTerm]
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadDpDetails(page, pageSize);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    loadDpDetails(1, size);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (pagination.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;

      if (endPage > pagination.totalPages) {
        endPage = pagination.totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  useEffect(() => {
    // Load initial data
    loadDpDetails(1, pageSize);
  }, []);

  // Add effect to reload when filters change
  useEffect(() => {
    setCurrentPage(1);
    loadDpDetails(1, pageSize);
  }, [statusFilter, environmentFilter]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    loadDpDetails(1, pageSize);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadDpDetails(1, pageSize);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleUpdateKeyClick = (dp: DpDetail) => {
    setSelectedDp(dp);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateKeySuccess = (updatedDp: DpDetail) => {
    // Refresh the data
    loadDpDetails(currentPage, pageSize);

    setSuccessMessage("RSA key change request submitted successfully!");

    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const handleCloseModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedDp(null);
  };

  const handleAction = useCallback(
    async (dp: DpDetail, action: "view" | "approve" | "reject") => {
      if (action === "view") {
        setSelectedDpForView(dp);
        return;
      }

      if (
        !window.confirm(
          `Are you sure you want to ${action} this RSA key change?`
        )
      ) {
        return;
      }

      setProcessingId(dp.id);
      setError(null);

      try {
        let updatedDp: DpDetail;
        const environment = dp?.environment || "UAT";

        if (action === "approve") {
          updatedDp = await approveRsaKey(dp.id, environment);
          setSuccessMessage("RSA key approved successfully!");
        } else {
          updatedDp = await rejectRsaKey(dp.id, environment);
          setSuccessMessage("RSA key rejected successfully!");
        }

        // Refresh the data
        loadDpDetails(currentPage, pageSize);

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } catch (err) {
        console.error(`${action} Error:`, err);
        setError(
          err instanceof Error
            ? err.message
            : `Failed to ${action} RSA key. Please try again.`
        );
      } finally {
        setProcessingId(null);
      }
    },
    [currentPage, pageSize, loadDpDetails]
  );

  const handleRefresh = () => {
    loadDpDetails(currentPage, pageSize);
    setSuccessMessage("Data refreshed successfully!");

    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const pendingCount = dpDetails.filter(
    (dp) => dp && dp.rsa_key_status === "PENDING"
  ).length;
  const approvedCount = dpDetails.filter(
    (dp) => dp && dp.rsa_key_status === "APPROVED"
  ).length;
  const rejectedCount = dpDetails.filter(
    (dp) => dp && dp.rsa_key_status === "REJECTED"
  ).length;

  const startRecord = (currentPage - 1) * pagination.limit + 1;
  const endRecord = Math.min(
    currentPage * pagination.limit,
    pagination.totalRecords
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="nsdl-heading-1 text-gray-900 mb-3">
            RSA Key Management
          </h1>
          <p className="nsdl-body text-gray-600">
            Manage Depository Participant RSA Public Keys and Approvals
          </p>
        </div>

        {/* Role Switcher */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 inline-flex mb-10 shadow-sm">
          <button
            onClick={() => setCurrentRole("maker")}
            className={`nsdl-tab px-8 py-3 ${
              currentRole === "maker" ? "nsdl-tab-active" : ""
            }`}
          >
            Key Maker
          </button>
          <button
            onClick={() => setCurrentRole("checker")}
            className={`nsdl-tab px-8 py-3 ${
              currentRole === "checker" ? "nsdl-tab-active" : ""
            }`}
          >
            Key Checker
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Toast
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}

        {/* Error Message */}
        {error && (
          <Toast type="error" message={error} onClose={() => setError(null)} />
        )}

        {/* Stats Cards */}
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="nsdl-card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <KeyIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="nsdl-body text-gray-600">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="nsdl-card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="nsdl-body text-gray-600">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {approvedCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="nsdl-card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="nsdl-body text-gray-600">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {rejectedCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="nsdl-card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ServerIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="nsdl-body text-gray-600">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dpDetails.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="nsdl-card p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Status Filter */}
              <div className="flex items-center">
                <FilterIcon className="w-5 h-5" />
                <span className="ml-3 nsdl-body-bold text-gray-700">
                  Status:
                </span>
                <div className="flex flex-wrap gap-2 ml-4">
                  {["all", "PENDING", "APPROVED", "REJECTED"].map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        setStatusFilter(
                          status === "all"
                            ? "all"
                            : (status as DpDetail["rsa_key_status"])
                        )
                      }
                      className={`px-4 py-2.5 nsdl-body rounded-lg transition-colors duration-200 ${
                        statusFilter === (status === "all" ? "all" : status)
                          ? "nsdl-btn-primary"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {status === "all" ? "All" : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Environment Filter */}
              <div className="flex items-center">
                <ServerIcon className="w-5 h-5" />
                <span className="ml-3 nsdl-body-bold text-gray-700">
                  Environment:
                </span>
                <div className="flex flex-wrap gap-2 ml-4">
                  {["UAT", "STAGING"].map((env) => (
                    <button
                      key={env}
                      onClick={() => setEnvironmentFilter(env)}
                      className={`px-4 py-2.5 nsdl-body rounded-lg transition-colors duration-200 ${
                        environmentFilter === env
                          ? env === "UAT"
                            ? "bg-blue-100 text-blue-700 border border-blue-300"
                            : "bg-purple-100 text-purple-700 border border-purple-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Search Box */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="text"
                    placeholder="Search by DP Name or ID"
                    className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />
                  <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search and Refresh Buttons */}
              <div className="flex items-center gap-2">
                {/* <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2.5 text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </button> */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshIcon className="w-4 h-4 mr-2" />
                  {isLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Headings */}
        <div className="bg-gray-50 rounded-t-lg border border-gray-200 p-4 mb-2">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="text-sm font-semibold text-gray-700">DP Name</div>
            <div className="text-sm font-semibold text-gray-700">DP ID</div>
            <div className="text-sm font-semibold text-gray-700">
              IP Address
            </div>
            <div className="text-sm font-semibold text-gray-700">
              Last Updated
            </div>
            <div className="text-sm font-semibold text-gray-700">Status</div>
            <div className="text-sm font-semibold text-gray-700">Actions</div>
          </div>
        </div>

        {/* DP List */}
        {isLoading ? (
          <DpListSkeleton />
        ) : dpDetails.length > 0 ? (
          <>
            <div className="space-y-2">
              {dpDetails.map((dp) => (
                <DpListItem
                  key={dp.id}
                  dp={dp}
                  role={currentRole}
                  onAction={handleAction}
                  isProcessing={processingId === dp.id}
                  onUpdateKey={
                    currentRole === "maker" ? handleUpdateKeyClick : undefined
                  }
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4 sm:mb-0">
                  <span className="text-sm text-gray-700 mr-3">
                    Rows per page:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                    disabled={isLoading}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[3, 5, 10, 20, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600 ml-4">
                    Showing {startRecord} to {endRecord} of{" "}
                    {pagination.totalRecords} records
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isLoading}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title="First Page"
                  >
                    <ChevronDoubleLeftIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title="Previous Page"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                        className={`min-w-[36px] px-3 py-1.5 text-sm border rounded ${
                          currentPage === page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      currentPage === pagination.totalPages || isLoading
                    }
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title="Next Page"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={
                      currentPage === pagination.totalPages || isLoading
                    }
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title="Last Page"
                  >
                    <ChevronDoubleRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="nsdl-card p-12 text-center">
            <KeyIcon className="w-12 h-12 mx-auto text-gray-300" />
            <h3 className="mt-4 nsdl-heading-3 text-gray-900">No DPs Found</h3>
            <p className="mt-2 text-gray-500 nsdl-body">
              {searchTerm
                ? "No DPs found matching your search criteria"
                : "No DP records found. Ensure the backend has data."}
            </p>
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="mt-4 px-4 py-2 nsdl-btn-primary rounded-lg"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Update Key Modal */}
      {isUpdateModalOpen && selectedDp && (
        <UpdateKeyModal
          dp={selectedDp}
          onClose={handleCloseModal}
          onSuccess={handleUpdateKeySuccess}
        />
      )}

      {/* Detail View Modal */}
      {selectedDpForView && (
        <DpDetailModal
          dp={selectedDpForView}
          onClose={() => setSelectedDpForView(null)}
          role={currentRole}
          onAction={currentRole === "checker" ? handleAction : undefined}
          isProcessing={processingId === selectedDpForView.id}
        />
      )}
    </div>
  );
};

export default KeyManagement;
