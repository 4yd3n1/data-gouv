"use client";

import { useState } from "react";

export function Avatar({
  src,
  initials,
  size = "md",
}: {
  src?: string | null;
  initials: string;
  size?: "sm" | "md" | "lg";
}) {
  const [error, setError] = useState(false);
  const sizeClass =
    size === "sm" ? "h-9 w-9 text-xs" :
    size === "lg" ? "h-24 w-24 text-2xl" :
    "h-14 w-14 text-lg";
  const ringClass = size === "lg" ? "ring-2 ring-teal/30 ring-offset-2 ring-offset-bureau-950" : "";

  if (!src || error) {
    return (
      <div className={`flex ${sizeClass} ${ringClass} shrink-0 items-center justify-center rounded-full bg-bureau-700/40 font-medium text-bureau-300`}>
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={initials}
      className={`${sizeClass} ${ringClass} shrink-0 rounded-full object-cover`}
      onError={() => setError(true)}
    />
  );
}
