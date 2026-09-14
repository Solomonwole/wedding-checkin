import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  QrCode,
  ScanLine,
  Users,
} from "lucide-react";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

interface DashboardPageProps {
  params: Promise<{
    organizationSlug: string;
    eventId: string;
  }>;
}

export default async function EventDashboard({ params }: DashboardPageProps) {
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
    .select(
      `
        id,
        name,
        event_date,
        venue,
        status
      `,
    )
    .eq("id", eventId)
    .eq("organization_id", organization.id)
    .is("archived_at", null)
    .single();

  if (!event) {
    notFound();
  }

  /*
   * Guests
   */

  const { count: totalGuests } = await supabase
    .from("guests")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("event_id", event.id)
    .is("deleted_at", null);

  /*
   * Confirmed guests
   */

  const { count: confirmedGuests } = await supabase
    .from("guests")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("event_id", event.id)
    .eq("status", "confirmed")
    .is("deleted_at", null);

  /*
   * Checked in
   */

  const { count: checkedInGuests } = await supabase
    .from("check_ins")
    .select("id, invitation:invitations!inner(event_id)", {
      count: "exact",
      head: true,
    })
    .eq("invitation.event_id", event.id);

  /*
   * Invitations
   */

  const { count: invitations } = await supabase
    .from("invitations")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("event_id", event.id);

  /*
   * Active scanners
   */

  const { count: activeScanners } = await supabase
    .from("scanner_devices")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("event_id", event.id)
    .eq("status", "active");

  /*
   * Recent check-ins
   */

  const { data: recentCheckIns } = await supabase
    .from("check_ins")
    .select(
      `
        id,
        checked_in_at,
        guest:guests (
          first_name,
          last_name
        ),
        scanner:scanner_devices (
          device_name
        )
      `,
    )
    .eq("event_id", event.id)
    .order("checked_in_at", {
      ascending: false,
    })
    .limit(8);

  const total = totalGuests ?? 0;
  const checkedIn = checkedInGuests ?? 0;

  const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}

        <div className="mb-8">
          <p className="text-sm text-muted-foreground">{event.name}</p>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Overview
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Monitor your event and guest check-ins.
              </p>
            </div>

            <Badge
              variant={event.status === "active" ? "default" : "secondary"}
              className="w-fit capitalize"
            >
              {event.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Stats */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total guests"
            value={total}
            description="Guests on your list"
            icon={Users}
          />

          <StatCard
            title="Invitations"
            value={invitations ?? 0}
            description="Generated invitations"
            icon={QrCode}
          />

          <StatCard
            title="Checked in"
            value={checkedIn}
            description="Guests who entered"
            icon={CheckCircle2}
            trend
          />

          <StatCard
            title="Check-in rate"
            value={`${checkInRate}%`}
            description={`${checkedIn} of ${total} guests`}
            icon={ScanLine}
          />
        </div>

        {/* Main content */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
          {/* Check-in activity */}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Check-in activity</CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Guest arrivals during the event.
                  </p>
                </div>

                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <ScanLine className="size-4 text-primary" />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <CheckInChart />
            </CardContent>
          </Card>

          {/* Scanner status */}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scanner status</CardTitle>

              <p className="text-sm text-muted-foreground">
                Active devices for this event.
              </p>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <ScanLine className="size-5 text-primary" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">Active scanners</p>

                    <p className="text-xs text-muted-foreground">
                      Ready to scan
                    </p>
                  </div>
                </div>

                <span className="text-2xl font-semibold">
                  {activeScanners ?? 0}
                </span>
              </div>

              <div className="mt-3 rounded-xl bg-muted/50 p-4">
                <p className="text-sm font-medium">Scanner tip</p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Staff can use their registered devices to scan guest QR codes
                  at the entrance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent check-ins */}

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent check-ins</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Latest guests admitted to the event.
                </p>
              </div>

              <Clock3 className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {recentCheckIns?.length ? (
              <div className="divide-y">
                {recentCheckIns.map((checkIn) => {
                  const guest = Array.isArray(checkIn.guest)
                    ? checkIn.guest[0]
                    : checkIn.guest;

                  const scanner = Array.isArray(checkIn.scanner)
                    ? checkIn.scanner[0]
                    : checkIn.scanner;

                  return (
                    <div
                      key={checkIn.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {guest?.first_name?.charAt(0).toUpperCase()}
                        {guest?.last_name?.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {guest?.first_name} {guest?.last_name}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {scanner?.device_name ?? "Unknown scanner"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium">
                          {new Date(checkIn.checked_in_at).toLocaleTimeString(
                            [],
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Checked in
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <ScanLine className="size-5 text-muted-foreground" />
                </div>

                <p className="mt-4 text-sm font-medium">No check-ins yet</p>

                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Guest check-ins will appear here once your scanners start
                  processing invitations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
 * Stat Card
 * --------------------------------------------------------- */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>

            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {value}
            </p>

            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {trend && <ArrowUpRight className="size-3 text-green-600" />}

              <span>{description}</span>
            </div>
          </div>

          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------
 * Simple check-in chart
 * --------------------------------------------------------- */

function CheckInChart() {
  const values = [8, 14, 21, 32, 48, 65, 82, 70, 52, 31, 18, 9];

  const max = Math.max(...values);

  return (
    <div className="h-[260px]">
      <div className="flex h-full items-end gap-2 sm:gap-3">
        {values.map((value, index) => {
          const height = Math.max((value / max) * 100, 5);

          return (
            <div
              key={index}
              className="group flex h-full flex-1 flex-col justify-end"
            >
              <div className="relative flex flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all group-hover:bg-primary"
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>

              <span className="mt-2 text-center text-[10px] text-muted-foreground">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
