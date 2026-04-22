import { Fragment } from "react";

export function SrcChip({ items }: { items: readonly string[] }) {
  if (!items.length) return null;
  return (
    <span className="src-chip">
      <svg
        width="10"
        height="10"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
      >
        <rect x="1.5" y="2" width="9" height="8" stroke="currentColor" strokeWidth="1" />
        <path d="M3 4.5 H9 M3 6.5 H9 M3 8.5 H7" stroke="currentColor" strokeWidth="0.8" />
      </svg>
      <span className="k">SRC</span>
      {items.map((s, i) => (
        <Fragment key={`${s}-${i}`}>
          <span className="dot" />
          <span>{s}</span>
        </Fragment>
      ))}
    </span>
  );
}
