import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function wrapText(text, maxCharsPerLine = 42) {
  const safeText = String(text ?? "");
  const words = safeText.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [safeText];
}

function drawCenteredText(page, text, centerX, y, options) {
  const { font, size = 12, color = rgb(0, 0, 0) } = options;
  const width = font.widthOfTextAtSize(String(text ?? ""), size);

  page.drawText(String(text ?? ""), {
    x: centerX - width / 2,
    y,
    size,
    font,
    color,
  });
}

function drawLeftText(page, text, x, y, options) {
  const { font, size = 12, color = rgb(0, 0, 0) } = options;

  page.drawText(String(text ?? ""), {
    x,
    y,
    size,
    font,
    color,
  });
}

function drawWrappedText(page, text, x, y, options) {
  const {
    font,
    size = 12,
    color = rgb(0, 0, 0),
    maxCharsPerLine = 40,
    lineHeight = size + 4,
  } = options;

  const lines = wrapText(text, maxCharsPerLine);
  let currentY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      font,
      color,
    });
    currentY -= lineHeight;
  }

  return currentY;
}

function drawInfoRow({
  page,
  x,
  y,
  width,
  label,
  value,
  fonts,
  labelWidthRatio = 0.4,
}) {
  const labelWidth = width * labelWidthRatio;
  const valueWidth = width - labelWidth;

  const labelLines = wrapText(label, 22);
  const valueLines = wrapText(value, 34);

  const lineCount = Math.max(labelLines.length, valueLines.length);
  const rowHeight = Math.max(32, 12 + lineCount * 14);

  page.drawLine({
    start: { x, y: y - rowHeight },
    end: { x: x + width, y: y - rowHeight },
    thickness: 1,
    color: rgb(0.87, 0.89, 0.92),
  });

  let labelY = y - 14;
  labelLines.forEach((line) => {
    page.drawText(line, {
      x,
      y: labelY,
      size: 10,
      font: fonts.regular,
      color: rgb(0.42, 0.46, 0.53),
    });
    labelY -= 14;
  });

  let valueY = y - 14;
  valueLines.forEach((line) => {
    const textWidth = fonts.bold.widthOfTextAtSize(line, 10.5);
    page.drawText(line, {
      x: x + labelWidth + valueWidth - textWidth,
      y: valueY,
      size: 10.5,
      font: fonts.bold,
      color: rgb(0.05, 0.09, 0.16),
    });
    valueY -= 14;
  });

  return y - rowHeight;
}

function selectVehicle(vehicles, weightTon) {
  if (!Array.isArray(vehicles) || vehicles.length === 0) return null;

  const normalized = vehicles
    .map((v) => ({
      ...v,
      min_capacity_ton: Number(v.min_capacity_ton),
      max_capacity_ton: Number(v.max_capacity_ton),
      rate_per_km: Number(v.rate_per_km),
      minimum_charge: Number(v.minimum_charge),
      loaded_avg_speed_kmph: Number(v.loaded_avg_speed_kmph),
      loading_hours: Number(v.loading_hours),
      unloading_hours: Number(v.unloading_hours),
    }))
    .filter(
      (v) =>
        !Number.isNaN(v.min_capacity_ton) &&
        !Number.isNaN(v.max_capacity_ton) &&
        weightTon >= v.min_capacity_ton &&
        weightTon <= v.max_capacity_ton
    )
    .sort((a, b) => a.max_capacity_ton - b.max_capacity_ton);

  return normalized[0] || null;
}

async function calculateRouteDistance({
  pickupLat,
  pickupLon,
  deliveryLat,
  deliveryLon,
}) {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (
    !apiKey ||
    pickupLat === null ||
    pickupLon === null ||
    deliveryLat === null ||
    deliveryLon === null
  ) {
    return {
      distanceKm: null,
      timeHours: null,
    };
  }

  const url =
    `https://api.geoapify.com/v1/routing?` +
    `waypoints=${pickupLat},${pickupLon}|${deliveryLat},${deliveryLon}` +
    `&mode=drive&details=route_details&apiKey=${apiKey}`;

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch route distance");
  }

  const feature = data?.features?.[0];
  const distanceMeters = feature?.properties?.distance;
  const timeSeconds = feature?.properties?.time;

  if (
    distanceMeters === null ||
    distanceMeters === undefined ||
    timeSeconds === null ||
    timeSeconds === undefined
  ) {
    throw new Error("Invalid route response");
  }

  return {
    distanceKm: Number((distanceMeters / 1000).toFixed(1)),
    timeHours: Number((timeSeconds / 3600).toFixed(1)),
  };
}

async function createEstimatePdfBuffer({
  estimateCode,
  generatedAtText,
  fullName,
  phone,
  email,
  pickup,
  delivery,
  materialsText,
  safeWeight,
  safeDistance,
  safeVehicle,
  safeTransitHours,
  safeFinalCost,
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fonts = {
    regular: fontRegular,
    bold: fontBold,
  };

  const colors = {
    red: rgb(0.839, 0.09, 0.051),
    redSoft: rgb(0.995, 0.962, 0.962),
    redBorder: rgb(0.973, 0.81, 0.81),
    pageBg: rgb(0.948, 0.952, 0.965),
    cardBg: rgb(1, 1, 1),
    mutedBg: rgb(0.969, 0.973, 0.98),
    border: rgb(0.86, 0.89, 0.93),
    text: rgb(0.05, 0.09, 0.16),
    subtext: rgb(0.42, 0.46, 0.53),
    amberBg: rgb(1, 0.974, 0.925),
    amberBorder: rgb(0.945, 0.82, 0.48),
    amberText: rgb(0.55, 0.31, 0),
  };

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: colors.pageBg,
  });

  page.drawRectangle({
    x: 0,
    y: height - 6,
    width,
    height: 6,
    color: colors.red,
  });

  const outerX = 18;
  const outerY = 18;
  const outerWidth = width - 36;
  const outerHeight = height - 36;

  page.drawRectangle({
    x: outerX,
    y: outerY,
    width: outerWidth,
    height: outerHeight,
    color: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
  });

  let y = height - 58;

  // LOAD LOGO FROM PUBLIC FOLDER
  const logoPath = path.join(process.cwd(), "public", "logo-6.png");
  const logoBytes = fs.readFileSync(logoPath);
  const logoImage = await pdfDoc.embedPng(logoBytes);

  // LOGO SIZE CONTROL
  const logoWidth = 140;
  const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

  // DRAW LOGO CENTERED
  page.drawImage(logoImage, {
    x: width / 2 - logoWidth / 2,
    y: y - logoHeight + 10,
    width: logoWidth,
    height: logoHeight,
  });

  y -= 42;

  drawCenteredText(page, "Instant Estimate", width / 2, y, {
    font: fontBold,
    size: 21,
    color: colors.text,
  });

  y -= 24;

  drawCenteredText(page, `ESTIMATE ID: ${estimateCode}`, width / 2 - 105, y, {
    font: fontBold,
    size: 8.5,
    color: colors.subtext,
  });

  drawCenteredText(page, `GENERATED: ${generatedAtText}`, width / 2 + 110, y, {
    font: fontBold,
    size: 8.5,
    color: colors.subtext,
  });

  y -= 28;

  page.drawRectangle({
    x: 32,
    y: y - 58,
    width: width - 64,
    height: 58,
    color: colors.redSoft,
    borderColor: colors.redBorder,
    borderWidth: 1,
  });

  drawCenteredText(page, "ESTIMATED COST", width / 2, y - 14, {
    font: fontBold,
    size: 8.5,
    color: colors.subtext,
  });

  drawCenteredText(page, `PKR ${safeFinalCost}`, width / 2, y - 34, {
    font: fontBold,
    size: 23,
    color: colors.red,
  });

  drawCenteredText(page, "Based on your route and requirements", width / 2, y - 48, {
    font: fontRegular,
    size: 8.5,
    color: colors.text,
  });

  y -= 72;

  page.drawRectangle({
    x: 32,
    y: y - 70,
    width: width - 64,
    height: 70,
    color: colors.mutedBg,
    borderColor: colors.border,
    borderWidth: 1,
  });

  drawLeftText(page, "Customer Details", 44, y - 16, {
    font: fontBold,
    size: 11,
    color: colors.text,
  });

  const customerCols = [
    { label: "NAME", value: fullName || "Guest User", x: 44 },
    { label: "PHONE", value: phone || "Not provided", x: 220 },
    { label: "EMAIL", value: email || "Not provided", x: 416 },
  ];

  customerCols.forEach((item) => {
    drawLeftText(page, item.label, item.x, y - 36, {
      font: fontRegular,
      size: 7.8,
      color: colors.subtext,
    });

    drawWrappedText(page, item.value, item.x, y - 50, {
      font: fontBold,
      size: 10,
      color: colors.text,
      maxCharsPerLine: item.x === 416 ? 24 : 18,
      lineHeight: 12,
    });
  });

  y -= 82;

  const leftCardX = 32;
  const rightCardX = width / 2 + 5;
  const cardWidth = width / 2 - 42;
  const cardHeight = 148;

  page.drawRectangle({
    x: leftCardX,
    y: y - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: rightCardX,
    y: y - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
  });

  drawLeftText(page, "Shipment Summary", leftCardX + 12, y - 16, {
    font: fontBold,
    size: 11,
    color: colors.text,
  });

  let leftY = y - 30;
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Total Weight",
    value: safeWeight,
    fonts,
  });
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Material Type",
    value: materialsText,
    fonts,
  });
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Route",
    value: `${pickup} to ${delivery}`,
    fonts,
  });
  drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Distance",
    value: safeDistance,
    fonts,
  });

  drawLeftText(page, "Recommendation", rightCardX + 12, y - 16, {
    font: fontBold,
    size: 11,
    color: colors.text,
  });

  page.drawRectangle({
    x: rightCardX + 12,
    y: y - 54,
    width: cardWidth - 24,
    height: 26,
    color: colors.redSoft,
  });

  drawCenteredText(page, "Full Load", rightCardX + cardWidth / 2, y - 44, {
    font: fontBold,
    size: 12,
    color: colors.red,
  });

  let rightY = y - 66;
  rightY = drawInfoRow({
    page,
    x: rightCardX + 12,
    y: rightY,
    width: cardWidth - 24,
    label: "Vehicle Class",
    value: safeVehicle,
    fonts,
  });

  drawInfoRow({
    page,
    x: rightCardX + 12,
    y: rightY,
    width: cardWidth - 24,
    label: "Transit Time",
    value: safeTransitHours,
    fonts,
  });

  y -= cardHeight + 10;

  page.drawRectangle({
    x: 32,
    y: y - 26,
    width: width - 64,
    height: 26,
    color: colors.amberBg,
    borderColor: colors.amberBorder,
    borderWidth: 1,
  });

  drawCenteredText(
    page,
    "Prices are indicative and subject to route inspection, fuel fluctuation, and operational constraints.",
    width / 2,
    y - 16,
    {
      font: fontRegular,
      size: 7.8,
      color: colors.amberText,
    }
  );

  y -= 40;

  drawCenteredText(page, "Secure • Fast • Reliable", width / 2, y, {
    font: fontRegular,
    size: 8.5,
    color: colors.subtext,
  });

  const footerLineY = 96;

  page.drawLine({
    start: { x: 30, y: footerLineY },
    end: { x: width - 30, y: footerLineY },
    thickness: 1,
    color: colors.border,
  });

  drawCenteredText(
    page,
    "Opposite Kohinoor Textile Mill, Main Peshawar Road, Rawalpindi",
    width / 2,
    78,
    {
      font: fontRegular,
      size: 7.5,
      color: colors.subtext,
    }
  );

  drawCenteredText(
    page,
    "+92 334 6466818 | info@mjlogistics.com",
    width / 2,
    64,
    {
      font: fontRegular,
      size: 7.5,
      color: colors.subtext,
    }
  );

  drawCenteredText(
    page,
    `© ${new Date().getFullYear()} MJ Logistic Services. All rights reserved.`,
    width / 2,
    50,
    {
      font: fontRegular,
      size: 7,
      color: rgb(0.58, 0.61, 0.67),
    }
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function POST(req) {
  try {
    const body = await req.json();

    const customerEmail = body.email?.trim() || "";
    const safeName = body.fullName?.trim() || "Customer";
    const safePhone = body.phone?.trim() || "Not provided";

    const pickup = body.pickup || "N/A";
    const delivery = body.delivery || "N/A";
    const pickupCity = body.pickupCity?.trim() || "";
    const deliveryCity = body.deliveryCity?.trim() || "";

    const safePickup = pickupCity || pickup;
    const safeDelivery = deliveryCity || delivery;

    const pickupLat =
      body.pickupLat !== null && body.pickupLat !== undefined
        ? Number(body.pickupLat)
        : null;
    const pickupLon =
      body.pickupLon !== null && body.pickupLon !== undefined
        ? Number(body.pickupLon)
        : null;
    const deliveryLat =
      body.deliveryLat !== null && body.deliveryLat !== undefined
        ? Number(body.deliveryLat)
        : null;
    const deliveryLon =
      body.deliveryLon !== null && body.deliveryLon !== undefined
        ? Number(body.deliveryLon)
        : null;

    const weightTon =
      body.weight !== null && body.weight !== undefined
        ? Number(body.weight)
        : 0;

    const weightType = body.weightType || "ton";
    const materials = Array.isArray(body.materials) ? body.materials : [];
    const materialsText = materials.length ? materials.join(", ") : "N/A";

    const generatedAtText = formatDateTime(new Date());

    const [routeData, vehiclesResult] = await Promise.all([
      calculateRouteDistance({
        pickupLat,
        pickupLon,
        deliveryLat,
        deliveryLon,
      }),
      supabase
        .from("vehicles")
        .select(
          "vehicle_name,min_capacity_ton,max_capacity_ton,rate_per_km,minimum_charge,loaded_avg_speed_kmph,loading_hours,unloading_hours"
        )
        .eq("is_active", true),
    ]);

    const distanceKm = routeData.distanceKm;
    const routeTimeHours = routeData.timeHours;

    if (distanceKm === null) {
      throw new Error("Unable to calculate route distance");
    }

    const { data: vehicles, error: vehiclesError } = vehiclesResult;

    if (vehiclesError) {
      throw vehiclesError;
    }

    const matchedVehicle = selectVehicle(vehicles || [], weightTon);

    if (!matchedVehicle) {
      throw new Error("No suitable vehicle found for this weight.");
    }

    const baseCost = distanceKm * Number(matchedVehicle.rate_per_km || 0);
    const minCharge = Number(matchedVehicle.minimum_charge || 0);
    const finalCostRaw = Math.max(baseCost, minCharge);

    const speed = Number(matchedVehicle.loaded_avg_speed_kmph || 0);
    const loadingHours = Number(matchedVehicle.loading_hours || 0);
    const unloadingHours = Number(matchedVehicle.unloading_hours || 0);

    const transitHours =
      speed > 0
        ? Number((distanceKm / speed + loadingHours + unloadingHours).toFixed(1))
        : routeTimeHours;

    const { data, error } = await supabase
      .from("estimates")
      .insert([
        {
          full_name: body.fullName || null,
          phone: body.phone || null,
          email: customerEmail || null,
          pickup: pickup || null,
          delivery: delivery || null,
          pickup_city: pickupCity || null,
          delivery_city: deliveryCity || null,
          pickup_lat: pickupLat,
          pickup_lon: pickupLon,
          delivery_lat: deliveryLat,
          delivery_lon: deliveryLon,
          weight_value: weightTon,
          weight_type: weightType,
          materials: materials,
          distance_km: distanceKm,
          transit_hours: transitHours,
          vehicle_name: matchedVehicle.vehicle_name || null,
          final_cost: finalCostRaw,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    const id = data.id;
    const year = new Date().getFullYear();
    const paddedId = String(id).padStart(6, "0");
    const estimateCode = `MJ-EST-${year}-${paddedId}`;

    const { error: updateError } = await supabase
      .from("estimates")
      .update({ estimate_code: estimateCode })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    const safeWeight = `${weightTon} ${weightType}`.trim();
    const safeDistance = `${distanceKm.toLocaleString("en-PK")} KM`;
    const safeTransitHours = `${Number(transitHours).toFixed(1)} hours`;
    const safeVehicle = matchedVehicle.vehicle_name || "Not available";
    const safeFinalCost = Math.round(finalCostRaw).toLocaleString("en-PK");

    const pdfBuffer = await createEstimatePdfBuffer({
      estimateCode,
      generatedAtText,
      fullName: safeName,
      phone: safePhone,
      email: customerEmail || "Not provided",
      pickup: safePickup,
      delivery: safeDelivery,
      materialsText,
      safeWeight,
      safeDistance,
      safeVehicle,
      safeTransitHours,
      safeFinalCost,
    });

    const customerDetailsTableHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0 0;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <tr>
          <td colspan="2" style="padding:14px 16px;background:#111827;font-size:13px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:0.3px;">
            Customer Details
          </td>
        </tr>
        ${[
          ["Customer Name", safeName],
          ["Phone Number", safePhone],
          ["Email Address", customerEmail || "Not provided"],
        ]
          .map(
            ([label, value], index, arr) => `
              <tr>
                <td style="padding:12px 14px;background:#f9fafb;border-bottom:${
                  index === arr.length - 1 ? "0" : "1px solid #e5e7eb"
                };font-size:13px;font-weight:700;color:#111827;width:40%;text-align:left;">
                  ${escapeHtml(label)}
                </td>
                <td style="padding:12px 14px;border-bottom:${
                  index === arr.length - 1 ? "0" : "1px solid #e5e7eb"
                };font-size:13px;color:#4b5563;text-align:center;">
                  ${escapeHtml(value)}
                </td>
              </tr>
            `
          )
          .join("")}
      </table>
    `;

    const detailsTableHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0 0;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <tr>
          <td colspan="2" style="padding:14px 16px;background:#111827;font-size:13px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:0.3px;">
            Estimate Details
          </td>
        </tr>
        ${[
        ["Pickup Location", safePickup],
        ["Delivery Location", safeDelivery],
        ["Material Type", materialsText],
        ["Total Weight", safeWeight],
        ["Distance", safeDistance],
        ["Vehicle Class", safeVehicle],
        ["Transit Time", safeTransitHours],
      ]
        .map(
          ([label, value], index, arr) => `
              <tr>
                <td style="padding:12px 14px;background:#f9fafb;border-bottom:${index === arr.length - 1 ? "0" : "1px solid #e5e7eb"
            };font-size:13px;font-weight:700;color:#111827;width:40%;text-align:left;">
                  ${escapeHtml(label)}
                </td>
                <td style="padding:12px 14px;border-bottom:${index === arr.length - 1 ? "0" : "1px solid #e5e7eb"
            };font-size:13px;color:#4b5563;text-align:center;">
                  ${escapeHtml(value)}
                </td>
              </tr>
            `
        )
        .join("")}
      </table>
    `;

    const customerEmailHtml = `
      <div style="margin:0;padding:0;background-color:#f4f6f8;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
                <tr>
                  <td align="center" style="background:#ffffff;padding:28px 24px;border-bottom:1px solid #eee;">
                    <img
                      src="https://mjlogisticservices.com/logo-6.png"
                      alt="MJ Logistics Services"
                      style="display:block;max-width:190px;width:100%;height:auto;margin:0 auto 14px auto;"
                    />
                    <div style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#111827;">
                      Instant Estimate
                    </div>
                    <div style="font-family:Arial,sans-serif;font-size:14px;color:#6b7280;margin-top:6px;">
                      Your estimate has been generated successfully
                    </div>
                    <div style="height:3px;background:#d6170d;width:80px;margin:14px auto 0 auto;border-radius:10px;"></div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:34px 32px 18px 32px;font-family:Arial,sans-serif;">
                    <div style="font-size:16px;color:#374151;margin-bottom:10px;text-align:left;">
                      Hello ${escapeHtml(safeName)},
                    </div>

                    <div style="font-size:15px;color:#4b5563;margin-bottom:24px;line-height:26px;text-align:left;">
                      Thank you for choosing <strong>MJ Logistics Services</strong>.
                      Below is your instant estimate based on the shipment details you provided.
                    </div>

                    <div style="text-align:center;margin:0 0 22px 0;">
                      <div style="display:inline-block;background:#fff5f5;border:1px solid #fecaca;border-radius:16px;padding:18px 24px;min-width:260px;">
                        <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#991b1b;font-weight:700;margin-bottom:8px;">
                          Estimated Cost
                        </div>
                        <div style="font-size:34px;font-weight:800;color:#d6170d;line-height:1.2;">
                          PKR ${escapeHtml(safeFinalCost)}
                        </div>
                      </div>
                    </div>

                    ${customerDetailsTableHtml}
                    ${detailsTableHtml}

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0 0;background:#fffaf0;border:1px solid #fcd34d;border-radius:14px;">
                      <tr>
                        <td style="padding:16px;">
                          <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px;text-align:left;">
                            Important Note
                          </div>
                          <div style="font-size:13px;color:#6b7280;line-height:22px;text-align:left;">
                            Prices are indicative and subject to route inspection, fuel fluctuation, and operational constraints.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 30px 32px;">
                    <div style="height:1px;background:#e5e7eb;"></div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 32px 32px;font-family:Arial,sans-serif;text-align:center;">
                    <div style="font-size:12px;color:#9ca3af;line-height:20px;">
                      A professional PDF estimate is attached with this email.
                    </div>
                    <div style="font-size:12px;color:#9ca3af;margin-top:8px;line-height:20px;">
                      © ${new Date().getFullYear()} MJ Logistics Services. All rights reserved.
                    </div>
                    <div style="font-size:12px;color:#9ca3af;margin-top:4px;line-height:20px;">
                      no-reply@mjlogisticservices.com
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    const companyEmailHtml = `
      <div style="margin:0;padding:0;background-color:#f4f6f8;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
                <tr>
                  <td align="center" style="background:#ffffff;padding:28px 24px;border-bottom:1px solid #eee;">
                    <img
                      src="https://mjlogisticservices.com/logo-6.png"
                      alt="MJ Logistics Services"
                      style="display:block;max-width:190px;width:100%;height:auto;margin:0 auto 14px auto;"
                    />
                    <div style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#111827;">
                      New Estimate Received
                    </div>
                    <div style="font-family:Arial,sans-serif;font-size:14px;color:#6b7280;margin-top:6px;">
                      A new instant estimate has been generated on the website
                    </div>
                    <div style="height:3px;background:#d6170d;width:80px;margin:14px auto 0 auto;border-radius:10px;"></div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:34px 32px 18px 32px;font-family:Arial,sans-serif;">
                    <div style="text-align:center;margin:0 0 22px 0;">
                      <div style="display:inline-block;background:#fff5f5;border:1px solid #fecaca;border-radius:16px;padding:18px 24px;min-width:260px;">
                        <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#991b1b;font-weight:700;margin-bottom:8px;">
                          Estimated Cost
                        </div>
                        <div style="font-size:34px;font-weight:800;color:#d6170d;line-height:1.2;">
                          PKR ${escapeHtml(safeFinalCost)}
                        </div>
                      </div>
                    </div>

                    ${detailsTableHtml}

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0 0;background:#fffaf0;border:1px solid #fcd34d;border-radius:14px;">
                      <tr>
                        <td style="padding:16px;">
                          <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px;text-align:left;">
                            Estimate Reference
                          </div>
                          <div style="font-size:13px;color:#6b7280;line-height:22px;text-align:left;">
                            Estimate ID: ${escapeHtml(estimateCode)}<br />
                            Generated On: ${escapeHtml(generatedAtText)}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 30px 32px;">
                    <div style="height:1px;background:#e5e7eb;"></div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 32px 32px;font-family:Arial,sans-serif;text-align:center;">
                    <div style="font-size:12px;color:#9ca3af;line-height:20px;">
                      A professional PDF estimate is attached with this email.
                    </div>
                    <div style="font-size:12px;color:#9ca3af;margin-top:8px;line-height:20px;">
                      © ${new Date().getFullYear()} MJ Logistics Services. All rights reserved.
                    </div>
                    <div style="font-size:12px;color:#9ca3af;margin-top:4px;line-height:20px;">
                      no-reply@mjlogisticservices.com
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    const attachments = [
      {
        filename: `${estimateCode}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ];

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "MJ Logistic Services <no-reply@mjlogisticservices.com>";

    const emailJobs = [
      resend.emails.send({
        from: fromEmail,
        to: ["estimates@mjlogisticservices.com"],
        subject: `[NEW ESTIMATE] ${estimateCode}`,
        html: companyEmailHtml,
        attachments,
      }),
    ];

    if (customerEmail) {
      emailJobs.push(
        resend.emails.send({
          from: fromEmail,
          to: [customerEmail],
          subject: `Your Estimate - ${estimateCode}`,
          html: customerEmailHtml,
          attachments,
        })
      );
    }

    const emailResults = await Promise.all(emailJobs);

    for (const result of emailResults) {
      if (result?.error) {
        throw new Error(result.error.message || "Failed to send email");
      }
    }

    return NextResponse.json({
      success: true,
      estimateId: estimateCode,
      generatedAt: generatedAtText,
      estimateData: {
        fullName: safeName,
        phone: safePhone,
        email: customerEmail || "Not provided",
        pickup: safePickup,
        delivery: safeDelivery,
        materialsText,
        weight: safeWeight,
        distance: safeDistance,
        vehicleName: safeVehicle,
        transitTime: safeTransitHours,
        finalCost: safeFinalCost,
      },
    });
  } catch (err) {
    console.error("Save estimate API error:", err);

    return NextResponse.json(
      {
        error: err.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}