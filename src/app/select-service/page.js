"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SelectServiceContent() {
  const searchParams = useSearchParams();

  // Get full pickup and delivery from URL params
  const pickupFull = searchParams.get("pickup") || "Ahmedabad";
  const deliveryFull = searchParams.get("delivery") || "Mumbai";

  // Extract only first word (city name) - before comma
  const pickup = pickupFull.split(",")[0].trim();
  const delivery = deliveryFull.split(",")[0].trim();

  const handleBack = () => {
    window.location.href = "/";
  };

  // Direct navigation on card click
  const handleBusinessClick = () => {
    window.location.href = `/business-quote?pickup=${encodeURIComponent(
      pickup
    )}&delivery=${encodeURIComponent(delivery)}`;
  };

  const handlePersonalClick = () => {
    window.location.href = `/personal-quote?pickup=${encodeURIComponent(
      pickup
    )}&delivery=${encodeURIComponent(delivery)}`;
  };

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-[#111827]">
      <div className="pt-4 md:pt-6"></div>

      <div className="w-full bg-red-700 py-3 md:py-4">
        <div className="mx-auto flex w-full max-w-[1376px] items-center justify-between px-5 md:px-6 lg:px-5">
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
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

          <div className="text-center">
            <span className="text-base font-medium text-white md:text-lg">
              {pickup} <span className="text-white">→</span> {delivery}
            </span>
          </div>

          <Link
            href="/login"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
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
          </Link>
        </div>
      </div>

      <section className="px-5 pb-10 pt-8 md:px-8 lg:px-5">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#0f172a] md:text-3xl lg:text-4xl">
              Choose service type
            </h1>
            <p className="mt-2 text-sm text-[#6b7280] md:text-base">
              Select business for Full truck or partload or personal for household
              goods
            </p>
          </div>

          <div className="mx-auto max-w-[900px]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div
                onClick={handleBusinessClick}
                className="cursor-pointer rounded-2xl border-2 border-[#e5e7eb] bg-white p-6 transition-all hover:border-red-600 hover:bg-red-50 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#1f2937]">
                      Business
                    </h3>
                    <p className="mt-1 text-sm text-[#6b7280]">
                      Industrial, Commercial or Enterprise goods
                    </p>
                  </div>
                  <div className="text-gray-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                onClick={handlePersonalClick}
                className="cursor-pointer rounded-2xl border-2 border-[#e5e7eb] bg-white p-6 transition-all hover:border-red-600 hover:bg-red-50 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-2xl">🏠</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#1f2937]">
                      Personal
                    </h3>
                    <p className="mt-1 text-sm text-[#6b7280]">
                      Household or personal Goods
                    </p>
                  </div>
                  <div className="text-gray-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function SelectServicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f3f3]" />}>
      <SelectServiceContent />
    </Suspense>
  );
}