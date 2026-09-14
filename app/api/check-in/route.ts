import { NextResponse } from "next/server";
import crypto from "crypto";

import { createClient } from "@/lib/supabase/server";

interface CheckInRequest {
  token?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // -------------------------------------------------------
    // 1. Verify authenticated staff member
    // -------------------------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in to check in guests.",
          code: "UNAUTHENTICATED",
        },
        { status: 401 },
      );
    }

    // -------------------------------------------------------
    // 2. Read request body
    // -------------------------------------------------------

    const body =
      (await request.json()) as CheckInRequest;

    const token = body.token?.trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Invitation token is required.",
          code: "TOKEN_REQUIRED",
        },
        { status: 400 },
      );
    }

    // -------------------------------------------------------
    // 3. Get scanner device
    // -------------------------------------------------------
    //
    // For now we use the scanner device stored
    // in localStorage by the scanner UI.
    //
    // We'll implement device registration next.
    // -------------------------------------------------------

    const scannerDeviceId =
      request.headers.get("x-scanner-device-id");

    if (!scannerDeviceId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This device has not been registered as a scanner.",
          code: "SCANNER_NOT_REGISTERED",
        },
        { status: 400 },
      );
    }

    // -------------------------------------------------------
    // 4. Hash the raw QR token
    // -------------------------------------------------------

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // -------------------------------------------------------
    // 5. Redeem invitation atomically
    // -------------------------------------------------------

    const { data, error } = await supabase.rpc(
      "redeem_invitation",
      {
        p_token_hash: tokenHash,
        p_scanner_device_id: scannerDeviceId,
      },
    );

    if (error) {
      console.error(
        "Check-in RPC error:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to process the check-in.",
          code: "CHECKIN_ERROR",
        },
        { status: 500 },
      );
    }

    const result = data?.[0];

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No check-in result was returned.",
          code: "NO_RESULT",
        },
        { status: 500 },
      );
    }

    // -------------------------------------------------------
    // 6. Handle unsuccessful check-in
    // -------------------------------------------------------

    if (!result.success) {
      const statusMap: Record<
        string,
        number
      > = {
        invalid_scanner: 403,
        invalid: 404,
        wrong_event: 403,
        already_used: 409,
        revoked: 409,
        guest_not_found: 404,
      };

      const httpStatus =
        statusMap[result.result] ?? 400;

      return NextResponse.json(
        {
          success: false,
          code: result.result,
          error: getCheckInErrorMessage(
            result.result,
          ),
          guest: result.guest_name
            ? {
                id: result.guest_id,
                name: result.guest_name,
                category:
                  result.guest_category,
              }
            : undefined,
          usedAt: result.checked_in_at,
        },
        { status: httpStatus },
      );
    }

    // -------------------------------------------------------
    // 7. Successful check-in
    // -------------------------------------------------------

    return NextResponse.json({
      success: true,
      guest: {
        id: result.guest_id,
        name: result.guest_name,
        category: result.guest_category,
      },
      checkedInAt: result.checked_in_at,
    });
  } catch (error) {
    console.error(
      "Check-in API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected error occurred.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}

function getCheckInErrorMessage(
  result: string,
): string {
  switch (result) {
    case "invalid_scanner":
      return "This scanner device is not registered or is inactive.";

    case "invalid":
      return "This invitation QR code is not valid.";

    case "wrong_event":
      return "This invitation belongs to a different event.";

    case "already_used":
      return "This invitation has already been used.";

    case "revoked":
      return "This invitation has been revoked.";

    case "guest_not_found":
      return "The guest associated with this invitation could not be found.";

    default:
      return "This invitation could not be accepted.";
  }
}