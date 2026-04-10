import { NextResponse } from "next/server";

function getNormalizedCity(properties) {
  const formatted = properties.formatted || "";

  const knownCities = [
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Quetta",
    "Hyderabad",
    "Sialkot",
    "Gujranwala",
    "Sargodha",
    "Bahawalpur",
    "Sukkur",
    "Abbottabad",
    "Gilgit",
    "Skardu",
  ];

  const fieldsToCheck = [
    formatted,
    properties.city,
    properties.county,
    properties.state_district,
    properties.state,
  ]
    .filter(Boolean)
    .join(", ");

  for (const city of knownCities) {
    const regex = new RegExp(`\\b${city}\\b`, "i");
    if (regex.test(fieldsToCheck)) {
      return city;
    }
  }

  if ((properties.city || "").toLowerCase() === "karachi division") {
    return "Karachi";
  }

  if ((properties.city || "").toLowerCase().includes("zone")) {
    if (/islamabad/i.test(formatted)) {
      return "Islamabad";
    }
  }

  return properties.city || "";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");

  if (!text || text.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;

  const url =
    `https://api.geoapify.com/v1/geocode/autocomplete` +
    `?text=${encodeURIComponent(text)}` +
    `&filter=countrycode:pk` +
    `&limit=10` +
    `&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const allowedTypes = [
      "city",
      "locality",
      "suburb",
      "neighbourhood",
      "street",
    ];

    const results = (data.features || [])
      .filter((item) => {
        const type = item?.properties?.result_type || "";
        return allowedTypes.includes(type);
      })
      .map((item) => ({
        label: item.properties.formatted || "",
        city: getNormalizedCity(item.properties),
        state: item.properties.state || "",
        resultType: item.properties.result_type || "",
        lat: item.properties.lat,
        lon: item.properties.lon,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ results: [] });
  }
}