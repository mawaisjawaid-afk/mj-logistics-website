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

function buildEstimateResponse(row) {
  return {
    id: row.id,
    estimateCode: row.estimate_code,
    source: row.source || "website",

    linkedBookingId: row.linked_booking_id,
    linkedBookingCode: row.linked_booking_code,
    estimateVersion: row.estimate_version || 1,

    fullName: row.full_name,
    phone: row.phone,
    email: row.email,

    pickup: row.pickup,
    delivery: row.delivery,
    pickupCity: row.pickup_city,
    deliveryCity: row.delivery_city,

    pickupLabel: row.pickup_label,
    dropoffLabel: row.dropoff_label,

    pickupLat: row.pickup_lat,
    pickupLon: row.pickup_lon,
    deliveryLat: row.delivery_lat,
    deliveryLon: row.delivery_lon,

    pickupOtherInfo: row.pickup_other_info,
    dropoffOtherInfo: row.dropoff_other_info,

    material: row.material,
    materialSpecification: row.material_specification,
    materials: Array.isArray(row.materials) ? row.materials : [],

    weightValue: row.weight_value,
    weightType: row.weight_type,

    suggestedVehicle: row.suggested_vehicle,
    vehicleName: row.vehicle_name,

    loadingDate: row.loading_date,

    documentsAvailable: row.documents_available,
    documentsDetails: row.documents_details,
    notes: row.notes,

    leadSource: row.lead_source,

    distanceKm: row.distance_km,
    transitHours: row.transit_hours,
    finalCost: row.final_cost,

    requestHash: row.request_hash,
    odooStatus: row.odoo_status,
    customerEmailSent: row.customer_email_sent,
    internalEmailSent: row.internal_email_sent,

    createdAt: row.created_at,
  };
}

async function findEstimate({ estimateCode, linkedBookingCode }) {
  const normalizedEstimateCode = normalizeSearchValue(estimateCode);
  const normalizedBookingCode = normalizeSearchValue(linkedBookingCode);

  if (!normalizedEstimateCode && !normalizedBookingCode) {
    return {
      error: "Estimate ID or Booking ID is required",
      status: 400,
    };
  }

  if (normalizedEstimateCode) {
    const { data, error } = await supabase
      .from("estimates")
      .select("*")
      .eq("estimate_code", normalizedEstimateCode)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          error: "Estimate not found",
          status: 404,
        };
      }
      throw error;
    }

    return {
      data: buildEstimateResponse(data),
      matchedBy: "estimate_code",
    };
  }

  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("linked_booking_code", normalizedBookingCode)
    .order("estimate_version", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return {
      error: "Estimate not found",
      status: 404,
    };
  }

  return {
    data: buildEstimateResponse(data[0]),
    matchedBy: "linked_booking_code",
  };
}

export async function POST(req) {
  try {
    const body = await req.json();

    const result = await findEstimate({
      estimateCode: body.estimateCode || body.estimate_code || body.searchId,
      linkedBookingCode:
        body.linkedBookingCode || body.linked_booking_code || null,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      matchedBy: result.matchedBy,
      estimate: result.data,
    });
  } catch (error) {
    console.error("get-estimate POST error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to fetch estimate" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const result = await findEstimate({
      estimateCode:
        searchParams.get("estimateCode") ||
        searchParams.get("estimate_code") ||
        searchParams.get("searchId"),
      linkedBookingCode:
        searchParams.get("linkedBookingCode") ||
        searchParams.get("linked_booking_code"),
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      matchedBy: result.matchedBy,
      estimate: result.data,
    });
  } catch (error) {
    console.error("get-estimate GET error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to fetch estimate" },
      { status: 500 }
    );
  }
}