import Link from "next/link";
import { ReactNode } from "react";

export function ReadLink({
  href,
  children = "Ouvrir le dossier",
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link href={href} className="lnk-arrow">
      <span>{children}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}
