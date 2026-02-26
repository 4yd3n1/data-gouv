/**
 * HTTP client for data.gouv.fr Tabular API pagination + direct downloads.
 * Uses Node 20 native fetch.
 */

const TABULAR_BASE = "https://tabular-api.data.gouv.fr/api/resources";
const DEFAULT_PAGE_SIZE = 200;
const DELAY_MS = 100; // Polite delay between paginated requests

interface TabularResponse {
  data: Record<string, unknown>[];
  links: {
    next?: string;
    previous?: string;
  };
  meta: {
    page: number;
    page_size: number;
    total: number;
  };
}

interface FetchPagesOptions {
  pageSize?: number;
  delayMs?: number;
  filterColumn?: string;
  filterValue?: string;
  filterOperator?: string;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
}

/**
 * Paginate through all rows of a Tabular API resource.
 * Yields batches of rows per page.
 */
export async function* fetchAllPages(
  resourceId: string,
  options: FetchPagesOptions = {}
): AsyncGenerator<Record<string, unknown>[]> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const delay = options.delayMs ?? DELAY_MS;
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });

    if (options.filterColumn && options.filterValue) {
      params.set("filter_column", options.filterColumn);
      params.set("filter_value", options.filterValue);
      params.set("filter_operator", options.filterOperator ?? "exact");
    }
    if (options.sortColumn) {
      params.set("sort_column", options.sortColumn);
      params.set("sort_direction", options.sortDirection ?? "asc");
    }

    const url = `${TABULAR_BASE}/${resourceId}/data/?${params}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Tabular API error: ${res.status} ${res.statusText} for ${url}`);
    }

    const json = (await res.json()) as TabularResponse;
    const rows = json.data;

    if (rows.length === 0) break;

    yield rows;

    const total = json.meta.total;
    const fetched = page * pageSize;
    if (fetched >= total) break;

    page++;
    if (delay > 0) await sleep(delay);
  }
}

/**
 * Fetch all rows from a Tabular API resource as a flat array.
 */
export async function fetchAllRows(
  resourceId: string,
  options: FetchPagesOptions = {}
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for await (const batch of fetchAllPages(resourceId, options)) {
    rows.push(...batch);
  }
  return rows;
}

/**
 * Fetch raw text from a URL (for CSV downloads).
 * Handles ISO-8859-1 encoding (common in French government CSVs).
 */
export async function fetchText(url: string, encoding?: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status} ${res.statusText} for ${url}`);
  }
  if (encoding) {
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
  }
  return res.text();
}

/**
 * Fetch JSON from a URL.
 */
export async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch and decompress a gzipped response.
 */
export async function fetchGzip(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status} ${res.statusText} for ${url}`);
  }
  const buffer = await res.arrayBuffer();
  const { gunzipSync } = await import("node:zlib");
  return gunzipSync(Buffer.from(buffer)).toString("utf-8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
