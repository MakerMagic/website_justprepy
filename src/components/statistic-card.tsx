"use client";

import type { ReactNode } from "react";

/** Shared statistics anatomy; styling and motion stay in the existing app stylesheet. */
export function StatisticCard({
  label,
  value,
  motif,
  onClick,
  secondary,
  decoration,
}: {
  label: string;
  value: ReactNode;
  motif: "check" | "trend";
  onClick: () => void;
  secondary?: ReactNode;
  decoration?: ReactNode;
}) {
  return (
    <button
      type="button"
      className="stat-card"
      aria-haspopup="dialog"
      onClick={onClick}
    >
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {secondary != null && <span className="stat-secondary">{secondary}</span>}
      {decoration != null ? (
        <span className="stat-decoration" aria-hidden="true">
          {decoration}
        </span>
      ) : (
        <svg className="stat-motif" viewBox="0 0 80 80" aria-hidden="true">
          {motif === "check" ? (
            <>
              <circle cx="48" cy="48" r="28" />
              <path d="m32 48 11 11 23-26" />
            </>
          ) : (
            <path d="M16 10v62h60M24 58l17-19 13 10 22-29" />
          )}
        </svg>
      )}
    </button>
  );
}
