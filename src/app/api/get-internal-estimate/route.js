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

function transformEstimateRecord(row) {
  if (!row) return null;

  const weightValue =
    row.weight_value !== null && row.weight_value !== undefined
      ? String(row.weight_value)
      : "";

  const weightUnit = row.weight_type || "ton";

  const materialsText =
    Array.isArray(row.materials) && row.materials.length
      ? row.materials.join(", ")
      : row.material || "";

  return {
    id: row.id,

    estimateId: row.estimate_code || "",
    estimateCode: row.estimate_code || "",
    estimateStatus: row.odoo_status || "Ready",
    status: row.odoo_status || "Ready",

    linkedBookingId: row.linked_booking_id ?? null,
    linkedBookingCode: row.linked_booking_code || "",
    linked_booking_code: row.linked_booking_code || "",

    estimateVersion: row.estimate_version ?? 1,
    estimate_version: row.estimate_version ?? 1,

    generatedOn: row.updated_at || row.created_at || null,
    createdAt: row.created_at || null,
    created_at: row.created_at || null,
    updatedAt: row.updated_at || null,
    updated_at: row.updated_at || null,

    fullName: row.full_name || "",
    full_name: row.full_name || "",

    phone: row.phone || "",
    contactNumber: row.phone || "",

    email: row.email || "",

    pickup: row.pickup || "",
    pickupLabel: row.pickup_label || row.pickup || "",
    pickup_label: row.pickup_label || row.pickup || "",
    pickupCity: row.pickup_city || "",
    pickup_city: row.pickup_city || "",
    pickupLat:
      row.pickup_lat !== null && row.pickup_lat !== undefined
        ? Number(row.pickup_lat)
        : null,
    pickup_lat:
      row.pickup_lat !== null && row.pickup_lat !== undefined
        ? Number(row.pickup_lat)
        : null,
    pickupLon:
      row.pickup_lon !== null && row.pickup_lon !== undefined
        ? Number(row.pickup_lon)
        : null,
    pickup_lon:
      row.pickup_lon !== null && row.pickup_lon !== undefined
        ? Number(row.pickup_lon)
        : null,
    pickupOtherInfo: row.pickup_other_info || "",
    pickup_other_info: row.pickup_other_info || "",

    delivery: row.delivery || "",
    dropoff: row.delivery || "",
    dropoffLabel: row.dropoff_label || row.delivery || "",
    dropoff_label: row.dropoff_label || row.delivery || "",
    dropoffCity: row.delivery_city || "",
    deliveryCity: row.delivery_city || "",
    dropoff_city: row.delivery_city || "",
    dropoffLat:
      row.delivery_lat !== null && row.delivery_lat !== undefined
        ? Number(row.delivery_lat)
        : null,
    dropoff_lat:
      row.delivery_lat !== null && row.delivery_lat !== undefined
        ? Number(row.delivery_lat)
        : null,
    dropoffLon:
      row.delivery_lon !== null && row.delivery_lon !== undefined
        ? Number(row.delivery_lon)
        : null,
    dropoff_lon:
      row.delivery_lon !== null && row.delivery_lon !== undefined
        ? Number(row.delivery_lon)
        : null,
    dropoffOtherInfo: row.dropoff_other_info || "",
    dropoff_other_info: row.dropoff_other_info || "",

    material: row.material || "",
    material_name: row.material || "",
    materialSpecification: row.material_specification || "",
    material_specification: row.material_specification || "",

    materials: Array.isArray(row.materials) ? row.materials : [],
    materialsText,
    materials_text: materialsText,

    weightValue,
    weight_value: weightValue,
    weight: weightValue,
    weightUnit,
    weight_unit: weightUnit,
    weightType: weightUnit,

    suggestedVehicle: row.suggested_vehicle || row.vehicle_name || "",
    vehicleName: row.vehicle_name || "",
    vehicle_name: row.vehicle_name || "",

    distance:
      row.distance_km !== null && row.distance_km !== undefined
        ? `${Number(row.distance_km).toLocaleString("en-PK")} KM`
        : "",
    distance_km:
      row.distance_km !== null && row.distance_km !== undefined
        ? Number(row.distance_km)
        : null,

    transitTime:
      row.transit_hours !== null && row.transit_hours !== undefined
        ? `${Number(row.transit_hours).toFixed(1)} hours`
        : "",
    transit_time:
      row.transit_hours !== null && row.transit_hours !== undefined
        ? `${Number(row.transit_hours).toFixed(1)} hours`
        : "",
    transit_hours:
      row.transit_hours !== null && row.transit_hours !== undefined
        ? Number(row.transit_hours)
        : null,

    finalCost:
      row.final_cost !== null && row.final_cost !== undefined
        ? Math.round(Number(row.final_cost)).toLocaleString("en-PK")
        : "",
    final_cost:
      row.final_cost !== null && row.final_cost !== undefined
        ? Math.round(Number(row.final_cost))
        : null,

    loadingDate: row.loading_date || "",
    loading_date: row.loading_date || "",

    documentsAvailable: row.documents_available || "",
    documents_available: row.documents_available || "",

    documentsDetails: row.documents_details || "",
    documents_details: row.documents_details || "",

    notes: row.notes || "",

    source: row.source || "",
    leadSource: row.lead_source || "",
    lead_source: row.lead_source || "",
    customerEmailSent: Boolean(row.customer_email_sent),
    internalEmailSent: Boolean(row.internal_email_sent),
    odooStatus: row.odoo_status || "",
    odoo_status: row.odoo_status || "",
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const searchId = normalizeSearchValue(body.searchId);

    if (!searchId) {
      return NextResponse.json(
        { error: "Search ID is required" },
        { status: 400 }
      );
    }

    let estimate = null;
    let fetchError = null;

    // 1) Try exact estimate code first
    const { data: estimateByCode, error: codeError } = await supabase
      .from("estimates")
      .select("*")
      .eq("estimate_code", searchId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError) {
      fetchError = codeError;
    } else if (estimateByCode) {
      estimate = estimateByCode;
    }

    // 2) If not found, try linked booking code and get latest version
    if (!estimate && !fetchError) {
      const { data: estimateByBookingCode, error: bookingCodeError } =
        await supabase
          .from("estimates")
          .select("*")
          .eq("linked_booking_code", searchId)
          .order("estimate_version", { ascending: false })
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (bookingCodeError) {
        fetchError = bookingCodeError;
      } else if (estimateByBookingCode) {
        estimate = estimateByBookingCode;
      }
    }

    // 3) If numeric, try linked booking ID
    if (!estimate && !fetchError && /^\d+$/.test(searchId)) {
      const numericId = Number(searchId);

      const { data: estimateByBookingId, error: bookingIdError } =
        await supabase
          .from("estimates")
          .select("*")
          .eq("linked_booking_id", numericId)
          .order("estimate_version", { ascending: false })
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (bookingIdError) {
        fetchError = bookingIdError;
      } else if (estimateByBookingId) {
        estimate = estimateByBookingId;
      }
    }

    if (fetchError) {
      throw fetchError;
    }

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      estimate: transformEstimateRecord(estimate),
    });
  } catch (error) {
    console.error("get-internal-estimate API error:", error);

    return NextResponse.json(
      {
        error: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}