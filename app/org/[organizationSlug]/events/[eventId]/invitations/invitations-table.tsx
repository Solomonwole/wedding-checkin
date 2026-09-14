"use client";

import { useMemo, useState } from "react";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  MoreHorizontal,
  Send,
  Ticket,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 10;

interface Invitation {
  id: string;
  status: string;
  sentAt: string | null;
  token: string;
  usedAt: string | null;
  revokedAt: string | null;
}

interface GuestRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  category: string;
  status: string;
  plusOne: boolean;
  invitation: Invitation | null;
}

interface InvitationsTableProps {
  eventId: string;
  initialGuests: GuestRow[];
}

function getInvitationUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

export function InvitationsTable({
  eventId,
  initialGuests,
}: InvitationsTableProps) {
  const [guests, setGuests] = useState(initialGuests);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [page, setPage] = useState(1);

  const [loadingGuestId, setLoadingGuestId] = useState<string | null>(null);

  const [bulkLoading, setBulkLoading] = useState(false);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(guests.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const pageGuests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return guests.slice(start, start + PAGE_SIZE);
  }, [guests, currentPage]);

  const selectableGuests = pageGuests.filter((guest) => !guest.invitation);

  const allCurrentPageSelected =
    selectableGuests.length > 0 &&
    selectableGuests.every((guest) => selectedIds.includes(guest.id));

  const selectedGuests = guests.filter((guest) =>
    selectedIds.includes(guest.id),
  );

  const invitationsGenerated = guests.filter(
    (guest) => guest.invitation,
  ).length;

  function toggleGuest(guestId: string) {
    setSelectedIds((current) =>
      current.includes(guestId)
        ? current.filter((id) => id !== guestId)
        : [...current, guestId],
    );
  }

  function toggleCurrentPage() {
    const selectableIds = selectableGuests.map((guest) => guest.id);

    if (allCurrentPageSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !selectableIds.includes(id)),
      );

      return;
    }

    setSelectedIds((current) => [
      ...current,
      ...selectableIds.filter((id) => !current.includes(id)),
    ]);
  }

  async function generateInvitation(guestId: string) {
    setError(null);
    setLoadingGuestId(guestId);

    try {
      const response = await fetch(
        `/api/events/${eventId}/guests/${guestId}/invitation`,
        {
          method: "POST",
        },
      );
      console.log(response);

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        invitation?: {
          id: string;
          status: string;
          created_at: string;
        };
        token?: string;
      };

      if (!response.ok || !data.success || !data.invitation) {
        throw new Error(data.error ?? "Unable to generate invitation.");
      }

      setGuests((current) =>
        current.map((guest) =>
          guest.id === guestId
            ? {
                ...guest,
                invitation: {
                  id: data.invitation!.id,
                  status: data.invitation!.status,
                  sentAt: null,
                  usedAt: null,
                  revokedAt: null,
                },
              }
            : guest,
        ),
      );

      setSelectedIds((current) => current.filter((id) => id !== guestId));

      if (data.token) {
        await copyInvitationLink(data.token);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to generate invitation.",
      );
    } finally {
      setLoadingGuestId(null);
    }
  }

  async function generateBulkInvitations() {
    if (selectedIds.length === 0) {
      return;
    }

    setError(null);
    setBulkLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/invitation/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestIds: selectedIds,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        invitations?: Array<{
          id: string;
          guest_id: string;
          status: string;
        }>;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to generate invitations.");
      }

      const created = data.invitations ?? [];

      setGuests((current) =>
        current.map((guest) => {
          const invitation = created.find((item) => item.guest_id === guest.id);

          if (!invitation) {
            return guest;
          }

          return {
            ...guest,
            invitation: {
              id: invitation.id,
              status: invitation.status,
              sentAt: null,
              usedAt: null,
              revokedAt: null,
            },
          };
        }),
      );

      setSelectedIds([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to generate invitations.",
      );
    } finally {
      setBulkLoading(false);
    }
  }

  async function copyInvitationLink(token: string) {
    const url = getInvitationUrl(token);

    try {
      await navigator.clipboard.writeText(url);
      console.log("Invitation link copied to clipboard:", url);
      setCopiedToken(token);

      window.setTimeout(() => {
        setCopiedToken(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy invitation link:", error);

      setError("Unable to copy the invitation link.");
    }
  }

  function shareOnWhatsApp(token: string, guestName: string) {
    const url = getInvitationUrl(token);

    const message = `You're invited! 🎉

${guestName}, please use your personal invitation link below:

${url}

Please keep this link and present your QR code at the entrance when you arrive.`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  function invitationStatus(guest: GuestRow) {
    if (!guest.invitation) {
      return <Badge variant="outline">Not generated</Badge>;
    }

    if (guest.invitation.status === "used") {
      return <Badge>Checked in</Badge>;
    }

    if (guest.invitation.status === "revoked") {
      return <Badge variant="destructive">Revoked</Badge>;
    }

    if (guest.invitation.status === "expired") {
      return <Badge variant="secondary">Expired</Badge>;
    }

    return <Badge variant="secondary">Ready</Badge>;
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">Guest invitations</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {invitationsGenerated} of {guests.length} invitations generated
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedGuests.length > 0 && (
              <Button onClick={generateBulkInvitations} disabled={bulkLoading}>
                {bulkLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Ticket className="mr-2 size-4" />
                )}
                Generate {selectedGuests.length} invitation
                {selectedGuests.length === 1 ? "" : "s"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {error && (
        <div className="border-b bg-destructive/10 px-6 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={
                      allCurrentPageSelected
                        ? true
                        : selectedGuests.length > 0
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleCurrentPage}
                    aria-label="Select all guests on this page"
                  />
                </th>

                <th className="px-4 py-3 text-left font-medium">Guest</th>

                <th className="px-4 py-3 text-left font-medium">Contact</th>

                <th className="px-4 py-3 text-left font-medium">Category</th>

                <th className="px-4 py-3 text-left font-medium">RSVP</th>

                <th className="px-4 py-3 text-left font-medium">Invitation</th>

                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y">
              {pageGuests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No guests found.
                  </td>
                </tr>
              ) : (
                pageGuests.map((guest) => {
                  const selected = selectedIds.includes(guest.id);

                  const loading = loadingGuestId === guest.id;

                  return (
                    <tr
                      key={guest.id}
                      className={selected ? "bg-muted/40" : "hover:bg-muted/20"}
                    >
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={selected}
                          disabled={Boolean(guest.invitation)}
                          onCheckedChange={() => toggleGuest(guest.id)}
                          aria-label={`Select ${guest.firstName} ${guest.lastName}`}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {guest.firstName.charAt(0)}
                            {guest.lastName.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium">
                              {guest.firstName} {guest.lastName}
                            </p>

                            {guest.plusOne && (
                              <p className="text-xs text-muted-foreground">
                                Includes +1
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="max-w-52 truncate">
                          {guest.email || guest.phone || (
                            <span className="text-muted-foreground">
                              No contact
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge variant="outline">{guest.category}</Badge>
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            guest.status === "confirmed"
                              ? "secondary"
                              : guest.status === "declined"
                                ? "destructive"
                                : "outline"
                          }
                          className="capitalize"
                        >
                          {guest.status.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="px-4 py-4">{invitationStatus(guest)}</td>

                      <td className="px-4 py-4 text-right">
                        {!guest.invitation ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            onClick={() => generateInvitation(guest.id)}
                          >
                            {loading ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <Ticket className="mr-2 size-4" />
                            )}
                            Generate
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <>
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">
                                  Invitation actions
                                </span>
                              </>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  shareOnWhatsApp(
                                    guest.invitation!.token,
                                    `${guest.firstName} ${guest.lastName}`,
                                  )
                                }
                              >
                                <Send className="mr-2 size-4" />
                                Share invitation
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  console.log(guest.invitation!.token);

                                  copyInvitationLink(guest.invitation!.token);
                                }}
                              >
                                <Copy className="mr-2 size-4" />
                                {copiedToken === guest.invitation.token
                                  ? "Copied"
                                  : "Copy invitation link"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : `Showing ${
                  guests.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
                }–${Math.min(
                  currentPage * PAGE_SIZE,
                  guests.length,
                )} of ${guests.length}`}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>

            <div className="min-w-20 text-center text-sm">
              Page {currentPage} of {totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
