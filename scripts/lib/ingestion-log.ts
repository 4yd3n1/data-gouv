/**
 * Ingestion logging helper.
 * Wraps any ingestion function in timing + IngestionLog write.
 */

import { prisma } from "../../src/lib/db";

export interface IngestionResult {
  rowsIngested: number;
  rowsTotal?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Run an ingestion function and log the result.
 *
 * Usage:
 *   await logIngestion("deputes", async () => {
 *     // ... do ingestion work ...
 *     return { rowsIngested: 577 };
 *   });
 */
export async function logIngestion(
  source: string,
  fn: () => Promise<IngestionResult>
): Promise<void> {
  const start = Date.now();
  console.log(`\n[${source}] Starting ingestion...`);

  try {
    const result = await fn();
    const duration = Date.now() - start;

    await prisma.ingestionLog.create({
      data: {
        source,
        status: "success",
        rowsIngested: result.rowsIngested,
        rowsTotal: result.rowsTotal ?? null,
        duration,
        metadata: result.metadata ? JSON.stringify(result.metadata) : null,
      },
    });

    console.log(
      `[${source}] Done: ${result.rowsIngested} rows ingested in ${(duration / 1000).toFixed(1)}s`
    );
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);

    await prisma.ingestionLog.create({
      data: {
        source,
        status: "error",
        rowsIngested: 0,
        duration,
        error: message,
      },
    });

    console.error(`[${source}] FAILED after ${(duration / 1000).toFixed(1)}s: ${message}`);
    throw error;
  }
}
