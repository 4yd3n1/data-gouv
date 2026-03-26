import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProfileHero } from "@/components/profile-hero";
import { ProfileTabs } from "@/components/profile-tabs";
import { MandatsSection } from "@/components/gouvernement/mandats-section";
import { InteretsSection } from "@/components/gouvernement/interets-section";
import { CareerSection } from "@/components/gouvernement/career-section";
import { LobbySection } from "@/components/gouvernement/lobby-section";
import { JudiciaireSection } from "@/components/gouvernement/judiciaire-section";
import { ParliamentarySection } from "@/components/gouvernement/parliamentary-section";
import { PresidentBilanSection } from "@/components/gouvernement/president-bilan-section";
import { PresidentPromessesSection } from "@/components/gouvernement/president-promesses-section";
import { PresidentLobbyingSection } from "@/components/gouvernement/president-lobbying-section";
import { PresidentDeclarationsSection } from "@/components/gouvernement/president-declarations-section";
import { MediaTutelleSection } from "@/components/gouvernement/media-tutelle-section";
import { getPromesseSummary, BIO, PROMESSES } from "@/data/president-macron";

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
  const { tab = "parcours", election = "2022" } = await searchParams;
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
      _count: { select: { interets: true, carriere: true } },
      evenements: {
        where: { verifie: true },
        select: { id: true },
      },
    },
  });

  if (!personnalite) notFound();

  const currentMandat = personnalite.mandats.find((m) => m.dateFin === null);
  const initials = `${personnalite.prenom[0] ?? ""}${personnalite.nom[0] ?? ""}`.toUpperCase();
  const hasConflictAlert = personnalite.interets.length > 0;
  const interetCount = personnalite._count.interets;
  const carriereCount = personnalite._count.carriere;

  const hasParlementaire = !!(personnalite.deputeId || personnalite.senateurId);
  const judiciaireCount = personnalite.evenements.length;
  const isPresident = personnalite.mandats.some((m) => m.type === "PRESIDENT");

  // Additional count for president hero score
  const presidentDeclCount = isPresident
    ? await prisma.declarationInteret.count({
        where: { nom: { contains: "Macron", mode: "insensitive" } },
      })
    : 0;

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
        { key: "parcours", label: "Parcours", count: carriereCount || undefined },
        { key: "hatvp", label: "Déclarations HATVP", count: interetCount || undefined },
        {
          key: "mandats",
          label: "Mandats & Lobbying",
          count: personnalite.mandats.length || undefined,
        },
        ...(judiciaireCount > 0
          ? [{ key: "judiciaire", label: "Affaires judiciaires", count: judiciaireCount }]
          : []),
        ...(hasParlementaire
          ? [{ key: "parlement", label: "Activité parlementaire" }]
          : []),
      ];

  const defaultTab = isPresident ? "promesses" : "parcours";

  const promesseSummary = isPresident ? getPromesseSummary(2022) : null;

  return (
    <>
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
          active: currentMandat !== undefined,
          label: isPresident
            ? "En fonction depuis le 14 mai 2017"
            : currentMandat
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
          { label: "Gouvernement", href: "/gouvernement" },
          { label: `${personnalite.prenom} ${personnalite.nom}` },
        ]}
      >
        <Suspense>
          <ProfileTabs tabs={tabs} defaultTab={defaultTab} />
        </Suspense>
      </ProfileHero>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* ── Parcours ── */}
        {tab === "parcours" && (
          <div className="fade-up">
            <CareerSection personnaliteId={personnalite.id} />
          </div>
        )}

        {/* ── Promesses (president only) ── */}
        {tab === "promesses" && isPresident && (
          <PresidentPromessesSection electionYear={electionYear} />
        )}

        {/* ── Bilan économique (president only) ── */}
        {tab === "bilan" && isPresident && <PresidentBilanSection />}

        {/* ── Lobbying & Agenda (president only) ── */}
        {tab === "lobbying" && isPresident && <PresidentLobbyingSection />}

        {/* ── Déclarations HATVP (president — uses DeclarationInteret model) ── */}
        {tab === "declarations" && isPresident && (
          <PresidentDeclarationsSection />
        )}

        {/* ── Déclarations HATVP (standard ministers — uses InteretDeclare model) ── */}
        {tab === "hatvp" && !isPresident && (
          <div className="space-y-6 fade-up">
            {hasConflictAlert && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-600/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
                <span className="shrink-0 font-semibold">Alerte :</span>
                <span>
                  Des conflits d&apos;intérêts potentiels ont été identifiés
                  dans les déclarations HATVP.
                </span>
              </div>
            )}
            <InteretsSection
              personnaliteId={personnalite.id}
              hatvpDossierId={personnalite.hatvpDossierId}
            />
          </div>
        )}

        {/* ── Mandats & Lobbying (standard ministers) ── */}
        {tab === "mandats" && !isPresident && (
          <div className="space-y-8 fade-up">
            <MandatsSection mandats={personnalite.mandats} />
            <LobbySection
              ministereCode={currentMandat?.ministereCode ?? null}
            />
            {currentMandat?.ministereCode && (
              <MediaTutelleSection ministereCode={currentMandat.ministereCode} />
            )}
          </div>
        )}

        {/* ── Affaires judiciaires ── */}
        {tab === "judiciaire" && (
          <div className="fade-up">
            <JudiciaireSection personnaliteId={personnalite.id} />
          </div>
        )}

        {/* ── Activité parlementaire (standard profiles only) ── */}
        {tab === "parlement" && hasParlementaire && !isPresident && (
          <div className="fade-up">
            <ParliamentarySection
              deputeId={personnalite.deputeId}
              senateurId={personnalite.senateurId}
            />
          </div>
        )}
      </div>

      {/* Source footer */}
      <div className="mx-auto max-w-4xl px-6 pb-10">
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
