import { prisma } from "@/lib/db";

export interface AlignmentPair {
  groupA: string;   // organeRef (PO* id)
  groupB: string;   // organeRef (PO* id)
  totalShared: number;
  agreed: number;
  alignmentRate: number; // 0–100, one decimal
}

export interface GroupInfo {
  id: string;
  libelle: string;
  libelleAbrege: string | null;
  couleur: string | null;
}

/**
 * Compute pairwise alignment rates between all political groups.
 *
 * Dominant position logic: whichever of `pour`/`contre` is strictly higher.
 * If `abstentions` is the highest, the group's position is 'abstention' and that
 * scrutin is excluded from the pair's count (neither agreed nor disagreed).
 *
 * @param minShared  Minimum number of shared meaningful scrutins to include a pair (default 5)
 */
export async function computeAlignment(minShared = 5): Promise<{
  pairs: AlignmentPair[];
  groups: GroupInfo[];
}> {
  // Self-join on GroupeVote filtered to political groups (codeType = 'GP').
  // Only scrutins where both groups have a clear pour/contre majority count.
  const rawPairs = await prisma.$queryRaw<
    { groupA: string; groupB: string; totalShared: bigint; agreed: bigint; alignmentRate: number }[]
  >`
    WITH positions AS (
      SELECT
        gv."scrutinId",
        gv."organeRef",
        CASE
          WHEN gv."pour"  > gv."contre" AND gv."pour"  > gv."abstentions" THEN 'pour'
          WHEN gv."contre" > gv."pour"  AND gv."contre" > gv."abstentions" THEN 'contre'
          ELSE 'abstention'
        END AS dominant
      FROM "GroupeVote" gv
      JOIN "Organe" o ON o.id = gv."organeRef" AND o."codeType" = 'GP'
    ),
    meaningful AS (
      SELECT * FROM positions WHERE dominant != 'abstention'
    )
    SELECT
      p1."organeRef"  AS "groupA",
      p2."organeRef"  AS "groupB",
      COUNT(*)        AS "totalShared",
      SUM(CASE WHEN p1.dominant = p2.dominant THEN 1 ELSE 0 END) AS "agreed",
      ROUND(
        (SUM(CASE WHEN p1.dominant = p2.dominant THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100)::numeric,
        1
      )::float AS "alignmentRate"
    FROM meaningful p1
    JOIN meaningful p2
      ON p1."scrutinId" = p2."scrutinId"
     AND p1."organeRef" < p2."organeRef"
    GROUP BY p1."organeRef", p2."organeRef"
    HAVING COUNT(*) >= ${minShared}
    ORDER BY "alignmentRate" DESC
  `;

  const pairs: AlignmentPair[] = rawPairs.map((r) => ({
    groupA: r.groupA,
    groupB: r.groupB,
    totalShared: Number(r.totalShared),
    agreed: Number(r.agreed),
    alignmentRate: Number(r.alignmentRate),
  }));

  // Collect unique group IDs referenced in pairs
  const groupIds = new Set<string>();
  pairs.forEach((p) => {
    groupIds.add(p.groupA);
    groupIds.add(p.groupB);
  });

  const groups = await prisma.organe.findMany({
    where: { id: { in: Array.from(groupIds) } },
    select: { id: true, libelle: true, libelleAbrege: true, couleur: true },
  });

  // Order groups by total vote volume (sum of nombreMembresGroupe) — largest first
  const volumeMap = new Map<string, number>();
  if (groups.length > 0) {
    const volumes = await prisma.groupeVote.groupBy({
      by: ["organeRef"],
      where: { organeRef: { in: Array.from(groupIds) } },
      _sum: { nombreMembresGroupe: true },
    });
    volumes.forEach((v) => volumeMap.set(v.organeRef, v._sum.nombreMembresGroupe ?? 0));
  }
  groups.sort((a, b) => (volumeMap.get(b.id) ?? 0) - (volumeMap.get(a.id) ?? 0));

  return { pairs, groups };
}
