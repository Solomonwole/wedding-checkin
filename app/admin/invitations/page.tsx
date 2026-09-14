"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Eye,
  Mail,
  MoreHorizontal,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { InvitationPreview } from "@/components/invitations/invitation-preview";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type InvitationStatus = "active" | "sent" | "used" | "not-sent";

type Invitation = {
  id: string;
  guestName: string;
  email: string;
  category: string;
  status: InvitationStatus;
  guestNumber: string;
  sentAt?: string;
  usedAt?: string;
  initials: string;
};

const mockInvitations: Invitation[] = [
  {
    id: "inv_001",
    guestName: "John Doe",
    email: "john@example.com",
    category: "Groom's Family",
    status: "used",
    guestNumber: "0047",
    sentAt: "Sep 10, 2026",
    usedAt: "Sep 12, 2026 · 7:42 PM",
    initials: "JD",
  },
  {
    id: "inv_002",
    guestName: "Sarah Smith",
    email: "sarah@example.com",
    category: "Bride's Family",
    status: "used",
    guestNumber: "0048",
    sentAt: "Sep 10, 2026",
    usedAt: "Sep 12, 2026 · 7:41 PM",
    initials: "SS",
  },
  {
    id: "inv_003",
    guestName: "Michael Brown",
    email: "michael@example.com",
    category: "Friends",
    status: "sent",
    guestNumber: "0049",
    sentAt: "Sep 11, 2026",
    initials: "MB",
  },
  {
    id: "inv_004",
    guestName: "Emily Johnson",
    email: "emily@example.com",
    category: "Friends",
    status: "used",
    guestNumber: "0050",
    sentAt: "Sep 10, 2026",
    usedAt: "Sep 12, 2026 · 7:37 PM",
    initials: "EJ",
  },
  {
    id: "inv_005",
    guestName: "David Williams",
    email: "david@example.com",
    category: "Groom's Family",
    status: "active",
    guestNumber: "0051",
    sentAt: "Sep 11, 2026",
    initials: "DW",
  },
  {
    id: "inv_006",
    guestName: "Jessica Davis",
    email: "jessica@example.com",
    category: "VIP",
    status: "sent",
    guestNumber: "0052",
    sentAt: "Sep 11, 2026",
    initials: "JD",
  },
  {
    id: "inv_007",
    guestName: "Daniel Wilson",
    email: "daniel@example.com",
    category: "Colleagues",
    status: "not-sent",
    guestNumber: "0053",
    initials: "DW",
  },
];

export default function InvitationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [previewInvitation, setPreviewInvitation] = useState<Invitation | null>(
    null,
  );

  const filteredInvitations = useMemo(() => {
    return mockInvitations.filter((invitation) => {
      const matchesSearch =
        invitation.guestName.toLowerCase().includes(search.toLowerCase()) ||
        invitation.email.toLowerCase().includes(search.toLowerCase()) ||
        invitation.guestNumber.includes(search);

      const matchesStatus = status === "all" || invitation.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  const total = mockInvitations.length;
  const sent = mockInvitations.filter(
    (item) => item.status === "sent" || item.status === "used",
  ).length;
  const used = mockInvitations.filter((item) => item.status === "used").length;
  const notSent = mockInvitations.filter(
    (item) => item.status === "not-sent",
  ).length;

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Ticket className="size-4" />
              <span>{total} invitations</span>
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Invitations
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Create, send and manage guest QR invitations.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Mail />
              Send invitations
            </Button>

            <Button>
              <QrCode />
              Generate invitations
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total invitations"
            value={total}
            description="Created for guests"
            icon={Ticket}
          />

          <MetricCard
            title="Sent"
            value={sent}
            description={`${Math.round((sent / total) * 100)}% delivered`}
            icon={Send}
          />

          <MetricCard
            title="Used"
            value={used}
            description="Guests checked in"
            icon={CheckCircle2}
          />

          <MetricCard
            title="Not sent"
            value={notSent}
            description="Ready to send"
            icon={Mail}
          />
        </div>

        {/* Invitations */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search invitations..."
                  className="pl-9"
                />
              </div>

              <Select
                value={status}
                onValueChange={(value) => {
                  if (value !== null) {
                    setStatus(value);
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>

                  <SelectItem value="active">Active</SelectItem>

                  <SelectItem value="sent">Sent</SelectItem>

                  <SelectItem value="used">Used</SelectItem>

                  <SelectItem value="not-sent">Not sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">Guest</th>

                    <th className="px-4 py-3">Category</th>

                    <th className="px-4 py-3">Invitation</th>

                    <th className="px-4 py-3">Status</th>

                    <th className="px-6 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {filteredInvitations.map((invitation) => (
                    <InvitationRow
                      key={invitation.id}
                      invitation={invitation}
                      onView={() => setPreviewInvitation(invitation)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y md:hidden">
              {filteredInvitations.map((invitation) => (
                <MobileInvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  onView={() => setPreviewInvitation(invitation)}
                />
              ))}
            </div>

            {filteredInvitations.length === 0 && (
              <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Search className="size-5 text-muted-foreground" />
                </div>

                <h3 className="mt-4 font-medium">No invitations found</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Try changing your search or status filter.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security information */}
        <div className="rounded-xl border bg-muted/20 p-5">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <h3 className="text-sm font-medium">One-time QR protection</h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Each invitation contains a unique secure token. Once a guest is
                checked in, that token becomes invalid and cannot be used again.
              </p>
            </div>
          </div>
        </div>
      </div>
      <InvitationPreview
        open={previewInvitation !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewInvitation(null);
          }
        }}
        guestName={previewInvitation?.guestName ?? ""}
        category={previewInvitation?.category ?? ""}
        guestNumber={previewInvitation?.guestNumber ?? ""}
      />
    </DashboardShell>
  );
}

function MetricCard({
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

function InvitationRow({
  invitation,
  onView,
}: {
  invitation: Invitation;
  onView: () => void;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={invitation.initials} />

          <div>
            <p className="text-sm font-medium">{invitation.guestName}</p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {invitation.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <Badge variant="secondary" className="font-normal">
          {invitation.category}
        </Badge>
      </td>

      <td className="px-4 py-4">
        <div>
          <p className="font-mono text-xs">#{invitation.guestNumber}</p>

          {invitation.sentAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Sent {invitation.sentAt}
            </p>
          )}
        </div>
      </td>

      <td className="px-4 py-4">
        <InvitationStatus status={invitation.status} />
      </td>

      <td className="px-6 py-4">
        <InvitationActions invitation={invitation} onView={onView} />
      </td>
    </tr>
  );
}

function MobileInvitationRow({
  invitation,
  onView,
}: {
  invitation: Invitation;
  onView: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <Avatar initials={invitation.initials} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{invitation.guestName}</p>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {invitation.email}
              </p>
            </div>

            <InvitationActions invitation={invitation} onView={onView} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {invitation.category}
            </Badge>

            <InvitationStatus status={invitation.status} />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">#{invitation.guestNumber}</span>

            {invitation.sentAt && (
              <>
                <span>·</span>
                <span>Sent {invitation.sentAt}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvitationStatus({ status }: { status: InvitationStatus }) {
  switch (status) {
    case "used":
      return (
        <Badge className="gap-1 font-normal">
          <CheckCircle2 className="size-3.5" />
          Used
        </Badge>
      );

    case "sent":
      return (
        <Badge variant="secondary" className="gap-1 font-normal">
          <Send className="size-3.5" />
          Sent
        </Badge>
      );

    case "active":
      return (
        <Badge variant="outline" className="gap-1 font-normal">
          <QrCode className="size-3.5" />
          Active
        </Badge>
      );

    default:
      return (
        <Badge variant="outline" className="gap-1 font-normal">
          <Mail className="size-3.5" />
          Not sent
        </Badge>
      );
  }
}

function InvitationActions({
  invitation,
  onView,
}: {
  invitation: Invitation;
  onView: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="size-8" />}
      >
        <MoreHorizontal />
        <span className="sr-only">Open invitation actions</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" onClick={onView}>
        <DropdownMenuItem>
          <Eye />
          View invitation
        </DropdownMenuItem>

        {invitation.status !== "used" && (
          <DropdownMenuItem>
            <QrCode />
            View QR code
          </DropdownMenuItem>
        )}

        {invitation.status !== "used" && (
          <DropdownMenuItem>
            <Copy />
            Copy invitation link
          </DropdownMenuItem>
        )}

        {invitation.status !== "used" && invitation.status !== "sent" && (
          <DropdownMenuItem>
            <Send />
            Send invitation
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-destructive">
          Revoke invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
      {initials}
    </div>
  );
}
