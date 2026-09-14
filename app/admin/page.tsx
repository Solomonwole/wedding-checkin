import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  QrCode,
  Users,
} from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const recentCheckIns = [
  {
    name: "John Doe",
    category: "Groom's Family",
    time: "7:42 PM",
    initials: "JD",
  },
  {
    name: "Sarah Smith",
    category: "Bride's Family",
    time: "7:41 PM",
    initials: "SS",
  },
  {
    name: "Michael Brown",
    category: "Friends",
    time: "7:39 PM",
    initials: "MB",
  },
  {
    name: "Emily Johnson",
    category: "Friends",
    time: "7:37 PM",
    initials: "EJ",
  },
];

export default function AdminDashboard() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Saturday, September 12
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Wedding reception
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Monitor guests and manage event check-in.
            </p>
          </div>

          <Button>
            <Link href="/scanner" className="flex items-center gap-2">
              <QrCode />
              Open scanner
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total guests"
            value="350"
            description="Registered for this event"
            icon={Users}
          />

          <StatsCard
            title="Checked in"
            value="217"
            description="62% of total guests"
            icon={CheckCircle2}
          />

          <StatsCard
            title="Remaining"
            value="133"
            description="Guests yet to arrive"
            icon={Clock3}
          />

          <StatsCard
            title="Check-in rate"
            value="62%"
            description="Current attendance"
            icon={ArrowUpRight}
          />
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Recent check-ins */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent check-ins</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Guests who entered the event recently.
                  </p>
                </div>

                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-1">
                {recentCheckIns.map((guest, index) => (
                  <div key={guest.name}>
                    <div className="flex items-center gap-4 py-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {guest.initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {guest.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {guest.category}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium">{guest.time}</p>

                        <Badge variant="secondary" className="mt-1 font-normal">
                          Checked in
                        </Badge>
                      </div>
                    </div>

                    {index < recentCheckIns.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scanner card */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Quick check-in</CardTitle>

              <p className="text-sm text-muted-foreground">
                Scan a guest&apos;s unique QR invitation.
              </p>
            </CardHeader>

            <CardContent>
              <div className="flex min-h-65 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-8 text-center">
                <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border">
                  <QrCode className="size-8" />
                </div>

                <h3 className="font-semibold">Ready to scan</h3>

                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Open the scanner to verify a guest and grant one-time entry.
                </p>

                <Button className="mt-6">
                  <Link href="/scanner">Start scanning</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {value}
            </p>
          </div>

          <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
            <Icon className="size-5" />
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
