"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { getVehicles } from "@/lib/getVehicles";
import { selectVehicle } from "@/lib/selectVehicles";

function EstimateContent() {
  const searchParams = useSearchParams();

  // Get data from URL params
  const pickupFull = searchParams.get("pickup") || "";
  const deliveryFull = searchParams.get("delivery") || "";
  const pickupCity = searchParams.get("pickupCity") || "";
  const deliveryCity = searchParams.get("deliveryCity") || "";
  const weightParam = searchParams.get("weight") || "15";
  const weightType = searchParams.get("type") || "ton";
  const materialsParam = searchParams.get("materials") || '["Steel Coil"]';
  const fullName = searchParams.get("name") || "Guest User";
  const phone = searchParams.get("phone") || "";
  const email = searchParams.get("email") || "";

  // Coordinates from URL params
  const pickupLat = searchParams.get("pickupLat") || "";
  const pickupLon = searchParams.get("pickupLon") || "";
  const deliveryLat = searchParams.get("deliveryLat") || "";
  const deliveryLon = searchParams.get("deliveryLon") || "";

  const weightNum = Number(weightParam) || 0;

  // Parse materials
  let materials = [];
  try {
    materials = JSON.parse(materialsParam);
  } catch (e) {
    materials = ["Steel Coil"];
  }

  // Display clean city names
  const pickup = pickupCity || pickupFull || "Pickup";
  const delivery = deliveryCity || deliveryFull || "Delivery";

  // Route distance state
  const [distanceKm, setDistanceKm] = useState(null);
  const [routeTimeHours, setRouteTimeHours] = useState(null);
  const [isDistanceLoading, setIsDistanceLoading] = useState(true);
  const [distanceError, setDistanceError] = useState("");

  // Vehicle state
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isVehicleLoading, setIsVehicleLoading] = useState(true);
  const [vehicleError, setVehicleError] = useState("");

  // Optional small fade-in after loading completes
  const [showPage, setShowPage] = useState(false);

  // Fetch route distance
  useEffect(() => {
    const fetchDistance = async () => {
      if (!pickupLat || !pickupLon || !deliveryLat || !deliveryLon) {
        setDistanceError("Missing route coordinates");
        setIsDistanceLoading(false);
        return;
      }

      try {
        setIsDistanceLoading(true);
        setDistanceError("");

        const response = await fetch(
          `/api/route-distance?pickupLat=${encodeURIComponent(
            pickupLat
          )}&pickupLon=${encodeURIComponent(
            pickupLon
          )}&deliveryLat=${encodeURIComponent(
            deliveryLat
          )}&deliveryLon=${encodeURIComponent(deliveryLon)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch distance");
        }

        setDistanceKm(data.distanceKm ?? null);
        setRouteTimeHours(data.timeHours ?? null);
      } catch (error) {
        setDistanceError(error.message || "Unable to calculate distance");
      } finally {
        setIsDistanceLoading(false);
      }
    };

    fetchDistance();
  }, [pickupLat, pickupLon, deliveryLat, deliveryLon]);

  // Fetch vehicles and select by weight
  useEffect(() => {
    const fetchAndSelectVehicle = async () => {
      try {
        setIsVehicleLoading(true);
        setVehicleError("");

        const vehicles = await getVehicles();
        const matchedVehicle = selectVehicle(vehicles, weightNum);

        if (!matchedVehicle) {
          setSelectedVehicle(null);
          setVehicleError("No suitable vehicle found for this weight.");
          return;
        }

        setSelectedVehicle(matchedVehicle);
      } catch (error) {
        setVehicleError("Failed to fetch vehicle data.");
        setSelectedVehicle(null);
      } finally {
        setIsVehicleLoading(false);
      }
    };

    fetchAndSelectVehicle();
  }, [weightNum]);

  // Final loading state
  const isPageLoading = isDistanceLoading || isVehicleLoading;

  useEffect(() => {
    if (!isPageLoading) {
      const timer = setTimeout(() => {
        setShowPage(true);
      }, 150);

      return () => clearTimeout(timer);
    } else {
      setShowPage(false);
    }
  }, [isPageLoading]);

  // Estimated cost from DB vehicle rate/km
  const finalCost = useMemo(() => {
    if (!selectedVehicle || distanceKm === null) return null;

    const baseCost = distanceKm * Number(selectedVehicle.rate_per_km || 0);
    const minCharge = Number(selectedVehicle.minimum_charge || 0);

    return Math.max(baseCost, minCharge);
  }, [selectedVehicle, distanceKm]);

  // Transit time
  const totalTransitHours = useMemo(() => {
    if (!selectedVehicle || distanceKm === null) return null;

    const speed = Number(selectedVehicle.loaded_avg_speed_kmph || 0);
    const loadingHours = Number(selectedVehicle.loading_hours || 0);
    const unloadingHours = Number(selectedVehicle.unloading_hours || 0);

    if (!speed) return null;

    const driveTime = distanceKm / speed;
    return driveTime + loadingHours + unloadingHours;
  }, [selectedVehicle, distanceKm]);

  const distanceDisplay = useMemo(() => {
    if (distanceKm !== null) return `${distanceKm.toLocaleString()} KM`;
    return "Distance unavailable";
  }, [distanceKm]);

  const transitDisplay = useMemo(() => {
    if (totalTransitHours !== null) return `${totalTransitHours.toFixed(1)} hours`;
    if (routeTimeHours !== null) return `${routeTimeHours.toFixed(1)} hours`;
    return "Transit unavailable";
  }, [totalTransitHours, routeTimeHours]);

  const costDisplay = useMemo(() => {
    if (finalCost !== null) return `PKR ${Math.round(finalCost).toLocaleString()}`;
    return "PKR N/A";
  }, [finalCost]);

  const handleRefine = () => {
    window.location.href = "/";
  };

  const handleRequestQuotation = () => {
    alert("Your quotation request has been sent! We will contact you shortly.");
  };

  // Full page branded loader
  if (isPageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <div className="animate-pulse">
              <Image
                src="/logo-6.png"
                alt="MJ Logistics"
                width={72}
                height={72}
                className="h-auto w-auto object-contain"
                priority
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-red-700 [animation-delay:-0.3s]"></span>
            <span className="mx-2 h-2.5 w-2.5 animate-bounce rounded-full bg-red-700 [animation-delay:-0.15s]"></span>
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-red-700"></span>
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900 md:text-2xl">
            Preparing your estimate
          </h2>
          <p className="mt-2 text-sm text-gray-600 md:text-base">
            Please wait while we calculate the best transport option.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen overflow-x-hidden bg-white text-gray-900 transition-all duration-300 ${
        showPage ? "opacity-100" : "opacity-0"
      }`}
    >
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 pt-3 md:px-6 md:pt-4 lg:px-8">
          <div className="overflow-hidden rounded-[20px] bg-red-700 shadow-sm">
            <div className="flex min-h-[58px] items-center justify-between px-4 sm:px-5 md:min-h-[64px] md:px-6">
              <button
                onClick={() => window.location.href = "/"}
                aria-label="Go back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10"
              >
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex-1 px-3 text-center">
                <div className="truncate text-sm font-semibold text-white sm:text-base md:text-lg">
                  {pickup} <span className="mx-1">→</span> {delivery}
                </div>
              </div>

              <button
                type="button"
                aria-label="Account icon"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition duration-200 hover:bg-white/30 focus:outline-none"
              >
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-4 pb-8 pt-6 md:px-6 md:pb-10 md:pt-8 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-[860px] text-center">
            <h1 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-gray-900 sm:text-3xl md:text-4xl">
              Instant Estimate
            </h1>
          </div>

          <div className="mx-auto mt-4 max-w-[840px] md:mt-5">
            <div className="rounded-[22px] border border-gray-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.08)] md:p-4">
              <div className="rounded-[16px] border border-red-100 bg-red-50/50 px-4 py-4 text-center md:px-5 md:py-4.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 md:text-xs">
                  Estimated Cost
                </p>
                <p className="mt-1.5 text-2xl font-bold text-red-700 sm:text-3xl md:text-4xl">
                  {costDisplay}
                </p>
                <p className="mt-1 text-xs text-gray-600 md:text-sm">
                  Based on your route and requirements
                </p>
              </div>

              <div className="mt-3 rounded-[16px] border border-gray-200 bg-gray-50 p-3 md:p-4">
                <h3 className="text-sm font-bold text-gray-900 md:text-base">
                  Customer Details
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      Name
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {fullName}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      Phone
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      Email
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {email || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-[16px] border border-gray-200 p-3 md:p-4">
                  <h3 className="text-sm font-bold text-gray-900 md:text-base">
                    Shipment Summary
                  </h3>

                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                      <span className="text-xs text-gray-500">Total Weight</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {weightParam} {weightType === "ton" ? "Tons" : "Kgs"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                      <span className="text-xs text-gray-500">Material Type</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {materials.join(", ")}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                      <span className="text-xs text-gray-500">Route</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {pickup} → {delivery}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-gray-500">Distance</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {distanceDisplay}
                      </span>
                    </div>

                    {distanceError && (
                      <p className="pt-1 text-xs text-red-600">{distanceError}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[16px] border border-gray-200 p-3 md:p-4">
                  <h3 className="text-sm font-bold text-gray-900 md:text-base">
                    Recommendation
                  </h3>

                  <div className="mt-3 rounded-[12px] bg-red-50 px-4 py-3">
                    <p className="text-center text-lg font-bold text-red-700">
                      Full Load
                    </p>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                      <span className="text-xs text-gray-500">Vehicle Class</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {selectedVehicle?.vehicle_name || "Not available"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-gray-500">Transit Time</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {transitDisplay}
                      </span>
                    </div>

                    {vehicleError && (
                      <p className="pt-1 text-xs text-red-600">{vehicleError}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-[14px] border border-amber-100 bg-amber-50 px-4 py-2.5">
                <p className="text-center text-xs text-amber-900">
                  Final price may vary based on the confirmed quotation.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <button
                  onClick={handleRefine}
                  className="rounded-[12px] border border-red-700 bg-white px-5 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 md:text-sm"
                >
                  Refine with exact locations
                </button>

                <button
                  onClick={handleRequestQuotation}
                  className="rounded-[12px] bg-red-700 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-800 md:text-sm"
                >
                  Request final quotation
                </button>
              </div>

              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">Secure • Fast • Reliable</p>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-3 text-center">
                <p className="text-[11px] text-gray-500">
                  Opposite kohinoor Textile Mill, Main Peshawar Road, Rawalpindi
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  +92 334 6466818 | info@mjlogistics.com
                </p>
                <p className="mt-1.5 text-[10px] text-gray-400">
                  © 2025 MJ Logistic Services. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function EstimatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <EstimateContent />
    </Suspense>
  );
}