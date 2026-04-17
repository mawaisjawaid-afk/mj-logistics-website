import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeSearchValue(value) {
  return String(value || "").trim();
}

function transformBookingRecord(row) {
  return {
    id: row.id,
    bookingCode: row.booking_code,
    bookingStatus: row.booking_status,
    linkedEstimateCode: row.linked_estimate_code,
    generatedOn: row.generated_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    fullName: row.full_name,
    contactNumber: row.contact_number,

    pickupLabel: row.pickup_label,
    pickupCity: row.pickup_city,
    pickupLat: row.pickup_lat,
    pickupLon: row.pickup_lon,
    pickupOtherInfo: row.pickup_other_info,

    dropoffLabel: row.dropoff_label,
    dropoffCity: row.dropoff_city,
    dropoffLat: row.dropoff_lat,
    dropoffLon: row.dropoff_lon,
    dropoffOtherInfo: row.dropoff_other_info,

    material: row.material,
    materialSpecification: row.material_specification,

    weightValue: row.weight_value,
    weightUnit: row.weight_unit,

    suggestedVehicle: row.suggested_vehicle,
    manualPrice: row.manual_price,
    loadingDate: row.loading_date,

    documentsAvailable: row.documents_available,
    documentsDetails: row.documents_details,
    notes: row.notes,

    leadSource: row.lead_source,
    isEstimateGenerated: row.is_estimate_generated,
  };
}

async function findBooking(searchValue) {
  const normalized = normalizeSearchValue(searchValue);

  if (!normalized) {
    return {
      error: "Booking ID or Estimate ID is required",
      status: 400,
    };
  }

  // 1) Try exact booking_code match first
  const { data: bookingMatch, error: bookingError } = await supabase
    .from("internal_bookings")
    .select("*")
    .eq("booking_code", normalized)
    .maybeSingle();

  if (bookingError) {
    throw bookingError;
  }

  if (bookingMatch) {
    return {
      data: transformBookingRecord(bookingMatch),
      matchedBy: "booking_code",
    };
  }

  // 2) If not found, try linked_estimate_code
  const { data: estimateMatch, error: estimateError } = await supabase
    .from("internal_bookings")
    .select("*")
    .eq("linked_estimate_code", normalized)
    .maybeSingle();

  if (estimateError) {
    throw estimateError;
  }

  if (estimateMatch) {
    return {
      data: transformBookingRecord(estimateMatch),
      matchedBy: "linked_estimate_code",
    };
  }

  return {
    error: "Booking not found",
    status: 404,
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const searchValue =
      body.booking_code ||
      body.linked_estimate_code ||
      body.searchId ||
      "";

    const result = await findBooking(searchValue);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      matchedBy: result.matchedBy,
      booking: result.data,
    });
  } catch (error) {
    console.error("get-internal-booking POST error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const searchValue =
      searchParams.get("booking_code") ||
      searchParams.get("linked_estimate_code") ||
      searchParams.get("searchId") ||
      "";

    const result = await findBooking(searchValue);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      matchedBy: result.matchedBy,
      booking: result.data,
    });
  } catch (error) {
    console.error("get-internal-booking GET error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to fetch booking" },
      { status: 500 }
    );
  }
}