"use client";

import { useRef, useState } from "react";
import { Download, Loader2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InvitationQrDialogProps {
  eventId: string;
  guestId: string;
  guestName: string;
}

export function InvitationQrDialog({
  eventId,
  guestId,
  guestName,
}: InvitationQrDialogProps) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);

  async function generateInvitation() {
    if (token) {
      setOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/events/${eventId}/guests/${guestId}/invitation`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate invitation.");
      }

      setToken(data.token);
      setOpen(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");

    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${guestName
      .toLowerCase()
      .replace(/\s+/g, "-")}-invitation.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={generateInvitation}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <QrCode className="mr-2 size-4" />
        )}

        {loading ? "Generating..." : "Invitation"}
      </Button>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guest Invitation</DialogTitle>

            <DialogDescription>
              This QR code belongs to <strong>{guestName}</strong>. It can only
              be used once at the event.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center">
            <div ref={qrRef} className="rounded-2xl border bg-white p-6">
              {token && (
                <QRCodeSVG value={token} size={240} level="H" marginSize={2} />
              )}
            </div>

            <p className="mt-4 text-center text-sm font-medium">{guestName}</p>

            <p className="mt-1 text-center text-xs text-muted-foreground">
              Present this QR code at the entrance.
            </p>

            <Button className="mt-6 w-full" onClick={downloadQr}>
              <Download className="mr-2 size-4" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
