import React from "react";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

export default function Button({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
}: Props) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2 rounded-xl gap-2 shadow-xs",
    lg: "text-base px-5 py-2.5 rounded-xl gap-2.5 shadow-sm",
  }[size];

  const variantClasses = {
    primary:
      "bg-stone-900 text-stone-50 hover:bg-stone-800 active:scale-[0.99] shadow-stone-900/10",
    secondary:
      "bg-stone-100 text-stone-800 hover:bg-stone-200/80 border border-stone-200/80 active:scale-[0.99]",
    outline:
      "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.99]",
    danger:
      "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:scale-[0.99]",
    ghost:
      "bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
}
