import Link from "next/link";
import { Plus, Upload, Search, Users } from "lucide-react";

import { notFound } from "next/navigation";
import { InvitationQrDialog } from "@/components/invitations/invitation-qr-dialog";
import { createClient } from "@/lib/supabase/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface GuestsPageProps {
  params: Promise<{
    organizationSlug: string;
    eventId: string;
  }>;
}

export default async function GuestsPage({ params }: GuestsPageProps) {
  const { organizationSlug, eventId } = await params;

  const supabase = await createClient();

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", organizationSlug)
    .single();

  if (!organization) {
    notFound();
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .eq("organization_id", organization.id)
    .is("archived_at", null)
    .single();

  if (!event) {
    notFound();
  }

  const { data: guests, error } = await supabase
    .from("guests")
    .select(
      `
      id,
      first_name,
      last_name,
      email,
      phone,
      category,
      plus_one,
      status
    `,
    )
    .eq("event_id", event.id)
    .is("deleted_at", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
  }

  const totalGuests = guests?.length ?? 0;

  const confirmed =
    guests?.filter((guest) => guest.status === "confirmed").length ?? 0;

  const checkedIn =
    guests?.filter((guest) => guest.status === "checked_in").length ?? 0;

  const basePath = `/org/${organizationSlug}/events/${eventId}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{event.name}</p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Guests
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage everyone invited to this event.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href={`${basePath}/guests/import`}>
              <Button variant="outline">
                <Upload className="mr-2 size-4" />
                Import CSV
              </Button>
            </Link>

            <Link href={`${basePath}/guests/new`}>
              <Button>
                <Plus className="mr-2 size-4" />
                Add guest
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Total guests" value={totalGuests} />

          <StatCard title="Confirmed" value={confirmed} />

          <StatCard title="Checked in" value={checkedIn} />
        </div>

        {/* Guest table */}

        <Card className="mt-8">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Guest list</CardTitle>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input placeholder="Search guests..." className="pl-9" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {totalGuests === 0 ? (
              <EmptyGuests basePath={basePath} />
            ) : (
              <div className="divide-y">
                {guests?.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
                  >
                    {/* Avatar */}

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {guest.first_name.charAt(0).toUpperCase()}
                      {guest.last_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}

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

                    {/* Plus one */}

                    {guest.plus_one && <Badge variant="secondary">+1</Badge>}

                    {/* Status */}

                    <GuestStatus status={guest.status} />

                    {/* Invitation */}

                    <InvitationQrDialog
                      eventId={event.id}
                      guestId={guest.id}
                      guestName={`${guest.first_name} ${guest.last_name}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>

            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>

          <div className="rounded-lg bg-muted p-2.5">
            <Users className="size-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Badge variant={variants[status] ?? "outline"} className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}

function EmptyGuests({ basePath }: { basePath: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Users className="size-5 text-muted-foreground" />
      </div>

      <h3 className="mt-4 font-semibold">No guests yet</h3>

      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Add your guests manually or import your existing guest list from a CSV
        file.
      </p>

      <div className="mt-6 flex gap-2">
        <Link href={`${basePath}/guests/import`}>
          <Button variant="outline">
            <Upload className="mr-2 size-4" />
            Import CSV
          </Button>
        </Link>

        <Link href={`${basePath}/guests/new`}>
          <Button>
            <Plus className="mr-2 size-4" />
            Add guest
          </Button>
        </Link>
      </div>
    </div>
  );
}
