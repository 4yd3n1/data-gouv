"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function ProfileTabs({
  tabs,
  defaultTab,
}: {
  tabs: Array<{ key: string; label: string; count?: number }>;
  defaultTab: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") ?? defaultTab;

  const handleTab = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return (
    <div className="border-t border-bureau-800/60">
      <nav
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 scrollbar-hide"
        aria-label="Profile tabs"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTab(tab.key)}
              className={`relative whitespace-nowrap px-3 py-3.5 text-[13px] font-medium tracking-tight transition-colors ${
                active ? "text-bureau-50" : "text-bureau-500 hover:text-bureau-300"
              }`}
            >
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span
                  className={`ml-1.5 text-[11px] tabular-nums ${
                    active ? "text-bureau-400" : "text-bureau-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {active && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 bg-teal" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
