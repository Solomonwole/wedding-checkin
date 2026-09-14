import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface ActivateScannerBody {
  activationCode?: string;
  deviceName?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // --------------------------------------------------
    // 1. Make sure the staff member is logged in
    // --------------------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in to activate a scanner.",
        },
        { status: 401 },
      );
    }

    // --------------------------------------------------
    // 2. Read request body
    // --------------------------------------------------

    const body = (await request.json()) as ActivateScannerBody;

    const activationCode = body.activationCode?.trim().toUpperCase();
    // const deviceName = body.deviceName?.trim();

    if (!activationCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Activation code is required.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 3. Find scanner by activation code
    // --------------------------------------------------

    const { data: scanner, error: scannerError } = await supabase
      .from("scanner_devices")
      .select(
        `
        id,
        event_id,
        user_id,
        device_name,
        activation_code,
        status,
        last_seen_at,
        created_at,
        updated_at
      `,
      )
      .eq("activation_code", activationCode)
      .maybeSingle();

    if (scannerError) {
      console.error("Scanner lookup error:", scannerError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify activation code.",
        },
        { status: 500 },
      );
    }

    if (!scanner) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid activation code.",
        },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // 4. Don't allow revoked scanners to be activated
    // --------------------------------------------------

    if (scanner.status === "revoked") {
      return NextResponse.json(
        {
          success: false,
          error: "This scanner has been revoked.",
        },
        { status: 403 },
      );
    }

    // --------------------------------------------------
    // 5. Claim scanner for current staff user
    // --------------------------------------------------

    const updatePayload: {
      user_id: string;
      updated_at: string;
      last_seen_at: string;
      device_name?: string;
    } = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    };

    const { data: updatedScanner, error: updateError } = await supabase
      .from("scanner_devices")
      .update(updatePayload)
      .eq("id", scanner.id)
      .select(
        `
        id,
        event_id,
        user_id,
        device_name,
        activation_code,
        status,
        last_seen_at,
        created_at,
        updated_at
      `,
      )
      .single();

    if (updateError) {
      console.error("Scanner activation error:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to activate scanner.",
        },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // 6. Return activated scanner
    // --------------------------------------------------

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, name")
      .eq("id", scanner.event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scanner: {
        ...scanner,
        event_name: event.name,
      },
    });
  } catch (error) {
    console.error("Unexpected scanner activation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while activating the scanner.",
      },
      { status: 500 },
    );
  }
}
