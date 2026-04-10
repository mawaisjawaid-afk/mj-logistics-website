import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const pickupLat = searchParams.get("pickupLat");
    const pickupLon = searchParams.get("pickupLon");
    const deliveryLat = searchParams.get("deliveryLat");
    const deliveryLon = searchParams.get("deliveryLon");

    if (!pickupLat || !pickupLon || !deliveryLat || !deliveryLon) {
      return NextResponse.json(
        { error: "Missing pickup or delivery coordinates" },
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
      `https://api.geoapify.com/v1/routing?` +
      `waypoints=${pickupLat},${pickupLon}|${deliveryLat},${deliveryLon}` +
      `&mode=drive` +
      `&details=route_details` +
      `&apiKey=${apiKey}`;

    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();

    const firstRoute = data?.features?.[0]?.properties;

    if (!firstRoute) {
      return NextResponse.json(
        { error: "Route not found", raw: data },
        { status: 404 }
      );
    }

    const distanceMeters = firstRoute.distance || 0;
    const timeSeconds = firstRoute.time || 0;

    return NextResponse.json({
      distanceMeters,
      distanceKm: Number((distanceMeters / 1000).toFixed(1)),
      timeSeconds,
      timeHours: Number((timeSeconds / 3600).toFixed(1)),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch route distance",
        details: error.message,
      },
      { status: 500 }
    );
  }
}