import Link from "next/link";

export type RelationItemType =
  | "ministere"
  | "lobbyiste"
  | "entreprise"
  | "media"
  | "parti"
  | "groupe"
  | "commission"
  | "scrutin"
  | "personnalite"
  | "declaration"
  | "autre";

export interface RelationItem {
  type: RelationItemType;
  title: string;
  href?: string;
  meta?: string;
}

export interface RelationGroup {
  label: string;
  /** Optional intro line under the group label. */
  hint?: string;
  items: RelationItem[];
}

export interface RelationsGridProps {
  groups: RelationGroup[];
  /** Empty-state copy when all groups are empty. Defaults to a generic French line. */
  emptyMessage?: string;
}

const TYPE_LABEL: Record<RelationItemType, string> = {
  ministere: "Ministère",
  lobbyiste: "Lobby",
  entreprise: "Entreprise",
  media: "Média",
  parti: "Parti",
  groupe: "Groupe",
  commission: "Commission",
  scrutin: "Scrutin",
  personnalite: "Personnalité",
  declaration: "Déclaration",
  autre: "Lien",
};

/**
 * Skeleton grid for the "Relations" section on every profile type. Each entity
 * type wires its own group set (see plan phases 5–6). Same component, different
 * group composition per type — the structural frame is shared.
 */
export function RelationsGrid({
  groups,
  emptyMessage = "Aucun lien détecté à ce jour.",
}: RelationsGridProps) {
  const nonEmpty = groups.filter((g) => g.items.length > 0);
  if (nonEmpty.length === 0) {
    return (
      <p className="text-[13px] italic text-fg-faint">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-6">
      {nonEmpty.map((group) => (
        <section key={group.label} className="space-y-2">
          <header>
            <h3 className="text-[11px] uppercase tracking-[0.1em] text-fg-mute">
              {group.label}
            </h3>
            {group.hint ? (
              <p className="text-[12px] text-fg-faint">{group.hint}</p>
            ) : null}
          </header>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item, idx) => (
              <li key={`${item.title}-${idx}`}>
                <RelationCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function RelationCard({ item }: { item: RelationItem }) {
  const body = (
    <>
      <span className="text-[10px] uppercase tracking-[0.1em] text-fg-faint">
        {TYPE_LABEL[item.type]}
      </span>
      <span className="block text-[13px] font-medium leading-snug text-fg">
        {item.title}
      </span>
      {item.meta ? (
        <span className="block text-[11px] text-fg-mute">{item.meta}</span>
      ) : null}
    </>
  );

  const cardClass =
    "block rounded border border-fg-faint/20 bg-ink-1/30 p-3 transition-colors";

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={`${cardClass} hover:border-fg-mute/40 hover:bg-ink-1/60`}
      >
        {body}
      </Link>
    );
  }
  return <span className={cardClass}>{body}</span>;
}
