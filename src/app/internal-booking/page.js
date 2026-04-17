"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

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

function normalizeValue(value) {
    return String(value ?? "").trim();
}

export default function InternalBookingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchId, setSearchId] = useState("");

    const [recordId, setRecordId] = useState(null);
    const [bookingId, setBookingId] = useState("Not generated yet");
    const [bookingStatus, setBookingStatus] = useState("New Entry");
    const [linkedEstimate, setLinkedEstimate] = useState(
        "Will link after estimate creation"
    );
    const [generatedOn, setGeneratedOn] = useState(getCurrentDateTime());

    const [name, setName] = useState("");
    const [contactNumber, setContactNumber] = useState("");

    const [pickup, setPickup] = useState("");
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [pickupLocation, setPickupLocation] = useState(null);
    const [pickupOtherInfo, setPickupOtherInfo] = useState("");

    const [dropoff, setDropoff] = useState("");
    const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
    const [dropoffLocation, setDropoffLocation] = useState(null);
    const [dropoffOtherInfo, setDropoffOtherInfo] = useState("");

    const [activeField, setActiveField] = useState(null);

    const [material, setMaterial] = useState("");
    const [materialSpecification, setMaterialSpecification] = useState("");
    const [weight, setWeight] = useState("");
    const [weightUnit, setWeightUnit] = useState("ton");

    const [suggestedVehicle, setSuggestedVehicle] = useState("");
    const [manualPrice, setManualPrice] = useState("");
    const [loadingDate, setLoadingDate] = useState(getTodayDate());

    const [documentsAvailable, setDocumentsAvailable] = useState("yes");
    const [documentsDetails, setDocumentsDetails] = useState("");
    const [notes, setNotes] = useState("");

    const [initialFormSnapshot, setInitialFormSnapshot] = useState(null);

    const [errors, setErrors] = useState({});
    const [savingBooking, setSavingBooking] = useState(false);
    const [generatingEstimate, setGeneratingEstimate] = useState(false);

    const wrapperRef = useRef(null);

    const inputClass = (fieldName) =>
        `w-full rounded-[14px] border px-4 py-3 text-sm outline-none transition ${errors[fieldName]
            ? "border-red-500 focus:border-red-600"
            : "border-gray-300 focus:border-red-700"
        }`;

    const textareaClass = (fieldName) =>
        `w-full resize-none rounded-[14px] border px-4 py-3 text-sm outline-none transition ${errors[fieldName]
            ? "border-red-500 focus:border-red-600"
            : "border-gray-300 focus:border-red-700"
        }`;

    const getErrorText = (fieldName) =>
        errors[fieldName] ? (
            <p className="mt-1 text-xs font-medium text-red-600">{errors[fieldName]}</p>
        ) : null;

    const clearFieldError = (fieldName) => {
        setErrors((prev) => {
            if (!prev[fieldName]) return prev;
            const next = { ...prev };
            delete next[fieldName];
            return next;
        });
    };

    const buildFormSnapshot = (override = {}) => ({
        name: normalizeValue(override.name ?? name),
        contactNumber: normalizeValue(override.contactNumber ?? contactNumber),

        pickupInput: normalizeValue(override.pickup ?? pickup),
        pickupLabel: normalizeValue(
            override.pickupLabel ?? pickupLocation?.label ?? pickup
        ),
        pickupCity: normalizeValue(
            override.pickupCity ?? pickupLocation?.city ?? ""
        ),
        pickupLat:
            override.pickupLat !== undefined
                ? override.pickupLat
                : pickupLocation?.lat ?? null,
        pickupLon:
            override.pickupLon !== undefined
                ? override.pickupLon
                : pickupLocation?.lon ?? null,
        pickupOtherInfo: normalizeValue(
            override.pickupOtherInfo ?? pickupOtherInfo
        ),

        dropoffInput: normalizeValue(override.dropoff ?? dropoff),
        dropoffLabel: normalizeValue(
            override.dropoffLabel ?? dropoffLocation?.label ?? dropoff
        ),
        dropoffCity: normalizeValue(
            override.dropoffCity ?? dropoffLocation?.city ?? ""
        ),
        dropoffLat:
            override.dropoffLat !== undefined
                ? override.dropoffLat
                : dropoffLocation?.lat ?? null,
        dropoffLon:
            override.dropoffLon !== undefined
                ? override.dropoffLon
                : dropoffLocation?.lon ?? null,
        dropoffOtherInfo: normalizeValue(
            override.dropoffOtherInfo ?? dropoffOtherInfo
        ),

        material: normalizeValue(override.material ?? material),
        materialSpecification: normalizeValue(
            override.materialSpecification ?? materialSpecification
        ),

        weight: normalizeValue(override.weight ?? weight),
        weightUnit: normalizeValue(override.weightUnit ?? weightUnit),

        suggestedVehicle: normalizeValue(
            override.suggestedVehicle ?? suggestedVehicle
        ),
        manualPrice: normalizeValue(override.manualPrice ?? manualPrice),
        loadingDate: normalizeValue(override.loadingDate ?? loadingDate),

        documentsAvailable: normalizeValue(
            override.documentsAvailable ?? documentsAvailable
        ),
        documentsDetails: normalizeValue(
            override.documentsDetails ?? documentsDetails
        ),
        notes: normalizeValue(override.notes ?? notes),
    });

    const hasLinkedEstimate =
        linkedEstimate &&
        linkedEstimate !== "Will link after estimate creation" &&
        linkedEstimate.trim() !== "";

    const currentSnapshot = useMemo(
        () => buildFormSnapshot(),
        [
            name,
            contactNumber,
            pickup,
            pickupLocation,
            pickupOtherInfo,
            dropoff,
            dropoffLocation,
            dropoffOtherInfo,
            material,
            materialSpecification,
            weight,
            weightUnit,
            suggestedVehicle,
            manualPrice,
            loadingDate,
            documentsAvailable,
            documentsDetails,
            notes,
        ]
    );

    const hasFormChanges = useMemo(() => {
        if (!initialFormSnapshot) {
            return (
                normalizeValue(name) !== "" ||
                normalizeValue(contactNumber) !== "" ||
                normalizeValue(pickup) !== "" ||
                normalizeValue(dropoff) !== "" ||
                normalizeValue(material) !== "" ||
                normalizeValue(weight) !== "" ||
                normalizeValue(suggestedVehicle) !== "" ||
                normalizeValue(manualPrice) !== "" ||
                normalizeValue(documentsDetails) !== "" ||
                normalizeValue(notes) !== ""
            );
        }

        return JSON.stringify(currentSnapshot) !== JSON.stringify(initialFormSnapshot);
    }, [
        initialFormSnapshot,
        currentSnapshot,
        name,
        contactNumber,
        pickup,
        dropoff,
        material,
        weight,
        suggestedVehicle,
        manualPrice,
        documentsDetails,
        notes,
    ]);

    const hasManualOverride =
        normalizeValue(suggestedVehicle) !== "" &&
        normalizeValue(manualPrice) !== "";

    const estimateActionLabel = hasLinkedEstimate
        ? "Update Estimate"
        : "Generate Estimate";

    const disableEstimateAction =
        savingBooking ||
        generatingEstimate ||
        (hasLinkedEstimate && !hasFormChanges);

    const syncSnapshotFromBooking = (booking) => {
        const nextSnapshot = buildFormSnapshot({
            name: booking.fullName || "",
            contactNumber: booking.contactNumber || "",

            pickup: booking.pickupLabel || "",
            pickupLabel: booking.pickupLabel || "",
            pickupCity: booking.pickupCity || "",
            pickupLat:
                booking.pickupLat !== null && booking.pickupLat !== undefined
                    ? Number(booking.pickupLat)
                    : null,
            pickupLon:
                booking.pickupLon !== null && booking.pickupLon !== undefined
                    ? Number(booking.pickupLon)
                    : null,
            pickupOtherInfo: booking.pickupOtherInfo || "",

            dropoff: booking.dropoffLabel || "",
            dropoffLabel: booking.dropoffLabel || "",
            dropoffCity: booking.dropoffCity || "",
            dropoffLat:
                booking.dropoffLat !== null && booking.dropoffLat !== undefined
                    ? Number(booking.dropoffLat)
                    : null,
            dropoffLon:
                booking.dropoffLon !== null && booking.dropoffLon !== undefined
                    ? Number(booking.dropoffLon)
                    : null,
            dropoffOtherInfo: booking.dropoffOtherInfo || "",

            material: booking.material || "",
            materialSpecification: booking.materialSpecification || "",

            weight:
                booking.weightValue !== null && booking.weightValue !== undefined
                    ? String(booking.weightValue)
                    : "",
            weightUnit: booking.weightUnit || "ton",

            suggestedVehicle: booking.suggestedVehicle || "",
            manualPrice:
                booking.manualPrice !== null && booking.manualPrice !== undefined
                    ? String(booking.manualPrice)
                    : "",
            loadingDate: booking.loadingDate || getTodayDate(),

            documentsAvailable: booking.documentsAvailable || "yes",
            documentsDetails: booking.documentsDetails || "",
            notes: booking.notes || "",
        });

        setInitialFormSnapshot(nextSnapshot);
    };

    const applyBookingToForm = (booking) => {
        setRecordId(booking.id ?? null);
        setBookingId(booking.bookingCode || "Not generated yet");
        setBookingStatus(booking.bookingStatus || "New Entry");
        setLinkedEstimate(
            booking.linkedEstimateCode || "Will link after estimate creation"
        );
        setGeneratedOn(formatDateTime(booking.generatedOn || booking.createdAt));

        setName(booking.fullName || "");
        setContactNumber(booking.contactNumber || "");

        setPickup(booking.pickupLabel || "");
        setPickupLocation(
            booking.pickupLabel
                ? {
                    label: booking.pickupLabel || "",
                    city: booking.pickupCity || "",
                    lat:
                        booking.pickupLat !== null &&
                            booking.pickupLat !== undefined
                            ? Number(booking.pickupLat)
                            : null,
                    lon:
                        booking.pickupLon !== null &&
                            booking.pickupLon !== undefined
                            ? Number(booking.pickupLon)
                            : null,
                }
                : null
        );
        setPickupOtherInfo(booking.pickupOtherInfo || "");
        setPickupSuggestions([]);

        setDropoff(booking.dropoffLabel || "");
        setDropoffLocation(
            booking.dropoffLabel
                ? {
                    label: booking.dropoffLabel || "",
                    city: booking.dropoffCity || "",
                    lat:
                        booking.dropoffLat !== null &&
                            booking.dropoffLat !== undefined
                            ? Number(booking.dropoffLat)
                            : null,
                    lon:
                        booking.dropoffLon !== null &&
                            booking.dropoffLon !== undefined
                            ? Number(booking.dropoffLon)
                            : null,
                }
                : null
        );
        setDropoffOtherInfo(booking.dropoffOtherInfo || "");
        setDropoffSuggestions([]);

        setMaterial(booking.material || "");
        setMaterialSpecification(booking.materialSpecification || "");
        setWeight(
            booking.weightValue !== null && booking.weightValue !== undefined
                ? String(booking.weightValue)
                : ""
        );
        setWeightUnit(booking.weightUnit || "ton");

        setSuggestedVehicle(booking.suggestedVehicle || "");
        setManualPrice(
            booking.manualPrice !== null && booking.manualPrice !== undefined
                ? String(booking.manualPrice)
                : ""
        );
        setLoadingDate(booking.loadingDate || getTodayDate());

        setDocumentsAvailable(booking.documentsAvailable || "yes");
        setDocumentsDetails(booking.documentsDetails || "");
        setNotes(booking.notes || "");

        setActiveField(null);
        setErrors({});
        syncSnapshotFromBooking(booking);
    };

    const resetFormFields = () => {
        setName("");
        setContactNumber("");

        setPickup("");
        setPickupSuggestions([]);
        setPickupLocation(null);
        setPickupOtherInfo("");

        setDropoff("");
        setDropoffSuggestions([]);
        setDropoffLocation(null);
        setDropoffOtherInfo("");

        setActiveField(null);

        setMaterial("");
        setMaterialSpecification("");
        setWeight("");
        setWeightUnit("ton");

        setSuggestedVehicle("");
        setManualPrice("");
        setLoadingDate(getTodayDate());

        setDocumentsAvailable("yes");
        setDocumentsDetails("");
        setNotes("");
        setErrors({});
        setInitialFormSnapshot(null);
    };

    const handleReset = () => {
        resetFormFields();
        setRecordId(null);
        setBookingId("Not generated yet");
        setBookingStatus("New Entry");
        setLinkedEstimate("Will link after estimate creation");
        setGeneratedOn(getCurrentDateTime());
        setSearchId("");
    };

    const handleOpenBooking = async () => {
        const trimmedSearchId = searchId.trim();

        if (!trimmedSearchId) {
            alert("Please enter Booking ID or Estimate ID");
            return;
        }

        try {
            const response = await fetch("/api/get-internal-booking", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    searchId: trimmedSearchId,
                }),
            });

            const text = await response.text();
            let data = {};

            try {
                data = text ? JSON.parse(text) : {};
            } catch (parseError) {
                console.error("Invalid JSON response:", text);
                alert("Invalid server response. Please check terminal logs.");
                return;
            }

            if (!response.ok) {
                alert(data.error || "Failed to fetch booking");
                return;
            }

            applyBookingToForm(data.booking);
            alert("Booking loaded successfully");
        } catch (error) {
            console.error("Open booking error:", error);
            alert("Something went wrong while fetching booking");
        }
    };

    const handleCheckEstimate = () => {
        if (!hasLinkedEstimate) return;

        router.push(
            `/internal-estimate?estimateId=${encodeURIComponent(linkedEstimate)}`
        );
    };

    useEffect(() => {
        const searchFromUrl = searchParams.get("search");

        if (searchFromUrl && searchFromUrl !== searchId) {
            setSearchId(searchFromUrl);
        }
    }, [searchParams, searchId]);

    useEffect(() => {
        const searchFromUrl = searchParams.get("search");
        if (!searchFromUrl) return;

        const loadBookingFromUrl = async () => {
            try {
                const response = await fetch("/api/get-internal-booking", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        searchId: searchFromUrl,
                    }),
                });

                const text = await response.text();
                let data = {};

                try {
                    data = text ? JSON.parse(text) : {};
                } catch (parseError) {
                    console.error("Invalid JSON response:", text);
                    return;
                }

                if (!response.ok) return;

                applyBookingToForm(data.booking);
            } catch (error) {
                console.error("Auto-open booking error:", error);
            }
        };

        loadBookingFromUrl();
    }, [searchParams]);

    const validateSaveBooking = () => {
        const nextErrors = {};

        if (!name.trim()) {
            nextErrors.name = "Name is required";
        }

        if (!contactNumber.trim()) {
            nextErrors.contactNumber = "Contact Number is required";
        }

        if (!pickup.trim() || !pickupLocation) {
            nextErrors.pickup = "Please select Pickup Location from the dropdown";
        }

        if (!dropoff.trim() || !dropoffLocation) {
            nextErrors.dropoff = "Please select Drop-off Location from the dropdown";
        }

        if (!material.trim()) {
            nextErrors.material = "Material is required";
        }

        if (!weight.trim()) {
            nextErrors.weight = "Weight is required";
        } else if (Number(weight) <= 0) {
            nextErrors.weight = "Weight must be greater than 0";
        }

        if (!weightUnit.trim()) {
            nextErrors.weightUnit = "Unit is required";
        }

        if (!loadingDate) {
            nextErrors.loadingDate = "Loading Date is required";
        }

        if (manualPrice.trim() !== "" && Number(manualPrice) < 0) {
            nextErrors.manualPrice = "Manual Price cannot be negative";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const saveBookingToDatabase = async ({
        showSuccessAlert = true,
        markEstimateGenerated = false,
    } = {}) => {
        if (!validateSaveBooking()) return null;

        const response = await fetch("/api/save-internal-booking", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: recordId,
                bookingStatus,
                linkedEstimateCode:
                    linkedEstimate === "Will link after estimate creation"
                        ? null
                        : linkedEstimate,

                fullName: name,
                contactNumber,

                pickupLabel: pickupLocation?.label || pickup,
                pickupCity: pickupLocation?.city || null,
                pickupLat: pickupLocation?.lat ?? null,
                pickupLon: pickupLocation?.lon ?? null,
                pickupOtherInfo,

                dropoffLabel: dropoffLocation?.label || dropoff,
                dropoffCity: dropoffLocation?.city || "",
                dropoffLat: dropoffLocation?.lat ?? null,
                dropoffLon: dropoffLocation?.lon ?? null,
                dropoffOtherInfo,

                material,
                materialSpecification,

                weightValue: weight,
                weightUnit,

                suggestedVehicle,
                manualPrice,
                loadingDate,

                documentsAvailable,
                documentsDetails,
                notes,

                isEstimateGenerated: Boolean(markEstimateGenerated),
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
            throw new Error(data.error || "Failed to save booking");
        }

        setRecordId(data.booking.id);
        setBookingId(data.booking.bookingCode || "Not generated yet");
        setBookingStatus(data.booking.bookingStatus || "Saved");
        setLinkedEstimate(
            data.booking.linkedEstimateCode || "Will link after estimate creation"
        );
        setGeneratedOn(formatDateTime(data.booking.generatedOn));

        syncSnapshotFromBooking({
            ...data.booking,
            fullName: name,
            contactNumber,
            pickupLabel: pickupLocation?.label || pickup,
            pickupCity: pickupLocation?.city || "",
            pickupLat: pickupLocation?.lat ?? null,
            pickupLon: pickupLocation?.lon ?? null,
            pickupOtherInfo,
            dropoffLabel: dropoffLocation?.label || dropoff,
            dropoffCity: dropoffLocation?.city || "",
            dropoffLat: dropoffLocation?.lat ?? null,
            dropoffLon: dropoffLocation?.lon ?? null,
            dropoffOtherInfo,
            material,
            materialSpecification,
            weightValue: weight,
            weightUnit,
            suggestedVehicle,
            manualPrice,
            loadingDate,
            documentsAvailable,
            documentsDetails,
            notes,
        });

        if (showSuccessAlert) {
            alert(
                data.mode === "create"
                    ? "Booking saved successfully"
                    : "Booking updated successfully"
            );
        }

        return data.booking;
    };


    const handleEstimateAction = async () => {
        if (disableEstimateAction) return;
        if (!validateSaveBooking()) return;

        try {
            setGeneratingEstimate(true);

            const savedBooking = await saveBookingToDatabase({
                showSuccessAlert: false,
                markEstimateGenerated: true,
            });

            if (!savedBooking?.id || !savedBooking?.bookingCode) {
                throw new Error("Booking could not be saved before estimate action");
            }

            const estimatePayload = {
                linkedBookingId: savedBooking.id,
                linkedBookingCode: savedBooking.bookingCode,
                linkedEstimateCode: hasLinkedEstimate ? linkedEstimate : null,

                fullName: name,
                contactNumber,
                phone: contactNumber,
                email: "",

                pickup: pickup,
                delivery: dropoff,

                pickupLabel: pickupLocation?.label || pickup,
                pickupCity: pickupLocation?.city || "",
                pickupLat: pickupLocation?.lat ?? null,
                pickupLon: pickupLocation?.lon ?? null,
                pickupOtherInfo,

                dropoffLabel: dropoffLocation?.label || dropoff,
                dropoffCity: dropoffLocation?.city || "",
                dropoffLat: dropoffLocation?.lat ?? null,
                dropoffLon: dropoffLocation?.lon ?? null,
                dropoffOtherInfo,

                material,
                materialSpecification,
                materials: material ? [material] : [],

                weight: weight,
                weightValue: weight,
                weightType: weightUnit,
                weightUnit: weightUnit,

                suggestedVehicle,
                manualPrice,
                hasManualOverride,

                loadingDate,

                documentsAvailable,
                documentsDetails,
                notes,

                leadSource: "whatsapp",
            };

            const endpoint = hasLinkedEstimate
                ? "/api/update-internal-estimate"
                : "/api/save-internal-estimate";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(estimatePayload),
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
                throw new Error(
                    data.error ||
                    (hasLinkedEstimate
                        ? "Failed to update estimate"
                        : "Failed to generate estimate")
                );
            }

            const returnedEstimateCode =
                data?.estimateId ||
                data?.estimate?.estimateCode ||
                data?.estimateCode ||
                linkedEstimate ||
                "";

            if (!returnedEstimateCode) {
                throw new Error(
                    hasLinkedEstimate
                        ? "Estimate updated but estimate code was not returned"
                        : "Estimate generated but estimate code was not returned"
                );
            }

            setLinkedEstimate(returnedEstimateCode);
            setBookingStatus("Estimate Generated");

            syncSnapshotFromBooking({
                id: savedBooking.id,
                bookingCode: savedBooking.bookingCode,
                bookingStatus: "Estimate Generated",
                linkedEstimateCode: returnedEstimateCode,
                generatedOn: savedBooking.generatedOn,
                createdAt: savedBooking.createdAt,
                updatedAt: savedBooking.updatedAt,

                fullName: name,
                contactNumber,

                pickupLabel: pickupLocation?.label || pickup,
                pickupCity: pickupLocation?.city || "",
                pickupLat: pickupLocation?.lat ?? null,
                pickupLon: pickupLocation?.lon ?? null,
                pickupOtherInfo,

                dropoffLabel: dropoffLocation?.label || dropoff,
                dropoffCity: dropoffLocation?.city || "",
                dropoffLat: dropoffLocation?.lat ?? null,
                dropoffLon: dropoffLocation?.lon ?? null,
                dropoffOtherInfo,

                material,
                materialSpecification,

                weightValue: weight,
                weightUnit,

                suggestedVehicle,
                manualPrice,
                loadingDate,

                documentsAvailable,
                documentsDetails,
                notes,
            });

            router.push(
                `/internal-estimate?estimateId=${encodeURIComponent(returnedEstimateCode)}`
            );
        } catch (error) {
            console.error("Estimate action error:", error);
            alert(
                error.message ||
                "Something went wrong while processing the estimate"
            );
        } finally {
            setGeneratingEstimate(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setPickupSuggestions([]);
                setDropoffSuggestions([]);
                setActiveField(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (activeField === "pickup" && pickup.trim().length >= 2) {
                fetch(`/api/places?text=${encodeURIComponent(pickup)}`)
                    .then((res) => res.json())
                    .then((data) => {
                        setPickupSuggestions(
                            Array.isArray(data?.results) ? data.results : []
                        );
                    })
                    .catch(() => setPickupSuggestions([]));
            } else {
                setPickupSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [pickup, activeField]);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (activeField === "dropoff" && dropoff.trim().length >= 2) {
                fetch(`/api/places?text=${encodeURIComponent(dropoff)}`)
                    .then((res) => res.json())
                    .then((data) => {
                        setDropoffSuggestions(
                            Array.isArray(data?.results) ? data.results : []
                        );
                    })
                    .catch(() => setDropoffSuggestions([]));
            } else {
                setDropoffSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [dropoff, activeField]);

    if (generatingEstimate) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white px-4">
                <div className="text-center">
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
                        <div className="animate-pulse">
                            <img
                                src="/logo-6.png"
                                alt="MJ Logistics"
                                className="h-[72px] w-[72px] object-contain"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-red-700 [animation-delay:-0.3s]"></span>
                        <span className="mx-2 h-2.5 w-2.5 animate-bounce rounded-full bg-red-700 [animation-delay:-0.15s]"></span>
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-red-700"></span>
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-gray-900 md:text-2xl">
                        {hasLinkedEstimate ? "Updating Estimate" : "Generating Estimate"}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600 md:text-base">
                        Please wait while we process your booking and prepare the estimate record.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f8fafc] text-gray-900">
            <section className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-[1400px] px-4 pt-4 md:px-6 md:pt-5 lg:px-8">
                    <div className="overflow-hidden rounded-[24px] bg-red-700 shadow-sm">
                        <div className="px-5 py-5 text-center md:px-6 md:py-6">
                            <h1 className="text-2xl font-bold tracking-[-0.03em] text-white md:text-3xl">
                                Internal Booking
                            </h1>
                            <p className="mt-2 text-sm text-white/90 md:text-base">
                                WhatsApp Lead Entry Form
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-8 md:px-6 md:py-10 lg:px-8">
                <div className="mx-auto max-w-[1000px]" ref={wrapperRef}>
                    <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                        <div className="border-b border-gray-100 px-5 py-6 md:px-8 md:py-8">
                            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
                                Booking Details
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 md:text-base">
                                Enter the customer and shipment details received on WhatsApp.
                            </p>
                        </div>

                        <div className="px-5 py-6 md:px-8 md:py-8">
                            <div className="grid gap-8">
                                <div className="rounded-[20px] border border-gray-200 bg-gray-50 p-4 md:p-5">
                                    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Search Booking ID / Estimate ID
                                            </label>
                                            <input
                                                type="text"
                                                value={searchId}
                                                onChange={(e) => setSearchId(e.target.value)}
                                                placeholder="Enter booking ID or estimate ID"
                                                className="w-full rounded-[14px] border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-700"
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={handleOpenBooking}
                                                disabled={savingBooking || generatingEstimate}
                                                className="w-full rounded-[14px] bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                Open Booking
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[20px] border border-gray-200 bg-gray-50 p-4 md:p-5">
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                                                Booking ID
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-gray-900 md:text-base">
                                                {bookingId}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                                                Booking Status
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-gray-900 md:text-base">
                                                {bookingStatus}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                                                Linked Estimate
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-gray-900 md:text-base">
                                                {linkedEstimate}
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

                                <div>
                                    <h3 className="mb-4 text-lg font-bold text-gray-900">
                                        Customer Details
                                    </h3>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Name <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => {
                                                    setName(e.target.value);
                                                    clearFieldError("name");
                                                }}
                                                placeholder="Enter customer name"
                                                className={inputClass("name")}
                                            />
                                            {getErrorText("name")}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Contact Number <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={contactNumber}
                                                onChange={(e) => {
                                                    setContactNumber(e.target.value);
                                                    clearFieldError("contactNumber");
                                                }}
                                                placeholder="Enter contact number"
                                                className={inputClass("contactNumber")}
                                            />
                                            {getErrorText("contactNumber")}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 text-lg font-bold text-gray-900">
                                        Route Details
                                    </h3>

                                    <div className="grid gap-5">
                                        <div className="relative">
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Pickup Location <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={pickup}
                                                onChange={(e) => {
                                                    setPickup(e.target.value);
                                                    setPickupLocation(null);
                                                    setActiveField("pickup");
                                                    clearFieldError("pickup");
                                                }}
                                                onFocus={() => setActiveField("pickup")}
                                                placeholder="Search pickup location"
                                                className={inputClass("pickup")}
                                            />

                                            {activeField === "pickup" &&
                                                pickupSuggestions.length > 0 && (
                                                    <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-[14px] border border-gray-200 bg-white shadow-xl">
                                                        {pickupSuggestions.map((item, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onClick={() => {
                                                                    setPickup(item.label);
                                                                    setPickupLocation(item);
                                                                    setPickupSuggestions([]);
                                                                    setActiveField(null);
                                                                    clearFieldError("pickup");
                                                                }}
                                                                className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-800 hover:bg-gray-50"
                                                            >
                                                                {item.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            {getErrorText("pickup")}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Other Pickup Info
                                            </label>
                                            <textarea
                                                value={pickupOtherInfo}
                                                onChange={(e) => setPickupOtherInfo(e.target.value)}
                                                placeholder="Factory name, gate number, landmark, loading details, timing, etc."
                                                rows={4}
                                                className={textareaClass("pickupOtherInfo")}
                                            />
                                        </div>

                                        <div className="relative">
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Drop-off Location <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={dropoff}
                                                onChange={(e) => {
                                                    setDropoff(e.target.value);
                                                    setDropoffLocation(null);
                                                    setActiveField("dropoff");
                                                    clearFieldError("dropoff");
                                                }}
                                                onFocus={() => setActiveField("dropoff")}
                                                placeholder="Search drop-off location"
                                                className={inputClass("dropoff")}
                                            />

                                            {activeField === "dropoff" &&
                                                dropoffSuggestions.length > 0 && (
                                                    <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-[14px] border border-gray-200 bg-white shadow-xl">
                                                        {dropoffSuggestions.map((item, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onClick={() => {
                                                                    setDropoff(item.label);
                                                                    setDropoffLocation(item);
                                                                    setDropoffSuggestions([]);
                                                                    setActiveField(null);
                                                                    clearFieldError("dropoff");
                                                                }}
                                                                className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-800 hover:bg-gray-50"
                                                            >
                                                                {item.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            {getErrorText("dropoff")}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Other Drop-off Info
                                            </label>
                                            <textarea
                                                value={dropoffOtherInfo}
                                                onChange={(e) => setDropoffOtherInfo(e.target.value)}
                                                placeholder="Warehouse, landmark, unloading details, timing, etc."
                                                rows={4}
                                                className={textareaClass("dropoffOtherInfo")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 text-lg font-bold text-gray-900">
                                        Load Details
                                    </h3>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Material <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={material}
                                                onChange={(e) => {
                                                    setMaterial(e.target.value);
                                                    clearFieldError("material");
                                                }}
                                                placeholder="Enter material"
                                                className={inputClass("material")}
                                            />
                                            {getErrorText("material")}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Material Specification
                                            </label>
                                            <input
                                                type="text"
                                                value={materialSpecification}
                                                onChange={(e) =>
                                                    setMaterialSpecification(e.target.value)
                                                }
                                                placeholder="Enter material specification"
                                                className={inputClass("materialSpecification")}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-5 md:grid-cols-[1fr_180px]">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Weight <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={weight}
                                                onChange={(e) => {
                                                    setWeight(e.target.value);
                                                    clearFieldError("weight");
                                                }}
                                                placeholder="Enter weight"
                                                className={inputClass("weight")}
                                            />
                                            {getErrorText("weight")}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Unit <span className="text-red-600">*</span>
                                            </label>
                                            <select
                                                value={weightUnit}
                                                onChange={(e) => {
                                                    setWeightUnit(e.target.value);
                                                    clearFieldError("weightUnit");
                                                }}
                                                className={inputClass("weightUnit")}
                                            >
                                                <option value="ton">Tons</option>
                                                <option value="kg">Kgs</option>
                                            </select>
                                            {getErrorText("weightUnit")}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 text-lg font-bold text-gray-900">
                                        Transport & Schedule
                                    </h3>

                                    <div className="grid gap-5 md:grid-cols-3">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Suggested Vehicle
                                            </label>
                                            <input
                                                type="text"
                                                value={suggestedVehicle}
                                                onChange={(e) => setSuggestedVehicle(e.target.value)}
                                                placeholder="Vehicle will be suggested / can be entered manually"
                                                className={inputClass("suggestedVehicle")}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Manual Price
                                            </label>
                                            <input
                                                type="number"
                                                value={manualPrice}
                                                onChange={(e) => {
                                                    setManualPrice(e.target.value);
                                                    clearFieldError("manualPrice");
                                                }}
                                                placeholder="Enter manual price"
                                                className={inputClass("manualPrice")}
                                            />
                                            {getErrorText("manualPrice")}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Loading Date <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={loadingDate}
                                                onChange={(e) => {
                                                    setLoadingDate(e.target.value);
                                                    clearFieldError("loadingDate");
                                                }}
                                                className={inputClass("loadingDate")}
                                            />
                                            {getErrorText("loadingDate")}
                                        </div>
                                    </div>

                                    {hasManualOverride && (
                                        <p className="mt-3 text-xs font-medium text-amber-700">
                                            Manual override is active. Estimate should use Suggested Vehicle and Manual Price instead of automatic pricing logic.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="mb-4 text-lg font-bold text-gray-900">
                                        Documents & Notes
                                    </h3>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Required Documents Available?
                                            </label>
                                            <select
                                                value={documentsAvailable}
                                                onChange={(e) =>
                                                    setDocumentsAvailable(e.target.value)
                                                }
                                                className={inputClass("documentsAvailable")}
                                            >
                                                <option value="yes">Yes</option>
                                                <option value="no">No</option>
                                                <option value="not_sure">Not Sure</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                                Documents Details
                                            </label>
                                            <input
                                                type="text"
                                                value={documentsDetails}
                                                onChange={(e) =>
                                                    setDocumentsDetails(e.target.value)
                                                }
                                                placeholder="Invoice, customs papers, machinery papers, etc."
                                                className={inputClass("documentsDetails")}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <label className="mb-2 block text-sm font-semibold text-gray-800">
                                            Additional Notes
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Any additional information from WhatsApp conversation"
                                            rows={5}
                                            className={textareaClass("notes")}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 border-t border-gray-100 pt-6">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={savingBooking || generatingEstimate}
                                        className="w-full rounded-[14px] border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        Reset Form
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCheckEstimate}
                                        disabled={
                                            !hasLinkedEstimate ||
                                            savingBooking ||
                                            generatingEstimate
                                        }
                                        className="w-full rounded-[14px] border border-gray-900 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Check Estimate
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleEstimateAction}
                                        disabled={disableEstimateAction}
                                        className="w-full rounded-[14px] bg-red-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {generatingEstimate
                                            ? hasLinkedEstimate
                                                ? "Updating Estimate..."
                                                : "Generating Estimate..."
                                            : estimateActionLabel}
                                    </button>

                                    {hasLinkedEstimate && !hasFormChanges && (
                                        <p className="text-center text-xs font-medium text-gray-500">
                                            No booking changes detected. Update Estimate is disabled.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}