"use client";

import { Download, Mail, QrCode, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { QRCodeSVG } from "qrcode.react";

type InvitationPreviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string;
  category: string;
  guestNumber: string;
};

export function InvitationPreview({
  open,
  onOpenChange,
  guestName,
  category,
  guestNumber,
}: InvitationPreviewProps) {
  const mockToken = `wedding-checkin-${guestNumber}`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Invitation preview</DialogTitle>

          <DialogDescription>
            Preview the invitation before sending it to the guest.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_260px]">
          {/* Invitation */}
          <div className="flex justify-center rounded-2xl border bg-muted/30 p-6">
            <div
              id="invitation-card"
              className="w-full max-w-[380px] overflow-hidden rounded-2xl border bg-background shadow-sm"
            >
              {/* Header */}
              <div className="border-b px-6 py-8 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                  <QrCode className="size-5" />
                </div>

                <p className="mt-5 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                  Wedding Invitation
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  You&apos;re Invited
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  We would love to celebrate this special day with you.
                </p>
              </div>

              {/* Guest */}
              <div className="px-6 py-6 text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Guest
                </p>

                <h3 className="mt-2 text-xl font-semibold">{guestName}</h3>

                <p className="mt-1 text-sm text-muted-foreground">{category}</p>
              </div>

              <Separator />

              {/* QR */}
              <div className="px-6 py-8">
                <div className="mx-auto flex aspect-square max-w-[220px] items-center justify-center rounded-xl bg-white p-4">
                  <QRCodeSVG
                    value={mockToken}
                    size={190}
                    level="H"
                    includeMargin
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t bg-muted/30 px-6 py-5 text-center">
                <p className="text-xs leading-5 text-muted-foreground">
                  Please present this invitation at the entrance. Your QR code
                  can only be used once.
                </p>

                <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Digital Entry Pass
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col">
            <div>
              <p className="text-sm font-medium">Invitation actions</p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                This invitation is linked to this specific guest.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <Button className="w-full">
                <Mail />
                Send invitation
              </Button>

              <Button variant="outline" className="w-full">
                <Download />
                Download
              </Button>
            </div>

            <div className="mt-auto rounded-xl border bg-muted/30 p-4">
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background">
                  <QrCode className="size-4" />
                </div>

                <div>
                  <p className="text-xs font-medium">One-time QR</p>

                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    Once scanned successfully at the entrance, this pass becomes
                    invalid.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
