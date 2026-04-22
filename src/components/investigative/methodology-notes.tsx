import Link from "next/link";
import { Eyebrow } from "./eyebrow";

export type MethodologyNote = {
  n: number;
  body: string;
  source?: string;
  href?: string;
};

export function MethodologyNotes({ notes }: { notes: readonly MethodologyNote[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 28,
        paddingTop: 20,
        borderTop: "1px solid var(--line)",
      }}
      className="methodology-notes"
    >
      <Eyebrow>Notes méthodologiques</Eyebrow>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
          color: "var(--color-fg-mute)",
          fontSize: 12.5,
          lineHeight: 1.55,
        }}
        className="methodology-notes-grid"
      >
        {notes.map((note) => (
          <div key={note.n}>
            <span
              className="obs-mono"
              style={{ color: "var(--color-signal)", fontSize: 10 }}
            >
              [{note.n}]
            </span>{" "}
            {note.body}
            {note.source && (
              <>
                {" "}
                <span style={{ color: "var(--color-fg-dim)" }}>— {note.source}</span>
              </>
            )}
            {note.href && (
              <>
                {" "}
                <Link
                  href={note.href}
                  className="obs-mono"
                  style={{
                    color: "var(--color-fg)",
                    textDecoration: "none",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                  }}
                >
                  Méthode →
                </Link>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
