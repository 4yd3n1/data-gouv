import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProfileHero } from "@/components/profile-hero";
import { ProfileTabs } from "@/components/profile-tabs";
import { MandatsSection } from "@/components/gouvernement/mandats-section";
import { HatvpDeclarationsSection } from "@/components/gouvernement/hatvp-declarations-section";
import { CareerSection } from "@/components/gouvernement/career-section";
import { LobbySection } from "@/components/gouvernement/lobby-section";
import { JudiciaireSection } from "@/components/gouvernement/judiciaire-section";
import { ParliamentarySection } from "@/components/gouvernement/parliamentary-section";
import { PresidentBilanSection } from "@/components/gouvernement/president-bilan-section";
import { PresidentPromessesSection } from "@/components/gouvernement/president-promesses-section";
import { PresidentLobbyingSection } from "@/components/gouvernement/president-lobbying-section";
import { MediaTutelleSection } from "@/components/gouvernement/media-tutelle-section";
import { DeportBanner } from "@/components/gouvernement/deport-banner";
import { DeportSection } from "@/components/gouvernement/deport-section";
import { SouveraineteSection } from "@/components/gouvernement/souverainete-section";
import { TrajectoireHero } from "@/components/gouvernement/trajectoire-hero";
import { ProfileSignalBanner } from "@/components/profile-signal-banner";
import { ProfileSummary } from "@/components/gouvernement/profile-summary";
import { StaleDataNotice } from "@/components/stale-data-notice";
import { ShareButton } from "@/components/share-button";
import { getPromesseSummary, BIO, PROMESSES } from "@/data/president-macron";
import { JsonLd } from "@/components/json-ld";

/**
 * Standard-minister tab order (5-section frame). The president variant keeps
 * its specialized tabs (parcours / promesses / bilan / lobbying / declarations
 * / judiciaire) — see plan §Phase 2.
 */
const STANDARD_TAB_REDIRECTS: Record<string, string> = {
  parcours: "chronologie",
  dossier: "documents",
  hatvp: "documents",
  mandats: "relations",
  judiciaire: "signaux",
  parlementaire: "relations",
};

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.personnalitePublique.findUnique({
    where: { slug },
    include: { mandats: { where: { dateFin: null }, take: 1 } },
  });
  if (!p) return { title: "Fiche introuvable" };
  const titre = p.mandats[0]?.titreCourt ?? "";
  return {
    title: `${p.prenom} ${p.nom} — ${titre} — Intelligence Bureau`,
    description: p.bioCourte ?? `Fiche de ${p.prenom} ${p.nom}, ${titre}.`,
  };
}

export default async function GouvernementProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { slug } = await params;
  const { tab: rawTab, election = "2022" } = await searchParams;
  const electionYear: 2017 | 2022 = election === "2017" ? 2017 : 2022;

  const personnalite = await prisma.personnalitePublique.findUnique({
    where: { slug },
    include: {
      mandats: { orderBy: { rang: "asc" } },
      interets: {
        where: { alerteConflit: true },
        take: 1,
        select: { id: true },
      },
      _count: { select: { interets: true, carriere: true, deports: true } },
      evenements: {
        where: { verifie: true },
        select: { id: true },
      },
    },
  });

  if (!personnalite) notFound();

  const activeMandat = personnalite.mandats.find((m) => m.dateFin === null);
  const lastMandatWithCode = [...personnalite.mandats]
    .filter((m) => m.ministereCode)
    .sort((a, b) => {
      const aEnd = a.dateFin?.getTime() ?? Number.POSITIVE_INFINITY;
      const bEnd = b.dateFin?.getTime() ?? Number.POSITIVE_INFINITY;
      return bEnd - aEnd;
    })[0];
  const currentMandat = activeMandat ?? lastMandatWithCode;
  const initials = `${personnalite.prenom[0] ?? ""}${personnalite.nom[0] ?? ""}`.toUpperCase();
  const hasConflictAlert = personnalite.interets.length > 0;
  const interetCount = personnalite._count.interets;
  const carriereCount = personnalite._count.carriere;

  const hasParlementaire = !!(personnalite.deputeId || personnalite.senateurId);
  const judiciaireCount = personnalite.evenements.length;
  const deportCount = personnalite._count.deports;
  const isPresident = personnalite.mandats.some((m) => m.type === "PRESIDENT");

  // Additional count for president hero score
  const presidentDeclCount = isPresident
    ? await prisma.declarationInteret.count({
        where: { nomNormalise: "macron" },
      })
    : 0;

  // Standard ministers use the 5-section frame; president keeps specialized tabs.
  // Primary path: next.config.ts HTTP 308 redirects (excluding president slug).
  // This in-page guard catches any old key that slips through.
  if (!isPresident && rawTab && STANDARD_TAB_REDIRECTS[rawTab]) {
    permanentRedirect(`/profils/${slug}?tab=${STANDARD_TAB_REDIRECTS[rawTab]}`);
  }

  const signauxCount =
    deportCount + judiciaireCount + (hasConflictAlert ? 1 : 0);

  const tabs = isPresident
    ? [
        { key: "parcours", label: "Parcours", count: carriereCount || undefined },
        { key: "promesses", label: "Promesses", count: PROMESSES.length },
        { key: "bilan", label: "Bilan économique" },
        { key: "lobbying", label: "Lobbying & Agenda" },
        {
          key: "declarations",
          label: "Déclarations HATVP",
          count: presidentDeclCount || undefined,
        },
        ...(judiciaireCount > 0
          ? [{ key: "judiciaire", label: "Affaires judiciaires", count: judiciaireCount }]
          : []),
      ]
    : [
        { key: "resume", label: "Résumé" },
        { key: "signaux", label: "Signaux", count: signauxCount || undefined },
        {
          key: "chronologie",
          label: "CV public",
          count: carriereCount || undefined,
        },
        {
          key: "relations",
          label: "Relations",
          count: personnalite.mandats.length || undefined,
        },
        {
          key: "documents",
          label: "Déclarations HATVP",
        },
      ];

  const defaultTab = isPresident ? "promesses" : "resume";
  const validTabKeys = tabs.map((t) => t.key);
  const tab = rawTab && validTabKeys.includes(rawTab) ? rawTab : defaultTab;

  const promesseSummary = isPresident ? getPromesseSummary(2022) : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${personnalite.prenom} ${personnalite.nom}`,
    url: `${siteUrl}/profils/${personnalite.slug}`,
    ...(personnalite.photoUrl ? { image: personnalite.photoUrl } : {}),
    ...(personnalite.hatvpDossierId ? { sameAs: [personnalite.hatvpDossierId] } : {}),
    ...(currentMandat
      ? {
          hasOccupation: {
            "@type": "GovernmentPosition",
            name: currentMandat.gouvernement ?? "",
          },
          jobTitle: currentMandat.titreCourt ?? currentMandat.titre,
        }
      : {}),
  };

  return (
    <>
      <JsonLd id={`ld-person-${personnalite.slug}`} data={personSchema} />
      <ProfileHero
        avatar={{ src: personnalite.photoUrl, initials }}
        name={`${personnalite.prenom} ${personnalite.nom}`}
        subtitle={
          isPresident
            ? "Président de la République Française · En Marche / Renaissance"
            : (currentMandat?.titre ??
              personnalite.mandats[0]?.titre ??
              "Membre du gouvernement")
        }
        status={{
          active: activeMandat !== undefined,
          label: isPresident
            ? "En fonction depuis le 14 mai 2017"
            : activeMandat
              ? "En exercice"
              : "Ancien membre du gouvernement",
        }}
        {...(isPresident && {
          badge: "Rén.",
          contact: {
            website: "https://www.elysee.fr",
            twitter: "EmmanuelMacron",
          },
          scores: [
            { value: BIO.elections[0].tour2Pct, label: "Suffrage 2017", color: "teal" as const },
            { value: BIO.elections[1].tour2Pct, label: "Suffrage 2022", color: "blue" as const },
            {
              value: (promesseSummary?.tenu ?? 0) + (promesseSummary?.partiel ?? 0),
              label: "Promesses tenues/partielles",
              color: "amber" as const,
            },
            {
              value: presidentDeclCount,
              label: "Déclarations HATVP",
              color: "rose" as const,
            },
          ],
        })}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Ministres", href: "/profils/ministres" },
          { label: `${personnalite.prenom} ${personnalite.nom}` },
        ]}
        lastUpdated={personnalite.derniereMaj}
        stats={
          isPresident
            ? undefined
            : [
                { label: "Mandats", value: personnalite.mandats.length || null },
                { label: "Parcours", value: carriereCount || null },
                { label: "Intérêts HATVP", value: interetCount || null },
                { label: "Affaires", value: judiciaireCount || null },
              ]
        }
        actions={<ShareButton />}
      >
        <Suspense>
          <ProfileTabs tabs={tabs} defaultTab={defaultTab} />
        </Suspense>
      </ProfileHero>

      {deportCount > 0 && !isPresident && tab !== "documents" && (
        <div className="mt-5">
          <DeportBanner
            personnaliteId={personnalite.id}
            hatvpTabHref={`/profils/${personnalite.slug}?tab=signaux#deports`}
          />
        </div>
      )}

      {tab !== "documents" && (
        <div className="mt-5">
          <ProfileSignalBanner keys={[`ministre:${personnalite.slug}`]} />
        </div>
      )}

      <div className="mx-auto mt-5 max-w-6xl px-6">
        <StaleDataNotice date={personnalite.derniereMaj} />
      </div>

      {tab !== "documents" && <TrajectoireHero personnaliteId={personnalite.id} />}

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ─── PRESIDENT VARIANT ─── (specialized tabs, unchanged) */}
        {tab === "parcours" && isPresident && (
          <div className="fade-up">
            <CareerSection
              personnaliteId={personnalite.id}
              ministereCode={currentMandat?.ministereCode}
              portefeuille={currentMandat?.portefeuille}
            />
          </div>
        )}
        {tab === "promesses" && isPresident && (
          <PresidentPromessesSection electionYear={electionYear} />
        )}
        {tab === "bilan" && isPresident && <PresidentBilanSection />}
        {tab === "lobbying" && isPresident && (
          <div className="space-y-8 fade-up">
            <PresidentLobbyingSection />
            <SouveraineteSection
              nom={personnalite.nom}
              prenom={personnalite.prenom}
            />
          </div>
        )}
        {tab === "declarations" && isPresident && (
          <HatvpDeclarationsSection
            personnaliteId={personnalite.id}
            prenom={personnalite.prenom}
            nom={personnalite.nom}
            hatvpDossierId={personnalite.hatvpDossierId}
          />
        )}
        {tab === "judiciaire" && isPresident && (
          <div className="fade-up">
            <JudiciaireSection personnaliteId={personnalite.id} />
          </div>
        )}

        {/* ─── STANDARD MINISTER 5-SECTION FRAME ─── */}
        {tab === "resume" && !isPresident && (
          <ProfileSummary
            currentRole={currentMandat?.titre ?? "Membre du gouvernement"}
            portefeuille={currentMandat?.portefeuille}
            gouvernement={currentMandat?.gouvernement}
            active={activeMandat !== undefined}
            slug={personnalite.slug}
            counts={{
              mandats: personnalite.mandats.length,
              carriere: carriereCount,
              interets: interetCount,
              deports: deportCount,
              judiciaire: judiciaireCount,
            }}
          />
        )}

        {tab === "signaux" && !isPresident && (
          <div className="space-y-8 fade-up">
            {hasConflictAlert && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-600/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
                <span className="shrink-0 font-semibold">Alerte :</span>
                <span>
                  Des conflits d&apos;intérêts potentiels ont été identifiés
                  dans les déclarations HATVP. Voir l&apos;onglet Documents pour
                  le détail des participations.
                </span>
              </div>
            )}
            {deportCount > 0 && (
              <div id="deports">
                <DeportSection personnaliteId={personnalite.id} />
              </div>
            )}
            <JudiciaireSection personnaliteId={personnalite.id} />
          </div>
        )}

        {tab === "chronologie" && !isPresident && (
          <div className="fade-up">
            <CareerSection
              personnaliteId={personnalite.id}
              ministereCode={currentMandat?.ministereCode}
              portefeuille={currentMandat?.portefeuille}
            />
          </div>
        )}

        {tab === "relations" && !isPresident && (
          <div className="space-y-8 fade-up">
            <MandatsSection mandats={personnalite.mandats} />
            <LobbySection
              ministereCode={currentMandat?.ministereCode ?? null}
              personnaliteId={personnalite.id}
            />
            <SouveraineteSection
              nom={personnalite.nom}
              prenom={personnalite.prenom}
            />
            {currentMandat?.ministereCode && (
              <MediaTutelleSection ministereCode={currentMandat.ministereCode} />
            )}
            {hasParlementaire && (
              <ParliamentarySection
                deputeId={personnalite.deputeId}
                senateurId={personnalite.senateurId}
                ministereCode={currentMandat?.ministereCode}
              />
            )}
          </div>
        )}

        {tab === "documents" && !isPresident && (
          <HatvpDeclarationsSection
            personnaliteId={personnalite.id}
            prenom={personnalite.prenom}
            nom={personnalite.nom}
            hatvpDossierId={personnalite.hatvpDossierId}
          />
        )}
      </div>

      {/* Source footer */}
      <div className="mx-auto max-w-6xl px-6 pb-10">
        <p className="text-xs text-bureau-600">
          Dernière mise à jour :{" "}
          {personnalite.derniereMaj.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · Source : HATVP, gouvernement.fr
        </p>
      </div>
    </>
  );
}
