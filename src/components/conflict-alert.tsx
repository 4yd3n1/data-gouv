import Link from "next/link";
import { fmtEuro } from "@/lib/format";

interface ConflictAlertProps {
  deputyName: string;
  sector: string;
  participationTotal: number;
  relatedVoteCount: number;
  declarationId: string;
  typeMandat?: string;
}

export function ConflictAlert({
  deputyName,
  sector,
  participationTotal,
  relatedVoteCount,
  declarationId,
  typeMandat,
}: ConflictAlertProps) {
  return (
    <div className="rounded-xl border border-amber/20 bg-amber/5 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber/30 bg-amber/10">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-bureau-100">
            {deputyName}
            {typeMandat && (
              <span className="ml-1.5 text-xs text-bureau-500">{typeMandat}</span>
            )}
          </p>
          <p className="mt-1 text-xs text-bureau-400">
            A déclaré{" "}
            <span className="text-amber font-medium">{fmtEuro(participationTotal)}</span>{" "}
            de participations financières dans le secteur <strong className="text-bureau-200">{sector}</strong>.
            A voté sur{" "}
            <span className="text-bureau-100 font-medium">{relatedVoteCount}</span> texte{relatedVoteCount > 1 ? "s" : ""}{" "}
            lié{relatedVoteCount > 1 ? "s" : ""} à ce domaine.
          </p>
          <Link
            href={`/gouvernance/declarations/${declarationId}`}
            className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-amber/70 hover:text-amber transition-colors"
          >
            Voir la déclaration →
          </Link>
        </div>
      </div>
    </div>
  );
}
