"use client";

import { useState } from "react";

interface ShareButtonsProps {
  deputyName: string;
  party: string;
  url: string;
}

export function ShareButtons({ deputyName, party, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const message = `Voici mon député selon L'Observatoire : ${deputyName} (${party}). Découvrez ses votes et déclarations. ${url}`;
  const subject = `Mon député : ${deputyName} (${party}) — L'Observatoire`;

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  function handleX() {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener"
    );
  }

  function handleMastodon() {
    const instance = window.prompt("Votre instance Mastodon (ex. mastodon.social)");
    if (!instance || !instance.trim()) return;
    const cleanInstance = instance.trim().replace(/^https?:\/\//, "");
    window.open(
      `https://${cleanInstance}/share?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener"
    );
  }

  function handleEmail() {
    const body = `${message}\n\nSource : ${url}`;
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_self"
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a temporary input
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const btns: Array<{
    label: string;
    ariaLabel: string;
    onClick: () => void;
    icon: React.ReactNode;
    style: string;
  }> = [
    {
      label: "WhatsApp",
      ariaLabel: "Partager sur WhatsApp",
      onClick: handleWhatsApp,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      style: "border-teal-700/40 text-teal-400 hover:bg-teal-400/10 hover:border-teal-400/40",
    },
    {
      label: "X",
      ariaLabel: "Partager sur X",
      onClick: handleX,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      style: "border-bureau-700/40 text-bureau-300 hover:bg-bureau-700/20 hover:border-bureau-600/40",
    },
    {
      label: "Mastodon",
      ariaLabel: "Partager sur Mastodon",
      onClick: handleMastodon,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" />
        </svg>
      ),
      style: "border-bureau-700/40 text-bureau-300 hover:bg-bureau-700/20 hover:border-bureau-600/40",
    },
    {
      label: "E-mail",
      ariaLabel: "Partager par e-mail",
      onClick: handleEmail,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 7L2 7" />
        </svg>
      ),
      style: "border-bureau-700/40 text-bureau-300 hover:bg-bureau-700/20 hover:border-bureau-600/40",
    },
    {
      label: copied ? "Copié" : "Copier",
      ariaLabel: copied ? "Lien copié" : "Copier le lien",
      onClick: handleCopy,
      icon: copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      ),
      style: copied
        ? "border-teal-700/40 text-teal-400 bg-teal-400/5"
        : "border-bureau-700/40 text-bureau-300 hover:bg-bureau-700/20 hover:border-bureau-600/40",
    },
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
      {btns.map((btn) => (
        <button
          key={btn.ariaLabel}
          type="button"
          onClick={btn.onClick}
          aria-label={btn.ariaLabel}
          className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors sm:w-auto sm:flex-1 ${btn.style}`}
        >
          {btn.icon}
          <span>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
