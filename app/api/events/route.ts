import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const { name, eventDate, venue, organizationName } = body;

    if (!name || !eventDate) {
      return NextResponse.json(
        {
          error: "Event name and event date are required.",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } = await supabase.rpc("create_event", {
      p_name: name,
      p_event_date: eventDate,
      p_venue: venue || null,
      p_organization_name: organizationName || null,
    });

    if (error) {
      console.error("Create event error:", error);

      return NextResponse.json(
        {
          error: "Unable to create event.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        event: data,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create event API error:", error);

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
