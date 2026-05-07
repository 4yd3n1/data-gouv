import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { DOSSIERS } from "@/lib/dossier-config";
import { listDrafts } from "@/lib/factcheck-manifest";

export const revalidate = 3600;

const STATIC_ROUTES = [
  "/",
  "/methodologie",
  "/apropos",
  "/profils",
  "/signaux",
  "/votes",
  "/territoire",
  "/souverainete",
  "/patrimoine",
  "/signaler-une-erreur",
  "/mon-depute",
  "/v",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const [personnalites, deputes, senateurs, lobbyistes, departements, drafts] = await Promise.all([
    prisma.personnalitePublique.findMany({
      select: { slug: true, derniereMaj: true },
    }),
    prisma.depute.findMany({
      select: { id: true },
    }),
    prisma.senateur.findMany({
      select: { id: true },
    }),
    prisma.lobbyiste.findMany({
      select: { id: true },
    }),
    prisma.departement.findMany({
      select: { code: true },
    }),
    listDrafts(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1.0 : 0.7,
  }));

  const dossierEntries: MetadataRoute.Sitemap = DOSSIERS.map((d) => ({
    url: `${siteUrl}/dossiers/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: d.priority === 1 ? 0.9 : d.priority === 2 ? 0.8 : 0.7,
  }));

  const personnaliteEntries: MetadataRoute.Sitemap = personnalites.map((p) => ({
    url: `${siteUrl}/profils/${p.slug}`,
    lastModified: p.derniereMaj ?? now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const deputeEntries: MetadataRoute.Sitemap = deputes.map((d) => ({
    url: `${siteUrl}/profils/deputes/${d.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const senateurEntries: MetadataRoute.Sitemap = senateurs.map((s) => ({
    url: `${siteUrl}/profils/senateurs/${s.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const lobbyisteEntries: MetadataRoute.Sitemap = lobbyistes.map((l) => ({
    url: `${siteUrl}/profils/lobbyistes/${l.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const territoireEntries: MetadataRoute.Sitemap = departements.map((dep) => ({
    url: `${siteUrl}/territoire/${dep.code}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const factCheckEntries: MetadataRoute.Sitemap = drafts.map((d) => ({
    url: `${siteUrl}/v/${d.slug}`,
    lastModified: d.publishedAt ? new Date(d.publishedAt) : now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    ...staticEntries,
    ...dossierEntries,
    ...personnaliteEntries,
    ...deputeEntries,
    ...senateurEntries,
    ...lobbyisteEntries,
    ...territoireEntries,
    ...factCheckEntries,
  ];
}
