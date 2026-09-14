import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/components/layout/logout-button";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * ---------------------------------------------------------
   * Not logged in
   * ---------------------------------------------------------
   */

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="size-7 text-primary" />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Wedding Check-In
          </h1>

          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Manage your event, invitations, guests, and check-in from one place.
          </p>

          <Link href="/login">
            <Button size="lg" className="mt-8">
              Sign in
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * Get user's organization membership
   * ---------------------------------------------------------
   */

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      `
        id,
        role,
        organization_id,
        organizations (
          id,
          name,
          slug
        )
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  /*
   * ---------------------------------------------------------
   * No organization
   *
   * This is normally a new account.
   * Give the user the option to create their first event.
   * ---------------------------------------------------------
   */

  if (!membership) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center">
          {/* Header */}

          <div className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="size-7 text-primary" />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome to Wedding Check-In
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Create your event and start managing your guests, invitations,
              team, and check-in.
            </p>
          </div>

          {/* Create Event */}

          <Card className="group mt-10 transition-colors hover:border-primary/50 hover:bg-muted/40">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <CalendarPlus className="size-7 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold">
                    Create your first event
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Set up your wedding or event, add your guest list, create
                    invitations, and prepare your check-in team.
                  </p>
                </div>

                <Link href="/dashboard/events/new" className="shrink-0">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Event
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}

          <div className="mt-8 flex justify-center">
            <LogoutButton />
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * Organization
   * ---------------------------------------------------------
   */

  const organization = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations;

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  /*
   * ---------------------------------------------------------
   * Staff
   *
   * Staff only needs the scanner.
   * ---------------------------------------------------------
   */

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <ScanLine className="size-7 text-primary" />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight">
              Wedding Check-In
            </h1>

            <p className="mt-3 text-muted-foreground">
              You are signed in as a staff member.
            </p>
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <Link href="/scanner">
                <Button size="lg" className="h-14 w-full text-base">
                  <ScanLine className="mr-3 size-5" />
                  Open Scanner
                  <ArrowRight className="ml-auto size-5" />
                </Button>
              </Link>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Use the scanner to check guests in at the event entrance.
              </p>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-center">
            <LogoutButton />
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * Owner / Admin
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}

        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="size-7 text-primary" />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Wedding Check-In
          </h1>

          <p className="mt-3 text-muted-foreground">
            {organization?.name
              ? `Welcome back to ${organization.name}.`
              : "Welcome back."}
          </p>
        </div>

        {/* Navigation */}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {/* Scanner */}

          <Link href="/scanner" className="group">
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/40">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <ScanLine className="size-6 text-primary" />
                  </div>

                  <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>

                <h2 className="mt-6 text-xl font-semibold">Event Scanner</h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Scan guest invitations and check guests in at the event.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Admin */}

          <Link
            href={organization?.slug ? `/dashboard` : "/login"}
            className="group"
          >
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/40">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                    <LayoutDashboard className="size-6" />
                  </div>

                  <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>

                <h2 className="mt-6 text-xl font-semibold">Admin Dashboard</h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Manage events, guests, invitations, team members, and check-in
                  activity.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer */}

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium capitalize">{membership.role}</span>
          </p>

          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
