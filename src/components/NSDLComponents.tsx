import React from "react";

interface NSDLButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export const NSDLButton: React.FC<NSDLButtonProps> = ({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  type = "button",
  className = "",
}) => {
  const baseClasses =
    variant === "primary" ? "nsdl-btn-primary" : "nsdl-btn-secondary";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </button>
  );
};

interface NSDLCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const NSDLCard: React.FC<NSDLCardProps> = ({
  children,
  className = "",
  hover = true,
}) => {
  return (
    <div className={`nsdl-card ${hover ? "hover:shadow-xl" : ""} ${className}`}>
      {children}
    </div>
  );
};

interface NSDLBadgeProps {
  status: "pending" | "approved" | "rejected" | "default";
  children: React.ReactNode;
}

export const NSDLBadge: React.FC<NSDLBadgeProps> = ({ status, children }) => {
  const statusClass = {
    pending: "nsdl-badge-pending",
    approved: "nsdl-badge-approved",
    rejected: "nsdl-badge-rejected",
    default: "bg-gray-100 text-gray-800",
  }[status];

  return <span className={`nsdl-badge ${statusClass}`}>{children}</span>;
};

interface NSDLInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const NSDLInput: React.FC<NSDLInputProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="nsdl-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="nsdl-input w-full"
      />
    </div>
  );
};
