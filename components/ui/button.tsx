import React from "react";

type ButtonProps = {
  label: string;
  onClick: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
};

export const ButtonHollow: React.FC<ButtonProps> = ({
  label,
  onClick,
  type = "button",
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 border border-slate-800 text-black rounded-sm hover:bg-slate-800 hover:text-white transition ${className}`}
    >
      {label}
    </button>
  );
};

export const ButtonFill: React.FC<ButtonProps> = ({
  label,
  onClick,
  type = "button",
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 text-white bg-slate-800 rounded-sm hover:bg-slate-700 transition ${className}`}
    >
      {label}
    </button>
  );
};
