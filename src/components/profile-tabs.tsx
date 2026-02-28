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
    <div className="border-b border-bureau-700/30">
      <nav
        className="mx-auto flex max-w-4xl gap-0 overflow-x-auto px-6 scrollbar-hide"
        aria-label="Profile tabs"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTab(tab.key)}
              className={`relative whitespace-nowrap px-4 py-3.5 text-sm font-medium transition-colors ${
                active
                  ? "text-teal"
                  : "text-bureau-500 hover:text-bureau-300"
              }`}
            >
              {tab.label}
              {tab.count != null && (
                <span
                  className={`ml-1.5 text-xs ${
                    active ? "text-teal/60" : "text-bureau-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {active && (
                <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-teal" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
