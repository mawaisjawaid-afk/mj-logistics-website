import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

const safeText = (value, fallback = "Not provided") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return String(value);
};

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
      width: page.getSize().width - 64,
      height: 52,
      color: BRAND.redSoft,
      borderColor: BRAND.redBorder,
      borderWidth: 1,
    });

    drawCenteredText(page, "ESTIMATED COST", page.getSize().width / 2, y - 13, {
      font: fonts.bold,
      size: 8,
      color: BRAND.subtext,
    });

    drawCenteredText(page, `PKR ${safeFinalCost}`, page.getSize().width / 2, y - 31, {
      font: fonts.bold,
      size: 21,
      color: BRAND.red,
    });

    drawCenteredText(page, footerText, page.getSize().width / 2, y - 43, {
      font: fonts.regular,
      size: 7.8,
      color: BRAND.text,
    });

    y -= 62;
  } else {
    page.drawRectangle({
      x: 32,
      y: y - 38,
      width: page.getSize().width - 64,
      height: 38,
      color: BRAND.greenBg,
      borderColor: BRAND.greenBorder,
      borderWidth: 1,
    });

    drawCenteredText(page, footerText, page.getSize().width / 2, y - 22, {
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

async function getEstimateRecord({ estimateRecordId, estimateCode, searchId }) {
  if (estimateRecordId) {
    const { data, error } = await supabase
      .from("estimates")
      .select("*")
      .eq("id", Number(estimateRecordId))
      .single();

    if (error) throw error;
    return data;
  }

  const lookupValue = String(estimateCode || searchId || "").trim();

  if (!lookupValue) {
    throw new Error("Estimate ID is required");
  }

  let { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("estimate_code", lookupValue)
    .order("id", { ascending: false })
    .limit(1);

  if (error) throw error;
  if (data && data.length > 0) return data[0];

  ({ data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("linked_booking_code", lookupValue)
    .order("id", { ascending: false })
    .limit(1));

  if (error) throw error;
  if (data && data.length > 0) return data[0];

  throw new Error("Estimate not found");
}

export async function POST(req) {
  try {
    const body = await req.json();

    const estimate = await getEstimateRecord({
      estimateRecordId: body.estimateRecordId,
      estimateCode: body.estimateCode,
      searchId: body.searchId,
    });

    const estimateCode = estimate.estimate_code || `estimate-${estimate.id}`;
    const generatedAtText = formatDateTime(
      estimate.created_at || estimate.updated_at || new Date().toISOString()
    );

    const pickupCity = estimate.pickup_city || "";
    const deliveryCity = estimate.delivery_city || "";

    const pickupLabel = estimate.pickup_label || estimate.pickup || pickupCity || "Pickup";
    const dropoffLabel =
      estimate.dropoff_label || estimate.delivery || deliveryCity || "Delivery";

    const safePickup = pickupCity || pickupLabel || estimate.pickup || "Pickup";
    const safeDelivery =
      deliveryCity || dropoffLabel || estimate.delivery || "Delivery";

    const routeText = `${safePickup} to ${safeDelivery}`;

    const materialsText = Array.isArray(estimate.materials) && estimate.materials.length > 0
      ? estimate.materials.join(", ")
      : estimate.material || "N/A";

    const weightValue =
      estimate.weight_value !== null &&
      estimate.weight_value !== undefined &&
      estimate.weight_value !== ""
        ? estimate.weight_value
        : "";

    const weightType = estimate.weight_type || "ton";
    const safeWeight = `${weightValue} ${weightType}`.trim() || "N/A";

    const safeDistance =
      estimate.distance_km !== null && estimate.distance_km !== undefined
        ? `${Number(estimate.distance_km).toLocaleString("en-PK")} KM`
        : "Not available";

    const safeTransitHours =
      estimate.transit_hours !== null && estimate.transit_hours !== undefined
        ? `${Number(estimate.transit_hours).toFixed(1)} hours`
        : "Not available";

    const safeVehicle =
      estimate.vehicle_name || estimate.suggested_vehicle || "Not available";

    const safeFinalCost =
      estimate.final_cost !== null && estimate.final_cost !== undefined
        ? Math.round(Number(estimate.final_cost)).toLocaleString("en-PK")
        : "0";

    const pdfBuffer = await createInternalEstimatePdfBuffer({
      estimateCode,
      generatedAtText,
      fullName: estimate.full_name || "Customer",
      phone: estimate.phone || "Not provided",
      email: estimate.email || "Not provided",
      pickupCity: pickupCity || "Not provided",
      deliveryCity: deliveryCity || "Not provided",
      pickupLabel,
      dropoffLabel,
      pickupOtherInfo: estimate.pickup_other_info || null,
      dropoffOtherInfo: estimate.dropoff_other_info || null,
      materialsText,
      materialSpecification: estimate.material_specification || null,
      safeWeight,
      routeText,
      safeDistance,
      safeVehicle,
      safeTransitHours,
      safeFinalCost,
      loadingDate: estimate.loading_date || null,
      documentsAvailable: estimate.documents_available || null,
      documentsDetails: estimate.documents_details || null,
      notes: estimate.notes || null,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${estimateCode}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("download-internal-estimate-pdf API error:", err);

    return NextResponse.json(
      {
        error: err.message || "Failed to generate estimate PDF",
      },
      { status: 500 }
    );
  }
}