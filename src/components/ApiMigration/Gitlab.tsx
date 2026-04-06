import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

// GitLab Merge Request Interfaces
interface GitLabMergeRequest {
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

interface GitLabResponse {
  success: boolean;
  message: string;
  data: GitLabMergeRequest[];
}

const Gitlab: React.FC = () => {
  const navigate = useNavigate();

  // GitLab States
  const [gitlabRequests, setGitlabRequests] = useState<GitLabMergeRequest[]>(
    []
  );
  const [isLoadingGitlab, setIsLoadingGitlab] = useState(false);
  const [gitlabError, setGitlabError] = useState<string | null>(null);
  const [gitlabSuccess, setGitlabSuccess] = useState<string | null>(null);
  const [selectedMr, setSelectedMr] = useState<GitLabMergeRequest | null>(null);
  const [approveComment, setApproveComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch GitLab merge requests
  const fetchGitlabMergeRequests = async () => {
    setIsLoadingGitlab(true);
    setGitlabError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/api/gitlab/merge-requests/open`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data: GitLabResponse = await response.json();
      if (data.success) {
        setGitlabRequests(data.data || []);
      } else {
        throw new Error(
          data.message || "Failed to fetch GitLab merge requests"
        );
      }
    } catch (err) {
      setGitlabError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoadingGitlab(false);
    }
  };

  // GitLab Actions
  const handleApproveMr = async (mrIid: number) => {
    if (!approveComment.trim()) {
      setGitlabError("Comment is required for approval");
      return;
    }

    setIsProcessing(true);
    setGitlabError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/api/gitlab/merge-requests/${mrIid}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: approveComment }),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setGitlabSuccess("Merge request approved successfully!");
        setApproveComment("");
        setSelectedMr(null);
        await fetchGitlabMergeRequests();
      } else {
        throw new Error(data.message || "Failed to approve merge request");
      }
    } catch (err) {
      setGitlabError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMergeMr = async (mrIid: number) => {
    setIsProcessing(true);
    setGitlabError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/api/gitlab/merge-requests/${mrIid}/merge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setGitlabSuccess("Merge request merged successfully!");
        setSelectedMr(null);
        await fetchGitlabMergeRequests();
      } else {
        throw new Error(data.message || "Failed to merge merge request");
      }
    } catch (err) {
      setGitlabError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMergeStatusBadge = (status: string) => {
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

  // Navigation to other sections
  const handleNavigateToEnvironments = () => {
    navigate("/api-migration/environments");
  };

  const handleNavigateToMigration = () => {
    navigate("/api-migration/migration");
  };

  useEffect(() => {
    fetchGitlabMergeRequests();
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="nsdl-heading-2 text-gray-900 mb-4">
          GitLab Merge Requests
        </h2>
        <p className="nsdl-body text-gray-600">
          Review, approve, and merge GitLab merge requests for API
          configurations.
        </p>
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleNavigateToEnvironments}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2H7a2 2 0 012 2h10a2 2 0 012 2v16m-2 0a2 2 0 01-2 2H7a2 2 0 01-2-2m0 0V5a2 2 0 012-2h10a2 2 0 012 2v16M9 7h6m-6 4h6m-6 4h6"
              />
            </svg>
            Manage Environments
          </button>
          <button
            onClick={handleNavigateToMigration}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            View Migration Requests
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {gitlabError && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <strong className="font-medium">Error</strong>
            <div className="mt-1 text-sm">{gitlabError}</div>
          </div>
        </div>
      )}

      {gitlabSuccess && (
        <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-emerald-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <strong className="font-medium">Success</strong>
            <div className="mt-1 text-sm">{gitlabSuccess}</div>
          </div>
        </div>
      )}

      {/* GitLab Merge Requests List */}
      <div className="nsdl-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="nsdl-heading-3 text-gray-900">
            Open Merge Requests ({gitlabRequests.length})
          </h3>
          <button
            onClick={fetchGitlabMergeRequests}
            disabled={isLoadingGitlab}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center text-sm font-medium"
          >
            {isLoadingGitlab ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
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
                Refresh
              </>
            )}
          </button>
        </div>

        {isLoadingGitlab ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-3 text-gray-500 font-medium">
              Loading merge requests...
            </p>
          </div>
        ) : gitlabRequests.length > 0 ? (
          <div className="space-y-4">
            {gitlabRequests.map((mr) => (
              <div
                key={mr.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">
                      {mr.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {mr.description || "No description provided."}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center">
                        <img
                          src={mr.author.avatar_url}
                          alt={mr.author.name}
                          className="w-4 h-4 rounded-full mr-1"
                        />
                        <span>By {mr.author.name}</span>
                      </div>
                      <div>
                        Branch: <strong>{mr.source_branch}</strong> →{" "}
                        <strong>{mr.target_branch}</strong>
                      </div>
                      <div>Created: {formatDate(mr.created_at)}</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getMergeStatusBadge(
                          mr.merge_status
                        )}`}
                      >
                        {mr.merge_status.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <a
                        href={mr.web_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        View in GitLab
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedMr(mr)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleMergeMr(mr.iid)}
                    disabled={
                      mr.merge_status !== "can_be_merged" || isProcessing
                    }
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? "Merging..." : "Merge"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              No Open Merge Requests
            </h4>
            <p className="text-gray-500 max-w-md mx-auto">
              No open GitLab merge requests found. All merge requests might be
              closed or merged.
            </p>
          </div>
        )}
      </div>

      {/* GitLab Approval Modal */}
      {selectedMr && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Approve Merge Request
              </h2>
              <button
                onClick={() => {
                  setSelectedMr(null);
                  setApproveComment("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {selectedMr.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  By {selectedMr.author.name} •{" "}
                  {formatDate(selectedMr.created_at)}
                </p>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Branch Information
                  </h4>
                  <div className="text-sm text-gray-600">
                    <div>
                      <strong>Source:</strong> {selectedMr.source_branch}
                    </div>
                    <div>
                      <strong>Target:</strong> {selectedMr.target_branch}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedMr.merge_status}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="approveComment" className="nsdl-label">
                  Approval Comment (Required)
                </label>
                <textarea
                  id="approveComment"
                  rows={3}
                  className="nsdl-input w-full"
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  placeholder="Enter your approval comments..."
                />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedMr(null);
                  setApproveComment("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveMr(selectedMr.iid)}
                disabled={!approveComment.trim() || isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Approving..." : "Approve Merge Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitLab Info */}
      <div className="mt-8 nsdl-card p-6">
        <h3 className="nsdl-heading-3 text-gray-900 mb-4">
          GitLab Integration Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div>
              <div className="font-medium text-gray-900">Review Requests</div>
              <div className="text-gray-600 text-sm mt-1">
                Check open merge requests for API configuration changes
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div>
              <div className="font-medium text-gray-900">Approve Changes</div>
              <div className="text-gray-600 text-sm mt-1">
                Provide approval with comments for configuration changes
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div>
              <div className="font-medium text-gray-900">Merge Requests</div>
              <div className="text-gray-600 text-sm mt-1">
                Merge approved requests to complete the configuration deployment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gitlab;
