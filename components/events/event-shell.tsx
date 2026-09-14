"use client";

import { useState } from "react";

import { EventHeader } from "@/components/events/event-header";
import { EventSidebar } from "@/components/events/event-sidebar";

interface EventShellProps {
  children: React.ReactNode;
  organizationName: string;
  organizationSlug: string;
  eventName: string;
  eventId: string;
  eventStatus: string;
}

export function EventShell({
  children,
  organizationName,
  organizationSlug,
  eventName,
  eventId,
  eventStatus,
}: EventShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/20">
      <EventHeader
        organizationName={organizationName}
        organizationSlug={organizationSlug}
        eventName={eventName}
        eventStatus={eventStatus}
        onMenuClick={() => setMobileOpen(true)}
      />

      <div className="flex">
        <EventSidebar
          organizationSlug={organizationSlug}
          eventId={eventId}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}