"use client";

import React from "react";

interface LoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export default function Loader({ label = "Loading...", size = "md" }: LoaderProps) {
  const spinnerSize = {
    sm: "w-3.5 h-3.5 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-7 h-7 border-[2.5px]",
  }[size];

  return (
    <div className="flex items-center justify-center gap-2.5 py-4 text-stone-500">
      <div
        className={`${spinnerSize} rounded-full border-stone-200 border-t-amber-600 animate-spin`}
        aria-hidden="true"
      />
      {label && <span className="text-xs font-medium text-stone-600 tracking-wide">{label}</span>}
    </div>
  );
}
