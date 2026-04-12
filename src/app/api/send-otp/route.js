import { Resend } from "resend";
import { supabase } from "@/lib/supabase-server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const safeName = name?.trim() || "Customer";
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("otp_codes").insert([
      {
        email,
        otp_code: otp,
        expires_at: expiresAt,
        is_verified: false,
      },
    ]);

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return Response.json({ error: "Failed to save OTP" }, { status: 500 });
    }

    const { error: emailError } = await resend.emails.send({
      from: "MJ Logistics Services <no-reply@mjlogisticservices.com>",
      to: email,
      subject: "Your OTP for MJ Logistic Services estimate request",
      html: `
        <div style="margin:0;padding:0;background-color:#f4f6f8;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
            <tr>
              <td align="center">

                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">

                  <tr>
                    <td align="center" style="background:#ffffff;padding:28px 24px;border-bottom:1px solid #eee;">
                      <img 
                        src="https://mjlogisticservices.com/logo-6.png" 
                        alt="MJ Logistic Services" 
                        style="display:block;max-width:190px;width:100%;height:auto;margin:0 auto 14px auto;"
                      />

                      <div style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#111827;">
                        OTP Verification
                      </div>

                      <div style="font-family:Arial,sans-serif;font-size:14px;color:#6b7280;margin-top:6px;">
                        Estimate request authentication
                      </div>

                      <div style="height:3px;background:#d6170d;width:80px;margin:14px auto 0 auto;border-radius:10px;"></div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:34px 32px 18px 32px;font-family:Arial,sans-serif;">
                      <div style="font-size:16px;color:#374151;margin-bottom:10px;">
                        Hello ${safeName},
                      </div>

                      <div style="font-size:15px;color:#4b5563;margin-bottom:24px;line-height:26px;">
                        Use the verification code below to continue your
                        <strong> MJ Logistic Services </strong>
                        estimate request. This code is valid for
                        <strong> 5 minutes</strong>.
                      </div>

                      <div style="text-align:center;margin:28px 0;">
                        <div style="display:inline-block;background:#fff5f5;border:1px solid #fecaca;border-radius:16px;padding:18px 24px;">
                          <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#991b1b;font-weight:700;margin-bottom:8px;">
                            Verification Code
                          </div>

                          <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#d6170d;">
                            ${otp} 
                          </div>
                        </div>
                      </div>

                      <div style="font-size:14px;color:#6b7280;text-align:center;margin-bottom:20px;">
                        Enter this 6-digit code on the verification screen to proceed.
                      </div>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;">
                        <tr>
                          <td style="padding:16px;">
                            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px;">
                              Security Notice
                            </div>
                            <div style="font-size:13px;color:#6b7280;line-height:22px;">
                              Never share this OTP with anyone. MJ Logistic Services will never ask for your verification code by phone, WhatsApp, or email.
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
                        If you did not request this code, you can safely ignore this email.
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
      `,
    });

    if (emailError) {
      console.error("Resend email error:", emailError);
      return Response.json({ error: "Failed to send OTP email" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Send OTP route error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}