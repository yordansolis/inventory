
import React from "react";

export const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
  >
    {children}
  </div>
);

export const Badge = ({ children, variant = "default", size = "default" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    info: "bg-blue-100 text-blue-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
  };

  const sizes = {
    default: "px-2 py-1 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};

export const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const variants = {
    default: "bg-gray-900 text-white hover:bg-gray-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    info: "bg-blue-600 text-white hover:bg-blue-700",
  };

  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}; 

export const Spinner = ({ size = "default", className = "" }) => {
  const sizes = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <div className={`animate-spin ${sizes[size]} ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="w-full h-full"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
}; 