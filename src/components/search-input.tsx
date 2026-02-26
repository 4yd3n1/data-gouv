"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function SearchInput({
  placeholder = "Rechercher...",
  paramName = "q",
}: {
  placeholder?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bureau-500"
        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        defaultValue={searchParams.get(paramName) ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value) params.set(paramName, e.target.value);
          else params.delete(paramName);
          params.delete("page");
          startTransition(() => router.push(`?${params.toString()}`));
        }}
        className="search-glow w-full rounded-lg border border-bureau-700/50 bg-bureau-800/60 py-2.5 pl-10 pr-4 text-sm text-bureau-100 placeholder-bureau-500 outline-none transition-all"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-bureau-600 border-t-teal" />
      )}
    </div>
  );
}
