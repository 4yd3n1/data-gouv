import { prisma } from "@/lib/db";
import postalCodes from "@/data/postal-codes.json";

export interface ResolvedTerritory {
  commune: { code: string; libelle: string };
  departementCode: string;
  departementLibelle: string;
  regionLibelle: string;
}

/**
 * Resolve a French postal code to one or more communes with full territorial context.
 * Handles arrondissements (ARM typecom) by resolving to their parent commune (COM).
 */
export async function resolvePostalCode(
  input: string
): Promise<ResolvedTerritory[]> {
  const cp = input.trim().slice(0, 5);
  if (cp.length < 4) return [];

  const inseeList: string[] =
    (postalCodes as Record<string, string[]>)[cp] ?? [];
  if (inseeList.length === 0) return [];

  const communes = await prisma.commune.findMany({
    where: { code: { in: inseeList } },
    include: { departement: { include: { region: true } } },
  });

  // Resolve ARMs to their parent COM
  const parentCodesToFetch: string[] = [];
  for (const c of communes) {
    if (c.typecom === "ARM" && c.comparent && !inseeList.includes(c.comparent)) {
      parentCodesToFetch.push(c.comparent);
    }
  }

  let parentCommunes: typeof communes = [];
  if (parentCodesToFetch.length > 0) {
    parentCommunes = await prisma.commune.findMany({
      where: { code: { in: parentCodesToFetch } },
      include: { departement: { include: { region: true } } },
    });
  }

  // Build final deduped list (prefer COMs, substitute ARMs with parent)
  const seen = new Set<string>();
  const results: ResolvedTerritory[] = [];

  for (const c of [...communes, ...parentCommunes]) {
    // Determine effective commune: use parent if ARM
    let effectiveCode = c.code;
    let effectiveLibelle = c.libelle;

    if (c.typecom === "ARM" && c.comparent) {
      const parent = parentCommunes.find((p) => p.code === c.comparent);
      if (parent) {
        effectiveCode = parent.code;
        effectiveLibelle = parent.libelle;
      } else {
        // Parent wasn't in DB — skip this ARM
        continue;
      }
    }

    if (seen.has(effectiveCode)) continue;
    seen.add(effectiveCode);

    const dept = c.departement;
    if (!dept) continue;

    results.push({
      commune: { code: effectiveCode, libelle: effectiveLibelle },
      departementCode: dept.code,
      departementLibelle: dept.libelle,
      regionLibelle: dept.region?.libelle ?? "",
    });
  }

  return results;
}
