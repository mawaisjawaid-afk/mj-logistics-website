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

const DEFAULT_ESTIMATE_TEAM_EMAIL = "estimates@mjlogisticservices.com";
const DEFAULT_OPERATIONS_TEAM_EMAIL =
  process.env.OPERATIONS_TEAM_EMAIL || "mohsinafridi117@gmail.com";

const BRAND = {
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
  greenBg: rgb(0.93, 0.98, 0.94),
  greenBorder: rgb(0.67, 0.86, 0.71),
  greenText: rgb(0.06, 0.37, 0.12),
};

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
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

const safeText = (value, fallback = "Not provided") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return String(value);
};

function normalizePhone(value) {
  return String(value || "").trim();
}

function dedupeEmails(emails) {
  return [...new Set(emails.filter(Boolean).map((email) => email.trim().toLowerCase()))];
}

function wrapText(text, maxCharsPerLine = 42) {
  const safe = String(text ?? "");
  const words = safe.split(/\s+/);
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
  return lines.length ? lines : [safe];
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
  labelWidthRatio = 0.38,
}) {
  const labelWidth = width * labelWidthRatio;

  const labelLines = [label];
  const valueLines = wrapText(String(value ?? ""), 24);

  const lineCount = Math.max(labelLines.length, valueLines.length);
  const rowHeight = Math.max(24, 10 + lineCount * 12);

  page.drawLine({
    start: { x, y: y - rowHeight },
    end: { x: x + width, y: y - rowHeight },
    thickness: 1,
    color: BRAND.border,
  });

  let labelY = y - 10;
  labelLines.forEach((line) => {
    page.drawText(line, {
      x,
      y: labelY,
      size: 8.5,
      font: fonts.regular,
      color: BRAND.subtext,
    });
    labelY -= 12;
  });

  let valueY = y - 10;
  valueLines.forEach((line) => {
    page.drawText(line, {
      x: x + labelWidth + 8,
      y: valueY,
      size: 10,
      font: fonts.bold,
      color: BRAND.text,
    });
    valueY -= 12;
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
      priority_rank: Number(v.priority_rank || 1),
    }))
    .filter(
      (v) =>
        !Number.isNaN(v.min_capacity_ton) &&
        !Number.isNaN(v.max_capacity_ton) &&
        weightTon >= v.min_capacity_ton &&
        weightTon <= v.max_capacity_ton
    )
    .sort((a, b) => {
      if (a.max_capacity_ton !== b.max_capacity_ton) {
        return a.max_capacity_ton - b.max_capacity_ton;
      }
      return a.priority_rank - b.priority_rank;
    });

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

async function sendEstimateToOdoo({
  fullName,
  phone,
  email,
  pickupCity,
  deliveryCity,
  estimateCode,
  generatedAtIso,
  distanceKm,
  transitHours,
  weightTon,
  weightType,
  materialsText,
  vehicleName,
  finalCost,
  linkedBookingId,
  linkedBookingCode,
  pickupLabel,
  dropoffLabel,
  pickupOtherInfo,
  dropoffOtherInfo,
  material,
  materialSpecification,
  loadingDate,
  documentsAvailable,
  documentsDetails,
  notes,
  leadSource,
  hasManualOverride,
  manualPrice,
}) {
  const webhookUrl = process.env.ODOO_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("Missing ODOO_WEBHOOK_URL");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "internal_booking",
      mode: "update",
      fullName: fullName || "",
      phone: phone || "",
      email: email || "",
      pickupCity: pickupCity || "",
      deliveryCity: deliveryCity || "",
      estimateCode: estimateCode || "",
      generatedAt: generatedAtIso || "",
      distanceKm: typeof distanceKm === "number" ? distanceKm : 0,
      transitHours: typeof transitHours === "number" ? transitHours : 0,
      weightTon: typeof weightTon === "number" ? weightTon : 0,
      weightType: weightType || "",
      materialsText: materialsText || "",
      vehicleName: vehicleName || "",
      finalCost: typeof finalCost === "number" ? finalCost : 0,
      linkedBookingId: linkedBookingId || null,
      linkedBookingCode: linkedBookingCode || "",
      pickupLabel: pickupLabel || "",
      dropoffLabel: dropoffLabel || "",
      pickupOtherInfo: pickupOtherInfo || "",
      dropoffOtherInfo: dropoffOtherInfo || "",
      material: material || "",
      materialSpecification: materialSpecification || "",
      loadingDate: loadingDate || "",
      documentsAvailable: documentsAvailable || "",
      documentsDetails: documentsDetails || "",
      notes: notes || "",
      leadSource: leadSource || "",
      hasManualOverride: Boolean(hasManualOverride),
      manualPrice:
        manualPrice !== null && manualPrice !== undefined && manualPrice !== ""
          ? Number(manualPrice)
          : null,
    }),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Odoo webhook failed: ${response.status} ${text}`);
  }

  return text;
}

function buildSectionHtml(title, items) {
  const filteredItems = items.filter((item) => item?.value !== undefined && item?.value !== null);

  return `
    <div style="margin:18px 0 0 0;padding:16px 18px;border:1px solid #e5e7eb;border-radius:14px;background:#ffffff;">
      <div style="font-size:14px;font-weight:800;color:#111827;margin:0 0 10px 0;">
        ${escapeHtml(title)}
      </div>
      ${filteredItems
        .map(
          ({ label, value }) => `
            <div style="font-size:13px;line-height:21px;color:#374151;margin:2px 0;">
              <span style="font-weight:700;color:#111827;">${escapeHtml(label)}:</span>
              ${escapeHtml(safeText(value))}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function buildEmailSummaryHtml({
  estimateCode,
  linkedBookingCode,
  generatedAtText,
  safeFinalCost,
  fullName,
  phone,
  email,
  weight,
  materialsText,
  materialSpecification,
  routeText,
  distance,
  vehicle,
  transitTime,
  loadingDate,
  pickupCity,
  pickupLocation,
  pickupOtherInfo,
  dropoffCity,
  dropoffLocation,
  dropoffOtherInfo,
  documentsAvailable,
  documentsDetails,
  notes,
  includeCost = true,
  includeCustomer = true,
}) {
  const blocks = [];

  blocks.push(
    buildSectionHtml("Estimate Information", [
      { label: "Estimate ID", value: estimateCode },
      { label: "Linked Booking", value: linkedBookingCode },
      { label: "Updated On", value: generatedAtText },
    ])
  );

  if (includeCost) {
    blocks.push(
      buildSectionHtml("Estimated Cost", [{ label: "Amount", value: `PKR ${safeFinalCost}` }])
    );
  }

  if (includeCustomer) {
    blocks.push(
      buildSectionHtml("Customer Details", [
        { label: "Customer Name", value: fullName },
        { label: "Phone Number", value: phone },
        { label: "Email Address", value: email || "Not provided" },
      ])
    );
  }

  blocks.push(
    buildSectionHtml("Shipment Summary", [
      { label: "Total Weight", value: weight },
      { label: "Material Type", value: materialsText },
      { label: "Material Specification", value: safeText(materialSpecification) },
      { label: "Route", value: routeText },
      { label: "Distance", value: distance },
      { label: "Vehicle Class", value: vehicle },
      { label: "Transit Time", value: transitTime },
      { label: "Loading Date", value: safeText(loadingDate) },
    ])
  );

  blocks.push(
    buildSectionHtml("Location Details", [
      { label: "Pickup City", value: safeText(pickupCity) },
      { label: "Pickup Location", value: safeText(pickupLocation) },
      { label: "Pickup Other Info", value: safeText(pickupOtherInfo) },
      { label: "Drop-Off City", value: safeText(dropoffCity) },
      { label: "Drop-Off Location", value: safeText(dropoffLocation) },
      { label: "Drop-Off Other Info", value: safeText(dropoffOtherInfo) },
    ])
  );

  blocks.push(
    buildSectionHtml("Documents & Notes", [
      { label: "Documents Available", value: safeText(documentsAvailable) },
      { label: "Documents Details", value: safeText(documentsDetails) },
      { label: "Additional Notes", value: safeText(notes) },
    ])
  );

  return blocks.join("");
}

function buildInternalEmailHtml({
  title,
  subtitle,
  summaryHtml,
  reviewHtml = "",
  actionHtml = "",
  footerNote = "A PDF is attached with this email.",
}) {
  return `
    <div style="margin:0;padding:0;background-color:#f4f6f8;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
              <tr>
                <td align="center" style="background:#ffffff;padding:28px 24px;border-bottom:1px solid #eee;">
                  <img
                    src="https://mjlogisticservices.com/logo-6.png"
                    alt="MJ Logistic Services"
                    style="display:block;max-width:190px;width:100%;height:auto;margin:0 auto 14px auto;"
                  />
                  <div style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#111827;">
                    ${escapeHtml(title)}
                  </div>
                  <div style="font-family:Arial,sans-serif;font-size:14px;color:#6b7280;margin-top:6px;line-height:22px;">
                    ${escapeHtml(subtitle)}
                  </div>
                  <div style="height:3px;background:#d6170d;width:80px;margin:14px auto 0 auto;border-radius:10px;"></div>
                </td>
              </tr>

              <tr>
                <td style="padding:28px 28px 10px 28px;font-family:Arial,sans-serif;">
                  ${reviewHtml}
                  ${summaryHtml}
                  ${
                    actionHtml
                      ? `
                        <div style="margin:22px 0 0 0;padding:18px;border:1px solid #e5e7eb;border-radius:14px;background:#fafafa;text-align:center;">
                          ${actionHtml}
                        </div>
                      `
                      : ""
                  }
                </td>
              </tr>

              <tr>
                <td style="padding:18px 28px 30px 28px;">
                  <div style="height:1px;background:#e5e7eb;"></div>
                </td>
              </tr>

              <tr>
                <td style="padding:0 28px 32px 28px;font-family:Arial,sans-serif;text-align:center;">
                  <div style="font-size:12px;color:#9ca3af;line-height:20px;">
                    ${escapeHtml(footerNote)}
                  </div>
                  <div style="font-size:12px;color:#9ca3af;margin-top:8px;line-height:20px;">
                    © ${new Date().getFullYear()} MJ Logistic Services. All rights reserved.
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
}

function loadLogoPath() {
  return path.join(process.cwd(), "public", "logo-6.png");
}

function drawHeader({ page }) {
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: BRAND.pageBg,
  });

  page.drawRectangle({
    x: 0,
    y: height - 6,
    width,
    height: 6,
    color: BRAND.red,
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
    color: BRAND.cardBg,
    borderColor: BRAND.border,
    borderWidth: 1,
  });

  return { outerX, outerY, outerWidth, outerHeight };
}

async function embedLogo(pdfDoc) {
  const logoPath = loadLogoPath();
  const logoBytes = fs.readFileSync(logoPath);
  return pdfDoc.embedPng(logoBytes);
}

function drawTopMeta({
  page,
  title,
  estimateCode,
  generatedAtText,
  showCost,
  safeFinalCost,
  footerText,
  fonts,
  logoImage,
}) {
  const { width, height } = page.getSize();

  const logoWidth = 132;
  const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

  const logoY = height - 92;
  const titleY = height - 122;
  const metaY = height - 156;

  page.drawImage(logoImage, {
    x: width / 2 - logoWidth / 2,
    y: logoY,
    width: logoWidth,
    height: logoHeight,
  });

  drawCenteredText(page, title, width / 2, titleY, {
    font: fonts.bold,
    size: 19,
    color: BRAND.text,
  });

  drawCenteredText(page, `ESTIMATE ID: ${estimateCode}`, width / 2 - 105, metaY, {
    font: fonts.bold,
    size: 8,
    color: BRAND.subtext,
  });

  drawCenteredText(page, `GENERATED: ${generatedAtText}`, width / 2 + 110, metaY, {
    font: fonts.bold,
    size: 8,
    color: BRAND.subtext,
  });

  let y = metaY - 22;

  if (showCost) {
    page.drawRectangle({
      x: 32,
      y: y - 52,
      width: width - 64,
      height: 52,
      color: BRAND.redSoft,
      borderColor: BRAND.redBorder,
      borderWidth: 1,
    });

    drawCenteredText(page, "ESTIMATED COST", width / 2, y - 13, {
      font: fonts.bold,
      size: 8,
      color: BRAND.subtext,
    });

    drawCenteredText(page, `PKR ${safeFinalCost}`, width / 2, y - 31, {
      font: fonts.bold,
      size: 21,
      color: BRAND.red,
    });

    drawCenteredText(page, footerText, width / 2, y - 43, {
      font: fonts.regular,
      size: 7.8,
      color: BRAND.text,
    });

    y -= 62;
  } else {
    page.drawRectangle({
      x: 32,
      y: y - 38,
      width: width - 64,
      height: 38,
      color: BRAND.greenBg,
      borderColor: BRAND.greenBorder,
      borderWidth: 1,
    });

    drawCenteredText(page, footerText, width / 2, y - 22, {
      font: fonts.bold,
      size: 9.8,
      color: BRAND.greenText,
    });

    y -= 48;
  }

  return y;
}

function drawCustomerSection({
  page,
  y,
  fullName,
  phone,
  email,
  fonts,
}) {
  const { width } = page.getSize();

  page.drawRectangle({
    x: 32,
    y: y - 62,
    width: width - 64,
    height: 62,
    color: BRAND.mutedBg,
    borderColor: BRAND.border,
    borderWidth: 1,
  });

  drawLeftText(page, "Customer Details", 44, y - 14, {
    font: fonts.bold,
    size: 10.5,
    color: BRAND.text,
  });

  const customerCols = [
    { label: "NAME", value: fullName || "Guest User", x: 44, maxCharsPerLine: 18 },
    { label: "PHONE", value: phone || "Not provided", x: 220, maxCharsPerLine: 16 },
    { label: "EMAIL", value: email || "Not provided", x: 390, maxCharsPerLine: 22 },
  ];

  customerCols.forEach((item) => {
    drawLeftText(page, item.label, item.x, y - 31, {
      font: fonts.regular,
      size: 7.2,
      color: BRAND.subtext,
    });

    drawWrappedText(page, item.value, item.x, y - 44, {
      font: fonts.bold,
      size: 9.2,
      color: BRAND.text,
      maxCharsPerLine: item.maxCharsPerLine,
      lineHeight: 11,
    });
  });

  return y - 76;
}

function drawShipmentAndRecommendation({
  page,
  y,
  safeWeight,
  materialsText,
  materialSpecification,
  routeText,
  safeDistance,
  loadingDate,
  safeVehicle,
  safeTransitHours,
  fonts,
}) {
  const { width } = page.getSize();
  const leftCardX = 32;
  const rightCardX = width / 2 + 5;
  const cardWidth = width / 2 - 42;
  const cardHeight = 174;

  page.drawRectangle({
    x: leftCardX,
    y: y - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: BRAND.cardBg,
    borderColor: BRAND.border,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: rightCardX,
    y: y - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: BRAND.cardBg,
    borderColor: BRAND.border,
    borderWidth: 1,
  });

  drawLeftText(page, "Shipment Summary", leftCardX + 12, y - 14, {
    font: fonts.bold,
    size: 10.5,
    color: BRAND.text,
  });

  let leftY = y - 26;
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Total Weight",
    value: safeWeight,
    fonts,
    labelWidthRatio: 0.32,
  });
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Material Type",
    value: materialsText,
    fonts,
    labelWidthRatio: 0.32,
  });
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Material Specification",
    value: materialSpecification || "-",
    fonts,
    labelWidthRatio: 0.32,
  });
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Route",
    value: routeText,
    fonts,
    labelWidthRatio: 0.32,
  });
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Distance",
    value: safeDistance,
    fonts,
    labelWidthRatio: 0.32,
  });
  drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Loading Date",
    value: safeText(loadingDate),
    fonts,
    labelWidthRatio: 0.32,
  });

  drawLeftText(page, "Recommendation", rightCardX + 12, y - 14, {
    font: fonts.bold,
    size: 10.5,
    color: BRAND.text,
  });

  page.drawRectangle({
    x: rightCardX + 12,
    y: y - 46,
    width: cardWidth - 24,
    height: 24,
    color: BRAND.redSoft,
  });

  drawCenteredText(page, "Full Load", rightCardX + cardWidth / 2, y - 38, {
    font: fonts.bold,
    size: 11,
    color: BRAND.red,
  });

  let rightY = y - 58;
  rightY = drawInfoRow({
    page,
    x: rightCardX + 12,
    y: rightY,
    width: cardWidth - 24,
    label: "Vehicle Class",
    value: safeVehicle,
    fonts,
    labelWidthRatio: 0.32,
  });

  drawInfoRow({
    page,
    x: rightCardX + 12,
    y: rightY,
    width: cardWidth - 24,
    label: "Transit Time",
    value: safeTransitHours,
    fonts,
    labelWidthRatio: 0.32,
  });

  return y - cardHeight - 6;
}

function drawLocationSection({
  page,
  y,
  pickupCity,
  pickupLocation,
  pickupOtherInfo,
  dropoffCity,
  dropoffLocation,
  dropoffOtherInfo,
  fonts,
}) {
  const { width } = page.getSize();
  const leftCardX = 32;
  const rightCardX = width / 2 + 5;
  const cardWidth = width / 2 - 42;
  const cardHeight = 168;

  page.drawRectangle({
    x: leftCardX,
    y: y - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: BRAND.cardBg,
    borderColor: BRAND.border,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: rightCardX,
    y: y - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: BRAND.cardBg,
    borderColor: BRAND.border,
    borderWidth: 1,
  });

  drawLeftText(page, "Pickup Details", leftCardX + 12, y - 14, {
    font: fonts.bold,
    size: 10.5,
    color: BRAND.text,
  });

  let leftY = y - 26;
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Pickup City",
    value: safeText(pickupCity),
    fonts,
    labelWidthRatio: 0.32,
  });
  leftY = drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Pickup Location",
    value: safeText(pickupLocation),
    fonts,
    labelWidthRatio: 0.32,
  });
  drawInfoRow({
    page,
    x: leftCardX + 12,
    y: leftY,
    width: cardWidth - 24,
    label: "Pickup Other Info",
    value: safeText(pickupOtherInfo),
    fonts,
    labelWidthRatio: 0.32,
  });

  drawLeftText(page, "Drop-Off Details", rightCardX + 12, y - 14, {
    font: fonts.bold,
    size: 10.5,
    color: BRAND.text,
  });

  let rightY = y - 26;
  rightY = drawInfoRow({
    page,
    x: rightCardX + 12,
    y: rightY,
    width: cardWidth - 24,
    label: "Drop-Off City",
    value: safeText(dropoffCity),
    fonts,
    labelWidthRatio: 0.32,
  });
  rightY = drawInfoRow({
    page,
    x: rightCardX + 12,
    y: rightY,
    width: cardWidth - 24,
    label: "Drop-Off Location",
    value: safeText(dropoffLocation),
    fonts,
    labelWidthRatio: 0.32,
  });
  drawInfoRow({
    page,
    x: rightCardX + 12,
    y: rightY,
    width: cardWidth - 24,
    label: "Drop-Off Other Info",
    value: safeText(dropoffOtherInfo),
    fonts,
    labelWidthRatio: 0.32,
  });

  return y - cardHeight - 10;
}

function drawDocumentsSection({
  page,
  y,
  documentsAvailable,
  documentsDetails,
  notes,
  fonts,
}) {
  const { width } = page.getSize();
  const fullCardWidth = width - 64;

  page.drawRectangle({
    x: 32,
    y: y - 94,
    width: fullCardWidth,
    height: 94,
    color: BRAND.cardBg,
    borderColor: BRAND.border,
    borderWidth: 1,
  });

  drawLeftText(page, "Documents & Notes", 44, y - 14, {
    font: fonts.bold,
    size: 10.5,
    color: BRAND.text,
  });

  let docsY = y - 26;
  docsY = drawInfoRow({
    page,
    x: 44,
    y: docsY,
    width: fullCardWidth - 24,
    label: "Documents Available",
    value: safeText(documentsAvailable),
    fonts,
    labelWidthRatio: 0.32,
  });
  docsY = drawInfoRow({
    page,
    x: 44,
    y: docsY,
    width: fullCardWidth - 24,
    label: "Documents Details",
    value: safeText(documentsDetails),
    fonts,
    labelWidthRatio: 0.32,
  });
  drawInfoRow({
    page,
    x: 44,
    y: docsY,
    width: fullCardWidth - 24,
    label: "Additional Notes",
    value: safeText(notes),
    fonts,
    labelWidthRatio: 0.32,
  });

  return y - 106;
}

function drawFooter({ page, fonts }) {
  const { width } = page.getSize();
  const footerLineY = 96;

  page.drawLine({
    start: { x: 30, y: footerLineY },
    end: { x: width - 30, y: footerLineY },
    thickness: 1,
    color: BRAND.border,
  });

  drawCenteredText(
    page,
    "Opposite Kohinoor Textile Mill, Main Peshawar Road, Rawalpindi",
    width / 2,
    78,
    {
      font: fonts.regular,
      size: 7.5,
      color: BRAND.subtext,
    }
  );

  drawCenteredText(
    page,
    "+92 334 6466818 | info@mjlogisticservices.com",
    width / 2,
    64,
    {
      font: fonts.regular,
      size: 7.5,
      color: BRAND.subtext,
    }
  );

  drawCenteredText(
    page,
    `© ${new Date().getFullYear()} MJ Logistic Services. All rights reserved.`,
    width / 2,
    50,
    {
      font: fonts.regular,
      size: 7,
      color: rgb(0.58, 0.61, 0.67),
    }
  );
}

async function createInternalEstimatePdfBuffer({
  estimateCode,
  generatedAtText,
  fullName,
  phone,
  email,
  pickupCity,
  deliveryCity,
  pickupLabel,
  dropoffLabel,
  pickupOtherInfo,
  dropoffOtherInfo,
  materialsText,
  materialSpecification,
  safeWeight,
  routeText,
  safeDistance,
  safeVehicle,
  safeTransitHours,
  safeFinalCost,
  loadingDate,
  documentsAvailable,
  documentsDetails,
  notes,
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 1000]);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fonts = {
    regular: fontRegular,
    bold: fontBold,
  };

  drawHeader({ page });

  const logoImage = await embedLogo(pdfDoc);

  let y = drawTopMeta({
    page,
    title: "Instant Estimate",
    estimateCode,
    generatedAtText,
    showCost: true,
    safeFinalCost,
    footerText: "Based on saved route and shipment requirements",
    fonts,
    logoImage,
  });

  y = drawCustomerSection({
    page,
    y,
    fullName,
    phone,
    email,
    fonts,
  });

  y = drawShipmentAndRecommendation({
    page,
    y,
    safeWeight,
    materialsText,
    materialSpecification,
    routeText,
    safeDistance,
    loadingDate,
    safeVehicle,
    safeTransitHours,
    fonts,
  });

  y = drawLocationSection({
    page,
    y,
    pickupCity,
    pickupLocation: pickupLabel,
    pickupOtherInfo,
    dropoffCity: deliveryCity,
    dropoffLocation: dropoffLabel,
    dropoffOtherInfo,
    fonts,
  });

  y = drawDocumentsSection({
    page,
    y,
    documentsAvailable,
    documentsDetails,
    notes,
    fonts,
  });

  drawFooter({ page, fonts });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function createVendorRfqPdfBuffer({
  estimateCode,
  generatedAtText,
  pickupCity,
  deliveryCity,
  pickupLabel,
  dropoffLabel,
  pickupOtherInfo,
  dropoffOtherInfo,
  materialsText,
  materialSpecification,
  safeWeight,
  routeText,
  safeDistance,
  safeVehicle,
  safeTransitHours,
  loadingDate,
  documentsAvailable,
  documentsDetails,
  notes,
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 1000]);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fonts = {
    regular: fontRegular,
    bold: fontBold,
  };

  drawHeader({ page });

  const logoImage = await embedLogo(pdfDoc);

  let y = drawTopMeta({
    page,
    title: "Vendor Requirement",
    estimateCode,
    generatedAtText,
    showCost: false,
    safeFinalCost: "",
    footerText: "Please share your quotation for this transport requirement.",
    fonts,
    logoImage,
  });

  y = drawShipmentAndRecommendation({
    page,
    y,
    safeWeight,
    materialsText,
    materialSpecification,
    routeText,
    safeDistance,
    loadingDate,
    safeVehicle,
    safeTransitHours,
    fonts,
  });

  y = drawLocationSection({
    page,
    y,
    pickupCity,
    pickupLocation: pickupLabel,
    pickupOtherInfo,
    dropoffCity: deliveryCity,
    dropoffLocation: dropoffLabel,
    dropoffOtherInfo,
    fonts,
  });

  y = drawDocumentsSection({
    page,
    y,
    documentsAvailable,
    documentsDetails,
    notes,
    fonts,
  });

  drawFooter({ page, fonts });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function validatePayload(body) {
  if (!body.linkedEstimateCode?.trim()) return "Linked estimate code is required";
  if (!body.linkedBookingId) return "Linked booking ID is required";
  if (!body.linkedBookingCode?.trim()) return "Linked booking code is required";
  if (!body.fullName?.trim()) return "Customer name is required";

  if (!String(body.phone || body.contactNumber || "").trim()) {
    return "Contact number is required";
  }

  if (!body.pickupLabel?.trim()) return "Pickup location is required";
  if (!body.dropoffLabel?.trim()) return "Drop-off location is required";

  const weightValue =
    body.weight !== undefined && body.weight !== null && body.weight !== ""
      ? Number(body.weight)
      : Number(body.weightValue);

  if (!weightValue || Number.isNaN(weightValue) || weightValue <= 0) {
    return "Valid weight is required";
  }

  const hasManualOverride = Boolean(body.hasManualOverride);
  const manualPrice =
    body.manualPrice !== null &&
    body.manualPrice !== undefined &&
    body.manualPrice !== ""
      ? Number(body.manualPrice)
      : null;

  if (hasManualOverride) {
    if (!body.suggestedVehicle?.trim()) {
      return "Suggested vehicle is required when manual override is active";
    }

    if (
      manualPrice === null ||
      Number.isNaN(manualPrice) ||
      manualPrice < 0
    ) {
      return "Valid manual price is required when manual override is active";
    }
  }

  const finalPickupLat = body.pickupLat ?? null;
  const finalPickupLon = body.pickupLon ?? null;
  const finalDeliveryLat = body.deliveryLat ?? body.dropoffLat ?? null;
  const finalDeliveryLon = body.deliveryLon ?? body.dropoffLon ?? null;

  if (
    finalPickupLat === null ||
    finalPickupLat === undefined ||
    finalPickupLat === "" ||
    finalPickupLon === null ||
    finalPickupLon === undefined ||
    finalPickupLon === "" ||
    finalDeliveryLat === null ||
    finalDeliveryLat === undefined ||
    finalDeliveryLat === "" ||
    finalDeliveryLon === null ||
    finalDeliveryLon === undefined ||
    finalDeliveryLon === ""
  ) {
    return "Pickup and drop-off latitude/longitude are required";
  }

  return null;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const validationError = validatePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const linkedEstimateCode = body.linkedEstimateCode.trim();
    const linkedBookingId = Number(body.linkedBookingId);
    const linkedBookingCode = body.linkedBookingCode.trim();

    const internalNotificationEmail =
      body.internalNotificationEmail?.trim() || DEFAULT_ESTIMATE_TEAM_EMAIL;

    const operationsTeamEmail =
      body.operationsTeamEmail?.trim() || DEFAULT_OPERATIONS_TEAM_EMAIL;

    const customerEmail = body.email?.trim() || "";
    const safeName = body.fullName?.trim() || "Customer";
    const safePhone = normalizePhone(body.phone || body.contactNumber || "Not provided");

    const pickupLabel = body.pickupLabel?.trim() || "";
    const dropoffLabel = body.dropoffLabel?.trim() || "";

    const pickup = body.pickup?.trim() || pickupLabel;
    const delivery = body.delivery?.trim() || dropoffLabel;

    const pickupCity = body.pickupCity?.trim() || "";
    const deliveryCity =
      body.deliveryCity?.trim() || body.dropoffCity?.trim() || "";

    const pickupOtherInfo = body.pickupOtherInfo?.trim() || null;
    const dropoffOtherInfo = body.dropoffOtherInfo?.trim() || null;

    const material = body.material?.trim() || null;
    const materialSpecification = body.materialSpecification?.trim() || null;

    const weightTon =
      body.weight !== null && body.weight !== undefined && body.weight !== ""
        ? Number(body.weight)
        : Number(body.weightValue);

    const weightType = body.weightType || body.weightUnit || "ton";

    const materials = Array.isArray(body.materials)
      ? body.materials
      : material
      ? [material]
      : [];

    const materialsText = materials.length ? materials.join(", ") : "N/A";

    const pickupLat = Number(body.pickupLat);
    const pickupLon = Number(body.pickupLon);
    const deliveryLat = Number(body.deliveryLat ?? body.dropoffLat);
    const deliveryLon = Number(body.deliveryLon ?? body.dropoffLon);

    const suggestedVehicle = body.suggestedVehicle?.trim() || null;
    const loadingDate = body.loadingDate || null;
    const documentsAvailable = body.documentsAvailable?.trim() || null;
    const documentsDetails = body.documentsDetails?.trim() || null;
    const notes = body.notes?.trim() || null;
    const leadSource = body.leadSource?.trim() || "whatsapp";

    const hasManualOverride = Boolean(body.hasManualOverride);
    const manualPrice =
      body.manualPrice !== null &&
      body.manualPrice !== undefined &&
      body.manualPrice !== ""
        ? Number(body.manualPrice)
        : null;

    const now = new Date();
    const generatedAtText = formatDateTime(now);
    const generatedAtIso = now.toISOString();

    const { data: existingEstimate, error: existingEstimateError } = await supabase
      .from("estimates")
      .select("id, estimate_code, estimate_version")
      .eq("estimate_code", linkedEstimateCode)
      .single();

    if (existingEstimateError || !existingEstimate) {
      throw new Error("Existing estimate not found");
    }

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
          "vehicle_name,min_capacity_ton,max_capacity_ton,rate_per_km,minimum_charge,loaded_avg_speed_kmph,loading_hours,unloading_hours,priority_rank"
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

    let matchedVehicle = null;
    let finalVehicleName = null;
    let finalCostRaw = 0;
    let transitHours = routeTimeHours;

    if (hasManualOverride) {
      finalVehicleName = suggestedVehicle;
      finalCostRaw = Number(manualPrice || 0);

      if (routeTimeHours !== null && routeTimeHours !== undefined) {
        transitHours = Number(routeTimeHours.toFixed(1));
      }
    } else {
      matchedVehicle = selectVehicle(vehicles || [], weightTon);

      if (!matchedVehicle) {
        throw new Error("No suitable vehicle found for this weight.");
      }

      const baseCost = distanceKm * Number(matchedVehicle.rate_per_km || 0);
      const minCharge = Number(matchedVehicle.minimum_charge || 0);
      finalCostRaw = Math.max(baseCost, minCharge);

      const speed = Number(matchedVehicle.loaded_avg_speed_kmph || 0);
      const loadingHours = Number(matchedVehicle.loading_hours || 0);
      const unloadingHours = Number(matchedVehicle.unloading_hours || 0);

      transitHours =
        speed > 0
          ? Number((distanceKm / speed + loadingHours + unloadingHours).toFixed(1))
          : routeTimeHours;

      finalVehicleName = matchedVehicle.vehicle_name || suggestedVehicle || null;
    }

    const updatePayload = {
      full_name: safeName,
      phone: safePhone,
      email: customerEmail || null,

      pickup: pickup || null,
      delivery: delivery || null,
      pickup_city: pickupCity || null,
      delivery_city: deliveryCity || null,

      pickup_label: pickupLabel || null,
      dropoff_label: dropoffLabel || null,

      pickup_lat: pickupLat,
      pickup_lon: pickupLon,
      delivery_lat: deliveryLat,
      delivery_lon: deliveryLon,

      pickup_other_info: pickupOtherInfo,
      dropoff_other_info: dropoffOtherInfo,

      material: material,
      material_specification: materialSpecification,

      weight_value: weightTon,
      weight_type: weightType,
      materials: materials,

      suggested_vehicle: suggestedVehicle,
      loading_date: loadingDate,

      documents_available: documentsAvailable,
      documents_details: documentsDetails,
      notes: notes,

      lead_source: leadSource,

      distance_km: distanceKm,
      transit_hours: transitHours,
      vehicle_name: finalVehicleName,
      final_cost: finalCostRaw,

      odoo_status: "pending",
      internal_email_sent: false,
      updated_at: new Date().toISOString(),
    };

    const { error: updateEstimateError } = await supabase
      .from("estimates")
      .update(updatePayload)
      .eq("id", existingEstimate.id);

    if (updateEstimateError) {
      throw updateEstimateError;
    }

    const { error: updateBookingError } = await supabase
      .from("internal_bookings")
      .update({
        linked_estimate_code: linkedEstimateCode,
        latest_estimate_id: existingEstimate.id,
        latest_estimate_code: linkedEstimateCode,
        is_estimate_generated: true,
        booking_status: "Estimate Generated",
      })
      .eq("id", linkedBookingId);

    if (updateBookingError) {
      throw updateBookingError;
    }

    let odooSyncStatus = "pending";

    try {
      await sendEstimateToOdoo({
        fullName: safeName,
        phone: safePhone,
        email: customerEmail || "",
        pickupCity: pickupCity || "",
        deliveryCity: deliveryCity || "",
        estimateCode: linkedEstimateCode,
        generatedAtIso,
        distanceKm,
        transitHours,
        weightTon,
        weightType,
        materialsText,
        vehicleName: finalVehicleName || "",
        finalCost: finalCostRaw,
        linkedBookingId,
        linkedBookingCode,
        pickupLabel,
        dropoffLabel,
        pickupOtherInfo,
        dropoffOtherInfo,
        material,
        materialSpecification,
        loadingDate,
        documentsAvailable,
        documentsDetails,
        notes,
        leadSource,
        hasManualOverride,
        manualPrice,
      });

      odooSyncStatus = "sent";
    } catch (odooError) {
      console.error("Odoo update webhook failed:", odooError);
      odooSyncStatus = "failed";
    }

    const safePickup = pickupCity || pickupLabel || pickup;
    const safeDelivery = deliveryCity || dropoffLabel || delivery;
    const routeText = `${safePickup} to ${safeDelivery}`;

    const safeWeight = `${weightTon} ${weightType}`.trim();
    const safeDistance = `${distanceKm.toLocaleString("en-PK")} KM`;
    const safeTransitHours = `${Number(transitHours).toFixed(1)} hours`;
    const safeVehicle = finalVehicleName || "Not available";
    const safeFinalCost = Math.round(finalCostRaw).toLocaleString("en-PK");

    const internalPdfBuffer = await createInternalEstimatePdfBuffer({
      estimateCode: linkedEstimateCode,
      generatedAtText,
      fullName: safeName,
      phone: safePhone,
      email: customerEmail || "Not provided",
      pickupCity: pickupCity || "Not provided",
      deliveryCity: deliveryCity || "Not provided",
      pickupLabel: pickupLabel || safePickup,
      dropoffLabel: dropoffLabel || safeDelivery,
      pickupOtherInfo,
      dropoffOtherInfo,
      materialsText,
      materialSpecification,
      safeWeight,
      routeText,
      safeDistance,
      safeVehicle,
      safeTransitHours,
      safeFinalCost,
      loadingDate,
      documentsAvailable,
      documentsDetails,
      notes,
    });

    const vendorRfqPdfBuffer = await createVendorRfqPdfBuffer({
      estimateCode: linkedEstimateCode,
      generatedAtText,
      pickupCity: pickupCity || "Not provided",
      deliveryCity: deliveryCity || "Not provided",
      pickupLabel: pickupLabel || safePickup,
      dropoffLabel: dropoffLabel || safeDelivery,
      pickupOtherInfo,
      dropoffOtherInfo,
      materialsText,
      materialSpecification,
      safeWeight,
      routeText,
      safeDistance,
      safeVehicle,
      safeTransitHours,
      loadingDate,
      documentsAvailable,
      documentsDetails,
      notes,
    });

    const commonSummaryHtml = buildEmailSummaryHtml({
      estimateCode: linkedEstimateCode,
      linkedBookingCode,
      generatedAtText,
      safeFinalCost,
      fullName: safeName,
      phone: safePhone,
      email: customerEmail,
      weight: safeWeight,
      materialsText,
      materialSpecification,
      routeText,
      distance: safeDistance,
      vehicle: safeVehicle,
      transitTime: safeTransitHours,
      loadingDate,
      pickupCity,
      pickupLocation: pickupLabel || safePickup,
      pickupOtherInfo,
      dropoffCity: deliveryCity,
      dropoffLocation: dropoffLabel || safeDelivery,
      dropoffOtherInfo,
      documentsAvailable,
      documentsDetails,
      notes,
      includeCost: true,
      includeCustomer: true,
    });

    const operationsSummaryHtml = buildEmailSummaryHtml({
      estimateCode: linkedEstimateCode,
      linkedBookingCode,
      generatedAtText,
      safeFinalCost,
      fullName: safeName,
      phone: safePhone,
      email: customerEmail,
      weight: safeWeight,
      materialsText,
      materialSpecification,
      routeText,
      distance: safeDistance,
      vehicle: safeVehicle,
      transitTime: safeTransitHours,
      loadingDate,
      pickupCity,
      pickupLocation: pickupLabel || safePickup,
      pickupOtherInfo,
      dropoffCity: deliveryCity,
      dropoffLocation: dropoffLabel || safeDelivery,
      dropoffOtherInfo,
      documentsAvailable,
      documentsDetails,
      notes,
      includeCost: true,
      includeCustomer: true,
    });

    const estimatesTeamEmailHtml = buildInternalEmailHtml({
      title: "Internal Estimate Updated",
      subtitle:
        "An existing internal estimate has been updated. Please review the revised estimate attached with this email.",
      summaryHtml: commonSummaryHtml,
      footerNote:
        "Updated internal estimate PDF and vendor requirement PDF are attached with this email.",
    });

    const operationsReviewHtml = `
      <div style="margin:0 0 18px 0;padding:16px;border:1px solid #fdba74;border-radius:14px;background:#fff7ed;">
        <div style="font-size:14px;font-weight:700;color:#9a3412;margin-bottom:6px;">
          Revised Estimate Review Required
        </div>
        <div style="font-size:13px;color:#7c2d12;line-height:22px;">
          This estimate has been updated. Kindly review the revised estimate attached with this email, including vehicle recommendation, route assumptions, loading date, documents, and commercial feasibility.
          If everything is in order, please confirm approval by replying to this email thread.
          If further changes are required, please reply to this same email thread with the required revisions.
        </div>
      </div>
    `;

    const operationsActionHtml = `
      <div style="font-size:13px;color:#374151;line-height:22px;text-align:left;">
        <strong>Approval / Revision Process:</strong><br />
        • Kindly review the updated estimate attached with this email.<br />
        • If approved, reply to this email and confirm that the revised estimate may be shared.<br />
        • If further changes are required, reply to this same email thread with the required revisions.
      </div>
    `;

    const operationsEmailHtml = buildInternalEmailHtml({
      title: "Updated Estimate Review Required",
      subtitle:
        "This estimate has been updated. Kindly review the revised attachment and confirm approval or share any further required changes.",
      summaryHtml: operationsSummaryHtml,
      reviewHtml: operationsReviewHtml,
      actionHtml: operationsActionHtml,
      footerNote:
        "Updated internal estimate PDF and vendor requirement PDF are attached with this email.",
    });

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      "MJ Logistic Services <no-reply@mjlogisticservices.com>";

    const estimateRecipients = dedupeEmails([
      DEFAULT_ESTIMATE_TEAM_EMAIL,
      internalNotificationEmail,
    ]);

    const operationsRecipients = dedupeEmails([operationsTeamEmail]);

    const estimateAttachments = [
      {
        filename: `${linkedEstimateCode}.pdf`,
        content: internalPdfBuffer.toString("base64"),
      },
      {
        filename: `${linkedEstimateCode}-vendor-requirement.pdf`,
        content: vendorRfqPdfBuffer.toString("base64"),
      },
    ];

    const operationsAttachments = [
      {
        filename: `${linkedEstimateCode}.pdf`,
        content: internalPdfBuffer.toString("base64"),
      },
      {
        filename: `${linkedEstimateCode}-vendor-requirement.pdf`,
        content: vendorRfqPdfBuffer.toString("base64"),
      },
    ];

    const emailJobs = [];

    if (estimateRecipients.length > 0) {
      emailJobs.push(
        resend.emails.send({
          from: fromEmail,
          to: estimateRecipients,
          subject: `[UPDATED INTERNAL ESTIMATE] ${linkedEstimateCode}`,
          html: estimatesTeamEmailHtml,
          attachments: estimateAttachments,
        })
      );
    }

    if (operationsRecipients.length > 0) {
      emailJobs.push(
        resend.emails.send({
          from: fromEmail,
          to: operationsRecipients,
          subject: `[UPDATED ESTIMATE REVIEW REQUIRED] ${linkedEstimateCode}`,
          html: operationsEmailHtml,
          attachments: operationsAttachments,
        })
      );
    }

    const emailResults = emailJobs.length ? await Promise.all(emailJobs) : [];

    for (const result of emailResults) {
      if (result?.error) {
        throw new Error(result.error.message || "Failed to send email");
      }
    }

    const { error: finalEstimateFlagsError } = await supabase
      .from("estimates")
      .update({
        odoo_status: odooSyncStatus,
        internal_email_sent: true,
      })
      .eq("id", existingEstimate.id);

    if (finalEstimateFlagsError) {
      throw finalEstimateFlagsError;
    }

    return NextResponse.json({
      success: true,
      estimateId: linkedEstimateCode,
      generatedAt: generatedAtText,
      estimate: {
        id: existingEstimate.id,
        estimateCode: linkedEstimateCode,
        source: "internal_booking",
        linkedBookingId,
        linkedBookingCode,
        estimateVersion: existingEstimate.estimate_version,
        fullName: safeName,
        phone: safePhone,
        email: customerEmail || "",
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
    console.error("update-internal-estimate API error:", err);

    return NextResponse.json(
      {
        error: err.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}