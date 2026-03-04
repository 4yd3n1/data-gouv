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
  const { tab = "interets" } = await searchParams;

  const personnalite = await prisma.personnalitePublique.findUnique({
    where: { slug },
    include: {
      mandats: { orderBy: { rang: "asc" } },
      interets: {
        where: { alerteConflit: true },
        take: 1,
        select: { id: true },
      },
      _count: { select: { interets: true } },
    },
  });

  if (!personnalite) notFound();

  const currentMandat = personnalite.mandats.find((m) => m.dateFin === null);
  const initials = `${personnalite.prenom[0] ?? ""}${personnalite.nom[0] ?? ""}`.toUpperCase();
  const hasConflictAlert = personnalite.interets.length > 0;
  const interetCount = personnalite._count.interets;

  return (
    <>
      <ProfileHero
        avatar={{ src: personnalite.photoUrl, initials }}
        name={`${personnalite.prenom} ${personnalite.nom}`}
        subtitle={
          currentMandat?.titre ??
          personnalite.mandats[0]?.titre ??
          "Membre du gouvernement"
        }
        status={{
          active: currentMandat !== undefined,
          label: currentMandat ? "En exercice" : "Ancien membre du gouvernement",
        }}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Gouvernement", href: "/gouvernement" },
          { label: `${personnalite.prenom} ${personnalite.nom}` },
        ]}
      >
        <Suspense>
          <ProfileTabs
            tabs={[
              {
                key: "interets",
                label: "Intérêts déclarés",
                count: interetCount || undefined,
              },
              {
                key: "mandats",
                label: "Mandats",
                count: personnalite.mandats.length || undefined,
              },
              { key: "parcours", label: "Parcours" },
            ]}
            defaultTab="interets"
          />
        </Suspense>
      </ProfileHero>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* ── Intérêts déclarés ── */}
        {tab === "interets" && (
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

        {/* ── Mandats ── */}
        {tab === "mandats" && (
          <div className="space-y-8 fade-up">
            <MandatsSection mandats={personnalite.mandats} />
            <LobbySection
              ministereCode={currentMandat?.ministereCode ?? null}
            />
            <JudiciaireSection personnaliteId={personnalite.id} />
          </div>
        )}

        {/* ── Parcours ── */}
        {tab === "parcours" && (
          <div className="fade-up">
            <CareerSection personnaliteId={personnalite.id} />
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
