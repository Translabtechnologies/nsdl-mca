// import React from "react";
// import { useNavigate } from "react-router-dom";
// // import { useAuth } from "../contexts/AuthContext";
// import dpApprovalIcon from "../assets/dp-approval.svg"; // Group icon
// import apiMigrationIcon from "../assets/api-migration.png";

// const LandingPage: React.FC = () => {
//   const navigate = useNavigate();
//   // const { user } = useAuth();

//   return (
//     <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
//       {/* Grey Banner */}
//       <div className="bg-[#E0E0E0] h-[280px]" />

//       {/* Main Content */}
//       <main className="flex-1 bg-white">
//         <div className="max-w-6xl mx-auto px-6 py-14">
//           <h2 className="text-4xl font-semibold text-center mb-2">Functions</h2>
//           <p className="text-center text-gray-600 mb-10">
//             Select a core management function to proceed.
//           </p>

//           {/* Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-3xl mx-auto">
//             {/* DB Approval Card */}
//             <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
//               <div className="flex items-start gap-4 mb-6">
//                 {/* Icon - Left */}
//                 <div className="w-16 h-16 bg-[#FFF3D6] rounded-lg flex items-center justify-center shrink-0">
//                   <img
//                     src={dpApprovalIcon}
//                     alt="DB Approval"
//                     className="w-9 h-9"
//                   />
//                 </div>

//                 {/* Content - Right */}
//                 <div>
//                   <h3 className="text-xl font-semibold text-[#1F2937] mb-1">
//                     DB Approval
//                   </h3>
//                   <p className="text-lg text-gray-600 leading-relaxed">
//                     Review and approve DP registrations.
//                   </p>
//                 </div>
//               </div>

//               {/* Button */}
//               <button
//                 onClick={() => navigate("/dp-approval")}
//                 className="w-full bg-[#8E211B] text-white py-2.5 rounded-md font-medium
//                  shadow-[0_3px_10px_rgba(0,0,0,0.25)]
//                  hover:bg-[#741A16] transition"
//               >
//                 Manage Approvals
//               </button>
//             </div>

//             {/* API Migration Card */}
//             <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
//               <div className="flex items-start gap-4 mb-6">
//                 {/* Icon - Left */}
//                 <div className="w-16 h-16 bg-[#FFF3D6] rounded-lg flex items-center justify-center shrink-0">
//                   <img
//                     src={apiMigrationIcon}
//                     alt="API Migration"
//                     className="w-9 h-9"
//                   />
//                 </div>

//                 {/* Content - Right */}
//                 <div>
//                   <h3 className="text-xl font-semibold text-[#1F2937] mb-1">
//                     API Migration
//                   </h3>
//                   <p className="text-lg text-gray-600 leading-relaxed">
//                     Approve deployment requests.
//                   </p>
//                 </div>
//               </div>

//               {/* Button */}
//               <button
//                 onClick={() => navigate("/api-migration-approval")}
//                 className="w-full bg-[#8E211B] text-white py-2.5 rounded-md font-medium
//                  shadow-[0_3px_10px_rgba(0,0,0,0.25)]
//                  hover:bg-[#741A16] transition"
//               >
//                 Review Requests
//               </button>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default LandingPage;

import React from "react";
import { useNavigate } from "react-router-dom";
import dpApprovalIcon from "../assets/dp-approval.svg"; // Org Management — existing icon
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
          style={{ width: "64px", height: "64px" }}
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
          style={{ width: "64px", height: "64px" }}
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
          style={{ width: "64px", height: "64px" }}
        />
      ),
      title: "Analytics",
      description: "View usage statistics and insights",
      buttonLabel: "View Analytics",
      route: "/analytics",
    },
    {
      icon: (
        <img
          src={rolesIcon}
          alt="Roles"
          style={{ width: "64px", height: "64px" }}
        />
      ),
      title: "Roles",
      description: "View and manage roles",
      buttonLabel: "View",
      route: "/roles",
    },
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
          minHeight: "431px",
          marginTop: "40px", // accounts for fixed navbar height
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "60px 24px",
          background: "#FCF9F8",
          position: "relative",
        }}
      >
        {/* Decorative underline accent under heading */}
        <h1
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "48px",
            fontWeight: 700,
            color: "#1A1A1A",
            marginBottom: "16px",
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
            width: "590px",
            height: "5px",
            borderRadius: "6px",
            background:
              "linear-gradient(269.95deg, #FF9800 46.66%, #8B5000 56.86%)",
            marginBottom: "28px",
          }}
        />

        <p
          style={{
            fontFamily: "'Roboto Flex', sans-serif",
            fontSize: "20px",
            color: " #554434",
            maxWidth: "722px",
            lineHeight: "1.7",
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
          padding: "60px 24px 80px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "40px",
              fontWeight: 700,
              textAlign: "center",
              color: "#1A1A1A",
              marginBottom: "8px",
            }}
          >
            Functions
          </h2>
          <p
            style={{
              textAlign: "center",
              color: " #554434",
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "16px",
              marginBottom: "48px",
            }}
          >
            Select a core management function to proceed.
          </p>

          {/* Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "28px",
            }}
          >
            {cards.map((card, index) => (
              <FunctionCardComponent
                key={card.title}
                card={card}
                onNavigate={() => navigate(card.route)}
                centered={index === 3} // Last card centered
                totalCards={cards.length}
                index={index}
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
  centered: boolean;
  totalCards: number;
  index: number;
}

const FunctionCardComponent: React.FC<FunctionCardProps> = ({
  card,
  onNavigate,
  centered,
  totalCards,
  index,
}) => {
  // The 4th card (Roles) should be centered — use CSS grid column trick
  const isLastOdd =
    centered && totalCards % 3 !== 0 && index === totalCards - 1;

  return (
    <div
      style={{
        gridColumn: isLastOdd ? "2 / 3" : undefined,
        background: "#FFFFFF",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Orange top section with icon */}
      <div
        style={{
          background: "#FF9800",
          padding: "32px 24px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "130px",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            background: "#FFFFFF",
            borderRadius: "16px",
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
          padding: "24px 24px 28px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <h3
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "28px",
            fontWeight: 700,
            color: "#1A1A1A",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          {card.title}
        </h3>
        <p
          style={{
            fontFamily: "'Roboto Flex', sans-serif",
            fontSize: "20px",
            color: " #554434",
            lineHeight: "1.6",
            textAlign: "center",
            marginBottom: "24px",
            flex: 1,
          }}
        >
          {card.description}
        </p>

        <button
          onClick={onNavigate}
          style={{
            width: "100%",
            padding: "13px 24px",
            background: "linear-gradient(39.34deg, #8B5000 0%, #FF9800 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontFamily: "'Roboto Flex', sans-serif",
            fontSize: "15px",
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
