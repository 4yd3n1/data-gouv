"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function subscribeNewsletter(slug: string, formData: FormData) {
  const email = formData.get("email");
  if (!email || typeof email !== "string" || !email.includes("@")) {
    // Redirect back without newsletter=ok so the form stays visible
    redirect(`/v/${slug}`);
  }

  const trimmed = email.trim().toLowerCase();

  await prisma.newsletterPending.upsert({
    where: { email: trimmed },
    create: { email: trimmed, sourceSlug: slug },
    update: {},
  });

  redirect(`/v/${slug}?newsletter=ok`);
}
