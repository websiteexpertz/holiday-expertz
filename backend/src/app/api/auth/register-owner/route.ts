import { NextRequest, NextResponse } from "next/server";
import { validateOwnerRegistration, registerPropertyOwner } from "../../../../lib/index";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate payload using backend validation rules
    const validation = validateOwnerRegistration(body);
    if (!validation.isValid || !validation.cleanedData) {
      return NextResponse.json(
        {
          success: false,
          message: "Please correct the errors in the form.",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // 2. Delegate registration logic to backend service
    const result = await registerPropertyOwner(validation.cleanedData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          errors: {
            [result.field]: result.message,
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        owner: result.owner,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error in /api/auth/register-owner:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred while processing your registration. Please try again.",
      },
      { status: 500 }
    );
  }
}
