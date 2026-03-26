"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function NavSearch() {
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

  useEffect(() => {
    function onSlash(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onSlash);
    return () => document.removeEventListener("keydown", onSlash);
  }, []);

  return (
    <div className="flex items-center">
      <div className="relative">
        <button
          type="button"
          onClick={navigate}
          aria-label="Rechercher"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bureau-500 hover:text-bureau-300 transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
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
          onKeyDown={handleKeyDown}
          placeholder="Chercher un élu, un vote..."
          className="w-52 md:w-72 lg:w-80 rounded-lg border border-bureau-700/50 bg-bureau-800/60 pl-8 pr-8 py-1.5 text-sm text-bureau-100 placeholder-bureau-500 focus:outline-none focus:border-teal/40 search-glow transition-colors"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border border-bureau-700/50 bg-bureau-800/80 px-1.5 text-[10px] text-bureau-500 font-mono">/</kbd>
      </div>
    </div>
  );
}
