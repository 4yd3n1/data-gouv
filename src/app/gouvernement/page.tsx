import Link from "next/link";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/avatar";
import { TypeMandat } from "@prisma/client";

export const revalidate = 3600;

export const metadata = {
  title: "Gouvernement — Intelligence Bureau",
  description:
    "Composition du gouvernement français : fiches individuelles, déclarations d'intérêts, carrières et lobbying.",
};

const TYPE_LABEL: Record<TypeMandat, string> = {
  PRESIDENT: "Président de la République",
  PREMIER_MINISTRE: "Premier ministre",
  MINISTRE: "Ministre",
  MINISTRE_DELEGUE: "Ministre délégué",
  SECRETAIRE_ETAT: "Secrétaire d'État",
};

type Personnalite = {
  id: string;
  prenom: string;
  nom: string;
  slug: string;
  photoUrl: string | null;
  mandats: Array<{
    type: TypeMandat;
    rang: number | null;
    titreCourt: string;
    gouvernement: string;
  }>;
};

// ─── Corner targeting brackets ────────────────────────────────────────────────
// Uses border-current — set text-{color} on parent to tint all four corners
function Brackets({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <>
      <span className={`pointer-events-none absolute left-0 top-0 ${dim} border-l border-t border-current opacity-25 transition-opacity duration-300 group-hover:opacity-55`} />
      <span className={`pointer-events-none absolute right-0 top-0 ${dim} border-r border-t border-current opacity-25 transition-opacity duration-300 group-hover:opacity-55`} />
      <span className={`pointer-events-none absolute bottom-0 left-0 ${dim} border-b border-l border-current opacity-25 transition-opacity duration-300 group-hover:opacity-55`} />
      <span className={`pointer-events-none absolute bottom-0 right-0 ${dim} border-b border-r border-current opacity-25 transition-opacity duration-300 group-hover:opacity-55`} />
    </>
  );
}

// ─── Tier section label ───────────────────────────────────────────────────────
function TierLabel({
  code,
  label,
  count,
  colorCls,
}: {
  code: string;
  label: string;
  count: number;
  colorCls: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`shrink-0 font-mono text-[8px] tracking-[0.3em] ${colorCls} opacity-50`}>
        {code}
      </span>
      <div className="h-px flex-1 bg-bureau-800/50" />
      <span className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.22em] ${colorCls}`}>
        {label}
      </span>
      <div className="h-px flex-1 bg-bureau-800/50" />
      <span className="shrink-0 font-mono text-[8px] tabular-nums text-bureau-600">
        {String(count).padStart(2, "0")}&nbsp;sujets
      </span>
    </div>
  );
}

// ─── Vertical stem connector with relay node ──────────────────────────────────
function StemNode({ amber }: { amber?: boolean }) {
  const topBar = amber
    ? "bg-gradient-to-b from-amber/35 to-amber/5"
    : "bg-gradient-to-b from-teal/30 to-teal/5";
  const botBar = amber
    ? "bg-gradient-to-b from-teal/5 to-teal/25"
    : "bg-gradient-to-b from-blue-500/5 to-blue-500/15";
  const outerRing = amber ? "border-amber/12" : "border-teal/12";
  const innerRing = amber ? "border-amber/22" : "border-teal/22";
  return (
    <div className="flex flex-col items-center">
      <div className={`h-7 w-px ${topBar}`} />
      <div className="relative flex items-center justify-center py-2">
        <div className={`absolute h-9 w-9 rounded-full border ${outerRing}`} />
        <div className={`absolute h-5 w-5 rounded-full border ${innerRing}`} />
        {amber ? <div className="live-dot-amber" /> : <div className="live-dot" />}
      </div>
      <div className={`h-7 w-px ${botBar}`} />
    </div>
  );
}

// ─── Horizontal spread connector (PM → Ministres) ─────────────────────────────
function SpreadConnector() {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <div className="h-5 w-px bg-gradient-to-b from-teal/25 to-blue-500/15" />
      <div className="relative w-full max-w-2xl">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/18 to-transparent" />
        <div className="absolute left-0 top-0 h-3 w-px bg-blue-500/18" />
        <div className="absolute right-0 top-0 h-3 w-px bg-blue-500/18" />
      </div>
      <div className="h-3" />
    </div>
  );
}

// ─── President card (amber, imposing) ────────────────────────────────────────
function PresidentCard({ p }: { p: Personnalite }) {
  const mandat = p.mandats[0];
  const initials = `${p.prenom[0] ?? ""}${p.nom[0] ?? ""}`.toUpperCase();
  return (
    <Link
      href={`/gouvernement/${p.slug}`}
      className="group gov-hero-card sigint-section sigint-amber relative flex w-full max-w-lg items-center gap-7 rounded-xl border border-amber/22 bg-amber/[0.028] px-8 py-7 text-amber"
      style={{
        boxShadow:
          "0 0 90px -25px rgba(245,158,11,0.14), 0 0 0 1px rgba(245,158,11,0.04) inset",
      }}
    >
      <Brackets size="md" />

      {/* Classification badge */}
      <span className="absolute -top-2.5 left-7 rounded-sm border border-amber/25 bg-amber/8 px-3 py-0.5 font-mono text-[8px] uppercase tracking-[0.22em] text-amber">
        T1 · {TYPE_LABEL["PRESIDENT"]}
      </span>

      {/* Rang watermark */}
      <span className="pointer-events-none absolute right-6 top-4 select-none font-mono text-5xl font-bold tabular-nums text-amber opacity-[0.045]">
        {String(mandat.rang ?? 1).padStart(2, "0")}
      </span>

      {/* Avatar with amber ring */}
      <div className="shrink-0 rounded-full ring-2 ring-amber/35 ring-offset-2 ring-offset-bureau-950">
        <Avatar src={p.photoUrl} initials={initials} size="lg" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-display)] text-2xl font-normal leading-tight text-bureau-100 transition-colors duration-200 group-hover:text-amber">
          {p.prenom}{" "}
          <span className="font-semibold">{p.nom.toUpperCase()}</span>
        </p>
        <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-amber/55">
          {mandat.titreCourt}
        </p>
        <p className="mt-2.5 font-mono text-[8px] uppercase tracking-[0.2em] text-bureau-600">
          {mandat.gouvernement}
        </p>
      </div>

      {/* Bottom fill bar */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-amber/35 threat-bar" />
    </Link>
  );
}

// ─── Premier Ministre card (teal) ─────────────────────────────────────────────
function PremierMinistreCard({ p }: { p: Personnalite }) {
  const mandat = p.mandats[0];
  const initials = `${p.prenom[0] ?? ""}${p.nom[0] ?? ""}`.toUpperCase();
  return (
    <Link
      href={`/gouvernement/${p.slug}`}
      className="group gov-hero-card sigint-section relative flex w-full max-w-lg items-center gap-7 rounded-xl border border-teal/18 bg-teal/[0.02] px-8 py-7 text-teal"
      style={{
        boxShadow:
          "0 0 80px -25px rgba(45,212,191,0.10), 0 0 0 1px rgba(45,212,191,0.03) inset",
      }}
    >
      <Brackets size="md" />

      <span className="absolute -top-2.5 left-7 rounded-sm border border-teal/25 bg-teal/8 px-3 py-0.5 font-mono text-[8px] uppercase tracking-[0.22em] text-teal">
        T2 · {TYPE_LABEL["PREMIER_MINISTRE"]}
      </span>

      <span className="pointer-events-none absolute right-6 top-4 select-none font-mono text-5xl font-bold tabular-nums text-teal opacity-[0.04]">
        {String(mandat.rang ?? 2).padStart(2, "0")}
      </span>

      <div className="shrink-0 rounded-full ring-2 ring-teal/30 ring-offset-2 ring-offset-bureau-950">
        <Avatar src={p.photoUrl} initials={initials} size="lg" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-display)] text-2xl font-normal leading-tight text-bureau-100 transition-colors duration-200 group-hover:text-teal">
          {p.prenom}{" "}
          <span className="font-semibold">{p.nom.toUpperCase()}</span>
        </p>
        <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-teal/55">
          {mandat.titreCourt}
        </p>
        <p className="mt-2.5 font-mono text-[8px] uppercase tracking-[0.2em] text-bureau-600">
          {mandat.gouvernement}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-teal/30 threat-bar" />
    </Link>
  );
}

// ─── Ministre card (3-col grid, blue) ────────────────────────────────────────
function MinistreCard({ p }: { p: Personnalite }) {
  const mandat = p.mandats[0];
  const initials = `${p.prenom[0] ?? ""}${p.nom[0] ?? ""}`.toUpperCase();
  return (
    <Link
      href={`/gouvernement/${p.slug}`}
      className="group dossier-card relative flex items-center gap-3.5 rounded-lg border border-blue-500/10 bg-blue-500/[0.022] p-4 text-blue-400 transition-all duration-200 hover:border-blue-500/28"
    >
      <Brackets />

      <span className="pointer-events-none absolute bottom-2 right-3 select-none font-mono text-2xl font-bold tabular-nums text-blue-500 opacity-[0.06]">
        {String(mandat.rang ?? 99).padStart(2, "0")}
      </span>

      <div className="shrink-0 rounded-full ring-1 ring-blue-500/22 ring-offset-1 ring-offset-bureau-950">
        <Avatar src={p.photoUrl} initials={initials} size="md" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-bureau-100 transition-colors duration-150 group-hover:text-blue-400">
          {p.prenom} {p.nom}
        </p>
        <p className="mt-0.5 truncate font-mono text-[10px] leading-snug text-blue-400/50">
          {mandat.titreCourt}
        </p>
      </div>
    </Link>
  );
}

// ─── Délégué card (4-col grid, violet) ───────────────────────────────────────
function DelegueCard({ p }: { p: Personnalite }) {
  const mandat = p.mandats[0];
  const initials = `${p.prenom[0] ?? ""}${p.nom[0] ?? ""}`.toUpperCase();
  return (
    <Link
      href={`/gouvernement/${p.slug}`}
      className="group dossier-card relative flex items-center gap-2.5 rounded-md border border-violet-500/10 bg-violet-500/[0.018] p-3 text-violet-400 transition-all duration-150 hover:border-violet-500/25"
    >
      <Brackets />

      <span className="pointer-events-none absolute bottom-1.5 right-2.5 select-none font-mono text-lg font-bold tabular-nums text-violet-500 opacity-[0.06]">
        {String(mandat.rang ?? 99).padStart(2, "0")}
      </span>

      <div className="shrink-0 rounded-full ring-1 ring-violet-500/20 ring-offset-1 ring-offset-bureau-950">
        <Avatar src={p.photoUrl} initials={initials} size="sm" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-bureau-100 transition-colors duration-150 group-hover:text-violet-400">
          {p.prenom} {p.nom}
        </p>
        <p className="mt-0.5 truncate font-mono text-[9px] leading-snug text-violet-400/48">
          {mandat.titreCourt}
        </p>
      </div>
    </Link>
  );
}

// ─── Secrétaire card (4-col grid, rose) ──────────────────────────────────────
function SecretaireCard({ p }: { p: Personnalite }) {
  const mandat = p.mandats[0];
  const initials = `${p.prenom[0] ?? ""}${p.nom[0] ?? ""}`.toUpperCase();
  return (
    <Link
      href={`/gouvernement/${p.slug}`}
      className="group dossier-card relative flex items-center gap-2.5 rounded-md border border-rose/10 bg-rose/[0.015] p-3 text-rose transition-all duration-150 hover:border-rose/25"
    >
      <Brackets />

      <span className="pointer-events-none absolute bottom-1.5 right-2.5 select-none font-mono text-lg font-bold tabular-nums text-rose opacity-[0.06]">
        {String(mandat.rang ?? 99).padStart(2, "0")}
      </span>

      <div className="shrink-0 rounded-full ring-1 ring-rose/20 ring-offset-1 ring-offset-bureau-950">
        <Avatar src={p.photoUrl} initials={initials} size="sm" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-bureau-100 transition-colors duration-150 group-hover:text-rose">
          {p.prenom} {p.nom}
        </p>
        <p className="mt-0.5 truncate font-mono text-[9px] leading-snug text-rose/48">
          {mandat.titreCourt}
        </p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function GouvernementPage() {
  const personnalites = await prisma.personnalitePublique.findMany({
    include: {
      mandats: {
        where: { dateFin: null },
        orderBy: { rang: "asc" },
        take: 1,
      },
    },
  });

  const sorted = personnalites
    .filter((p) => p.mandats.length > 0)
    .sort((a, b) => (a.mandats[0].rang ?? 999) - (b.mandats[0].rang ?? 999));

  const byType = (type: TypeMandat) =>
    sorted.filter((p) => p.mandats[0]?.type === type);

  const president = byType(TypeMandat.PRESIDENT);
  const pm = byType(TypeMandat.PREMIER_MINISTRE);
  const ministres = byType(TypeMandat.MINISTRE);
  const delegues = byType(TypeMandat.MINISTRE_DELEGUE);
  const secretaires = byType(TypeMandat.SECRETAIRE_ETAT);

  const gouvernement = sorted[0]?.mandats[0]?.gouvernement ?? "Gouvernement";
  const total = sorted.length;
  const docRef = `GOV-FR-${new Date().getFullYear()}-${String(total).padStart(3, "0")}`;

  return (
    <div className="min-h-screen bg-bureau-950 text-bureau-100">

      {/* ── Classification bar ── */}
      <div className="border-b border-amber/12 bg-amber/[0.022]">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-1.5 sm:px-8">
          <div className="live-dot-amber" />
          <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-amber/65">
            Classifié · Usage restreint · Intelligence Bureau
          </span>
          <span className="ml-auto font-mono text-[8px] tabular-nums text-bureau-600">
            Réf.&nbsp;{docRef}
          </span>
        </div>
      </div>

      {/* ── SIGINT header ── */}
      <div className="border-b border-bureau-800/40 bg-bureau-900/55 sigint-section grid-bg">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-bureau-500">
            Organigramme d'État · Hiérarchie protocolaire · Direction du renseignement
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-bureau-100 sm:text-4xl">
            {gouvernement}
          </h1>

          {/* Tier stat pills */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {president.length > 0 && (
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="data-value text-sm font-semibold tabular-nums text-amber">
                  {String(president.length).padStart(2, "0")}
                </span>
                <span className="text-bureau-500">Président</span>
              </span>
            )}
            <span className="text-bureau-700">·</span>
            {pm.length > 0 && (
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="data-value text-sm font-semibold tabular-nums text-teal">
                  {String(pm.length).padStart(2, "0")}
                </span>
                <span className="text-bureau-500">Premier ministre</span>
              </span>
            )}
            <span className="text-bureau-700">·</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="data-value text-sm font-semibold tabular-nums text-blue-400">
                {String(ministres.length).padStart(2, "0")}
              </span>
              <span className="text-bureau-500">Ministres</span>
            </span>
            {delegues.length > 0 && (
              <>
                <span className="text-bureau-700">·</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="data-value text-sm font-semibold tabular-nums text-violet-400">
                    {String(delegues.length).padStart(2, "0")}
                  </span>
                  <span className="text-bureau-500">Délégués</span>
                </span>
              </>
            )}
            {secretaires.length > 0 && (
              <>
                <span className="text-bureau-700">·</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="data-value text-sm font-semibold tabular-nums text-rose">
                    {String(secretaires.length).padStart(2, "0")}
                  </span>
                  <span className="text-bureau-500">Secrétaires d'État</span>
                </span>
              </>
            )}
            <span className="ml-auto font-mono text-[9px] tabular-nums text-bureau-600">
              {total}&nbsp;membres
            </span>
          </div>
        </div>
      </div>

      {/* ── Organigram ── */}
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-10 sm:px-8">

        {/* Tier 1 — Président */}
        {president.length > 0 && (
          <div className="flex flex-col items-center">
            {president.map((p) => (
              <PresidentCard key={p.id} p={p} />
            ))}
            {pm.length > 0 && <StemNode amber />}
          </div>
        )}

        {/* Tier 2 — Premier Ministre */}
        {pm.length > 0 && (
          <div className="flex flex-col items-center">
            {pm.map((p) => (
              <PremierMinistreCard key={p.id} p={p} />
            ))}
            {ministres.length > 0 && <SpreadConnector />}
          </div>
        )}

        {/* Tier 3 — Ministres */}
        {ministres.length > 0 && (
          <div className="mt-1">
            <TierLabel
              code="T3"
              label="Ministres"
              count={ministres.length}
              colorCls="text-blue-400"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ministres.map((p) => (
                <MinistreCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}

        {/* Tier 4 — Délégués */}
        {delegues.length > 0 && (
          <div className="mt-10">
            <TierLabel
              code="T4"
              label="Ministres délégués"
              count={delegues.length}
              colorCls="text-violet-400"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {delegues.map((p) => (
                <DelegueCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}

        {/* Tier 5 — Secrétaires d'État */}
        {secretaires.length > 0 && (
          <div className="mt-10">
            <TierLabel
              code="T5"
              label="Secrétaires d'État"
              count={secretaires.length}
              colorCls="text-rose"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {secretaires.map((p) => (
                <SecretaireCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── Legend footer ── */}
        <div className="mt-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-bureau-800/30 pt-6">
          <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-bureau-600">
            Légende
          </span>
          {(
            [
              ["T1", "Président", "text-amber"],
              ["T2", "Premier ministre", "text-teal"],
              ["T3", "Ministre", "text-blue-400"],
              ["T4", "Délégué", "text-violet-400"],
              ["T5", "Sec. d'État", "text-rose"],
            ] as const
          ).map(([code, label, color]) => (
            <span key={code} className="flex items-center gap-2">
              <span className={`font-mono text-[8px] ${color} opacity-50`}>{code}</span>
              <span className={`font-mono text-[9px] ${color}`}>{label}</span>
            </span>
          ))}
          <span className="ml-auto font-mono text-[8px] text-bureau-700">
            Rang protocolaire · Source officielle
          </span>
        </div>
      </div>
    </div>
  );
}
