import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface RegisterScannerBody {
  eventId?: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as RegisterScannerBody;

    const eventId = body.eventId?.trim();
    const name = body.name?.trim();

    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error: "Event is required.",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Scanner name is required.",
        },
        { status: 400 },
      );
    }

    // -------------------------------------------------------
    // Verify the user has access to the event
    // -------------------------------------------------------

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, name, organization_id")
      .eq("id", eventId)
      .is("archived_at", null)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found.",
        },
        { status: 404 },
      );
    }

    // -------------------------------------------------------
    // Check organization membership
    // -------------------------------------------------------

    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", event.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to this event.",
        },
        { status: 403 },
      );
    }

    // -------------------------------------------------------
    // Check whether this device already exists
    //
    // For now we identify a device by the browser-generated
    // device ID stored locally on the client.
    // The first registration creates the device.
    // -------------------------------------------------------

    const { data: scannerDevice, error: insertError } = await supabase
      .from("scanner_devices")
      .insert({
        event_id: event.id,
        user_id: user.id,
        device_name: name,
        status: "active",
      })
      .select(
        `
          id,
          event_id,
          user_id,
          device_name,
          status,
          last_seen_at,
          created_at
        `,
      )
      .single();

    if (insertError || !scannerDevice) {
      console.error("Scanner registration error:", insertError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to register scanner.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      existing: false,
      scannerDevice,
      event: {
        id: event.id,
        name: event.name,
      },
    });
  } catch (error) {
    console.error("Scanner registration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}
