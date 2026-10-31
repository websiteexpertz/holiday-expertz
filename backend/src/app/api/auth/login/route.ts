import { NextRequest, NextResponse } from "next/server";
import { validateLoginInput, authenticatePropertyOwner } from "../../../../lib/index";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate login payload
    const validation = validateLoginInput(body);
    if (!validation.isValid || !validation.cleanedData) {
      return NextResponse.json(
        {
          success: false,
          message: "Email address and password are required.",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // 2. Delegate authentication to backend service
    const authResult = await authenticatePropertyOwner(
      validation.cleanedData.email,
      validation.cleanedData.password
    );

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.message,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: authResult.message,
        owner: authResult.owner,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error in /api/auth/login:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred while processing login.",
      },
      { status: 500 }
    );
  }
}
