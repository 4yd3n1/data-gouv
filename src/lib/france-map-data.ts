import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { DeptData } from "@/data/indicators";

async function fetchFranceMapData(): Promise<Record<string, DeptData>> {
  const [statRows, mgRows, budgetRows, depts] = await Promise.all([
    prisma.statLocale.findMany({
      where: {
        geoType: "DEP",
        indicateur: { in: ["MEDIAN_INCOME", "POVERTY_RATE", "UNEMPLOYMENT_RATE_LOCAL", "POP_TOTAL"] },
      },
      orderBy: { annee: "desc" },
      distinct: ["indicateur", "geoCode"],
      select: { geoCode: true, indicateur: true, valeur: true },
    }),
    prisma.densiteMedicale.findMany({
      where: { specialite: "MG" },
      orderBy: { annee: "desc" },
      distinct: ["departementCode"],
      select: { departementCode: true, pour10k: true },
    }),
    prisma.budgetLocal.findMany({
      where: { geoType: "DEP" },
      orderBy: { annee: "desc" },
      distinct: ["geoCode"],
      select: { geoCode: true, detteParHab: true },
    }),
    prisma.departement.findMany({
      select: { code: true, libelle: true, regionCode: true },
    }),
  ]);

  // Index lookups
  const statByCode: Record<string, Record<string, number>> = {};
  for (const row of statRows) {
    if (!statByCode[row.geoCode]) statByCode[row.geoCode] = {};
    statByCode[row.geoCode][row.indicateur] = row.valeur;
  }

  const mgByCode: Record<string, number> = {};
  for (const row of mgRows) {
    mgByCode[row.departementCode] = row.pour10k ?? 0;
  }

  const detByCode: Record<string, number> = {};
  for (const row of budgetRows) {
    detByCode[row.geoCode] = row.detteParHab ?? 0;
  }

  const result: Record<string, DeptData> = {};
  for (const dept of depts) {
    const stats = statByCode[dept.code] ?? {};
    result[dept.code] = {
      n: dept.libelle,
      r: dept.regionCode,
      pop: stats["POP_TOTAL"] ?? 0,
      rev: stats["MEDIAN_INCOME"] ?? 0,
      pov: stats["POVERTY_RATE"] ?? 0,
      cho: stats["UNEMPLOYMENT_RATE_LOCAL"] ?? 0,
      med: mgByCode[dept.code] ?? 0,
      det: detByCode[dept.code] ?? 0,
    };
  }

  return result;
}

// Cache across all callers and requests; revalidate hourly (matches territory page ISR)
export const getFranceMapData = unstable_cache(
  fetchFranceMapData,
  ["france-map-data"],
  { revalidate: 3600 },
);
