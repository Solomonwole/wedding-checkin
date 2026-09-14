"use client";

import { useMemo, useState } from "react";

import {
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  UserPlus,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  category: string;
  plus_one: boolean;
  status: string;
}

interface Invitation {
  id: string;
  guest_id: string;
  status: string;
  sent_at: string | null;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

interface CreatedInvitation {
  guestId: string;
  invitationId: string;
  firstName: string;
  lastName: string;
  token: string;
  status: string;
}

interface InvitationsClientProps {
  eventId: string;
  eventName: string;
  organizationSlug: string;
  guests: Guest[];
  invitationByGuest: Record<string, Invitation>;
  pendingCount: number;
}

export function InvitationsClient({
  eventId,
  eventName,
  guests,
  invitationByGuest,
  pendingCount,
}: InvitationsClientProps) {
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [createdInvitations, setCreatedInvitations] = useState<
    CreatedInvitation[]
  >([]);

  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);

  const selectableGuests = useMemo(
    () => guests.filter((guest) => !invitationByGuest[guest.id]),
    [guests, invitationByGuest],
  );

  const allSelected =
    selectableGuests.length > 0 &&
    selectableGuests.every((guest) => selectedGuests.includes(guest.id));

  function toggleGuest(guestId: string) {
    setSelectedGuests((current) =>
      current.includes(guestId)
        ? current.filter((id) => id !== guestId)
        : [...current, guestId],
    );
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedGuests([]);
      return;
    }

    setSelectedGuests(selectableGuests.map((guest) => guest.id));
  }

  async function createInvitations(guestIds: string[]) {
    if (guestIds.length === 0) {
      return;
    }

    setError(null);
    setCreating(true);
    setCreatedInvitations([]);

    try {
      const response = await fetch(`/api/events/${eventId}/invitation/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestIds,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        summary?: {
          requested: number;
          created: number;
          existing: number;
          failed: number;
        };
        created?: CreatedInvitation[];
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to create invitations.");
      }

      setCreatedInvitations(data.created ?? []);

      setSelectedGuests([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create invitations.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function copyInvitation(invitation: CreatedInvitation) {
    const url = getInvitationUrl(invitation.token);

    await navigator.clipboard.writeText(url);

    setCopiedGuestId(invitation.guestId);

    window.setTimeout(() => {
      setCopiedGuestId(null);
    }, 2000);
  }

  function shareWhatsApp(invitation: CreatedInvitation) {
    const url = getInvitationUrl(invitation.token);

    const message = [
      `You're invited to ${eventName}!`,
      "",
      `Hello ${invitation.firstName},`,
      "",
      "Please use the invitation below to view your invitation and check in at the event.",
      "",
      url,
    ].join("\n");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  function getInvitationUrl(token: string) {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/invite/${token}`;
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Error */}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Newly created invitations */}

      {createdInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invitations created</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm">
                {createdInvitations.length} invitation
                {createdInvitations.length === 1 ? "" : "s"} created
                successfully.
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Share these invitations now. The invitation tokens are only
                returned when they are created.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {createdInvitations.map((invitation) => {
                const url = getInvitationUrl(invitation.token);

                return (
                  <div
                    key={invitation.invitationId}
                    className="flex flex-col gap-4 rounded-xl border p-5 sm:flex-row"
                  >
                    <div className="flex shrink-0 items-center justify-center rounded-lg border bg-white p-3">
                      <QRCodeSVG value={url} size={140} level="M" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {invitation.firstName} {invitation.lastName}
                      </p>

                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {url}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => shareWhatsApp(invitation)}
                        >
                          <MessageCircle className="mr-2 size-4" />
                          WhatsApp
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void copyInvitation(invitation)}
                        >
                          {copiedGuestId === invitation.guestId ? (
                            <>
                              <Check className="mr-2 size-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 size-4" />
                              Copy link
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guest invitation table */}

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base">Guest invitations</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {pendingCount > 0
                  ? `${pendingCount} guest${
                      pendingCount === 1 ? "" : "s"
                    } still need an invitation.`
                  : "All guests have invitations."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={selectableGuests.length === 0}
                onClick={toggleAll}
              >
                {allSelected ? "Clear selection" : "Select all pending"}
              </Button>

              <Button
                disabled={creating || selectedGuests.length === 0}
                onClick={() => void createInvitations(selectedGuests)}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Create invitations
                    {selectedGuests.length > 0
                      ? ` (${selectedGuests.length})`
                      : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {guests.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y">
              {guests.map((guest) => {
                const invitation = invitationByGuest[guest.id];

                const hasInvitation = Boolean(invitation);

                return (
                  <div
                    key={guest.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    {/* Selection */}

                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedGuests.includes(guest.id)}
                        disabled={hasInvitation || creating}
                        onCheckedChange={() => toggleGuest(guest.id)}
                        aria-label={`Select ${guest.first_name} ${guest.last_name}`}
                      />
                    </div>

                    {/* Avatar */}

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {guest.first_name.charAt(0).toUpperCase()}
                      {guest.last_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Guest */}

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {guest.first_name} {guest.last_name}
                      </p>

                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {guest.email || guest.phone || "No contact information"}
                      </p>
                    </div>

                    {/* Category */}

                    <Badge variant="outline">{guest.category}</Badge>

                    {/* Invitation status */}

                    {invitation ? (
                      <InvitationStatus status={invitation.status} />
                    ) : (
                      <Badge variant="outline">Not created</Badge>
                    )}

                    {/* Individual action */}

                    {!hasInvitation && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={creating}
                        onClick={() => void createInvitations([guest.id])}
                      >
                        <Plus className="mr-2 size-4" />
                        Create
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvitationStatus({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    active: "secondary",
    used: "default",
    revoked: "destructive",
    expired: "outline",
  };

  return (
    <Badge variant={variants[status] ?? "outline"} className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <UserPlus className="size-5 text-muted-foreground" />
      </div>

      <h3 className="mt-4 font-semibold">No guests yet</h3>

      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Add guests first, then you can create their invitations.
      </p>
    </div>
  );
}
