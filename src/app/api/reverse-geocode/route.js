import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and Longitude are required" },
        { status: 400 }
      );
    }

    const latNum = Number(lat);
    const lonNum = Number(lon);

    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      return NextResponse.json(
        { error: "Latitude and Longitude must be valid numbers" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEOAPIFY_API_KEY" },
        { status: 500 }
      );
    }

    const url =
      `https://api.geoapify.com/v1/geocode/reverse?lat=${encodeURIComponent(latNum)}` +
      `&lon=${encodeURIComponent(lonNum)}` +
      `&format=json&apiKey=${apiKey}`;

    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Failed to reverse geocode location" },
        { status: response.status }
      );
    }

    const result = data?.results?.[0];

    if (!result) {
      return NextResponse.json(
        { error: "Location not found for these coordinates" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        label:
          result.formatted ||
          result.address_line1 ||
          result.city ||
          `${latNum}, ${lonNum}`,
        city: result.city || result.state || result.county || "",
        lat: latNum,
        lon: lonNum,
      },
    });
  } catch (error) {
    console.error("reverse-geocode API error:", error);

    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}