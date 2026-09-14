/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */
"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  Plus,
  ScanLine,
  Smartphone,
  Power,
  PowerOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Scanner {
  id: string;
  event_id: string;
  user_id: string;
  device_name: string;
  activation_code: string;
  status: "active" | "revoked";
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ScannersPageProps {
  params: Promise<{
    organizationSlug: string;
    eventId: string;
  }>;
}

export default function ScannersPage() {
  const [eventId, setEventId] = useState<string | null>(null);

  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split("/");

    const index = parts.indexOf("events");

    if (index !== -1 && parts[index + 1]) {
      setEventId(parts[index + 1]);
    }
  }, []);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    loadScanners(eventId);
  }, [eventId]);

  async function loadScanners(id: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${id}/scanners`);

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        scanners?: Scanner[];
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to load scanners.");
      }

      setScanners(data.scanners ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load scanners.");
    } finally {
      setLoading(false);
    }
  }

  async function createScanner() {
    if (!eventId) {
      return;
    }

    const name = deviceName.trim();

    if (!name) {
      setError("Enter a scanner name.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/scanners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceName: name,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        scanner?: Scanner;
      };

      if (!response.ok || !data.success || !data.scanner) {
        throw new Error(data.error ?? "Unable to create scanner.");
      }

      setScanners((current) => [data.scanner!, ...current]);

      setDeviceName("");
      setDialogOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create scanner.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateScannerStatus(
    scanner: Scanner,
    status: "active" | "revoked",
  ) {
    setError(null);

    try {
      const response = await fetch(`/api/scanner/${scanner.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        scanner?: Scanner;
      };

      if (!response.ok || !data.success || !data.scanner) {
        throw new Error(data.error ?? "Unable to update scanner.");
      }

      setScanners((current) =>
        current.map((item) => (item.id === scanner.id ? data.scanner! : item)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update scanner.",
      );
    }
  }

  async function copyCode(scanner: Scanner) {
    try {
      await navigator.clipboard.writeText(scanner.activation_code);

      setCopiedId(scanner.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch {
      setError("Unable to copy activation code.");
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ScanLine className="size-5 text-muted-foreground" />

              <p className="text-sm text-muted-foreground">Event scanners</p>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Scanners
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Register phones or tablets that staff will use to check guests
              into this event.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 size-4" />
                Add scanner
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add scanner</DialogTitle>

                <DialogDescription>
                  Create an activation code for a staff member&apos;s phone or
                  tablet.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-4">
                <label htmlFor="device-name" className="text-sm font-medium">
                  Scanner name
                </label>

                <Input
                  id="device-name"
                  value={deviceName}
                  onChange={(event) => setDeviceName(event.target.value)}
                  placeholder="Entrance Scanner 1"
                  autoFocus
                />

                <p className="text-xs text-muted-foreground">
                  Example: Main Entrance, VIP Entrance, or Reception.
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>

                <Button
                  onClick={createScanner}
                  disabled={creating || !deviceName.trim()}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 size-4" />
                      Create scanner
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error */}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Empty state */}

        {scanners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <Smartphone className="size-6 text-muted-foreground" />
              </div>

              <h2 className="mt-4 font-semibold">No scanners registered</h2>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Create a scanner and give its activation code to the staff
                member who will use the phone at the entrance.
              </p>

              <Button className="mt-6" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 size-4" />
                Add first scanner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {scanners.map((scanner) => (
              <Card key={scanner.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                        <Smartphone className="size-5 text-muted-foreground" />
                      </div>

                      <div>
                        <CardTitle className="text-base">
                          {scanner.device_name}
                        </CardTitle>

                        <CardDescription>
                          Created{" "}
                          {new Date(scanner.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>

                    <Badge
                      variant={
                        scanner.status === "active" ? "default" : "secondary"
                      }
                    >
                      {scanner.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Activation code */}

                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Activation code
                        </p>

                        <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.2em]">
                          {scanner.activation_code}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyCode(scanner)}
                        title="Copy activation code"
                      >
                        {copiedId === scanner.id ? (
                          <Check className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      Give this code to the staff member. They enter it at
                      <span className="font-medium"> /scanner </span>
                      on the device.
                    </p>
                  </div>

                  {/* Status */}

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Scanner access</p>

                      <p className="text-xs text-muted-foreground">
                        {scanner.status === "active"
                          ? "This scanner can check guests in."
                          : "This scanner can no longer check guests in."}
                      </p>
                    </div>

                    {scanner.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateScannerStatus(scanner, "revoked")}
                      >
                        <PowerOff className="mr-2 size-4" />
                        Revoke
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateScannerStatus(scanner, "active")}
                      >
                        <Power className="mr-2 size-4" />
                        Activate
                      </Button>
                    )}
                  </div>

                  {/* Last seen */}

                  <div className="border-t pt-4 text-xs text-muted-foreground">
                    {scanner.last_seen_at
                      ? `Last active ${new Date(
                          scanner.last_seen_at,
                        ).toLocaleString()}`
                      : "This scanner has not checked in yet."}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* How it works */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How scanner setup works</CardTitle>

            <CardDescription>
              You control which devices can check guests into this event.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <Step
                number="1"
                title="Create scanner"
                description="Create a scanner and generate a unique activation code."
              />

              <Step
                number="2"
                title="Give code to staff"
                description="Staff opens /scanner on their phone and enters the code."
              />

              <Step
                number="3"
                title="Start scanning"
                description="The phone becomes tied to this event and can scan guest QR codes."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
        {number}
      </div>

      <div>
        <p className="text-sm font-medium">{title}</p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
