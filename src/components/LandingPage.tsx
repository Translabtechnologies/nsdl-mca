import React from "react";
import { useNavigate } from "react-router-dom";
import dpApprovalIcon from "../assets/dp-approval.svg";
import apiMigrationIcon from "../assets/ApiMigration.png";
import analyticsIcon from "../assets/Analytics.png";
import rolesIcon from "../assets/Roles.png";

interface FunctionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  route: string;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const cards: FunctionCard[] = [
    {
      icon: (
        <img
          src={dpApprovalIcon}
          alt="Org Management"
          style={{ width: "48px", height: "48px" }}
        />
      ),
      title: "Org Management",
      description: "Review and approve Org registrations.",
      buttonLabel: "Manage Approvals",
      route: "/dp-approval",
    },
    {
      icon: (
        <img
          src={apiMigrationIcon}
          alt="API Migration"
          style={{ width: "48px", height: "48px" }}
        />
      ),
      title: "API Migration",
      description: "View or approve request",
      buttonLabel: "Review Requests",
      route: "/api-migration-approval",
    },
    {
      icon: (
        <img
          src={analyticsIcon}
          alt="Analytics"
          style={{ width: "48px", height: "48px" }}
        />
      ),
      title: "Analytics",
      description: "View usage statistics and insights",
      buttonLabel: "View Analytics",
      route: "/analytics",
    },
    // {
    //   icon: (
    //     <img
    //       src={rolesIcon}
    //       alt="Roles"
    //       style={{ width: "48px", height: "48px" }}
    //     />
    //   ),
    //   title: "Roles",
    //   description: "View and manage roles",
    //   buttonLabel: "View",
    //   route: "/roles",
    // },
    {
      icon: (
        <img
          src={rolesIcon}
          alt="Audit"
          style={{ width: "48px", height: "48px" }}
        />
      ),
      title: "Audit",
      description: "View and manage audit logs",
      buttonLabel: "View",
      route: "/audit",
    }
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#FAFAF8" }}
    >
      {/* ── Hero / Welcome Banner ── */}
      <section
        style={{
          width: "100%",
          minHeight: "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px 24px 20px",
          background: "#FCF9F8",
        }}
      >
        <h1
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "36px",
            fontWeight: 700,
            color: "#1A1A1A",
            marginBottom: "8px",
            lineHeight: 1.2,
          }}
        >
          Welcome to{" "}
          <span
            style={{
              background: "linear-gradient(39.34deg, #FF9800 0%, #FF9800 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            MCA Portal
          </span>
        </h1>

        {/* Gradient underline bar */}
        <div
          style={{
            width: "400px",
            height: "3px",
            borderRadius: "6px",
            background:
              "linear-gradient(269.95deg, #FF9800 46.66%, #8B5000 56.86%)",
            marginBottom: "12px",
          }}
        />

        <p
          style={{
            fontFamily: "'Roboto Flex', sans-serif",
            fontSize: "15px",
            color: "#554434",
            maxWidth: "650px",
            lineHeight: "1.5",
          }}
        >
          Multi-Connect App (MCA) enables NSDL administrators to manage Org
          Onboarding Requests, create various Gateway environments and migration
          APIs from lower to higher environments.
        </p>
      </section>

      {/* ── Functions Section ── */}
      <main
        style={{
          background: "#FFFFFF",
          flex: 1,
          padding: "24px 24px 32px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "28px",
              fontWeight: 700,
              textAlign: "center",
              color: "#1A1A1A",
              marginBottom: "4px",
            }}
          >
            Functions
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#554434",
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "14px",
              marginBottom: "24px",
            }}
          >
            Select a core management function to proceed.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            {cards.map((card) => (
              <FunctionCardComponent
                key={card.title}
                card={card}
                onNavigate={() => navigate(card.route)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

interface FunctionCardProps {
  card: FunctionCard;
  onNavigate: () => void;
}

const FunctionCardComponent: React.FC<FunctionCardProps> = ({
  card,
  onNavigate,
}) => {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 6px 20px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 2px 12px rgba(0,0,0,0.08)";
      }}
    >
      {/* Orange top section with icon */}
      <div
        style={{
          background: "#FF9800",
          padding: "16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "75px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "#FFFFFF",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {card.icon}
        </div>
      </div>

      {/* Card body */}
      <div
        style={{
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <h3
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "#1A1A1A",
            marginBottom: "6px",
            textAlign: "center",
          }}
        >
          {card.title}
        </h3>
        <p
          style={{
            fontFamily: "'Roboto Flex', sans-serif",
            fontSize: "13px",
            color: "#554434",
            lineHeight: "1.4",
            textAlign: "center",
            marginBottom: "14px",
            flex: 1,
          }}
        >
          {card.description}
        </p>

        <button
          onClick={onNavigate}
          style={{
            width: "100%",
            padding: "9px 14px",
            background: "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontFamily: "'Roboto Flex', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.2s ease, transform 0.15s ease",
            boxShadow: "0 3px 10px rgba(139,80,0,0.30)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(0)";
          }}
        >
          {card.buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
