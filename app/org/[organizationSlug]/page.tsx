import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

interface OrganizationPageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { organizationSlug } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select(
      `
      id,
      name,
      slug
    `,
    )
    .eq("slug", organizationSlug)
    .single();

  if (!organization) {
    redirect("/dashboard");
  }

  const { data: events } = await supabase
    .from("events")
    .select(
      `
      id,
      name,
      event_date,
      venue,
      status,
      created_at
    `,
    )
    .eq("organization_id", organization.id)
    .is("archived_at", null)
    .order("event_date", {
      ascending: true,
    });

  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-10">
      <div className="mb-10">
        <p className="text-sm text-muted-foreground">Organization</p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {organization.name}
        </h1>
      </div>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Events</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage your weddings and events.
            </p>
          </div>

          <Link
            href={`/dashboard/events/new`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Create event
          </Link>
        </div>

        {events && events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/org/${organization.slug}/events/${event.id}`}
                className="rounded-xl border p-5 transition-colors hover:bg-muted/50"
              >
                <h3 className="font-semibold">{event.name}</h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(
                    `${event.event_date}T00:00:00`,
                  ).toLocaleDateString()}
                </p>

                {event.venue && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.venue}
                  </p>
                )}

                <div className="mt-4">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {event.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <h3 className="font-semibold">No events yet</h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Create your first event to get started.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
