"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function EnterDetailsPage() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  // Get data from URL params
  const pickupFull = searchParams.get("pickup") || "";
  const deliveryFull = searchParams.get("delivery") || "";
  const pickupCity = searchParams.get("pickupCity") || "";
  const deliveryCity = searchParams.get("deliveryCity") || "";
  const weight = searchParams.get("weight") || "";
  const weightType = searchParams.get("type") || "ton";
  const materialsParam = searchParams.get("materials") || "[]";

  // Get coordinates from URL params
  const pickupLat = searchParams.get("pickupLat") || "";
  const pickupLon = searchParams.get("pickupLon") || "";
  const deliveryLat = searchParams.get("deliveryLat") || "";
  const deliveryLon = searchParams.get("deliveryLon") || "";

  // Parse materials from JSON
  let materials = [];
  try {
    materials = JSON.parse(materialsParam);
  } catch (e) {
    materials = [];
  }

  // Display clean city names in top strip
  const pickup = pickupCity || pickupFull || "Pickup";
  const delivery = deliveryCity || deliveryFull || "Delivery";

  // Back button - go to material type page
  const handleBack = () => {
    const params = new URLSearchParams({
      pickup: pickupFull,
      pickupCity,
      delivery: deliveryFull,
      deliveryCity,
      weight,
      type: weightType,
      materials: materialsParam,
      pickupLat,
      pickupLon,
      deliveryLat,
      deliveryLon,
    });

    window.location.href = `/material-type?${params.toString()}`;
  };

  const handleGetPrice = () => {
    if (!fullName.trim()) {
      alert("Please enter your full name");
      return;
    }

    if (!phoneNumber.trim()) {
      alert("Please enter WhatsApp number");
      return;
    }

    if (!email.trim()) {
      alert("Please enter email address");
      return;
    }

    const phoneRegex = /^[0-9+\-\s]{10,15}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      alert("Please enter a valid phone number");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("Please enter a valid email address");
      return;
    }

    const params = new URLSearchParams({
      pickup: pickupFull,
      pickupCity,
      delivery: deliveryFull,
      deliveryCity,
      weight,
      type: weightType,
      materials: materialsParam,
      name: fullName,
      phone: phoneNumber,
      email,
      pickupLat,
      pickupLon,
      deliveryLat,
      deliveryLon,
    });

    window.location.href = `/estimate?${params.toString()}`;
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
              Enter your details
            </h1>

            <p className="mx-auto mt-4 max-w-[700px] text-sm leading-7 text-gray-600 md:text-lg">
              Enter authentic details for better and quick response
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-[700px] md:mt-8">
            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-5">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-base font-semibold text-gray-900 md:text-lg">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-[52px] w-full rounded-[14px] border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 md:h-[56px] md:text-base"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-semibold text-gray-900 md:text-lg">
                    Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Whatsapp no. recommended"
                    className="h-[52px] w-full rounded-[14px] border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 md:h-[56px] md:text-base"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-semibold text-gray-900 md:text-lg">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="h-[52px] w-full rounded-[14px] border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 md:h-[56px] md:text-base"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleGetPrice}
                  className="rounded-[14px] bg-red-700 px-8 py-3 text-sm font-semibold text-white transition hover:bg-red-800 md:min-w-[180px] md:text-base"
                >
                  Get price
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}