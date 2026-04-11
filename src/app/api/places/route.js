import { NextResponse } from "next/server";

const VERIFIED_MAJOR_CITIES = [
  {
    city: "Islamabad",
    label: "Islamabad, Islamabad Capital Territory, Pakistan",
    state: "Islamabad Capital Territory",
    resultType: "city",
    lat: 33.6844,
    lon: 73.0479,
  },
  {
    city: "Rawalpindi",
    label: "Rawalpindi, Punjab, Pakistan",
    state: "Punjab",
    resultType: "city",
    lat: 33.5651,
    lon: 73.0169,
  },
  {
    city: "Lahore",
    label: "Lahore, Punjab, Pakistan",
    state: "Punjab",
    resultType: "city",
    lat: 31.5204,
    lon: 74.3587,
  },
  {
    city: "Karachi",
    label: "Karachi, Sindh, Pakistan",
    state: "Sindh",
    resultType: "city",
    lat: 24.8607,
    lon: 67.0011,
  },
  {
    city: "Faisalabad",
    label: "Faisalabad, Punjab, Pakistan",
    state: "Punjab",
    resultType: "city",
    lat: 31.4504,
    lon: 73.135,
  },
  {
    city: "Multan",
    label: "Multan, Punjab, Pakistan",
    state: "Punjab",
    resultType: "city",
    lat: 30.1575,
    lon: 71.5249,
  },
  {
    city: "Peshawar",
    label: "Peshawar, Khyber Pakhtunkhwa, Pakistan",
    state: "Khyber Pakhtunkhwa",
    resultType: "city",
    lat: 34.0151,
    lon: 71.5249,
  },
  {
    city: "Quetta",
    label: "Quetta, Balochistan, Pakistan",
    state: "Balochistan",
    resultType: "city",
    lat: 30.1798,
    lon: 66.975,
  },
  {
    city: "Hyderabad",
    label: "Hyderabad, Sindh, Pakistan",
    state: "Sindh",
    resultType: "city",
    lat: 25.3969,
    lon: 68.3578,
  },
  {
    city: "Sialkot",
    label: "Sialkot, Punjab, Pakistan",
    state: "Punjab",
    resultType: "city",
    lat: 32.4945,
    lon: 74.5229,
  },
  {
    city: "Gujranwala",
    label: "Gujranwala, Punjab, Pakistan",
    state: "Punjab",
    resultType: "city",
    lat: 32.1877,
    lon: 74.1945,
  },
  {
    city: "Sargodha",
    label: "Sargodha, Punjab, Pakistan",
    state: "Punjab",
    resultType: "city",
    lat: 32.0836,
    lon: 72.6711,
  },
  {
    city: "Bahawalpur",
    label: "Bahawalpur, Punjab, Pakistan",
    state: "Punjab",
    resultType: "city",
    lat: 29.3956,
    lon: 71.6836,
  },
  {
    city: "Sukkur",
    label: "Sukkur, Sindh, Pakistan",
    state: "Sindh",
    resultType: "city",
    lat: 27.7052,
    lon: 68.8574,
  },
  {
    city: "Abbottabad",
    label: "Abbottabad, Khyber Pakhtunkhwa, Pakistan",
    state: "Khyber Pakhtunkhwa",
    resultType: "city",
    lat: 34.1688,
    lon: 73.2215,
  },
  {
    city: "Gilgit",
    label: "Gilgit, Gilgit-Baltistan, Pakistan",
    state: "Gilgit-Baltistan",
    resultType: "city",
    lat: 35.9208,
    lon: 74.3144,
  },
  {
    city: "Skardu",
    label: "Skardu, Gilgit-Baltistan, Pakistan",
    state: "Gilgit-Baltistan",
    resultType: "city",
    lat: 35.2971,
    lon: 75.6337,
  },
];

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .replace(/\bpk\b/g, "")
    .replace(/\bpb\b/g, "")
    .replace(/\bpunjab\b/g, "")
    .replace(/\bsindh\b/g, "")
    .replace(/\bkp\b/g, "")
    .replace(/\bkpk\b/g, "")
    .replace(/\bkhyber pakhtunkhwa\b/g, "")
    .replace(/\bbalochistan\b/g, "")
    .replace(/\bislamabad capital territory\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getNormalizedCity(properties = {}) {
  const formatted = properties.formatted || "";

  const fieldsToCheck = [
    formatted,
    properties.city,
    properties.county,
    properties.state_district,
    properties.state,
  ]
    .filter(Boolean)
    .join(", ")
    .toLowerCase();

  for (const item of VERIFIED_MAJOR_CITIES) {
    if (fieldsToCheck.includes(item.city.toLowerCase())) {
      return item.city;
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

function getVerifiedMatches(searchText) {
  const q = normalizeText(searchText);

  return VERIFIED_MAJOR_CITIES.filter((item) => {
    const city = item.city.toLowerCase();
    return city.startsWith(q) || q.startsWith(city) || city.includes(q);
  });
}

function mapFeatureToResult(item, priority = 0) {
  const coordinates = item.geometry?.coordinates || [];
  const props = item.properties || {};

  return {
    label: props.formatted || "",
    city: getNormalizedCity(props),
    state: props.state || "",
    resultType: props.result_type || "",
    lat: coordinates[1],
    lon: coordinates[0],
    _priority: priority,
  };
}

function getPriority(item, searchText) {
  const props = item.properties || {};
  const normalizedCity = normalizeText(getNormalizedCity(props));
  const formatted = normalizeText(props.formatted || "");
  const resultType = normalizeText(props.result_type || "");
  const state = normalizeText(props.state || "");
  const county = normalizeText(props.county || "");
  const city = normalizeText(props.city || "");
  const search = normalizeText(searchText);

  let score = 0;

  if (normalizedCity === search) score += 120;
  if (city === search) score += 100;
  if (formatted.startsWith(search)) score += 60;
  if (formatted.includes(search)) score += 30;

  if (resultType === "city") score += 50;
  else if (resultType === "locality") score += 25;
  else if (resultType === "suburb") score += 10;
  else score -= 30;

  if (search.includes("islamabad")) {
    if (
      state.includes("islamabad") ||
      county.includes("islamabad") ||
      formatted.includes("islamabad capital territory")
    ) {
      score += 140;
    }

    if (
      state.includes("punjab") ||
      state.includes("sindh") ||
      state.includes("khyber pakhtunkhwa") ||
      state === "pb" ||
      state === "sd" ||
      state === "kp"
    ) {
      score -= 140;
    }
  }

  if (search.includes("lahore")) {
    if (state.includes("punjab")) score += 40;
  }

  if (search.includes("karachi")) {
    if (state.includes("sindh")) score += 40;
  }

  return score;
}

function dedupeResults(results) {
  const seen = new Set();

  return results.filter((item) => {
    const key = `${normalizeText(item.label)}|${item.lat}|${item.lon}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchGeoapifyGeocode(text, apiKey) {
  const url =
    `https://api.geoapify.com/v1/geocode/search` +
    `?text=${encodeURIComponent(text)}` +
    `&filter=countrycode:pk` +
    `&limit=10` +
    `&apiKey=${apiKey}`;

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();
  return data.features || [];
}

async function fetchGeoapifyAutocomplete(text, apiKey) {
  const url =
    `https://api.geoapify.com/v1/geocode/autocomplete` +
    `?text=${encodeURIComponent(text)}` +
    `&filter=countrycode:pk` +
    `&limit=10` +
    `&apiKey=${apiKey}`;

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();
  return data.features || [];
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "";

  if (text.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const verifiedMatches = getVerifiedMatches(text);

  const verifiedResults = verifiedMatches.map((item) => ({
    label: item.label,
    city: item.city,
    state: item.state,
    resultType: item.resultType,
    lat: item.lat,
    lon: item.lon,
    _priority: 1000,
  }));

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      results: verifiedResults.map(({ _priority, ...item }) => item).slice(0, 5),
    });
  }

  try {
    const [searchFeatures, autocompleteFeatures] = await Promise.all([
      fetchGeoapifyGeocode(text, apiKey),
      fetchGeoapifyAutocomplete(text, apiKey),
    ]);

    const allowedTypes = ["city", "locality", "suburb", "neighbourhood"];

    const searchResults = searchFeatures
      .filter((item) => {
        const type = item?.properties?.result_type || "";
        return allowedTypes.includes(type);
      })
      .map((item) => mapFeatureToResult(item, getPriority(item, text) + 80));

    const autocompleteResults = autocompleteFeatures
      .filter((item) => {
        const type = item?.properties?.result_type || "";
        return allowedTypes.includes(type);
      })
      .map((item) => mapFeatureToResult(item, getPriority(item, text)));

    const merged = dedupeResults([
      ...verifiedResults,
      ...searchResults,
      ...autocompleteResults,
    ])
      .sort((a, b) => b._priority - a._priority)
      .slice(0, 8)
      .map(({ _priority, ...item }) => item);

    return NextResponse.json({ results: merged });
  } catch (error) {
    return NextResponse.json({
      results: verifiedResults.map(({ _priority, ...item }) => item).slice(0, 5),
    });
  }
}