import { ReactNode } from "react";

type Tone = "neutral" | "red";

export function Eyebrow({
  children,
  tone = "neutral",
  size = "xs",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: "xs" | "sm";
  className?: string;
}) {
  const fontSize = size === "sm" ? "var(--fs-mono-sm)" : "var(--fs-mono-xs)";
  const color = tone === "red" ? "var(--color-signal)" : "var(--color-fg-mute)";
  return (
    <span
      className={`obs-mono ${className}`}
      style={{ fontSize, letterSpacing: "0.14em", color }}
    >
      {children}
    </span>
  );
}
