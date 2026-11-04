import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:3001").replace(
  /\/$/,
  ""
);

async function proxy(request: NextRequest, path: string[]) {
  try {
    const targetUrl = new URL(`/api/${path.join("/")}`, BACKEND_URL);
    targetUrl.search = request.nextUrl.search;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : Buffer.from(await request.arrayBuffer()),
      redirect: "manual",
      cache: "no-store",
    });

    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
    });

    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        response.headers.append(key, value);
      }
    });

    const setCookies = upstream.headers.getSetCookie?.() ?? [];
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Service unavailable";
    return NextResponse.json(
      {
        success: false,
        message: "Backend service is currently unavailable or initializing",
        error: errorMsg,
      },
      {
        status: 503,
        headers: { "content-type": "application/json" },
      }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path);
}
