import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function buildBookingCode(id) {
  return `WIB-${13420 + Number(id)}`;
}

function validatePayload(body) {
  if (!body.fullName?.trim()) return "Name is required";
  if (!body.contactNumber?.trim()) return "Contact Number is required";

  if (!body.pickupLabel?.trim()) return "Pickup Location is required";
  if (!body.dropoffLabel?.trim()) return "Drop-off Location is required";

  if (!body.material?.trim()) return "Material is required";

  if (
    body.weightValue === null ||
    body.weightValue === undefined ||
    body.weightValue === "" ||
    Number(body.weightValue) <= 0
  ) {
    return "Valid Weight is required";
  }

  if (!body.weightUnit?.trim()) return "Weight Unit is required";
  if (!body.loadingDate) return "Loading Date is required";

  return null;
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

export async function POST(req) {
  try {
    const body = await req.json();

    const validationError = validatePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const payload = {
      booking_status: body.bookingStatus?.trim() || "New Entry",
      linked_estimate_code: body.linkedEstimateCode?.trim() || null,

      full_name: body.fullName?.trim() || null,
      contact_number: body.contactNumber?.trim() || null,

      pickup_label: body.pickupLabel?.trim() || null,
      pickup_city: body.pickupCity?.trim() || null,
      pickup_lat: toNullableNumber(body.pickupLat),
      pickup_lon: toNullableNumber(body.pickupLon),
      pickup_other_info: body.pickupOtherInfo?.trim() || null,

      dropoff_label: body.dropoffLabel?.trim() || null,
      dropoff_city: body.dropoffCity?.trim() || null,
      dropoff_lat: toNullableNumber(body.dropoffLat),
      dropoff_lon: toNullableNumber(body.dropoffLon),
      dropoff_other_info: body.dropoffOtherInfo?.trim() || null,

      material: body.material?.trim() || null,
      material_specification: body.materialSpecification?.trim() || null,

      weight_value: Number(body.weightValue),
      weight_unit: body.weightUnit?.trim() || null,

      suggested_vehicle: body.suggestedVehicle?.trim() || null,
      manual_price: toNullableNumber(body.manualPrice),
      loading_date: body.loadingDate || null,

      documents_available: body.documentsAvailable?.trim() || "yes",
      documents_details: body.documentsDetails?.trim() || null,
      notes: body.notes?.trim() || null,

      lead_source: "whatsapp",
      is_estimate_generated: Boolean(body.isEstimateGenerated),
    };

    const existingId = body.id ? Number(body.id) : null;

    // UPDATE EXISTING BOOKING
    if (existingId) {
      const { data, error } = await supabase
        .from("internal_bookings")
        .update(payload)
        .eq("id", existingId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        mode: "update",
        booking: transformBookingRecord(data),
        record: data,
      });
    }

    // CREATE NEW BOOKING
    const { data: inserted, error: insertError } = await supabase
      .from("internal_bookings")
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const bookingCode = buildBookingCode(inserted.id);

    const { data: updated, error: updateError } = await supabase
      .from("internal_bookings")
      .update({ booking_code: bookingCode, booking_status: "Saved" })
      .eq("id", inserted.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      mode: "create",
      booking: transformBookingRecord(updated),
      record: updated,
    });
  } catch (error) {
    console.error("save-internal-booking error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to save booking" },
      { status: 500 }
    );
  }
}