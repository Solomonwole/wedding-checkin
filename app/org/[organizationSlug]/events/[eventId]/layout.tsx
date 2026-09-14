import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { EventShell } from "@/components/events/event-shell";

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
    <EventShell
      organizationName={organization.name}
      organizationSlug={organization.slug}
      eventName={event.name}
      eventId={event.id}
      eventStatus={event.status}
    >
      {children}
    </EventShell>
  );
}
