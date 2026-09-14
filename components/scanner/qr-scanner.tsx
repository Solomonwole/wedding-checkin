"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, ScanLine, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Html5Qrcode } from "html5-qrcode";

type ScanStatus = "idle" | "scanning" | "processing" | "success" | "error";

interface CheckInResult {
  success?: boolean;
  guest?: {
    id: string;
    name: string;
    category: string;
    plusOne: boolean;
  };
  error?: string;
  code?: string;
  usedAt?: string;
}

export function QrScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<ScanStatus>("idle");

  const [result, setResult] = useState<CheckInResult | null>(null);

  const [scannerError, setScannerError] = useState<string | null>(null);

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (!scanner) return;

    try {
      await scanner.stop();
      await scanner.clear();
    } catch (error) {
      console.error("Unable to stop scanner:", error);
    }

    scannerRef.current = null;
  }

  async function startScanner() {
    setScannerError(null);
    setResult(null);
    setStatus("scanning");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!scannerContainerRef.current) {
        throw new Error("Scanner container not available.");
      }

      const scanner = new Html5Qrcode(scannerContainerRef.current.id);

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          /*
           * Stop immediately after receiving
           * a QR code so the same QR cannot be
           * processed repeatedly.
           */
          await stopScanner();

          await processScan(decodedText);
        },
        () => {
          /*
           * Ignore normal "QR not found"
           * scanner callbacks.
           */
        },
      );
    } catch (error) {
      console.error("Scanner error:", error);

      setStatus("error");

      setScannerError(
        "Unable to access the camera. Please allow camera permission and try again.",
      );

      scannerRef.current = null;
    }
  }

  async function processScan(token: string) {
    setStatus("processing");

    try {
      const scannerDeviceId = localStorage.getItem(
        "wedding-checkin-scanner-device-id",
      );

      if (!scannerDeviceId) {
        setResult({
          error: "This device has not been registered as a scanner.",
          code: "SCANNER_NOT_REGISTERED",
        });

        setStatus("error");

        return;
      }

      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-scanner-device-id": scannerDeviceId,
        },
        body: JSON.stringify({
          token,
        }),
      });

      const data = (await response.json()) as CheckInResult;

      setResult(data);

      if (response.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Check-in request failed:", error);

      setResult({
        error: "Unable to connect to the check-in server.",
      });

      setStatus("error");
    }
  }

  async function resetScanner() {
    await stopScanner();

    setResult(null);
    setScannerError(null);
    setStatus("idle");
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  if (status === "success") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>

          <h2 className="mt-6 text-2xl font-semibold">Check-in successful</h2>

          <p className="mt-2 text-muted-foreground">
            Guest has been cleared for entry.
          </p>

          {result?.guest && (
            <div className="mt-6">
              <p className="text-xl font-semibold">{result.guest.name}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {result.guest.category}
                {result.guest.plusOne ? " · +1" : ""}
              </p>
            </div>
          )}

          <Button className="mt-8 w-full sm:w-auto" onClick={resetScanner}>
            <ScanLine className="mr-2 size-4" />
            Scan Next Guest
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-8 text-destructive" />
          </div>

          <h2 className="mt-6 text-2xl font-semibold">Check-in failed</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {scannerError ||
              result?.error ||
              "This QR code could not be accepted."}
          </p>

          {result?.code === "ALREADY_USED" && (
            <p className="mt-4 text-sm font-medium text-destructive">
              This invitation has already been used.
            </p>
          )}

          <Button className="mt-8" onClick={resetScanner}>
            <ScanLine className="mr-2 size-4" />
            Scan Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "processing") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-16 text-center">
          <Loader2 className="size-10 animate-spin text-muted-foreground" />

          <h2 className="mt-6 text-xl font-semibold">Checking invitation...</h2>

          <p className="mt-2 text-sm text-muted-foreground">Please wait.</p>
        </CardContent>
      </Card>
    );
  }

  if (status === "scanning") {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div id="qr-reader" ref={scannerContainerRef} className="w-full" />

          <div className="p-6 text-center">
            <p className="font-medium">
              Point the camera at the guest&apos;s QR code.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              The invitation will be checked automatically.
            </p>

            <Button variant="outline" className="mt-5" onClick={resetScanner}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Camera className="size-8 text-muted-foreground" />
        </div>

        <h2 className="mt-6 text-xl font-semibold">Ready to scan</h2>

        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Use your device camera to scan a guest invitation QR code.
        </p>

        <Button className="mt-8" onClick={startScanner}>
          <ScanLine className="mr-2 size-4" />
          Start Scanner
        </Button>
      </CardContent>
    </Card>
  );
}
