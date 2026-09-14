"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  QrCode,
  ScanLine,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface EventSidebarProps {
  organizationSlug: string;
  eventId: string;
}

const navigation = [
  {
    label: "Overview",
    icon: BarChart3,
    segment: "",
  },
  {
    label: "Guests",
    icon: Users,
    segment: "guests",
  },
  {
    label: "Invitations",
    icon: QrCode,
    segment: "invitations",
  },
  {
    label: "Scanner",
    icon: ScanLine,
    segment: "scan",
  },
  {
    label: "Team",
    icon: Users,
    segment: "team",
  },
  {
    label: "Settings",
    icon: Settings,
    segment: "settings",
  },
];

export function EventSidebar({ organizationSlug, eventId }: EventSidebarProps) {
  const pathname = usePathname();

  const basePath = `/org/${organizationSlug}/events/${eventId}`;

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/20 lg:block">
      <div className="sticky top-0 flex h-[calc(100vh-65px)] flex-col">
        <div className="p-4">
          <p className="px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Event
          </p>

          <nav className="mt-3 space-y-1">
            {navigation.map((item) => {
              const href = item.segment
                ? `${basePath}/${item.segment}`
                : basePath;

              const isActive =
                item.segment === ""
                  ? pathname === basePath
                  : pathname.startsWith(href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />

                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <Separator className="mb-4" />

          <Link
            href={`/org/${organizationSlug}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ClipboardList className="size-4" />
            All events
          </Link>
        </div>
      </div>
    </aside>
  );
}
