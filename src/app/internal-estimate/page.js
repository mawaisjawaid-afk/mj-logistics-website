"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getCurrentDateTime() {
  return new Date().toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateTime(value) {
  if (!value) return getCurrentDateTime();

  return new Date(value).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatLoadingDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const formatted = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return formatted.replace(/\//g, "-");
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const numeric = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(numeric)) return String(value);

  return numeric.toLocaleString("en-PK");
}

function safeValue(value, fallback = "N/A") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

function InternalEstimateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wrapperRef = useRef(null);

  const [searchId, setSearchId] = useState(searchParams.get("estimateId") || "");

  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pageError, setPageError] = useState("");

  const [estimateRecordId, setEstimateRecordId] = useState(null);
  const [estimateId, setEstimateId] = useState("Not generated yet");
  const [estimateStatus, setEstimateStatus] = useState("Ready");
  const [linkedBookingCode, setLinkedBookingCode] = useState("Not linked");
  const [generatedOn, setGeneratedOn] = useState(getCurrentDateTime());

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");

  const [pickupLabel, setPickupLabel] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupLat, setPickupLat] = useState(null);
  const [pickupLon, setPickupLon] = useState(null);
  const [pickupOtherInfo, setPickupOtherInfo] = useState("");

  const [dropoffLabel, setDropoffLabel] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [dropoffLat, setDropoffLat] = useState(null);
  const [dropoffLon, setDropoffLon] = useState(null);
  const [dropoffOtherInfo, setDropoffOtherInfo] = useState("");

  const [material, setMaterial] = useState("");
  const [materialSpecification, setMaterialSpecification] = useState("");
  const [materialsText, setMaterialsText] = useState("");

  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState("ton");

  const [vehicleName, setVehicleName] = useState("");
  const [distance, setDistance] = useState("");
  const [transitTime, setTransitTime] = useState("");
  const [finalCost, setFinalCost] = useState("");

  const [loadingDate, setLoadingDate] = useState("");
  const [documentsAvailable, setDocumentsAvailable] = useState("");
  const [documentsDetails, setDocumentsDetails] = useState("");
  const [notes, setNotes] = useState("");

  const pickupDisplay = useMemo(() => {
    return pickupCity || pickupLabel || "Pickup";
  }, [pickupCity, pickupLabel]);

  const dropoffDisplay = useMemo(() => {
    return dropoffCity || dropoffLabel || "Delivery";
  }, [dropoffCity, dropoffLabel]);

  const weightDisplay = useMemo(() => {
    if (!weightValue) return "N/A";
    return `${weightValue} ${weightUnit || ""}`.trim();
  }, [weightValue, weightUnit]);

  const buttonClass =
    "rounded-[12px] border border-red-700 bg-white px-5 py-2.5 text-xs font-semibold text-red-700 transition-all duration-200 hover:bg-red-700 hover:text-white hover:shadow-md md:text-sm disabled:cursor-not-allowed disabled:opacity-60";

  const applyEstimateToForm = (estimate) => {
    const estimateData = estimate?.estimateData || estimate?.estimate_data || {};

    setEstimateRecordId(estimate?.id ?? null);
    setEstimateId(
      estimate?.estimateId ||
        estimate?.estimateCode ||
        estimate?.estimate_code ||
        "Not generated yet"
    );
    setEstimateStatus(
      estimate?.estimateStatus ||
        estimate?.status ||
        estimate?.estimate_status ||
        "Ready"
    );
    setLinkedBookingCode(
      estimate?.linkedBookingCode ||
        estimate?.linkedBookingId ||
        estimate?.bookingCode ||
        estimate?.linked_booking_code ||
        "Not linked"
    );
    setGeneratedOn(
      formatDateTime(
        estimate?.generatedOn ||
          estimate?.createdAt ||
          estimate?.created_at ||
          estimate?.updatedAt
      )
    );

    setFullName(
      estimate?.fullName ||
        estimate?.name ||
        estimate?.customerName ||
        estimate?.full_name ||
        ""
    );
    setContactNumber(
      estimate?.contactNumber ||
        estimate?.phone ||
        estimate?.contact_number ||
        ""
    );
    setEmail(estimate?.email || "");

    setPickupLabel(
      estimate?.pickupLabel || estimate?.pickup || estimate?.pickup_label || ""
    );
    setPickupCity(estimate?.pickupCity || estimate?.pickup_city || "");
    setPickupLat(
      estimate?.pickupLat !== null && estimate?.pickupLat !== undefined
        ? Number(estimate.pickupLat)
        : estimate?.pickup_lat !== null && estimate?.pickup_lat !== undefined
        ? Number(estimate.pickup_lat)
        : null
    );
    setPickupLon(
      estimate?.pickupLon !== null && estimate?.pickupLon !== undefined
        ? Number(estimate.pickupLon)
        : estimate?.pickup_lon !== null && estimate?.pickup_lon !== undefined
        ? Number(estimate.pickup_lon)
        : null
    );
    setPickupOtherInfo(
      estimate?.pickupOtherInfo || estimate?.pickup_other_info || ""
    );

    setDropoffLabel(
      estimate?.dropoffLabel ||
        estimate?.delivery ||
        estimate?.dropoff ||
        estimate?.dropoff_label ||
        ""
    );
    setDropoffCity(
      estimate?.dropoffCity ||
        estimate?.deliveryCity ||
        estimate?.dropoff_city ||
        ""
    );
    setDropoffLat(
      estimate?.dropoffLat !== null && estimate?.dropoffLat !== undefined
        ? Number(estimate.dropoffLat)
        : estimate?.dropoff_lat !== null && estimate?.dropoff_lat !== undefined
        ? Number(estimate.dropoff_lat)
        : null
    );
    setDropoffLon(
      estimate?.dropoffLon !== null && estimate?.dropoffLon !== undefined
        ? Number(estimate.dropoffLon)
        : estimate?.dropoff_lon !== null && estimate?.dropoff_lon !== undefined
        ? Number(estimate.dropoff_lon)
        : null
    );
    setDropoffOtherInfo(
      estimate?.dropoffOtherInfo || estimate?.dropoff_other_info || ""
    );

    setMaterial(estimate?.material || estimate?.material_name || "");
    setMaterialSpecification(
      estimate?.materialSpecification || estimate?.material_specification || ""
    );
    setMaterialsText(
      estimateData?.materialsText ||
        estimate?.materialsText ||
        (Array.isArray(estimate?.materials) ? estimate.materials.join(", ") : "") ||
        estimate?.materials_text ||
        estimate?.material ||
        ""
    );

    setWeightValue(
      safeValue(
        estimate?.weightValue ??
          estimate?.weight ??
          estimate?.weight_value ??
          estimateData?.weight,
        ""
      )
    );
    setWeightUnit(
      estimate?.weightUnit ||
        estimate?.weightType ||
        estimate?.weight_unit ||
        "ton"
    );

    setVehicleName(
      estimateData?.vehicleName ||
        estimate?.suggestedVehicle ||
        estimate?.vehicleName ||
        estimate?.vehicle_name ||
        ""
    );
    setDistance(
      estimateData?.distance || estimate?.distance || estimate?.route_distance || ""
    );
    setTransitTime(
      estimateData?.transitTime ||
        estimate?.transitTime ||
        estimate?.transit_time ||
        ""
    );
    setFinalCost(
      estimateData?.finalCost ||
        estimate?.finalCost ||
        estimate?.price ||
        estimate?.amount ||
        estimate?.final_cost ||
        ""
    );

    setLoadingDate(estimate?.loadingDate || estimate?.loading_date || "");
    setDocumentsAvailable(
      estimate?.documentsAvailable || estimate?.documents_available || ""
    );
    setDocumentsDetails(
      estimate?.documentsDetails || estimate?.documents_details || ""
    );
    setNotes(estimate?.notes || "");
  };

  const handleOpenEstimate = async (incomingSearchId) => {
    const valueToSearch = String(incomingSearchId || searchId || "").trim();

    if (!valueToSearch) {
      alert("Please enter Estimate ID or Booking ID");
      return;
    }

    try {
      setIsLoading(true);
      setPageError("");

      const response = await fetch("/api/get-internal-estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchId: valueToSearch,
        }),
      });

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Invalid JSON response:", text);
        throw new Error("Invalid server response. Please check terminal logs.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch estimate");
      }

      const estimate = data?.estimate || data?.data || data;

      if (!estimate) {
        throw new Error("Estimate not found");
      }

      applyEstimateToForm(estimate);
      setSearchId(
        estimate?.estimateId ||
          estimate?.estimateCode ||
          estimate?.estimate_code ||
          valueToSearch
      );
    } catch (error) {
      console.error("Open estimate error:", error);
      setPageError(error.message || "Something went wrong while fetching estimate");
      alert(error.message || "Something went wrong while fetching estimate");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const estimateIdFromUrl = searchParams.get("estimateId");
    if (!estimateIdFromUrl) return;

    setSearchId(estimateIdFromUrl);
    handleOpenEstimate(estimateIdFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleOpenLinkedBooking = () => {
    if (!linkedBookingCode || linkedBookingCode === "Not linked") {
      alert("No linked booking found");
      return;
    }

    router.push(
      `/internal-booking?search=${encodeURIComponent(String(linkedBookingCode))}`
    );
  };

  const handleCreateNewEstimate = () => {
    router.push("/internal-booking");
  };

  const handleDownloadPDF = async () => {
    const effectiveEstimateCode =
      estimateId && estimateId !== "Not generated yet" ? estimateId : searchId;

    if (!estimateRecordId && !effectiveEstimateCode) {
      alert("Please open an estimate first");
      return;
    }

    try {
      setIsDownloading(true);

      const response = await fetch("/api/download-internal-estimate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estimateRecordId,
          estimateCode: effectiveEstimateCode,
          searchId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }
        throw new Error(data.error || "Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${effectiveEstimateCode || "estimate"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download PDF error:", error);
      alert(error.message || "Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-gray-900">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 pt-4 md:px-6 md:pt-5 lg:px-8">
          <div className="overflow-hidden rounded-[24px] bg-red-700 shadow-sm">
            <div className="px-5 py-5 text-center md:px-6 md:py-6">
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-white md:text-3xl">
                Internal Estimate
              </h1>
              <p className="mt-2 text-sm text-white/90 md:text-base">
                WhatsApp Lead Estimate View
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6 md:py-10 lg:px-8">
        <div className="mx-auto max-w-[1000px]" ref={wrapperRef}>
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="border-b border-gray-100 px-5 py-6 md:px-8 md:py-8">
              <div className="mb-4 flex justify-center">
                <Link
                  href="/"
                  aria-label="Go to home page"
                  className="transition-transform duration-200 hover:scale-[1.03]"
                >
                  <Image
                    src="/logo-6.png"
                    alt="MJ Logistics"
                    width={110}
                    height={110}
                    className="h-auto w-auto object-contain"
                    priority
                  />
                </Link>
              </div>

              <h2 className="text-center text-xl font-bold text-gray-900 md:text-2xl">
                Estimate Details
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 md:text-base">
                Open, review, and print internal estimates generated from WhatsApp leads.
              </p>
            </div>

            <div className="px-5 py-6 md:px-8 md:py-8">
              <div className="grid gap-8">
                <div className="rounded-[20px] border border-gray-200 bg-gray-50 p-4 md:p-5">
                  <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800">
                        Search Estimate ID / Booking ID
                      </label>
                      <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Enter estimate ID or booking ID"
                        className="w-full rounded-[14px] border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-700"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEstimate()}
                        disabled={isLoading}
                        className="w-full rounded-[14px] bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isLoading ? "Opening..." : "Open Estimate"}
                      </button>
                    </div>
                  </div>

                  {pageError ? (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      {pageError}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[20px] border border-gray-200 bg-gray-50 p-4 md:p-5">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                        Estimate ID
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-900 md:text-base">
                        {estimateId}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                        Estimate Status
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-900 md:text-base">
                        {estimateStatus}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                        Linked Booking
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-900 md:text-base">
                        {linkedBookingCode}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                        Generated On
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-900 md:text-base">
                        {generatedOn}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-gray-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.08)] md:p-4">
                  <div className="rounded-[16px] border border-red-100 bg-red-50/50 px-4 py-4 text-center md:px-5 md:py-4.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 md:text-xs">
                      Estimated Cost
                    </p>
                    <p className="mt-1.5 text-2xl font-bold text-red-700 sm:text-3xl md:text-4xl">
                      PKR {formatCurrency(finalCost)}
                    </p>
                    <p className="mt-1 text-xs text-gray-600 md:text-sm">
                      Based on saved route and shipment requirements
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
                          {safeValue(fullName)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Phone
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                          {safeValue(contactNumber)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Email
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                          {safeValue(email)}
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
                            {safeValue(weightDisplay)}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                          <span className="text-xs text-gray-500">Material Type</span>
                          <span className="text-right text-xs font-semibold text-gray-900">
                            {safeValue(materialsText || material)}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                          <span className="text-xs text-gray-500">Material Specification</span>
                          <span className="text-right text-xs font-semibold text-gray-900">
                            {safeValue(materialSpecification)}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                          <span className="text-xs text-gray-500">Route</span>
                          <span className="text-right text-xs font-semibold text-gray-900">
                            {pickupDisplay} → {dropoffDisplay}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
                          <span className="text-xs text-gray-500">Distance</span>
                          <span className="text-right text-xs font-semibold text-gray-900">
                            {safeValue(distance)}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs text-gray-500">Loading Date</span>
                          <span className="text-right text-xs font-semibold text-gray-900">
                            {formatLoadingDate(loadingDate)}
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
                            {safeValue(vehicleName)}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs text-gray-500">Transit Time</span>
                          <span className="text-right text-xs font-semibold text-gray-900">
                            {safeValue(transitTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-[16px] border border-gray-200 bg-gray-50 p-3 md:p-4">
                    <h3 className="text-sm font-bold text-gray-900 md:text-base">
                      Location Details
                    </h3>

                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div className="rounded-[14px] border border-gray-200 bg-white p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Pickup Location
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap">
                          {safeValue(pickupLabel)}
                        </p>

                        <p className="mt-4 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Pickup Other Info
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap">
                          {safeValue(pickupOtherInfo)}
                        </p>
                      </div>

                      <div className="rounded-[14px] border border-gray-200 bg-white p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Drop-off Location
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap">
                          {safeValue(dropoffLabel)}
                        </p>

                        <p className="mt-4 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Drop-off Other Info
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap">
                          {safeValue(dropoffOtherInfo)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-[16px] border border-gray-200 bg-gray-50 p-3 md:p-4">
                    <h3 className="text-sm font-bold text-gray-900 md:text-base">
                      Documents & Notes
                    </h3>

                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div className="rounded-[14px] border border-gray-200 bg-white p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Documents Available
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {safeValue(documentsAvailable)}
                        </p>
                      </div>

                      <div className="rounded-[14px] border border-gray-200 bg-white p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Documents Details
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap">
                          {safeValue(documentsDetails)}
                        </p>
                      </div>

                      <div className="rounded-[14px] border border-gray-200 bg-white p-4 md:col-span-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Additional Notes
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap">
                          {safeValue(notes)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-[14px] border border-amber-100 bg-amber-50 px-4 py-2.5">
                    <p className="text-center text-xs text-amber-900">
                      Prices are indicative and subject to route inspection, fuel fluctuation, vehicle availability, and operational constraints.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center">
                    <button
                      type="button"
                      onClick={handleOpenLinkedBooking}
                      className={buttonClass}
                    >
                      Open Linked Booking
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateNewEstimate}
                      className={buttonClass}
                    >
                      New Estimate
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className={buttonClass}
                    >
                      {isDownloading ? "Downloading..." : "Download PDF"}
                    </button>
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">Internal Use • Secure • Fast</p>
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
          </div>
        </div>
      </section>
    </main>
  );
}

export default function InternalEstimatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <InternalEstimateContent />
    </Suspense>
  );
}