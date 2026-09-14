import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InvitationQRCode } from "./invitation-qr-code";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const supabase = await createClient();

  /*
   * The database stores only the token hash.
   * We cannot look up the invitation directly using the raw token.
   *
   * For the public invitation page, use the RPC that validates
   * the token without redeeming it.
   */

  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });

  if (error) {
    console.error("Invitation lookup error:", error);
    notFound();
  }

  const invitation = Array.isArray(data) ? data[0] : data;

  if (!invitation) {
    notFound();
  }

  if (invitation.status === "revoked" || invitation.status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Invitation unavailable</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            This invitation is no longer valid. Please contact the event
            organizer.
          </p>
        </div>
      </div>
    );
  }

  const eventDate = invitation.event_date
    ? new Intl.DateTimeFormat("en-CA", {
        dateStyle: "long",
      }).format(new Date(invitation.event_date))
    : null;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="w-full overflow-hidden rounded-3xl border bg-background shadow-sm">
          <div className="px-6 pb-8 pt-10 text-center sm:px-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              You&apos;re invited
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              {invitation.event_name}
            </h1>

            <div className="mt-6">
              <p className="text-xl font-medium">
                {invitation.first_name} {invitation.last_name}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                We look forward to celebrating with you.
              </p>
            </div>

            {eventDate && (
              <div className="mt-8 rounded-2xl bg-muted/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Event date
                </p>

                <p className="mt-1 font-medium">{eventDate}</p>
              </div>
            )}

            <div className="mt-8">
              <InvitationQRCode token={token} />
            </div>

            <p className="mt-6 text-xs leading-5 text-muted-foreground">
              Please present this QR code at the entrance when you arrive. Your
              invitation is scanned once for check-in.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
