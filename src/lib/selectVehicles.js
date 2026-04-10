export function selectVehicle(vehicles, weight) {
  if (!vehicles || vehicles.length === 0) return null;

  const suitable = vehicles
    .filter(v => weight >= v.min_capacity_ton && weight <= v.max_capacity_ton)
    .sort((a, b) => a.max_capacity_ton - b.max_capacity_ton);

  return suitable[0] || null;
}