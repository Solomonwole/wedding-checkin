import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

interface DeleteGuestsRequest {
  guestIds?: string[];
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { eventId } = await params;

    const supabase = await createClient();

    /*
     * ---------------------------------------------------------
     * 1. Authenticate
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
        {
          status: 401,
        },
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. Parse request
     * ---------------------------------------------------------
     */

    const body =
      (await request.json()) as DeleteGuestsRequest;

    const guestIds = Array.isArray(body.guestIds)
      ? [
          ...new Set(
            body.guestIds.filter(
              (id): id is string =>
                typeof id === "string" &&
                id.trim().length > 0,
            ),
          ),
        ]
      : [];

    if (guestIds.length === 0) {
      return NextResponse.json(
        {
          error: "No guests were selected.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Prevent an unexpectedly large request.
     */

    if (guestIds.length > 500) {
      return NextResponse.json(
        {
          error:
            "You can delete a maximum of 500 guests at once.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. Verify event
     * ---------------------------------------------------------
     */

    const { data: event, error: eventError } =
      await supabase
        .from("events")
        .select(
          `
            id,
            organization_id
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
        {
          status: 404,
        },
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Verify owner/admin permission
     * ---------------------------------------------------------
     */

    const {
      data: membership,
      error: membershipError,
    } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq(
        "organization_id",
        event.organization_id,
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      membershipError ||
      !membership ||
      !["owner", "admin"].includes(membership.role)
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to delete guests.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Find guests belonging to this event
     * ---------------------------------------------------------
     */

    const { data: guests, error: guestsError } =
      await supabase
        .from("guests")
        .select("id")
        .eq("event_id", eventId)
        .in("id", guestIds)
        .is("deleted_at", null);

    if (guestsError) {
      console.error(
        "Guest lookup before deletion:",
        guestsError,
      );

      return NextResponse.json(
        {
          error: "Unable to find selected guests.",
        },
        {
          status: 500,
        },
      );
    }

    const validGuestIds =
      guests?.map((guest) => guest.id) ?? [];

    if (validGuestIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "None of the selected guests could be found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Soft delete
     *
     * IMPORTANT:
     *
     * We do NOT physically delete the guest.
     *
     * This preserves:
     *
     * guests
     *   ↓
     * invitations
     *   ↓
     * check_ins
     *
     * historical relationships.
     * ---------------------------------------------------------
     */

    const { error: deleteError } =
      await supabase
        .from("guests")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .in("id", validGuestIds)
        .eq("event_id", eventId)
        .is("deleted_at", null);

    if (deleteError) {
      console.error(
        "Guest deletion error:",
        deleteError,
      );

      return NextResponse.json(
        {
          error: "Unable to delete guests.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ---------------------------------------------------------
     * 7. Return result
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      deletedCount: validGuestIds.length,
      guestIds: validGuestIds,
    });
  } catch (error) {
    console.error(
      "Delete guests API error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      },
    );
  }
}