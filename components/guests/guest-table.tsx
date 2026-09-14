"use client";

import { useMemo, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  category: string;
  plus_one: boolean;
  status: string;
}

interface GuestTableProps {
  guests: Guest[];
  eventId: string;
}

export function GuestTable({ guests, eventId }: GuestTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [deleting, setDeleting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);

  /*
   * ---------------------------------------------------------
   * Search
   * ---------------------------------------------------------
   */

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return guests;
    }

    return guests.filter((guest) => {
      const fullName = `${guest.first_name} ${guest.last_name}`.toLowerCase();

      return (
        fullName.includes(query) ||
        guest.email?.toLowerCase().includes(query) ||
        guest.phone?.toLowerCase().includes(query) ||
        guest.category.toLowerCase().includes(query) ||
        guest.status.toLowerCase().includes(query)
      );
    });
  }, [guests, search]);

  /*
   * ---------------------------------------------------------
   * Pagination
   * ---------------------------------------------------------
   */

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedGuests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredGuests.slice(start, start + PAGE_SIZE);
  }, [filteredGuests, currentPage]);

  /*
   * ---------------------------------------------------------
   * Current page selection
   * ---------------------------------------------------------
   */

  const currentPageIds = paginatedGuests.map((guest) => guest.id);

  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.has(id));

  const someCurrentPageSelected = currentPageIds.some((id) =>
    selectedIds.has(id),
  );

  /*
   * ---------------------------------------------------------
   * Toggle individual guest
   * ---------------------------------------------------------
   */

  function toggleGuest(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  /*
   * ---------------------------------------------------------
   * Toggle current page
   * ---------------------------------------------------------
   */

  function toggleCurrentPage() {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (allCurrentPageSelected) {
        currentPageIds.forEach((id) => {
          next.delete(id);
        });
      } else {
        currentPageIds.forEach((id) => {
          next.add(id);
        });
      }

      return next;
    });
  }

  /*
   * ---------------------------------------------------------
   * Delete guests
   * ---------------------------------------------------------
   */

  async function deleteGuests(guestIds: string[]) {
    if (guestIds.length === 0) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/guests/delete`, {
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
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to delete guests.");
      }

      setSelectedIds((previous) => {
        const next = new Set(previous);

        guestIds.forEach((id) => {
          next.delete(id);
        });

        return next;
      });

      setDeleteTarget(null);

      /*
       * Refresh the Server Component.
       *
       * This updates:
       * - guest list
       * - total guests
       * - confirmed count
       * - checked-in count
       */

      router.refresh();
    } catch (error) {
      console.error("Unable to delete guests:", error);

      window.alert(
        error instanceof Error ? error.message : "Unable to delete guests.",
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Search
   * ---------------------------------------------------------
   */

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  /*
   * ---------------------------------------------------------
   * Empty
   * ---------------------------------------------------------
   */

  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <UserRound className="size-5 text-muted-foreground" />
        </div>

        <h3 className="mt-4 font-semibold">No guests yet</h3>

        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add your guests manually or import your existing guest list from a CSV
          file.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* -----------------------------------------------------
          Toolbar
      ----------------------------------------------------- */}

      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search guests..."
            className="pl-9"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  <Trash2 className="mr-2 size-4" />
                  Delete selected
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete selected guests?</AlertDialogTitle>

                  <AlertDialogDescription>
                    You are about to remove <strong>{selectedIds.size}</strong>{" "}
                    guest
                    {selectedIds.size === 1 ? "" : "s"} from this event.
                    Historical invitation and check-in records will be
                    preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                  <AlertDialogAction
                    onClick={() => void deleteGuests(Array.from(selectedIds))}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting..." : "Delete guests"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* -----------------------------------------------------
          Table
      ----------------------------------------------------- */}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    allCurrentPageSelected
                      ? true
                      : someCurrentPageSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={toggleCurrentPage}
                  aria-label="Select all guests on this page"
                />
              </TableHead>

              <TableHead>Guest</TableHead>

              <TableHead>Contact</TableHead>

              <TableHead>Category</TableHead>

              <TableHead>+1</TableHead>

              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedGuests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Search className="mx-auto size-5 text-muted-foreground" />

                  <p className="mt-2 text-sm font-medium">No guests found</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a different search.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedGuests.map((guest) => (
                <TableRow
                  key={guest.id}
                  data-state={
                    selectedIds.has(guest.id) ? "selected" : undefined
                  }
                >
                  {/* Checkbox */}

                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(guest.id)}
                      onCheckedChange={() => toggleGuest(guest.id)}
                      aria-label={`Select ${guest.first_name} ${guest.last_name}`}
                    />
                  </TableCell>

                  {/* Guest */}

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {guest.first_name.charAt(0).toUpperCase()}

                        {guest.last_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium whitespace-nowrap">
                          {guest.first_name} {guest.last_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact */}

                  <TableCell>
                    <div className="max-w-[220px]">
                      {guest.email && (
                        <p className="truncate text-sm">{guest.email}</p>
                      )}

                      {guest.phone && (
                        <p className="truncate text-sm text-muted-foreground">
                          {guest.phone}
                        </p>
                      )}

                      {!guest.email && !guest.phone && (
                        <span className="text-sm text-muted-foreground">
                          No contact
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}

                  <TableCell>
                    <Badge variant="outline">{guest.category}</Badge>
                  </TableCell>

                  {/* Plus one */}

                  <TableCell>
                    {guest.plus_one ? (
                      <Badge variant="secondary">+1</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Status */}

                  <TableCell>
                    <GuestStatus status={guest.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* -----------------------------------------------------
          Pagination
      ----------------------------------------------------- */}

      <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredGuests.length === 0
            ? "0 guests"
            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                currentPage * PAGE_SIZE,
                filteredGuests.length,
              )} of ${filteredGuests.length}`}
        </p>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex h-9 min-w-9 items-center justify-center px-2 text-sm">
            {currentPage} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function GuestStatus({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    invited: "outline",
    confirmed: "secondary",
    declined: "destructive",
    checked_in: "default",
  };

  return (
    <Badge
      variant={variants[status] ?? "outline"}
      className="whitespace-nowrap capitalize"
    >
      {status.replace("_", " ")}
    </Badge>
  );
}
