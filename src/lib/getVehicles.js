export async function getVehicles() {
  const response = await fetch("/api/vehicles", {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch vehicles");
  }

  return data.vehicles || [];
}