import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { hashInvitationToken } from "@/lib/validations/token";

interface CheckInRequest {
  token?: string;
  scannerDeviceId?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckInRequest;

    const token = body.token?.trim();
    const scannerDeviceId = body.scannerDeviceId?.trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          result: "invalid",
          error: "Invitation token is required.",
        },
        { status: 400 },
      );
    }

    if (!scannerDeviceId) {
      return NextResponse.json(
        {
          success: false,
          result: "invalid_scanner",
          error: "Scanner device is required.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    /*
     * Hash the raw QR token.
     *
     * The database stores only the hash.
     */
    const tokenHash = hashInvitationToken(token);

    const { data, error } = await supabase.rpc("redeem_invitation", {
      p_token_hash: tokenHash,
      p_scanner_device_id: scannerDeviceId,
    });

    if (error) {
      console.error("Check-in RPC error:", error);

      return NextResponse.json(
        {
          success: false,
          result: "error",
          error: "Unable to process check-in.",
        },
        { status: 500 },
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          result: "error",
          error: "No check-in result returned.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check-in request error:", error);

    return NextResponse.json(
      {
        success: false,
        result: "error",
        error: "Invalid request.",
      },
      { status: 400 },
    );
  }
}
