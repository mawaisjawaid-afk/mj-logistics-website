"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function MaterialTypePage() {
  const searchParams = useSearchParams();
  const [materialInput, setMaterialInput] = useState("");
  const [materials, setMaterials] = useState([]);

  // Get data from URL params
  const pickupFull = searchParams.get("pickup") || "";
  const deliveryFull = searchParams.get("delivery") || "";
  const pickupCity = searchParams.get("pickupCity") || "";
  const deliveryCity = searchParams.get("deliveryCity") || "";
  const weight = searchParams.get("weight") || "";
  const weightType = searchParams.get("type") || "ton";

  // Get coordinates from URL params
  const pickupLat = searchParams.get("pickupLat") || "";
  const pickupLon = searchParams.get("pickupLon") || "";
  const deliveryLat = searchParams.get("deliveryLat") || "";
  const deliveryLon = searchParams.get("deliveryLon") || "";

  // Display clean city names in top strip
  const pickup = pickupCity || pickupFull || "Pickup";
  const delivery = deliveryCity || deliveryFull || "Delivery";

  // Back button - go to business quote page
  const handleBack = () => {
    const params = new URLSearchParams({
      pickup: pickupFull,
      pickupCity,
      delivery: deliveryFull,
      deliveryCity,
      weight,
      type: weightType,
      pickupLat,
      pickupLon,
      deliveryLat,
      deliveryLon,
    });

    window.location.href = `/business-quote?${params.toString()}`;
  };

  // Add material from input
  const addMaterial = () => {
    const newMaterial = materialInput.trim();
    if (newMaterial === "") return;

    if (!materials.includes(newMaterial)) {
      setMaterials([...materials, newMaterial]);
    }
    setMaterialInput("");
  };

  // Remove material
  const removeMaterial = (materialToRemove) => {
    setMaterials(materials.filter((m) => m !== materialToRemove));
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMaterial();
    }
  };

  // Choose Material button - Navigate to enter-details page
  const handleContinue = () => {
    if (materials.length === 0) {
      alert("Please add at least one material");
      return;
    }

    const params = new URLSearchParams({
      pickup: pickupFull,
      pickupCity,
      delivery: deliveryFull,
      deliveryCity,
      weight,
      type: weightType,
      materials: JSON.stringify(materials),
      pickupLat,
      pickupLon,
      deliveryLat,
      deliveryLon,
    });

    window.location.href = `/enter-details?${params.toString()}`;
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 pt-4 md:px-6 md:pt-5 lg:px-8">
          <div className="overflow-hidden rounded-[24px] bg-red-700 shadow-sm">
            <div className="flex min-h-[64px] items-center justify-between px-4 sm:px-5 md:min-h-[72px] md:px-6">
              <button
                onClick={handleBack}
                aria-label="Go back"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10"
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition duration-200 hover:bg-white/30 focus:outline-none"
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

      <section className="bg-[#f8fafc] px-4 pb-14 pt-10 md:px-6 md:pb-16 md:pt-14 lg:px-8 lg:pt-16">
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-[760px] text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-[-0.03em] text-gray-900 sm:text-4xl md:text-5xl">
              Enter material type
            </h1>

            <p className="mx-auto mt-4 max-w-[700px] text-sm leading-7 text-gray-600 md:text-lg">
              Add materials for your shipment
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-[700px] md:mt-8">
            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-5">
              <label className="mb-3 block text-base font-semibold text-gray-900 md:text-lg">
                Material name
              </label>

              <div className="grid gap-3 md:grid-cols-[1fr_110px]">
                <input
                  type="text"
                  value={materialInput}
                  onChange={(e) => setMaterialInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type here..."
                  className="h-[52px] w-full rounded-[14px] border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 md:h-[56px] md:text-base"
                />

                <button
                  onClick={addMaterial}
                  className="h-[52px] rounded-[14px] bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 md:h-[56px] md:text-base"
                >
                  Add
                </button>
              </div>

              {materials.length > 0 && (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Added materials
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {materials.map((material, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-sm text-red-700"
                      >
                        {material}
                        <button
                          onClick={() => removeMaterial(material)}
                          className="text-red-500 transition hover:text-red-700"
                          aria-label={`Remove ${material}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleContinue}
                  disabled={materials.length === 0}
                  className={`rounded-[14px] px-8 py-3 text-sm font-semibold transition md:min-w-[210px] md:text-base ${
                    materials.length > 0
                      ? "bg-red-700 text-white hover:bg-red-800"
                      : "cursor-not-allowed bg-gray-300 text-gray-500"
                  }`}
                >
                  Choose Material
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}