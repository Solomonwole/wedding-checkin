import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

interface CreateScannerBody {
  deviceName?: string;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { eventId } = await params;

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

    const { data: event } = await supabase
      .from("events")
      .select("id, organization_id")
      .eq("id", eventId)
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

    const { data: membership } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", event.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to this event.",
        },
        { status: 403 },
      );
    }

    const { data: scanners, error } = await supabase
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
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Load scanners:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load scanners.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      scanners: scanners ?? [],
    });
  } catch (error) {
    console.error("Load scanners:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { eventId } = await params;

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

    const body = (await request.json()) as CreateScannerBody;

    const deviceName = body.deviceName?.trim();

    if (!deviceName) {
      return NextResponse.json(
        {
          success: false,
          error: "Scanner name is required.",
        },
        { status: 400 },
      );
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, name, organization_id")
      .eq("id", eventId)
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

    const { data: membership } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", event.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to this event.",
        },
        { status: 403 },
      );
    }

    const allowedRoles = ["owner", "admin"];

    if (!allowedRoles.includes(membership.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only organization owners and admins can create scanners.",
        },
        { status: 403 },
      );
    }

    const activationCode = await generateActivationCode(supabase);

    const { data: scanner, error } = await supabase
      .from("scanner_devices")
      .insert({
        event_id: event.id,
        user_id: user.id,
        device_name: deviceName,
        activation_code: activationCode,
        status: "active",
      })
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

    if (error || !scanner) {
      console.error("Create scanner:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to create scanner.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      scanner,
    });
  } catch (error) {
    console.error("Create scanner:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}

async function generateActivationCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase.rpc(
    "generate_scanner_activation_code",
  );

  if (error || !data) {
    throw new Error("Unable to generate activation code.");
  }

  return data as string;
}
