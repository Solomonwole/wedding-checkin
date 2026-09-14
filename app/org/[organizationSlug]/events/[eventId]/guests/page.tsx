import Link from "next/link";

import { Plus, Upload, Users } from "lucide-react";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { GuestTable } from "@/components/guests/guest-table";

import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";

interface GuestsPageProps {
  params: Promise<{
    organizationSlug: string;
    eventId: string;
  }>;
}

export default async function GuestsPage({ params }: GuestsPageProps) {
  const { organizationSlug, eventId } = await params;

  const supabase = await createClient();

  /*
   * ---------------------------------------------------------
   * Organization
   * ---------------------------------------------------------
   */

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", organizationSlug)
    .single();

  if (!organization) {
    notFound();
  }

  /*
   * ---------------------------------------------------------
   * Event
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * Guests
   * ---------------------------------------------------------
   */

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
    console.error("Unable to load guests:", error);
  }

  const guestList = guests ?? [];

  /*
   * ---------------------------------------------------------
   * Stats
   * ---------------------------------------------------------
   */

  const totalGuests = guestList.length;

  const confirmed = guestList.filter(
    (guest) => guest.status === "confirmed",
  ).length;

  const checkedIn = guestList.filter(
    (guest) => guest.status === "checked_in",
  ).length;

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

        {/* Guests */}

        <Card className="mt-8 overflow-hidden">
          <CardContent className="p-0">
            <GuestTable guests={guestList} eventId={event.id} />
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
