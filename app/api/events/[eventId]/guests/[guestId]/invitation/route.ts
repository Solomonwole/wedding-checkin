import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  generateInvitationToken,
  hashInvitationToken,
} from "@/lib/validations/token";

interface RouteContext {
  params: Promise<{
    eventId: string;
    guestId: string;
  }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { eventId, guestId } = await params;

    const supabase = await createClient();

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
     * Verify the guest belongs to this event.
     */
    const { data: guest, error: guestError } = await supabase
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
      .eq("id", guestId)
      .eq("event_id", eventId)
      .is("deleted_at", null)
      .single();

    if (guestError || !guest) {
      return NextResponse.json(
        {
          error: "Guest not found.",
        },
        { status: 404 },
      );
    }

    /*
     * Check if an invitation already exists.
     */
    const { data: existingInvitation } = await supabase
      .from("invitations")
      .select(
        `
        id,
        status,
        sent_at,
        used_at,
        revoked_at
        `,
      )
      .eq("guest_id", guestId)
      .maybeSingle();

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: "This guest already has an invitation.",
          invitation: existingInvitation,
        },
        { status: 409 },
      );
    }

    /*
     * Generate a cryptographically secure token.
     */
    const token = generateInvitationToken();

    /*
     * Only store the hash.
     */
    const tokenHash = hashInvitationToken(token);

    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .insert({
        event_id: eventId,
        guest_id: guestId,
        token_hash: tokenHash,
        status: "active",
      })
      .select(
        `
        id,
        event_id,
        guest_id,
        status,
        created_at
        `,
      )
      .single();

    if (invitationError) {
      console.error("Invitation creation error:", invitationError);

      return NextResponse.json(
        {
          error: "Unable to create invitation.",
        },
        { status: 500 },
      );
    }

    /*
     * Return the raw token ONCE.
     *
     * It is never stored in the database.
     */
    return NextResponse.json({
      success: true,

      invitation,

      guest: {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
      },

      token,
    });
  } catch (error) {
    console.error("Invitation API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}
