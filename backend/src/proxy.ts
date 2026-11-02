import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://holiday-expertz.vercel.app",
  "http://localhost:3000",
];

function allowedOrigins(): string[] {
  const configured = process.env.FRONTEND_URL?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigin = origin && allowedOrigins().includes(origin) ? origin : null;
  const corsHeaders = new Headers();

  if (allowedOrigin) {
    corsHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
    corsHeaders.set("Access-Control-Allow-Credentials", "true");
  }

  if (request.method === "OPTIONS") {
    corsHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    corsHeaders.set(
      "Access-Control-Allow-Headers",
      request.headers.get("access-control-request-headers") || "Content-Type, Authorization"
    );

    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const response = NextResponse.next();
  corsHeaders.forEach((value, key) => response.headers.set(key, value));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
