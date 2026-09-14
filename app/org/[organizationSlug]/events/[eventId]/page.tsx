import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  QrCode,
  ScanLine,
  Users,
  UserPlus,
} from "lucide-react";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface EventPageProps {
  params: Promise<{
    organizationSlug: string;
    eventId: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
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

  // ----------------------------------------------------------
  // Guest statistics
  // ----------------------------------------------------------

  const { count: guestCount } = await supabase
    .from("guests")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("event_id", event.id);

  // We'll replace these with real invitation/check-in
  // queries once those tables are built.

  const invitationCount = 0;
  const checkedInCount = 0;

  const remainingCount = Math.max((guestCount ?? 0) - checkedInCount, 0);

  const formattedDate = new Date(
    `${event.event_date}T00:00:00`,
  ).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const basePath = `/org/${organizationSlug}/events/${event.id}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {event.status}
              </Badge>
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Event overview
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage guests, invitations and check-in.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href={`${basePath}/guests`}>
              <Button variant="outline">
                <UserPlus className="mr-2 size-4" />
                Add guests
              </Button>
            </Link>

            <Link href={`${basePath}/scan`}>
              <Button>
                <ScanLine className="mr-2 size-4" />
                Open scanner
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total guests"
            value={guestCount ?? 0}
            description="Guests registered"
            icon={Users}
          />

          <StatCard
            title="Invitations"
            value={invitationCount}
            description="QR passes generated"
            icon={QrCode}
          />

          <StatCard
            title="Checked in"
            value={checkedInCount}
            description="Guests admitted"
            icon={CheckCircle2}
          />

          <StatCard
            title="Remaining"
            value={remainingCount}
            description="Guests yet to arrive"
            icon={Clock3}
          />
        </div>

        {/* Main content */}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Event information */}

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Event details</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <DetailItem
                  icon={CalendarDays}
                  label="Date"
                  value={formattedDate}
                />

                <DetailItem
                  icon={ScanLine}
                  label="Venue"
                  value={event.venue || "Not specified"}
                />
              </div>

              <Separator className="my-6" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Guest management</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Add guests or import your existing guest list.
                  </p>
                </div>

                <Link href={`${basePath}/guests`}>
                  <Button variant="outline" size="sm">
                    Manage guests
                    <ArrowUpRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Check-in card */}

          <Card>
            <CardHeader>
              <CardTitle>Check-in</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-center rounded-xl border border-dashed bg-muted/30 p-8">
                <div className="text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <ScanLine className="size-6 text-primary" />
                  </div>

                  <p className="mt-4 text-sm font-medium">Ready for check-in</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Scan guest QR passes at the entrance.
                  </p>

                  <Link href={`${basePath}/scan`}>
                    <Button className="mt-5" size="sm">
                      Open scanner
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Quick actions</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Common tasks for managing your event.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              href={`${basePath}/guests`}
              icon={Users}
              title="Manage guests"
              description="Add, import and organize your guest list."
            />

            <ActionCard
              href={`${basePath}/invitations`}
              icon={QrCode}
              title="Create invitations"
              description="Generate unique QR passes for your guests."
            />

            <ActionCard
              href={`${basePath}/scan`}
              icon={ScanLine}
              title="Start checking in"
              description="Open the scanner for your entrance team."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {value}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>

          <div className="rounded-lg bg-muted p-2.5">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div>
        <p className="text-xs text-muted-foreground">{label}</p>

        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card className="group transition-all hover:border-foreground/20 hover:shadow-sm">
      <Link href={href}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-muted p-2.5">
              <Icon className="size-4" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold">{title}</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>

            <ArrowUpRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
