export function ScrutinResultBadge({ sortCode }: { sortCode: string }) {
  const isAdopted = sortCode.toLowerCase().includes("adopt");
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${isAdopted ? "bg-teal/10 text-teal" : "bg-rose/10 text-rose"}`}>
      {isAdopted ? "Adopté" : "Rejeté"}
    </span>
  );
}
