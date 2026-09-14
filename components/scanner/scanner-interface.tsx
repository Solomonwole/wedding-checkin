"use client";

import { useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock3,
  QrCode,
  RotateCcw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ScanStatus =
  | "ready"
  | "scanning"
  | "checking"
  | "approved"
  | "used"
  | "invalid";

interface Guest {
  name: string;
  category: string;
  initials: string;
  guestNumber: string;
  checkedInAt?: string;
}

const mockGuest: Guest = {
  name: "John Doe",
  category: "Groom's Family",
  initials: "JD",
  guestNumber: "0047",
};

export function ScannerInterface() {
  const [status, setStatus] = useState<ScanStatus>("ready");

  const startScanning = () => {
    setStatus("scanning");

    setTimeout(() => {
      setStatus("checking");

      setTimeout(() => {
        setStatus("approved");
      }, 1200);
    }, 1800);
  };

  const resetScanner = () => {
    setStatus("ready");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="w-full max-w-lg">
        {status === "ready" && <ReadyState onStart={startScanning} />}

        {status === "scanning" && <ScanningState />}

        {status === "checking" && <CheckingState />}

        {status === "approved" && (
          <ApprovedState guest={mockGuest} onScanNext={resetScanner} />
        )}

        {status === "used" && (
          <UsedState guest={mockGuest} onScanNext={resetScanner} />
        )}

        {status === "invalid" && <InvalidState onScanNext={resetScanner} />}
      </div>
    </div>
  );
}

function ReadyState({ onStart }: { onStart: () => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Main Entrance
            </p>

            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Guest Check-In
            </h1>
          </div>

          <Badge variant="secondary">Scanner 01</Badge>
        </div>
      </div>

      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex size-24 items-center justify-center rounded-3xl bg-muted">
            <QrCode className="size-12" strokeWidth={1.5} />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to scan
          </h2>

          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Ask the guest to present their unique wedding invitation QR code.
          </p>

          <Button
            size="lg"
            className="mt-8 h-12 w-full max-w-sm"
            onClick={onStart}
          >
            <Camera />
            Start scanning
          </Button>

          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" />
            One-time entry verification
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScanningState() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-black">
        {/* Camera placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative size-[65%] max-w-70">
            <div className="absolute inset-0 rounded-3xl border-2 border-white/80" />

            {/* Corner markers */}
            <div className="absolute -left-1 -top-1 size-10 rounded-tl-2xl border-l-4 border-t-4 border-white" />
            <div className="absolute -right-1 -top-1 size-10 rounded-tr-2xl border-r-4 border-t-4 border-white" />
            <div className="absolute -bottom-1 -left-1 size-10 rounded-bl-2xl border-b-4 border-l-4 border-white" />
            <div className="absolute -bottom-1 -right-1 size-10 rounded-br-2xl border-b-4 border-r-4 border-white" />

            {/* Scanning line */}
            <div className="absolute left-4 right-4 top-1/2 h-0.5 animate-pulse bg-white" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-6 py-5 text-center text-white backdrop-blur-sm">
          <p className="text-sm font-medium">
            Position the QR code inside the frame
          </p>

          <p className="mt-1 text-xs text-white/70">Scanning automatically</p>
        </div>
      </div>
    </Card>
  );
}

function CheckingState() {
  return (
    <Card>
      <CardContent className="flex min-h-125 flex-col items-center justify-center p-8 text-center">
        <div className="relative flex size-24 items-center justify-center rounded-full bg-muted">
          <div className="absolute inset-0 animate-ping rounded-full border border-border" />

          <QrCode className="size-10 animate-pulse" />
        </div>

        <h2 className="mt-8 text-2xl font-semibold">Verifying invitation</h2>

        <p className="mt-3 text-sm text-muted-foreground">
          Please wait while we verify this guest.
        </p>
      </CardContent>
    </Card>
  );
}

function ApprovedState({
  guest,
  onScanNext,
}: {
  guest: Guest;
  onScanNext: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-foreground px-6 py-8 text-background">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-background/10">
            <CheckCircle2 className="size-12" />
          </div>

          <p className="mt-5 text-sm font-medium uppercase tracking-widest opacity-70">
            Entry approved
          </p>

          <h1 className="mt-2 text-3xl font-semibold">Welcome</h1>
        </div>
      </div>

      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-7" />
          </div>

          <h2 className="mt-4 text-xl font-semibold">{guest.name}</h2>

          <Badge variant="secondary" className="mt-2">
            {guest.category}
          </Badge>

          <div className="mt-6 w-full rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Guest number</span>

              <span className="font-medium">#{guest.guestNumber}</span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>

              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="size-4" />
                Checked in
              </span>
            </div>
          </div>

          <Button size="lg" className="mt-6 h-12 w-full" onClick={onScanNext}>
            <QrCode />
            Scan next guest
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UsedState({
  guest,
  onScanNext,
}: {
  guest: Guest;
  onScanNext: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-125 flex-col items-center justify-center p-8 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <Clock3 className="size-10" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold">Already checked in</h2>

        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          This invitation has already been used for entry.
        </p>

        <div className="mt-6 w-full rounded-xl border p-4">
          <p className="font-medium">{guest.name}</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Checked in earlier
          </p>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="mt-6 w-full"
          onClick={onScanNext}
        >
          <RotateCcw />
          Scan another
        </Button>
      </CardContent>
    </Card>
  );
}

function InvalidState({ onScanNext }: { onScanNext: () => void }) {
  return (
    <Card>
      <CardContent className="flex min-h-125 flex-col items-center justify-center p-8 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <XCircle className="size-10" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold">Invalid invitation</h2>

        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          We couldn&apos;t verify this QR code. Ask the guest to present their
          original invitation.
        </p>

        <Button
          variant="outline"
          size="lg"
          className="mt-8 w-full"
          onClick={onScanNext}
        >
          <RotateCcw />
          Scan again
        </Button>
      </CardContent>
    </Card>
  );
}
