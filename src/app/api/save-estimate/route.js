import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

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

const formatNumber = (value, fallback = "N/A") => {
    if (value === null || value === undefined || value === "") return fallback;
    const num = Number(value);
    if (Number.isNaN(num)) return fallback;
    return num.toLocaleString("en-PK");
};

const buildPdfHtml = ({
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
}) => {
    const year = new Date().getFullYear();

    return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(estimateCode)}</title>
      <style>
        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #0b1736;
          background: #ffffff;
        }

        @page {
          size: A4;
          margin: 0;
        }

        body {
          width: 794px;
          height: 1123px;
          background: #ffffff;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        .page {
          width: 794px;
          min-height: 1123px;
          background: #eef0f3;
          position: relative;
          overflow: hidden;
        }

        .top-line {
          height: 6px;
          width: 100%;
          background: #d81912;
        }

        .shell {
          padding: 18px 24px 16px;
        }

        .card {
          background: #f3f4f6;
          border: 1px solid #d7dbe2;
          border-radius: 22px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.35);
        }

        .logo-wrap {
          text-align: center;
          margin-top: 2px;
        }

        .logo-wrap img {
          width: 182px;
          height: auto;
          display: inline-block;
        }

        .title {
          margin: 8px 0 12px;
          text-align: center;
          font-size: 30px;
          line-height: 1.05;
          font-weight: 800;
          color: #081b4a;
          letter-spacing: -0.5px;
        }

        .meta {
          display: flex;
          justify-content: center;
          gap: 26px;
          flex-wrap: wrap;
          margin-bottom: 18px;
          font-size: 11px;
          color: #667085;
          letter-spacing: 1.9px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .meta strong {
          color: #0b1736;
          text-transform: none;
          letter-spacing: 0;
          margin-left: 6px;
          font-size: 12px;
        }

        .cost-card {
          padding: 24px 20px 16px;
          text-align: center;
          background: #f4efef;
          border: 1px solid #f0c9c9;
          border-radius: 18px;
          margin-bottom: 14px;
        }

        .cost-label {
          font-size: 11px;
          letter-spacing: 2.5px;
          color: #6c7686;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .cost-value {
          font-size: 32px;
          line-height: 1;
          color: #d81912;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .cost-subtext {
          font-size: 12px;
          color: #1b2747;
        }

        .section-card {
          padding: 14px 14px 12px;
          margin-bottom: 10px;
        }

        .section-title {
          font-size: 14px;
          line-height: 1.2;
          font-weight: 800;
          color: #0b1736;
          margin-bottom: 12px;
        }

        .customer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .mini-label {
          font-size: 10px;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .mini-value {
          font-size: 12px;
          color: #000814;
          font-weight: 700;
          word-break: break-word;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 8px;
        }

        .info-rows {
          margin-top: 4px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          padding: 8px 0;
          border-bottom: 1px solid #d9dde4;
        }

        .row:last-child {
          border-bottom: none;
        }

        .row .left {
          font-size: 12px;
          color: #5d6676;
          max-width: 46%;
        }

        .row .right {
          font-size: 12px;
          color: #091426;
          font-weight: 700;
          text-align: right;
          max-width: 52%;
          word-break: break-word;
        }

        .badge {
          background: #f8eaea;
          border-radius: 12px;
          color: #db1c14;
          text-align: center;
          font-weight: 800;
          font-size: 16px;
          padding: 10px 12px;
          margin-bottom: 10px;
        }

        .note {
          margin-top: 6px;
          background: #f3eee0;
          border: 1px solid #e8d189;
          color: #8a4f00;
          border-radius: 12px;
          text-align: center;
          padding: 9px 16px;
          font-size: 11px;
        }

        .trust {
          text-align: center;
          color: #384152;
          font-size: 12px;
          margin: 10px 0 12px;
        }

        .divider {
          height: 1px;
          background: #d4d9e0;
          margin: 12px 2px 8px;
        }

        .footer {
          text-align: center;
          color: #6c7484;
          font-size: 10px;
          line-height: 1.7;
        }

        .footer .muted {
          color: #8b93a3;
          font-size: 9px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="top-line"></div>

        <div class="shell">
          <div class="logo-wrap">
            <img
              src="https://mjlogisticservices.com/logo-6.png"
              alt="MJ Logistic Services"
            />
          </div>

          <div class="title">Instant Estimate</div>

          <div class="meta">
            <span>Estimate ID:<strong>${escapeHtml(estimateCode)}</strong></span>
            <span>Generated:<strong>${escapeHtml(generatedAtText)}</strong></span>
          </div>

          <div class="card cost-card">
            <div class="cost-label">Estimated Cost</div>
            <div class="cost-value">PKR ${escapeHtml(safeFinalCost)}</div>
            <div class="cost-subtext">Based on your route and requirements</div>
          </div>

          <div class="card section-card">
            <div class="section-title">Customer Details</div>
            <div class="customer-grid">
              <div>
                <div class="mini-label">Name</div>
                <div class="mini-value">${escapeHtml(fullName || "Guest User")}</div>
              </div>
              <div>
                <div class="mini-label">Phone</div>
                <div class="mini-value">${escapeHtml(phone || "Not provided")}</div>
              </div>
              <div>
                <div class="mini-label">Email</div>
                <div class="mini-value">${escapeHtml(email || "Not provided")}</div>
              </div>
            </div>
          </div>

          <div class="two-col">
            <div class="card section-card">
              <div class="section-title">Shipment Summary</div>
              <div class="info-rows">
                <div class="row">
                  <div class="left">Total Weight</div>
                  <div class="right">${escapeHtml(safeWeight)}</div>
                </div>
                <div class="row">
                  <div class="left">Material Type</div>
                  <div class="right">${escapeHtml(materialsText)}</div>
                </div>
                <div class="row">
                  <div class="left">Route</div>
                  <div class="right">${escapeHtml(`${pickup} → ${delivery}`)}</div>
                </div>
                <div class="row">
                  <div class="left">Distance</div>
                  <div class="right">${escapeHtml(safeDistance)}</div>
                </div>
              </div>
            </div>

            <div class="card section-card">
              <div class="section-title">Recommendation</div>
              <div class="badge">Full Load</div>
              <div class="info-rows">
                <div class="row">
                  <div class="left">Vehicle Class</div>
                  <div class="right">${escapeHtml(safeVehicle)}</div>
                </div>
                <div class="row">
                  <div class="left">Transit Time</div>
                  <div class="right">${escapeHtml(safeTransitHours)}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="note">
            Prices are indicative and subject to route inspection, fuel fluctuation, and operational constraints.
          </div>

          <div class="trust">Secure • Fast • Reliable</div>

          <div class="divider"></div>

          <div class="footer">
            <div>Opposite Kohinoor Textile Mill, Main Peshawar Road, Rawalpindi</div>
            <div>+92 334 6466818 | info@mjlogistics.com</div>
            <div class="muted">© ${year} MJ Logistic Services. All rights reserved.</div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
};

async function getBrowser() {
    const isVercel = Boolean(process.env.VERCEL);

    if (isVercel) {
        return puppeteer.launch({
            args: [
                ...chromium.args,
                "--hide-scrollbars",
                "--font-render-hinting=medium",
                "--disable-font-subpixel-positioning"
            ],
            defaultViewport: {
                width: 794,
                height: 1123,
                deviceScaleFactor: 2,
            },
            executablePath: await chromium.executablePath(),
            headless: true,
        });
    }

    return puppeteer.launch({
        headless: true,
        channel: "chrome",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        defaultViewport: {
            width: 794,
            height: 1123,
            deviceScaleFactor: 2,
        },
    });
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
    const html = buildPdfHtml({
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
    });

    const browser = await getBrowser();

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        await new Promise(resolve => setTimeout(resolve, 500));

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "0",
                right: "0",
                bottom: "0",
                left: "0",
            },
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        const customerEmail = body.email?.trim() || "";
        const safeName = body.fullName?.trim() || "Customer";
        const safePickup = body.pickup || "N/A";
        const safeDelivery = body.delivery || "N/A";
        const safePhone = body.phone?.trim() || "Not provided";
        const safeVehicle = body.vehicleName || "Not available";

        const materialsText = Array.isArray(body.materials)
            ? body.materials.join(", ")
            : body.materials || "N/A";

        const safeWeight =
            body.weight !== null && body.weight !== undefined && body.weight !== ""
                ? `${body.weight} ${body.weightType || ""}`.trim()
                : "N/A";

        const safeFinalCost =
            body.finalCost !== null &&
                body.finalCost !== undefined &&
                body.finalCost !== ""
                ? Math.round(Number(body.finalCost)).toLocaleString("en-PK")
                : "N/A";

        const safeTransitHours =
            body.transitHours !== null &&
                body.transitHours !== undefined &&
                body.transitHours !== ""
                ? `${Number(body.transitHours).toFixed(1)} hours`
                : "N/A";

        const safeDistance =
            body.distanceKm !== null &&
                body.distanceKm !== undefined &&
                body.distanceKm !== ""
                ? `${formatNumber(body.distanceKm)} KM`
                : "N/A";

        const generatedAtText = formatDateTime(new Date());

        const { data, error } = await supabase
            .from("estimates")
            .insert([
                {
                    full_name: body.fullName || null,
                    phone: body.phone || null,
                    email: customerEmail || null,
                    pickup: body.pickup || null,
                    delivery: body.delivery || null,
                    pickup_city: body.pickupCity || null,
                    delivery_city: body.deliveryCity || null,
                    pickup_lat: body.pickupLat ?? null,
                    pickup_lon: body.pickupLon ?? null,
                    delivery_lat: body.deliveryLat ?? null,
                    delivery_lon: body.deliveryLon ?? null,
                    weight_value: body.weight ?? null,
                    weight_type: body.weightType || null,
                    materials: body.materials ?? null,
                    distance_km: body.distanceKm ?? null,
                    transit_hours: body.transitHours ?? null,
                    vehicle_name: body.vehicleName || null,
                    final_cost: body.finalCost ?? null,
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
                <td style="padding:12px 14px;background:#f9fafb;border-bottom:${index === arr.length - 1 ? "0" : "1px solid #e5e7eb"};font-size:13px;font-weight:700;color:#111827;width:40%;text-align:left;">
                  ${escapeHtml(label)}
                </td>
                <td style="padding:12px 14px;border-bottom:${index === arr.length - 1 ? "0" : "1px solid #e5e7eb"};font-size:13px;color:#4b5563;text-align:center;">
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
                content: pdfBuffer,
                contentType: "application/pdf",
            },
        ];

        if (customerEmail) {
            await transporter.sendMail({
                from: `"MJ Logistic Services" <${process.env.SMTP_USER}>`,
                to: customerEmail,
                subject: `Your Estimate - ${estimateCode}`,
                html: customerEmailHtml,
                attachments,
            });
        }

        await transporter.sendMail({
            from: `"MJ Logistic Services" <${process.env.SMTP_USER}>`,
            to: "estimates@mjlogisticservices.com",
            subject: `[NEW ESTIMATE] ${estimateCode}`,
            html: companyEmailHtml,
            attachments,
        });

        return NextResponse.json({
            success: true,
            estimateId: estimateCode,
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