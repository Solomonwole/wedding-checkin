"use client";

import Link from "next/link";
import { CalendarDays, ChevronDown, Menu, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EventHeaderProps {
  organizationName: string;
  organizationSlug: string;
  eventName: string;
  eventStatus: string;
  onMenuClick?: () => void;
}

export function EventHeader({
  organizationName,
  organizationSlug,
  eventName,
  eventStatus,
  onMenuClick,
}: EventHeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu */}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>

          {/* Mobile logo */}

          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
            <QrCode className="size-4" />
          </div>

          {/* Event selector */}

          <Link
            href={`/org/${organizationSlug}`}
            className="group flex min-w-0 items-center gap-3"
          >
            <div className="hidden size-9 items-center justify-center rounded-lg bg-muted sm:flex">
              <CalendarDays className="size-4 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{eventName}</p>

                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
              </div>

              <p className="truncate text-xs text-muted-foreground">
                {organizationName}
              </p>
            </div>
          </Link>
        </div>

        {/* Right */}

        <div className="flex items-center gap-2">
          <Link href="/scanner">
            <div className="hidden items-center gap-2 rounded-full border px-3 py-1.5 sm:flex">
              <QrCode className="size-3.5 text-green-500" />

              <span className="text-xs font-medium capitalize">
                Scan Guests
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border px-3 py-1.5 sm:flex">
            <span
              className={
                eventStatus === "active"
                  ? "size-2 rounded-full bg-green-500"
                  : "size-2 rounded-full bg-muted-foreground"
              }
            />

            <span className="text-xs font-medium capitalize">
              {eventStatus.replace("_", " ")}
            </span>
          </div>

          {/* Avatar */}

          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {organizationName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
