"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function navigate() {
    const q = inputRef.current?.value.trim() ?? "";
    if (q.length >= 2) router.push(`/recherche?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      navigate();
    }
  }

  return (
    <div className="mb-6">
      <div className="relative">
        <button
          type="button"
          onClick={navigate}
          aria-label="Rechercher"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-bureau-500 hover:text-bureau-300 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          name="q"
          defaultValue={defaultValue}
          onKeyDown={handleKeyDown}
          placeholder="Nom, commune, sujet de vote..."
          autoFocus={!defaultValue}
          className="w-full rounded-xl border border-bureau-700/50 bg-bureau-800/60 py-2.5 pl-10 pr-4 text-sm text-bureau-100 placeholder-bureau-500 focus:border-teal-500/60 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
