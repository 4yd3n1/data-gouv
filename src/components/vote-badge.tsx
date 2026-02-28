const STYLES: Record<string, string> = {
  pour: "bg-teal/10 text-teal",
  contre: "bg-rose/10 text-rose",
  abstention: "bg-amber/10 text-amber",
  nonVotant: "bg-bureau-700/50 text-bureau-400",
};

const LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  nonVotant: "Non-votant",
};

export function VoteBadge({ position }: { position: string }) {
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${STYLES[position] ?? STYLES.nonVotant}`}>
      {LABELS[position] ?? position}
    </span>
  );
}
