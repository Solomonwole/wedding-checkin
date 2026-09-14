import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  generateInvitationToken,
  hashInvitationToken,
} from "@/lib/validations/token";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

interface BulkInvitationRequest {
  guestIds?: string[];
}

interface CreatedInvitation {
  guestId: string;
  invitationId: string;
  firstName: string;
  lastName: string;
  token: string;
  status: string;
}

interface ExistingInvitation {
  guestId: string;
  invitationId: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface FailedInvitation {
  guestId: string;
  error: string;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { eventId } = await params;

    const supabase = await createClient();

    /*
     * ---------------------------------------------------------
     * 1. Authenticate user
     * ---------------------------------------------------------
     */

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. Read request body
     * ---------------------------------------------------------
     */

    let body: BulkInvitationRequest;

    try {
      body = (await request.json()) as BulkInvitationRequest;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const guestIds = Array.isArray(body.guestIds)
      ? [...new Set(body.guestIds.filter((id): id is string => Boolean(id)))]
      : [];

    if (guestIds.length === 0) {
      return NextResponse.json(
        {
          error: "No guests were selected.",
        },
        { status: 400 },
      );
    }

    /*
     * Prevent accidentally processing an enormous request.
     */
    if (guestIds.length > 500) {
      return NextResponse.json(
        {
          error:
            "You can create invitations for a maximum of 500 guests at once.",
        },
        { status: 400 },
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. Verify event exists
     * ---------------------------------------------------------
     */

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
          id,
          organization_id,
          name
        `,
      )
      .eq("id", eventId)
      .is("archived_at", null)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        {
          error: "Event not found.",
        },
        { status: 404 },
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Verify owner/admin permission
     * ---------------------------------------------------------
     */

    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", event.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      membershipError ||
      !membership ||
      !["owner", "admin"].includes(membership.role)
    ) {
      return NextResponse.json(
        {
          error: "You do not have permission to create invitations.",
        },
        { status: 403 },
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Get selected guests
     * ---------------------------------------------------------
     */

    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select(
        `
          id,
          event_id,
          first_name,
          last_name,
          deleted_at
        `,
      )
      .eq("event_id", eventId)
      .in("id", guestIds)
      .is("deleted_at", null);

    if (guestsError) {
      console.error("Bulk guest lookup error:", guestsError);

      return NextResponse.json(
        {
          error: "Unable to load selected guests.",
        },
        { status: 500 },
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Find existing invitations
     * ---------------------------------------------------------
     */

    const { data: existingInvitations, error: existingError } = await supabase
      .from("invitations")
      .select(
        `
            id,
            guest_id,
            status,
            created_at
          `,
      )
      .in("guest_id", guestIds);

    if (existingError) {
      console.error("Existing invitation lookup error:", existingError);

      return NextResponse.json(
        {
          error: "Unable to check existing invitations.",
        },
        { status: 500 },
      );
    }

    const existingByGuestId = new Map(
      (existingInvitations ?? []).map((invitation) => [
        invitation.guest_id,
        invitation,
      ]),
    );

    /*
     * ---------------------------------------------------------
     * 7. Prepare result collections
     * ---------------------------------------------------------
     */

    const created: CreatedInvitation[] = [];

    const existing: ExistingInvitation[] = [];

    const failed: FailedInvitation[] = [];

    /*
     * ---------------------------------------------------------
     * 8. Process guests
     * ---------------------------------------------------------
     */

    for (const guestId of guestIds) {
      const guest = guests?.find((item) => item.id === guestId);

      /*
       * Guest does not exist or does not belong to this event.
       */
      if (!guest) {
        failed.push({
          guestId,
          error: "Guest not found for this event.",
        });

        continue;
      }

      /*
       * -------------------------------------------------------
       * Invitation already exists
       * -------------------------------------------------------
       */

      const existingInvitation = existingByGuestId.get(guestId);

      if (existingInvitation) {
        existing.push({
          guestId: guest.id,
          invitationId: existingInvitation.id,
          firstName: guest.first_name,
          lastName: guest.last_name,
          status: existingInvitation.status,
        });

        continue;
      }

      /*
       * -------------------------------------------------------
       * Create new invitation
       * -------------------------------------------------------
       */

      try {
        /*
         * Generate the token exactly once.
         */
        const token = generateInvitationToken();

        /*
         * Hash the token for secure scanner validation.
         */
        const tokenHash = hashInvitationToken(token);

        /*
         * Store BOTH the token and the hash.
         *
         * token:
         * Used to construct the guest invitation URL.
         *
         * token_hash:
         * Used by the scanner/redeem_invitation function.
         */
        const { data: invitation, error: invitationError } = await supabase
          .from("invitations")
          .insert({
            event_id: eventId,
            guest_id: guest.id,
            token,
            token_hash: tokenHash,
            status: "active",
          })
          .select(
            `
                id,
                guest_id,
                token,
                status,
                created_at
              `,
          )
          .single();

        if (invitationError || !invitation) {
          console.error(
            `Invitation creation failed for guest ${guest.id}:`,
            invitationError,
          );

          failed.push({
            guestId: guest.id,
            error: "Unable to create invitation.",
          });

          continue;
        }

        /*
         * Return the token from the database record.
         *
         * This means the client no longer depends on
         * localStorage to remember the invitation token.
         */
        created.push({
          guestId: guest.id,
          invitationId: invitation.id,
          firstName: guest.first_name,
          lastName: guest.last_name,
          token: invitation.token,
          status: invitation.status,
        });
      } catch (error) {
        console.error(
          `Invitation creation exception for guest ${guest.id}:`,
          error,
        );

        failed.push({
          guestId: guest.id,
          error: "Unable to create invitation.",
        });
      }
    }

    /*
     * ---------------------------------------------------------
     * 9. Return result
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      event: {
        id: event.id,
        name: event.name,
      },

      summary: {
        requested: guestIds.length,
        created: created.length,
        existing: existing.length,
        failed: failed.length,
      },

      created,
      existing,
      failed,
    });
  } catch (error) {
    console.error("Bulk invitation API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}
