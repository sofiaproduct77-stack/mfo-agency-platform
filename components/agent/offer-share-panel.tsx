"use client";

import { useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { ensureAgentOfferAction } from "@/actions/platform";
import { Button } from "@/components/ui/button";
import { formatMoney, personalLink } from "@/lib/utils";
import { Copy, Share2 } from "lucide-react";

export function OfferSharePanel({
  offerId,
  productName,
}: {
  offerId: string;
  productName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const result = await ensureAgentOfferAction(offerId);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result.agentOffer) {
        const url = personalLink(result.agentOffer.short_code);
        setLink(url);
        const dataUrl = await QRCode.toDataURL(url, {
          margin: 1,
          width: 200,
          color: { dark: "#fafafa", light: "#111113" },
        });
        setQr(dataUrl);
      }
    });
  }, [offerId]);

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
  }

  async function shareLink() {
    if (!link || !navigator.share) {
      await copyLink();
      return;
    }
    await navigator.share({ title: productName, url: link });
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--card-border)] bg-card p-4">
      <p className="text-sm font-medium">Ваша ссылка</p>
      {qr ? (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR-код" className="rounded-xl" width={160} height={160} />
          <p className="w-full break-all text-center text-xs text-muted-foreground">
            {link}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {pending ? "Готовим ссылку…" : "Загрузка…"}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={!link}
          onClick={copyLink}
        >
          <Copy className="h-4 w-4" />
          Копировать
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!link}
          onClick={shareLink}
        >
          <Share2 className="h-4 w-4" />
          Поделиться
        </Button>
      </div>
    </div>
  );
}
