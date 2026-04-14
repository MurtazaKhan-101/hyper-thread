import React from "react";

// Export upgrade components
export { UpgradeModal, UpgradeBanner } from "./UpgradePrompt";

// Export confirmation modal
export { default as ConfirmationModal } from "./ConfirmationModal";

// Button Component - Reddit style
export const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
  className = "",
}) => {
  const baseStyles =
    "px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-buttons-gradient text-black transition-all duration-300 ease-in-out hover:bg-buttons-gradient-hover",
    secondary:
      "bg-transparent border border-[#0079D3] text-[#0079D3] hover:bg-[#0079D3] hover:text-gray-900",
    outline:
      "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
    outline_secondary:
      "bg-transparent border border-gray-300 text-white hover:bg-gray-50 hover:text-gray-700",
    google:
      "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
};

// Input Component - Reddit style
export const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-4 py-3 ${
            isPasswordField ? "pr-12" : ""
          } rounded border ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-gray-300 dark:border-gray-600 focus:border-bg-buttons-gradient"
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0079D3] focus:ring-opacity-50 transition-all ${className}`}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none disabled:opacity-50"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
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
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

// Card Component - Reddit style
export const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

// Alert Component - Reddit style
export const Alert = ({ type = "info", message, children, onClose }) => {
  const types = {
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    error:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
  };

  return (
    <div
      className={`p-4 rounded border ${types[type]} flex justify-between items-center`}
    >
      <span className="text-sm">{children || message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-4 font-bold hover:opacity-70">
          ×
        </button>
      )}
    </div>
  );
};

// Loading Spinner - Reddit style
export const Spinner = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`${sizes[size]} border-gray-200 border-t-blue-500 rounded-full animate-spin ${className}`}
    ></div>
  );
};

// Link Component - Reddit style
export const Link = ({ href, children, className = "" }) => {
  return (
    <a
      href={href}
      className={`text-bg-buttons-gradient hover:underline text-sm ${className}`}
    >
      {children}
    </a>
  );
};

// Divider Component
export const Divider = ({ text, className = "" }) => {
  return (
    <div className={`flex items-center my-4 ${className}`}>
      <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
      {text && (
        <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
          {text}
        </span>
      )}
      <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
    </div>
  );
};
