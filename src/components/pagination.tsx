import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  function href(page: number) {
    const params = new URLSearchParams(searchParams);
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  }

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 py-6">
      {currentPage > 1 && (
        <Link href={href(currentPage - 1)} className="rounded-md px-3 py-1.5 text-sm text-bureau-400 hover:bg-bureau-800 hover:text-bureau-200">
          &larr;
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-bureau-600">...</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              p === currentPage
                ? "bg-teal/10 text-teal"
                : "text-bureau-400 hover:bg-bureau-800 hover:text-bureau-200"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link href={href(currentPage + 1)} className="rounded-md px-3 py-1.5 text-sm text-bureau-400 hover:bg-bureau-800 hover:text-bureau-200">
          &rarr;
        </Link>
      )}
    </div>
  );
}
