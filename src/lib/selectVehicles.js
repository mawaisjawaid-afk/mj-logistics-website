export function selectVehicle(vehicles, weight) {
  if (!Array.isArray(vehicles) || vehicles.length === 0) return null;

  const w = Number(weight);

  const suitable = vehicles
    .filter((v) => {
      const min = Number(v.min_capacity_ton);
      const max = Number(v.max_capacity_ton);

      return !Number.isNaN(min) && !Number.isNaN(max) && w >= min && w <= max;
    })
    .sort((a, b) => Number(a.max_capacity_ton) - Number(b.max_capacity_ton));

  return suitable[0] || null;
}