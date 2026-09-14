import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const importGuestSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  category: z.string().trim().min(1),
  plusOne: z.boolean(),
  notes: z.string().trim().optional(),
});

const requestSchema = z.object({
  guests: z.array(importGuestSchema).min(1).max(5000),
});

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
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid guest import data.",
        },
        { status: 400 },
      );
    }

    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .is("archived_at", null)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const guests = parsed.data.guests.map((guest) => ({
      event_id: eventId,
      first_name: guest.firstName,
      last_name: guest.lastName,
      email: guest.email || null,
      phone: guest.phone || null,
      category: guest.category,
      plus_one: guest.plusOne,
      notes: guest.notes || null,
    }));

    const { data, error } = await supabase
      .from("guests")
      .insert(guests)
      .select("id");

    if (error) {
      console.error("Guest import error:", error);

      return NextResponse.json(
        {
          error: "Unable to import guests.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      imported: data?.length ?? 0,
    });
  } catch (error) {
    console.error("Guest import API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}
