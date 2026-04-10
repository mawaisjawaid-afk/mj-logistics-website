import { supabase } from "./supabaseClient";

export async function getVehicles() {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  return data || [];
}