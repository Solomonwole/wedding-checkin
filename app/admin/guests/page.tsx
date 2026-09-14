"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Search, Users } from "lucide-react";
import { AddGuestDialog } from "@/components/guests/add-guest-dialog";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type GuestStatus = "checked-in" | "pending";

type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  status: GuestStatus;
  initials: string;
};

const mockGuests: Guest[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 416 555 0101",
    category: "Groom's Family",
    status: "checked-in",
    initials: "JD",
  },
  {
    id: "2",
    name: "Sarah Smith",
    email: "sarah@example.com",
    phone: "+1 416 555 0102",
    category: "Bride's Family",
    status: "checked-in",
    initials: "SS",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael@example.com",
    phone: "+1 416 555 0103",
    category: "Friends",
    status: "pending",
    initials: "MB",
  },
  {
    id: "4",
    name: "Emily Johnson",
    email: "emily@example.com",
    phone: "+1 416 555 0104",
    category: "Friends",
    status: "checked-in",
    initials: "EJ",
  },
  {
    id: "5",
    name: "David Williams",
    email: "david@example.com",
    phone: "+1 416 555 0105",
    category: "Groom's Family",
    status: "pending",
    initials: "DW",
  },
  {
    id: "6",
    name: "Jessica Davis",
    email: "jessica@example.com",
    phone: "+1 416 555 0106",
    category: "VIP",
    status: "checked-in",
    initials: "JD",
  },
  {
    id: "7",
    name: "Daniel Wilson",
    email: "daniel@example.com",
    phone: "+1 416 555 0107",
    category: "Colleagues",
    status: "pending",
    initials: "DW",
  },
  {
    id: "8",
    name: "Amanda Taylor",
    email: "amanda@example.com",
    phone: "+1 416 555 0108",
    category: "Bride's Family",
    status: "pending",
    initials: "AT",
  },
];

export default function GuestsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const filteredGuests = useMemo(() => {
    return mockGuests.filter((guest) => {
      const matchesSearch =
        guest.name.toLowerCase().includes(search.toLowerCase()) ||
        guest.email.toLowerCase().includes(search.toLowerCase()) ||
        guest.phone.includes(search);

      const matchesCategory = category === "all" || guest.category === category;

      const matchesStatus = status === "all" || guest.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, category, status]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>350 registered guests</span>
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Guests
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Manage your guest list and monitor attendance.
            </p>
          </div>

          <AddGuestDialog />
        </div>

        {/* Main card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search guests..."
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={category}
                  onValueChange={(value) => {
                    if (value !== null) {
                      setCategory(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-45">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>

                    <SelectItem value="Bride's Family">
                      Bride&apos;s Family
                    </SelectItem>

                    <SelectItem value="Groom's Family">
                      Groom&apos;s Family
                    </SelectItem>

                    <SelectItem value="Friends">Friends</SelectItem>

                    <SelectItem value="Colleagues">Colleagues</SelectItem>

                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={status}
                  onValueChange={(value) => {
                    if (value !== null) {
                      setStatus(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>

                    <SelectItem value="checked-in">Checked in</SelectItem>

                    <SelectItem value="pending">Not checked in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="w-12 px-6 py-3">
                      <Checkbox />
                    </th>

                    <th className="px-4 py-3">Guest</th>

                    <th className="px-4 py-3">Category</th>

                    <th className="px-4 py-3">Status</th>

                    <th className="w-12 px-6 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {filteredGuests.map((guest) => (
                    <GuestRow key={guest.id} guest={guest} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="divide-y md:hidden">
              {filteredGuests.map((guest) => (
                <MobileGuestRow key={guest.id} guest={guest} />
              ))}
            </div>

            {filteredGuests.length === 0 && (
              <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Search className="size-5 text-muted-foreground" />
                </div>

                <h3 className="mt-4 font-medium">No guests found</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Try changing your search or filters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function GuestRow({ guest }: { guest: Guest }) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-6 py-4">
        <Checkbox />
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={guest.initials} />

          <div>
            <p className="text-sm font-medium">{guest.name}</p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {guest.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <Badge variant="secondary" className="font-normal">
          {guest.category}
        </Badge>
      </td>

      <td className="px-4 py-4">
        <StatusBadge status={guest.status} />
      </td>

      <td className="px-6 py-4">
        <GuestActions />
      </td>
    </tr>
  );
}

function MobileGuestRow({ guest }: { guest: Guest }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <Avatar initials={guest.initials} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{guest.name}</p>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {guest.email}
              </p>
            </div>

            <GuestActions />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {guest.category}
            </Badge>

            <StatusBadge status={guest.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: GuestStatus }) {
  if (status === "checked-in") {
    return (
      <Badge className="gap-1 font-normal">
        <span className="size-1.5 rounded-full bg-current" />
        Checked in
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="font-normal">
      Not checked in
    </Badge>
  );
}

function GuestActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="size-8" />}
      >
        <MoreHorizontal />
        <span className="sr-only">Open guest actions</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem>View guest</DropdownMenuItem>

        <DropdownMenuItem>Edit guest</DropdownMenuItem>

        <DropdownMenuItem>View invitation</DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-destructive">
          Remove guest
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
