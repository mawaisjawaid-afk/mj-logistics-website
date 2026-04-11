import { supabase } from "@/lib/supabase-server";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return Response.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("is_verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return Response.json({ error: "OTP not found" }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now > expiresAt) {
      return Response.json({ error: "OTP has expired" }, { status: 400 });
    }

    if (String(data.otp_code) !== String(otp)) {
      return Response.json({ error: "Invalid OTP" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("otp_codes")
      .update({ is_verified: true })
      .eq("id", data.id);

    if (updateError) {
      return Response.json(
        { error: "Failed to update OTP status" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Verify OTP route error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}