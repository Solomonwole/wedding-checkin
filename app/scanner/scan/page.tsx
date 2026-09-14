/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ScanLine,
  Smartphone,
  UserRound,
  XCircle,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ScanResult {
  success: boolean;
  result: string;
  invitation_id?: string | null;
  guest_id?: string | null;
  guest_name?: string | null;
  guest_category?: string | null;
  checked_in_at?: string | null;
}

type ScanState = "starting" | "scanning" | "processing" | "success" | "error";

const SCANNER_ELEMENT_ID = "wedding-checkin-qr-reader";

export default function ScannerScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const deviceId = searchParams.get("device");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  const [scanState, setScanState] = useState<ScanState>("starting");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    scannerRef.current = null;

    try {
      const state = scanner.getState();

      // Html5Qrcode states:
      // 1 = NOT_STARTED
      // 2 = SCANNING
      // 3 = PAUSED
      if (state === 2 || state === 3) {
        await scanner.stop();
      }
    } catch (err) {
      console.error("Unable to stop scanner:", err);
    }

    try {
      scanner.clear();
    } catch (err) {
      console.error("Unable to clear scanner:", err);
    }
  }, []);

  const processQrCode = useCallback(
    async (decodedText: string) => {
      if (processingRef.current) {
        return;
      }

      processingRef.current = true;

      setScanState("processing");
      setError(null);

      await stopCamera();

      try {
        const response = await fetch("/api/scanner/check-in", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: decodedText,
            scannerDeviceId: deviceId,
          }),
        });

        const rawText = await response.text();

        let data: ScanResult & { error?: string };

        try {
          data = JSON.parse(rawText) as ScanResult & {
            error?: string;
          };
        } catch {
          throw new Error(
            `Server returned an invalid response (${response.status}).`,
          );
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to process this invitation.");
        }

        if (!mountedRef.current) {
          return;
        }

        setResult(data);

        if (data.success) {
          setScanState("success");
        } else {
          setScanState("error");
        }
      } catch (err) {
        console.error("Check-in error:", err);

        if (!mountedRef.current) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to process the invitation.",
        );

        setScanState("error");
      } finally {
        processingRef.current = false;
      }
    },
    [deviceId, stopCamera],
  );

  const startCamera = useCallback(async () => {
    if (!deviceId) {
      setError("This scanner is not associated with a registered device.");
      setScanState("error");
      return;
    }

    setError(null);
    setResult(null);
    processingRef.current = false;

    setScanState("starting");

    try {
      await stopCamera();

      /*
       * Make sure the browser actually has access to a camera.
       *
       * This is particularly useful on iOS where the browser may not
       * expose camera devices until permission has been granted.
       */
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is not supported by this browser. Please use Safari or Chrome on a device with a camera.",
        );
      }

      let permissionStream: MediaStream | null = null;

      try {
        permissionStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });
      } finally {
        /*
         * We only use this stream to request permission.
         * html5-qrcode will create its own stream.
         */
        permissionStream?.getTracks().forEach((track) => track.stop());
      }

      if (!mountedRef.current) {
        return;
      }

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);

      scannerRef.current = scanner;

      /*
       * Prefer the rear-facing camera.
       *
       * We first try facingMode. This works well across mobile browsers
       * and avoids depending on camera IDs being available beforehand.
       */
      await scanner.start(
        {
          facingMode: {
            exact: "environment",
          },
        },
        {
          fps: 10,
          qrbox: {
            width: 240,
            height: 395,
          },
          aspectRatio: 1,
          disableFlip: false,
        },
        (decodedText) => {
          void processQrCode(decodedText);
        },
        () => {
          // QR code not detected yet.
        },
      );

      if (!mountedRef.current) {
        await stopCamera();
        return;
      }

      setScanState("scanning");
    } catch (err) {
      console.error("Camera initialization error:", err);

      await stopCamera();

      if (!mountedRef.current) {
        return;
      }

      let message = "Unable to access the camera.";

      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          message =
            "Camera permission was denied. Allow camera access for this website in your browser settings, then try again.";
        } else if (err.name === "NotFoundError") {
          message = "No camera was found on this device.";
        } else if (err.name === "NotReadableError") {
          message =
            "The camera is already being used by another application or browser tab.";
        } else if (err.name === "SecurityError") {
          message =
            "The browser blocked camera access for security reasons. Make sure you are using HTTPS.";
        } else if (err.name === "OverconstrainedError") {
          message =
            "The rear camera could not be selected. Try again or use another camera.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      setScanState("error");
    }
  }, [deviceId, processQrCode, stopCamera]);

  const resetScanner = useCallback(async () => {
    await stopCamera();

    setResult(null);
    setError(null);
    processingRef.current = false;

    await startCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      void stopCamera();
    };
  }, [stopCamera]);

  /*
   * Automatically start the camera when the page opens.
   */
  useEffect(() => {
    if (!deviceId) {
      return;
    }

    void startCamera();
  }, [deviceId, startCamera]);

  if (!deviceId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertCircle className="size-7 text-destructive" />
            </div>

            <CardTitle className="mt-4">Scanner not found</CardTitle>

            <CardDescription>
              This scanning session is missing a registered scanner device.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button className="w-full" onClick={() => router.push("/scanner")}>
              Return to scanner setup
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col">
        {/* Header */}

        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <ScanLine className="size-5 text-primary" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-semibold">Guest Check-in</h1>

              <p className="text-sm text-muted-foreground">
                Scan the guest&apos;s invitation QR code
              </p>
            </div>

            <Badge variant="outline">
              <Smartphone className="mr-1 size-3" />
              Scanner
            </Badge>
          </div>
        </div>

        {/* Starting / Scanning */}

        {(scanState === "starting" || scanState === "scanning") && (
          <div className="flex flex-1 flex-col px-4 py-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-[360px] w-full overflow-hidden bg-black sm:h-[320px]">
                  <div id={SCANNER_ELEMENT_ID} className="h-full w-full" />

                  {scanState === "starting" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
                      <Loader2 className="size-8 animate-spin" />

                      <p className="mt-3 text-sm">Starting camera...</p>

                      <p className="mt-1 max-w-xs px-6 text-center text-xs text-white/60">
                        Please allow camera access when your browser asks.
                      </p>
                    </div>
                  )}

                  {/* {scanState === "scanning" && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="size-56 rounded-3xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                    </div>
                  )} */}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              {scanState === "starting" && (
                <>
                  <h2 className="text-xl font-semibold">Starting camera</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Please allow camera access if prompted.
                  </p>
                </>
              )}

              {scanState === "scanning" && (
                <>
                  <h2 className="text-xl font-semibold">Ready to scan</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Position the guest&apos;s QR code inside the frame.
                  </p>
                </>
              )}
            </div>

            {scanState === "scanning" && (
              <div className="mt-auto pt-8">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => void stopCamera()}
                >
                  Stop camera
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Processing */}

        {scanState === "processing" && (
          <div className="flex flex-1 items-center justify-center px-5">
            <Card className="w-full">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Checking invitation
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Verifying the guest&apos;s invitation...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success */}

        {scanState === "success" && result && (
          <div className="flex items-center justify-center px-5 py-8">
            <Card className="w-full">
              <CardHeader className="text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="size-9 text-green-600" />
                </div>

                <CardTitle className="mt-5 text-2xl">
                  Check-in successful
                </CardTitle>

                <CardDescription>
                  The guest has been checked in successfully.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-5 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-background">
                    <UserRound className="size-6 text-muted-foreground" />
                  </div>

                  <p className="mt-3 text-lg font-semibold">
                    {result.guest_name ?? "Guest"}
                  </p>

                  {result.guest_category && (
                    <Badge variant="secondary" className="mt-2">
                      {result.guest_category}
                    </Badge>
                  )}
                </div>

                {result.checked_in_at && (
                  <p className="text-center text-sm text-muted-foreground">
                    Checked in{" "}
                    {new Date(result.checked_in_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => void resetScanner()}
                >
                  <ScanLine className="mr-2 size-5" />
                  Scan next guest
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error */}

        {scanState === "error" && (
          <div className="flex items-center justify-center px-5 py-8">
            <Card className="w-full">
              <CardHeader className="text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="size-9 text-destructive" />
                </div>

                <CardTitle className="mt-5 text-2xl">
                  {result?.result === "already_used"
                    ? "Already checked in"
                    : result?.result === "wrong_event"
                      ? "Wrong event"
                      : result?.result === "revoked"
                        ? "Invitation revoked"
                        : result?.result === "guest_not_found"
                          ? "Guest not found"
                          : "Scanner error"}
                </CardTitle>

                <CardDescription>
                  {result?.result === "already_used"
                    ? `${result.guest_name ?? "This guest"} has already checked in.`
                    : result?.result === "wrong_event"
                      ? "This invitation belongs to a different event."
                      : result?.result === "revoked"
                        ? "This invitation is no longer valid."
                        : result?.result === "guest_not_found"
                          ? "The guest associated with this invitation could not be found."
                          : (error ?? "The scanner could not continue.")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {result?.guest_name && (
                  <div className="rounded-xl border bg-muted/30 p-4 text-center">
                    <p className="font-medium">{result.guest_name}</p>

                    {result.guest_category && (
                      <Badge variant="outline" className="mt-2">
                        {result.guest_category}
                      </Badge>
                    )}
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => void resetScanner()}
                >
                  <ScanLine className="mr-2 size-5" />
                  Try camera again
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/scanner")}
                >
                  Scanner settings
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
