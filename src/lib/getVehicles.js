import { supabase } from "./supabaseClient";

export async function getVehicles() {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Supabase error in getVehicles:", error);
    throw new Error(error.message || "Failed to fetch vehicles from Supabase");
  }

  console.log("Vehicles fetched from Supabase:", data);
  return data || [];
}