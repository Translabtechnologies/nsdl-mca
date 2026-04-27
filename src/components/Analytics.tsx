// components/Analytics.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { NSDLButton } from "./NSDLComponents";

const Analytics: React.FC = () => {
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

export default Analytics;
