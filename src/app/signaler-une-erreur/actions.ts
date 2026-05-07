"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

/**
 * Sanitize a user-submitted URL. Allow only same-origin paths (`/...`, no `//`)
 * or absolute http(s) URLs. Returns "/" for any unsafe input — `corrections`
 * page also re-validates at render time as defense in depth.
 */
function safeSubmittedUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "/";
  if (trimmed.startsWith("//")) return "/";
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "https:" || u.protocol === "http:") {
      return u.toString();
    }
  } catch {}
  return "/";
}

export async function submitErrorReport(formData: FormData): Promise<void> {
  const url = safeSubmittedUrl(
    (formData.get("url") as string | null)?.trim() ?? "",
  );
  const type = formData.get("type") as string | null;
  const description = ((formData.get("description") as string | null) ?? "").trim();
  const contact = ((formData.get("contact") as string | null) ?? "").trim() || null;

  // Validate required fields
  if (!description || description.length < 10) {
    // Redirect back with error param rather than throw — keeps UX simple
    redirect("/signaler-une-erreur?erreur=description");
  }

  const validTypes = ["FACTUEL", "SOURCE", "TYPO", "AUTRE"] as const;
  type ErrorReportType = (typeof validTypes)[number];
  const reportType: ErrorReportType = validTypes.includes(type as ErrorReportType)
    ? (type as ErrorReportType)
    : "AUTRE";

  await prisma.errorReport.create({
    data: {
      url,
      type: reportType,
      description,
      contact,
    },
  });

  // Audit log
  await prisma.ingestionLog.create({
    data: {
      source: "signaler-une-erreur",
      status: "success",
      rowsIngested: 1,
      duration: 0,
      metadata: JSON.stringify({
        action: "error_report_created",
        reportUrl: url,
        reportType,
        hasContact: !!contact,
      }),
    },
  });

  redirect("/signaler-une-erreur/merci");
}
