"use client";

import { useState } from "react";

export function ShareButton({
  label = "Partager ce profil",
}: {
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently ignore — user may have blocked clipboard
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-full border border-bureau-700/40 bg-bureau-800/40 px-3 py-1 text-xs text-bureau-400 transition-all hover:border-teal/30 hover:text-teal"
    >
      <svg
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
        />
      </svg>
      {copied ? "Lien copié" : label}
    </button>
  );
}
