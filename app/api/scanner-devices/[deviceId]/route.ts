import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    deviceId: string;
  }>;
}

interface UpdateScannerBody {
  status?: "active" | "inactive";
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { deviceId } = await params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { data: scanner, error } =
      await supabase
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
        .eq("id", deviceId)
        .eq("user_id", user.id)
        .single();

    if (error || !scanner) {
      return NextResponse.json(
        {
          success: false,
          error: "Scanner not found.",
        },
        { status: 404 },
      );
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, name")
      .eq("id", scanner.event_id)
      .is("archived_at", null)
      .single();

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      scannerDevice: scanner,
      event,
    });
  } catch (error) {
    console.error(
      "Get scanner:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { deviceId } = await params;

    const body =
      (await request.json()) as UpdateScannerBody;

    if (
      body.status !== "active" &&
      body.status !== "inactive"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid scanner status.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { data: scanner } =
      await supabase
        .from("scanner_devices")
        .select(
          `
          id,
          event_id,
          device_name,
          status
          `,
        )
        .eq("id", deviceId)
        .single();

    if (!scanner) {
      return NextResponse.json(
        {
          success: false,
          error: "Scanner not found.",
        },
        { status: 404 },
      );
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, organization_id")
      .eq("id", scanner.event_id)
      .single();

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found.",
        },
        { status: 404 },
      );
    }

    const { data: membership } =
      await supabase
        .from("organization_members")
        .select("id, role")
        .eq(
          "organization_id",
          event.organization_id,
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied.",
        },
        { status: 403 },
      );
    }

    const allowedRoles = [
      "owner",
      "admin",
    ];

    if (
      !allowedRoles.includes(
        membership.role,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only organization owners and admins can manage scanners.",
        },
        { status: 403 },
      );
    }

    const { data: updatedScanner, error } =
      await supabase
        .from("scanner_devices")
        .update({
          status: body.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId)
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

    if (error || !updatedScanner) {
      console.error(
        "Update scanner:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to update scanner.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      scanner: updatedScanner,
    });
  } catch (error) {
    console.error(
      "Update scanner:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}