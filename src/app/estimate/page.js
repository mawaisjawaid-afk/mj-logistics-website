"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

function EstimateContent() {
  const searchParams = useSearchParams();

  const pickupFull = searchParams.get("pickup") || "";
  const deliveryFull = searchParams.get("delivery") || "";
  const pickupCity = searchParams.get("pickupCity") || "";
  const deliveryCity = searchParams.get("deliveryCity") || "";
  const weightParam = searchParams.get("weight") || "15";
  const weightType = searchParams.get("type") || "ton";
  const materialsParam = searchParams.get("materials") || "[]";
  const fullName = searchParams.get("name") || "Guest User";
  const phone = searchParams.get("phone") || "";
  const email = searchParams.get("email") || "";

  const pickupLat = searchParams.get("pickupLat") || "";
  const pickupLon = searchParams.get("pickupLon") || "";
  const deliveryLat = searchParams.get("deliveryLat") || "";
  const deliveryLon = searchParams.get("deliveryLon") || "";

  const pickup = pickupCity || pickupFull || "Pickup";
  const delivery = deliveryCity || deliveryFull || "Delivery";

  const [showPage, setShowPage] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [prepareError, setPrepareError] = useState("");
  const [estimatePayload, setEstimatePayload] = useState(null);
  const hasPreparedRef = useRef(false);
  const hasTrackedLeadRef = useRef(false);

  let materials = [];
  try {
    materials = JSON.parse(materialsParam);
  } catch {
    materials = [];
  }

  const weightNum = useMemo(() => {
    return weightType === "kg"
      ? (Number(weightParam) || 0) / 1000
      : Number(weightParam) || 0;
  }, [weightParam, weightType]);

  useEffect(() => {
    if (hasPreparedRef.current) return;
    hasPreparedRef.current = true;

    let isMounted = true;
    let timer;

    const prepareEstimate = async () => {
      try {
        setIsPreparing(true);
        setPrepareError("");

        const response = await fetch("/api/save-estimate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            phone,
            email,
            pickup: pickupFull,
            delivery: deliveryFull,
            pickupCity,
            deliveryCity,
            pickupLat: pickupLat ? Number(pickupLat) : null,
            pickupLon: pickupLon ? Number(pickupLon) : null,
            deliveryLat: deliveryLat ? Number(deliveryLat) : null,
            deliveryLon: deliveryLon ? Number(deliveryLon) : null,
            weight: weightNum,
            weightType,
            materials,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to prepare estimate");
        }

        if (!isMounted) return;

        setEstimatePayload(data);

        timer = setTimeout(() => {
          if (isMounted) {
            setShowPage(true);
          }
        }, 150);
      } catch (error) {
        console.error("Prepare estimate error:", error);
        if (isMounted) {
          setPrepareError(error.message || "Unable to prepare estimate");
        }
      } finally {
        if (isMounted) {
          setIsPreparing(false);
        }
      }
    };

    prepareEstimate();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!estimatePayload || hasTrackedLeadRef.current) return;

    hasTrackedLeadRef.current = true;

    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Lead");
    }
  }, [estimatePayload]);

  const estimateId = estimatePayload?.estimateId || "";
  const generatedAt = estimatePayload?.generatedAt || "";

  const finalCost = estimatePayload?.estimateData?.finalCost || "N/A";
  const safeDistance =
    estimatePayload?.estimateData?.distance || "Distance unavailable";
  const safeTransitTime =
    estimatePayload?.estimateData?.transitTime || "Transit unavailable";
  const safeVehicle =
    estimatePayload?.estimateData?.vehicleName || "Not available";
  const safeMaterials =
    estimatePayload?.estimateData?.materialsText ||
    (materials.length ? materials.join(", ") : "N/A");
  const safeWeight =
    estimatePayload?.estimateData?.weight ||
    `${weightNum} ${weightType}`.trim();

  const handleRefine = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const handleRequestQuotation = () => {
    alert("Your quotation request has been sent! We will contact you shortly.");
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const buttonClass =
    "rounded-[12px] border border-red-700 bg-white px-5 py-2.5 text-xs font-semibold text-red-700 transition-all duration-200 hover:bg-red-700 hover:text-white hover:shadow-md md:text-sm";

  if (isPreparing) {
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
            Please wait while we save your details, generate your estimate, and
            send your confirmation.
          </p>
        </div>
      </main>
    );
  }

  if (prepareError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-[560px] rounded-[20px] border border-red-200 bg-red-50 p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-xl font-bold text-red-700">
            Unable to prepare estimate
          </h2>
          <p className="mt-2 text-sm text-red-600">{prepareError}</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen overflow-x-hidden bg-white pb-24 text-gray-900 transition-all duration-300 md:pb-0 ${showPage ? "opacity-100" : "opacity-0"
        }`}
    >
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-6 lg:px-8">
          <div className="mx-auto max-w-[860px] text-center">
            <div className="mb-4 flex justify-center">
              <Link
                href="/"
                aria-label="Go to home page"
                className="transition-transform duration-200 hover:scale-[1.05]"
              >
                <Image
                  src="/logo-6.png"
                  alt="MJ Logistics"
                  width={130}
                  height={130}
                  className="h-auto w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            <h1 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-gray-900 sm:text-3xl md:text-4xl">
              Instant Estimate
            </h1>

            <div className="mt-3 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                Estimate ID:{" "}
                <span className="text-gray-900">{estimateId}</span>
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                Generated:{" "}
                <span className="normal-case tracking-normal text-gray-900">
                  {generatedAt}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-4 pb-8 pt-6 md:px-6 md:pb-10 md:pt-8 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto mt-4 max-w-[840px] md:mt-5">
            <div className="rounded-[22px] border border-gray-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.08)] md:p-4">
              <div className="rounded-[16px] border border-red-100 bg-red-50/50 px-4 py-4 text-center md:px-5 md:py-4.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 md:text-xs">
                  Estimated Cost
                </p>
                <p className="mt-1.5 text-2xl font-bold text-red-700 sm:text-3xl md:text-4xl">
                  PKR {finalCost}
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
                      {phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      Email
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-[16px] border border-gray-200 bg-white p-3 md:p-4">
                  <h3 className="text-sm font-bold text-gray-900 md:text-base">
                    Shipment Summary
                  </h3>

                  <div className="mt-3 space-y-3">
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                      <span className="text-xs text-gray-500">Total Weight</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {safeWeight}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                      <span className="text-xs text-gray-500">Material Type</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {safeMaterials}
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
                        {safeDistance}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[16px] border border-gray-200 bg-white p-3 md:p-4">
                  <h3 className="text-sm font-bold text-gray-900 md:text-base">
                    Recommendation
                  </h3>

                  <div className="mt-3 rounded-[12px] bg-red-50 px-4 py-3 text-center">
                    <p className="text-base font-bold text-red-700">
                      Full Load
                    </p>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                      <span className="text-xs text-gray-500">Vehicle Class</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {safeVehicle}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-gray-500">Transit Time</span>
                      <span className="text-right text-xs font-semibold text-gray-900">
                        {safeTransitTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-[14px] border border-amber-100 bg-amber-50 px-4 py-2.5">
                <p className="text-center text-xs text-amber-900">
                  Prices are indicative and subject to route inspection, fuel fluctuation, and operational constraints.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center">
                <button onClick={handleRefine} className={buttonClass}>
                  Refine with exact locations
                </button>

                <button onClick={handleRequestQuotation} className={buttonClass}>
                  Request final quotation
                </button>

                <button onClick={handleDownloadPDF} className={buttonClass}>
                  Download PDF
                </button>
              </div>

              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">Secure • Fast • Reliable</p>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-3 text-center">
                <p className="text-[11px] text-gray-500">
                  Opposite Kohinoor Textile Mill, Main Peshawar Road, Rawalpindi
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  +92 334 6466818 | info@mjlogisticservices.com
                </p>
                <p className="mt-1.5 text-[10px] text-gray-400">
                  © 2026 MJ Logistic Services. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-[480px] gap-3">
          <a
            href="tel:+923346466818"
            className="flex-1 rounded-[14px] bg-red-700 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-800"
          >
            Call Now
          </a>

          <a
            href="https://wa.me/923346466818"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-[14px] border border-red-700 bg-white px-4 py-3 text-center text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            WhatsApp
          </a>
        </div>
      </div>
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