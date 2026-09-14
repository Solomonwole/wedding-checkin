"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  QrCode,
  ScanLine,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LogoutButton } from "../layout/logout-button";

interface EventSidebarProps {
  organizationSlug: string;
  eventId: string;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

const eventNavigation = [
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
    label: "Scanners",
    icon: ScanLine,
    segment: "scanners",
  },
];

const organizationNavigation = [
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

export function EventSidebar({
  organizationSlug,
  eventId,
  mobileOpen = false,
  onMobileOpenChange,
}: EventSidebarProps) {
  const pathname = usePathname();

  const basePath = `/org/${organizationSlug}/events/${eventId}`;
  const organizationPath = `/org/${organizationSlug}`;

  function isActive(segment: string) {
    const href = segment ? `${basePath}/${segment}` : basePath;

    if (!segment) {
      return pathname === basePath;
    }

    return pathname.startsWith(href);
  }

  function NavigationContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className="flex h-full flex-col">
        {/* Brand */}

        <div className="flex h-16 items-center border-b px-5">
          <Link
            href={`/org/${organizationSlug}`}
            className="flex items-center gap-2"
            onClick={() => mobile && onMobileOpenChange?.(false)}
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrCode className="size-4" />
            </div>

            <div className="leading-none">
              <p className="font-semibold tracking-tight">Wedding Checkin</p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                Event management
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Event
          </p>

          <nav className="space-y-1">
            {eventNavigation.map((item) => {
              const href = item.segment
                ? `${basePath}/${item.segment}`
                : basePath;

              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={href}
                  onClick={() => mobile && onMobileOpenChange?.(false)}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    isActive(item.segment)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-[18px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <p className="mb-2 mt-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Organization
          </p>

          <nav className="space-y-1">
            {organizationNavigation.map((item) => {
              const href = `${organizationPath}/${item.segment}`;

              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={href}
                  onClick={() => mobile && onMobileOpenChange?.(false)}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    pathname.startsWith(href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-[18px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="mt-auto border-t p-3">
          <LogoutButton />
        </div>

        {/* Bottom */}

        <div className="border-t p-3">
          <Link
            href={organizationPath}
            onClick={() => mobile && onMobileOpenChange?.(false)}
            className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />

            <span>All events</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}

      <aside className="hidden w-64 shrink-0 border-r bg-background lg:block">
        <div className="sticky top-0 h-screen">
          <NavigationContent />
        </div>
      </aside>

      {/* Mobile */}

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[280px] p-0 sm:w-[320px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Wedding Checkin navigation</SheetTitle>
          </SheetHeader>

          <NavigationContent mobile />
        </SheetContent>
      </Sheet>
    </>
  );
}
