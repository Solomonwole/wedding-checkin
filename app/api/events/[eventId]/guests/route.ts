import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { guestSchema } from "@/lib/validations/guest";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { eventId } = await params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const parsed = guestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid guest information.",
          fields: z.treeifyError(parsed.error),
        },
        { status: 400 },
      );
    }

    const values = parsed.data;

    // Verify that the current user can access this event.
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .is("archived_at", null)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const { data: guest, error } = await supabase
      .from("guests")
      .insert({
        event_id: eventId,
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email || null,
        phone: values.phone || null,
        category: values.category,
        plus_one: values.plusOne,
        notes: values.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Create guest error:", error);

      return NextResponse.json(
        { error: "Unable to create guest." },
        { status: 500 },
      );
    }

    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    console.error("Create guest API error:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
