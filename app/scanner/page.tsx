"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CheckCircle2, Loader2, ScanLine, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "wedding-checkin-scanner";

interface ScannerSession {
  id: string;
  event_id: string;
  event_name: string;
  user_id: string;
  device_name: string;
  status: string;
  activation_code?: string;
  last_seen_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function ScannerPage() {
  const router = useRouter();

  const [activationCode, setActivationCode] = useState("");
  const [scannerName, setScannerName] = useState("");

  const [scanner, setScanner] = useState<ScannerSession | null>(null);

  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSavedScanner = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
          if (!cancelled) {
            setIsCheckingStorage(false);
          }

          return;
        }

        const parsed = JSON.parse(saved) as ScannerSession;

        if (
          parsed &&
          typeof parsed.id === "string" &&
          typeof parsed.event_id === "string" &&
          typeof parsed.device_name === "string"
        ) {
          if (!cancelled) {
            setScanner(parsed);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (!cancelled) {
          setIsCheckingStorage(false);
        }
      }
    };

    loadSavedScanner();

    return () => {
      cancelled = true;
    };
  }, []);

  async function activateScanner() {
    setError(null);

    const code = activationCode.trim().toUpperCase();
    // const name = scannerName.trim();

    if (!code) {
      setError("Enter the activation code.");
      return;
    }

    // if (!name) {
    //   setError("Enter a scanner name.");
    //   return;
    // }

    setLoading(true);

    try {
      const response = await fetch("/api/scanner/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activationCode: code,
          // deviceName: name,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        scanner?: ScannerSession;
      };

      if (!response.ok || !data.success || !data.scanner) {
        throw new Error(data.error ?? "Unable to activate scanner.");
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.scanner));

      setScanner(data.scanner);
      setActivationCode("");
      setScannerName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to activate scanner.",
      );
    } finally {
      setLoading(false);
    }
  }

  function disconnectScanner() {
    localStorage.removeItem(STORAGE_KEY);

    setScanner(null);
    setActivationCode("");
    setScannerName("");
    setError(null);
  }

  /*
   * IMPORTANT:
   *
   * Don't render the setup form until we've checked localStorage.
   * This prevents the setup screen from flashing briefly on refresh.
   */
  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>

          <h2 className="mt-4 text-lg font-semibold">Loading scanner</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Checking this device...
          </p>
        </div>
      </div>
    );
  }

  if (scanner) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <CheckCircle2 className="size-7 text-primary" />
              </div>

              <CardTitle className="mt-4">Scanner ready</CardTitle>

              <CardDescription>
                This device is connected and ready to scan guest invitations.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Event
                </p>

                <p className="mt-1 font-medium">{scanner.event_name}</p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Scanner
                </p>

                <p className="mt-1 font-medium">{scanner.device_name}</p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() =>
                  router.push(`/scanner/scan?device=${scanner.id}`)
                }
              >
                <ScanLine className="mr-2 size-4" />
                Start scanning
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={disconnectScanner}
              >
                Disconnect scanner
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Smartphone className="size-7" />
            </div>

            <CardTitle className="mt-4">Set up scanner</CardTitle>

            <CardDescription>
              Enter the activation code provided by your event administrator.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* <div className="space-y-2">
              <label htmlFor="scanner-name" className="text-sm font-medium">
                Scanner name
              </label>

              <Input
                id="scanner-name"
                value={scannerName}
                onChange={(event) => setScannerName(event.target.value)}
                placeholder="Main Entrance Scanner"
              />

              <p className="text-xs text-muted-foreground">
                Give this phone a name so staff can identify it.
              </p>
            </div> */}

            <div className="space-y-2">
              <label htmlFor="activation-code" className="text-sm font-medium">
                Activation code
              </label>

              <Input
                id="activation-code"
                value={activationCode}
                onChange={(event) =>
                  setActivationCode(event.target.value.toUpperCase())
                }
                placeholder="WC-XXXXXXXX"
                autoCapitalize="characters"
                autoComplete="off"
                className="text-center font-mono tracking-widest"
              />

              <p className="text-xs text-muted-foreground">
                Get this code from the Scanners section of your event dashboard.
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={loading || !activationCode.trim()}
              onClick={activateScanner}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Activate this device
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
