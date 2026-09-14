import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardRedirectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select(
      `
      organization_id,
      role,
      organizations (
        id,
        name,
        slug
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("Unable to load organization membership:", membershipError);

    redirect("/login?error=organization_lookup_failed");
  }

  if (!membership) {
    redirect("/");
  }

  const organization = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations;

  if (!organization?.slug) {
    redirect("/");
  }

  if (membership.role === "staff") {
    redirect("/scanner");
  }

  if (membership.role === "owner" || membership.role === "admin") {
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("organization_id", organization.id)
      .is("archived_at", null)
      .order("event_date", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (event) {
      redirect(`/org/${organization.slug}/events/${event.id}`);
    }

    // Organization exists but has no event yet.
    redirect(`/org/${organization.slug}/events/new`);
  }

  // Defensive fallback.
  redirect("/login");
}
