import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { resolvePostalCode } from "@/lib/postal-resolver";
import { DeputeCard } from "@/components/mon-depute/depute-card";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ cp?: string; commune?: string }>;
}): Promise<Metadata> {
  const { cp, commune } = await searchParams;

  if (!cp && !commune) {
    return {
      title: "Mon député | L’Observatoire",
      description:
        "Trouvez votre député selon votre code postal. Votes, déclarations HATVP, conflits d’intérêts.",
    };
  }

  // Try to resolve to a single deputy for a richer title
  try {
    const territories = cp ? await resolvePostalCode(cp) : null;
    const deptCode = territories?.length === 1
      ? territories[0].departementCode
      : commune
      ? (await prisma.commune.findUnique({
          where: { code: commune },
          select: { departementCode: true },
        }))?.departementCode
      : null;

    if (deptCode) {
      const deputes = await prisma.depute.findMany({
        where: { departementRefCode: deptCode, actif: true },
        select: { prenom: true, nom: true, groupeAbrev: true },
      });
      const label = cp ?? commune ?? "";
      if (deputes.length === 1) {
        const d = deputes[0];
        const name = `${d.prenom} ${d.nom}`;
        return {
          title: `Votre député — ${name} (${label}) | L’Observatoire`,
          description: `Code postal ${label} : ${name} (${d.groupeAbrev}). Votes, déclarations HATVP, conflits d’intérêts. Partagez ce profil.`,
          alternates: {
            canonical: `${SITE_URL}/mon-depute?cp=${label}`,
          },
        };
      }
      if (deputes.length > 1) {
        return {
          title: `Vos députés — ${label} (${deputes.length} circonscriptions) | L’Observatoire`,
          description: `Code postal ${label} : ${deputes.length} députés couvrent ce territoire. Sélectionnez votre circonscription pour consulter votes, déclarations HATVP et conflits d’intérêts.`,
          alternates: {
            canonical: `${SITE_URL}/mon-depute?cp=${label}`,
          },
        };
      }
    }
  } catch {
    // Resolution failed — fall through to generic
  }

  return {
    title: "Mon député | L’Observatoire",
    description:
      "Trouvez votre député selon votre code postal. Votes, déclarations HATVP, conflits d’intérêts.",
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MonDeputePage({
  searchParams,
}: {
  searchParams: Promise<{ cp?: string; commune?: string }>;
}) {
  const { cp, commune } = await searchParams;

  // ── State 3: commune code specified directly ──
  if (commune) {
    const communeRow = await prisma.commune.findUnique({
      where: { code: commune },
      select: { libelle: true, departementCode: true },
    });
    const deptCode = communeRow?.departementCode;

    if (!deptCode) {
      return (
        <>
          <PageShell cp={cp} />
          <div className="mx-auto max-w-2xl px-6 py-10">
            <p className="text-sm text-bureau-400 italic">Commune introuvable.</p>
            <Link href="/mon-depute" className="mt-3 inline-block text-xs text-teal-400 hover:text-teal-300">
              Nouvelle recherche
            </Link>
          </div>
        </>
      );
    }

    const deputes = await prisma.depute.findMany({
      where: { departementRefCode: deptCode, actif: true },
      select: { id: true },
      orderBy: { nom: "asc" },
    });

    if (deputes.length === 0) {
      return (
        <>
          <PageShell cp={cp} />
          <div className="mx-auto max-w-2xl px-6 py-10">
            <p className="text-sm text-bureau-400 italic">
              Aucun député actif trouvé pour le département associé à cette commune.
            </p>
            <Link href="/mon-depute" className="mt-3 inline-block text-xs text-teal-400 hover:text-teal-300">
              Nouvelle recherche
            </Link>
          </div>
        </>
      );
    }

    return (
      <>
        <PageShell cp={cp} communeLibelle={communeRow.libelle} />
        <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
          {deputes.length > 1 && (
            <p className="rounded-md border border-bureau-800 bg-bureau-800/20 px-4 py-3 text-xs text-bureau-300">
              {communeRow.libelle} couvre {deputes.length}&nbsp;circonscriptions. Sélectionnez celle qui correspond à votre adresse — votre carte électorale ou{" "}
              <a href="https://www.elections.interieur.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline-offset-2 hover:underline">elections.interieur.gouv.fr</a>{" "}
              indique votre circonscription.
            </p>
          )}
          {deputes.map((d) => (
            <Suspense key={d.id} fallback={<CardSkeleton />}>
              <DeputeCard
                deputeId={d.id}
                postalCode={cp}
                communeName={communeRow.libelle}
                siteUrl={SITE_URL}
              />
            </Suspense>
          ))}
        </div>
      </>
    );
  }

  // ── State 2: postal code provided — resolve ──
  if (cp) {
    // Validate format
    if (!/^\d{4,5}$/.test(cp)) {
      return (
        <>
          <PageShell cp={cp} />
          <div className="mx-auto max-w-2xl px-6 py-10 space-y-4">
            <PostalCodeForm defaultValue={cp} />
            <UnknownPostal cp={cp} />
          </div>
        </>
      );
    }

    const territories = await resolvePostalCode(cp);

    if (territories.length === 0) {
      return (
        <>
          <PageShell cp={cp} />
          <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
            <PostalCodeForm defaultValue={cp} />
            <UnknownPostal cp={cp} />
          </div>
        </>
      );
    }

    if (territories.length === 1) {
      const t = territories[0];
      const deputes = await prisma.depute.findMany({
        where: { departementRefCode: t.departementCode, actif: true },
        select: { id: true },
        orderBy: { nom: "asc" },
      });

      if (deputes.length === 0) {
        return (
          <>
            <PageShell cp={cp} />
            <div className="mx-auto max-w-2xl px-6 py-10 space-y-4">
              <PostalCodeForm defaultValue={cp} />
              <div className="rounded-md border border-bureau-800 bg-bureau-800/20 px-5 py-6 text-center">
                <p className="text-sm text-bureau-400">
                  Aucun député actif trouvé pour {t.departementLibelle} ({t.departementCode}).
                </p>
                <Link href="/mon-depute" className="mt-3 inline-block text-xs text-teal-400 hover:text-teal-300">
                  Nouvelle recherche
                </Link>
              </div>
            </div>
          </>
        );
      }

      return (
        <>
          <PageShell cp={cp} communeLibelle={t.commune.libelle} />
          <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
            <PostalCodeForm defaultValue={cp} />
            {deputes.length > 1 && (
              <p className="rounded-md border border-bureau-800 bg-bureau-800/20 px-4 py-3 text-xs text-bureau-300">
                Le code postal&nbsp;{cp} couvre {deputes.length}&nbsp;circonscriptions à {t.commune.libelle}. Sélectionnez celle qui correspond à votre adresse — votre carte électorale ou{" "}
                <a href="https://www.elections.interieur.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline-offset-2 hover:underline">elections.interieur.gouv.fr</a>{" "}
                indique votre circonscription.
              </p>
            )}
            {deputes.map((d) => (
              <Suspense key={d.id} fallback={<CardSkeleton />}>
                <DeputeCard
                  deputeId={d.id}
                  postalCode={cp}
                  communeName={t.commune.libelle}
                  siteUrl={SITE_URL}
                />
              </Suspense>
            ))}
          </div>
        </>
      );
    }

    // Multiple communes — disambiguation picker
    return (
      <>
        <PageShell cp={cp} />
        <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
          <PostalCodeForm defaultValue={cp} />
          <div>
            <p className="mb-4 text-sm text-bureau-400">
              Plusieurs communes correspondent au code postal&nbsp;{cp}&nbsp;— choisissez la vôtre&nbsp;:
            </p>
            <div className="space-y-2">
              {territories.map((t) => (
                <Link
                  key={t.commune.code}
                  href={`/mon-depute?cp=${cp}&commune=${t.commune.code}`}
                  className="group flex items-center gap-4 rounded-md border border-bureau-800 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-700/50 hover:bg-bureau-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-bureau-200 transition-colors group-hover:text-teal-400">
                      {t.commune.libelle}
                    </p>
                    <p className="text-xs text-bureau-500">
                      {t.departementLibelle} ({t.departementCode})
                    </p>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0 text-bureau-600 transition-colors group-hover:text-teal-400"
                    aria-hidden
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── State 1: empty prompt ──
  return (
    <>
      <PageShell />
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-8">
        <div className="space-y-3">
          <p className="text-base text-bureau-300 leading-relaxed">
            Entrez votre code postal pour identifier votre député à l’Assemblée nationale — ses votes, ses déclarations HATVP et les contradictions relevées par L’Observatoire.
          </p>
        </div>

        <PostalCodeForm />

        <div className="space-y-3">
          <p className="text-xs text-bureau-600 uppercase tracking-wider">Exemples</p>
          <div className="flex flex-wrap gap-2">
            {[
              { cp: "75008", label: "Paris 8e" },
              { cp: "33000", label: "Bordeaux" },
              { cp: "13001", label: "Marseille 1er" },
              { cp: "69001", label: "Lyon 1er" },
              { cp: "59000", label: "Lille" },
            ].map(({ cp: exCp, label }) => (
              <Link
                key={exCp}
                href={`/mon-depute?cp=${exCp}`}
                className="rounded-md border border-bureau-700/40 bg-bureau-800/30 px-3 py-1.5 text-xs text-bureau-400 transition-colors hover:border-bureau-600/50 hover:text-teal-400"
              >
                {label} ({exCp})
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-bureau-800 pt-6">
          <p className="text-xs text-bureau-600">
            Le tableau de bord territorial complet est disponible sur{" "}
            <Link href="/mon-territoire" className="text-teal-400/70 transition-colors hover:text-teal-400">
              Mon Territoire
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}

// ── Shell / helpers ───────────────────────────────────────────────────────────

function PageShell({ cp, communeLibelle }: { cp?: string; communeLibelle?: string } = {}) {
  return (
    <div className="border-b border-bureau-800 bg-bureau-900/60">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-bureau-500">
          <Link href="/" className="transition-colors hover:text-teal-400">
            Accueil
          </Link>
          <span className="text-bureau-700">/</span>
          {cp ? (
            <>
              <Link href="/mon-depute" className="transition-colors hover:text-teal-400">
                Mon député
              </Link>
              <span className="text-bureau-700">/</span>
              <span className="text-bureau-300">{communeLibelle ?? cp}</span>
            </>
          ) : (
            <span className="text-bureau-300">Mon député</span>
          )}
        </nav>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-bureau-100">
          {cp && communeLibelle ? `Votre député — ${communeLibelle}` : "Quel est votre député ?"}
        </h1>
        {!cp && (
          <p className="mt-2 text-sm text-bureau-500">
            Identifiez votre représentant à l’Assemblée nationale par code postal.
          </p>
        )}
      </div>
    </div>
  );
}

function PostalCodeForm({ defaultValue }: { defaultValue?: string } = {}) {
  return (
    <form method="GET" action="/mon-depute" className="flex gap-3">
      <div className="relative flex-1">
        <label htmlFor="cp-input" className="sr-only">
          Code postal
        </label>
        <input
          id="cp-input"
          type="text"
          name="cp"
          defaultValue={defaultValue}
          inputMode="numeric"
          pattern="[0-9]{4,5}"
          maxLength={5}
          placeholder="Code postal (ex : 75008)"
          aria-label="Code postal"
          required
          className="w-full rounded-md border border-bureau-700/50 bg-bureau-800/60 px-4 py-3 text-sm text-bureau-100 placeholder-bureau-500 outline-none transition-all focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
        />
      </div>
      <button
        type="submit"
        className="rounded-md border border-teal-400/30 bg-teal-400/10 px-5 py-3 text-sm font-medium text-teal-400 transition-colors hover:border-teal-400/60 hover:bg-teal-400/20 active:scale-95"
      >
        Trouver
      </button>
    </form>
  );
}

function UnknownPostal({ cp }: { cp: string }) {
  return (
    <div className="rounded-md border border-bureau-800 bg-bureau-800/20 px-5 py-6 text-center">
      <p className="text-sm text-bureau-400">
        Code postal inconnu&nbsp;: &laquo;&nbsp;{cp}&nbsp;&raquo;.
      </p>
      <Link href="/mon-depute" className="mt-3 inline-block text-xs text-teal-400 hover:text-teal-300">
        Réessayer
      </Link>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-md border border-bureau-800 bg-bureau-900 p-6">
      <div className="flex items-start gap-5">
        <div className="h-16 w-16 rounded-full bg-bureau-700/40" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-bureau-700/40" />
          <div className="h-3 w-1/3 rounded bg-bureau-700/30" />
          <div className="h-3 w-1/2 rounded bg-bureau-700/30" />
        </div>
      </div>
    </div>
  );
}
