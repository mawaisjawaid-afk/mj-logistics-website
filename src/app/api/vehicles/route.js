import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: "Missing server env vars",
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
        },
        { status: 500 }
      );
    }

    const url = `${supabaseUrl}/rest/v1/vehicles?select=*&is_active=eq.true`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Supabase request failed",
          status: response.status,
          statusText: response.statusText,
          body: text,
        },
        { status: 500 }
      );
    }

    let vehicles = [];
    try {
      vehicles = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: "Supabase returned non-JSON response",
          body: text,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ vehicles });
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "Unknown server fetch error",
        stack:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}