import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InvitationsTable } from "./invitations-table";

interface InvitationsPageProps {
  params: Promise<{
    organizationSlug: string;
    eventId: string;
  }>;
}

export default async function InvitationsPage({
  params,
}: InvitationsPageProps) {
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
    .select("id, name")
    .eq("id", eventId)
    .eq("organization_id", organization.id)
    .is("archived_at", null)
    .single();

  if (!event) {
    notFound();
  }

  const { data: guests, error } = await supabase
    .from("guests")
    .select(
      `
        id,
        first_name,
        last_name,
        email,
        phone,
        category,
        status,
        plus_one,
        invitations (
            id,
            token,
            status,
            sent_at,
            used_at,
            revoked_at
        )
      `,
    )
    .eq("event_id", event.id)
    .is("deleted_at", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Failed to load invitation guests:", error);

    notFound();
  }

  const rows = (guests ?? []).map((guest) => {
    const invitation = Array.isArray(guest.invitations)
      ? (guest.invitations[0] ?? null)
      : guest.invitations;

    return {
      id: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      email: guest.email,
      phone: guest.phone,
      category: guest.category,
      status: guest.status,
      plusOne: guest.plus_one,

      invitation: invitation
        ? {
            id: invitation.id,
            token: invitation.token,
            status: invitation.status,
            sentAt: invitation.sent_at,
            usedAt: invitation.used_at,
            revokedAt: invitation.revoked_at,
          }
        : null,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">{event.name}</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Invitations
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Generate and manage invitations for your guests.
          </p>
        </div>

        <InvitationsTable eventId={event.id} initialGuests={rows} />
      </div>
    </div>
  );
}
