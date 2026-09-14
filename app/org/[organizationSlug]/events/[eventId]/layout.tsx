import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EventHeader } from "@/components/events/event-header";
import { EventSidebar } from "@/components/events/event-sidebar";

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    organizationSlug: string;
    eventId: string;
  }>;
}

export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { organizationSlug, eventId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", organizationSlug)
    .single();

  if (!organization) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id, role")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      `
      id,
      organization_id,
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

  return (
    <div className="min-h-screen bg-background">
      <EventHeader
        organizationName={organization.name}
        organizationSlug={organization.slug}
        eventName={event.name}
        eventStatus={event.status}
      />

      <div className="flex">
        <EventSidebar organizationSlug={organization.slug} eventId={event.id} />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
