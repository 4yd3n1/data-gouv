"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Dept {
  code: string;
  libelle: string;
}

interface DeptLookupProps {
  depts: Dept[];
  placeholder?: string;
}

export function DeptLookup({ depts, placeholder = "Département ou code..." }: DeptLookupProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return depts
      .filter(
        (d) =>
          d.code.startsWith(q) ||
          d.libelle.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, depts]);

  function select(dept: Dept) {
    setQuery(dept.libelle);
    setOpen(false);
    router.push(`/territoire/${dept.code}`);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-bureau-700/40 bg-bureau-800/40 px-4 py-3 focus-within:border-teal/40 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-bureau-500">
          <circle cx="12" cy="10" r="3" />
          <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.8a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-bureau-200 placeholder-bureau-600 outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="text-bureau-600 hover:text-bureau-400 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-bureau-700/40 bg-bureau-900 shadow-xl">
          {suggestions.map((d) => (
            <button
              key={d.code}
              onMouseDown={() => select(d)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-bureau-800"
            >
              <span className="w-8 rounded-md bg-bureau-700/40 px-1.5 py-0.5 text-center text-[10px] font-mono text-bureau-400">
                {d.code}
              </span>
              <span className="text-bureau-200">{d.libelle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
