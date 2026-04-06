// src/utils/apiMigrationUtils.ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

// Environment Interfaces
export interface Environment {
  id: string;
  name: string;
  admin_url: string;
  workspace: string;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentResponse {
  success: boolean;
  message: string;
  data: Environment | Environment[];
}

// Migration Interfaces
export interface MigrationRequest {
  id: string;
  status:
    | "pending_approval"
    | "APPROVED_PREP"
    | "PREP_COMPLETED"
    | "APPROVED_SYNC"
    | "SYNC_COMPLETED"
    | "rejected"
    | "failed";
  source_env_id: string;
  target_env_id: string;
  source_env_name: string;
  target_env_name: string;
  source_admin_url: string;
  target_admin_url: string;
  source_workspace: string;
  target_workspace: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  env1_config_path?: string;
  env2_config_path?: string;
  gitlab_env1_commit?: string;
  gitlab_env2_commit?: string;
  approved_by?: string;
  rejected_by?: string;
  rejection_reason?: string;
  branch?: string;
  sync_logs?: string;
  diff_logs?: string;
}

export interface MigrationResponse {
  success: boolean;
  message: string;
  data: MigrationRequest | MigrationRequest[];
}

// GitLab Merge Request Interfaces
export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar_url: string;
  };
  reviewers: Array<{
    id: number;
    username: string;
    name: string;
  }>;
  web_url: string;
  source_branch: string;
  target_branch: string;
  merge_status: string;
}

export interface GitLabResponse {
  success: boolean;
  message: string;
  data: GitLabMergeRequest[];
}

// Helper functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending_approval":
      return "bg-yellow-100 text-yellow-800";
    case "APPROVED_PREP":
      return "bg-blue-100 text-blue-800";
    case "PREP_COMPLETED":
      return "bg-purple-100 text-purple-800";
    case "APPROVED_SYNC":
      return "bg-indigo-100 text-indigo-800";
    case "SYNC_COMPLETED":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "failed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending_approval: "Pending Approval",
    APPROVED_PREP: "Prep Approved",
    PREP_COMPLETED: "Prep Completed",
    APPROVED_SYNC: "Sync Approved",
    SYNC_COMPLETED: "Sync Completed",
    rejected: "Rejected",
    failed: "Failed",
  };
  return statusMap[status] || status;
};

export const getMergeStatusBadge = (status: string) => {
  switch (status) {
    case "can_be_merged":
      return "bg-green-100 text-green-800";
    case "unchecked":
      return "bg-yellow-100 text-yellow-800";
    case "cannot_be_merged":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
