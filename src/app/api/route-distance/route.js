import { NextResponse } from "next/server";

function isValidLatitude(value) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

async function fetchRoute({ fromLat, fromLon, toLat, toLon, apiKey }) {
  const url =
    `https://api.geoapify.com/v1/routing?` +
    `waypoints=${fromLon},${fromLat}|${toLon},${toLat}` +
    `&mode=drive` +
    `&details=route_details` +
    `&apiKey=${apiKey}`;

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();

  return { response, data, url };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const pickupLat = Number(searchParams.get("pickupLat"));
    const pickupLon = Number(searchParams.get("pickupLon"));
    const deliveryLat = Number(searchParams.get("deliveryLat"));
    const deliveryLon = Number(searchParams.get("deliveryLon"));

    if (
      !isValidLatitude(pickupLat) ||
      !isValidLongitude(pickupLon) ||
      !isValidLatitude(deliveryLat) ||
      !isValidLongitude(deliveryLon)
    ) {
      return NextResponse.json(
        {
          error: "Invalid pickup or delivery coordinates",
          received: {
            pickupLat,
            pickupLon,
            deliveryLat,
            deliveryLon,
          },
        },
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

    // First try: correct order using lon,lat in waypoints
    let { response, data, url } = await fetchRoute({
      fromLat: pickupLat,
      fromLon: pickupLon,
      toLat: deliveryLat,
      toLon: deliveryLon,
      apiKey,
    });

    let firstRoute = data?.features?.[0]?.properties;

    // Optional fallback:
    // If frontend ever sends swapped values by mistake, this tries the opposite interpretation.
    if (!firstRoute) {
      const fallback = await fetchRoute({
        fromLat: pickupLon,
        fromLon: pickupLat,
        toLat: deliveryLon,
        toLon: deliveryLat,
        apiKey,
      });

      response = fallback.response;
      data = fallback.data;
      url = fallback.url;
      firstRoute = data?.features?.[0]?.properties;
    }

    if (!firstRoute) {
      return NextResponse.json(
        {
          error: "Route not found",
          received: {
            pickupLat,
            pickupLon,
            deliveryLat,
            deliveryLon,
          },
          geoapifyUrl: url,
          raw: data,
        },
        { status: 404 }
      );
    }

    const distanceMeters = Number(firstRoute.distance || 0);
    const timeSeconds = Number(firstRoute.time || 0);

    return NextResponse.json({
      distanceMeters,
      distanceKm: Number((distanceMeters / 1000).toFixed(1)),
      timeSeconds,
      timeHours: Number((timeSeconds / 3600).toFixed(1)),
      received: {
        pickupLat,
        pickupLon,
        deliveryLat,
        deliveryLon,
      },
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