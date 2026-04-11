"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

function EnterDetailsContent() {
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  const pickupFull = searchParams.get("pickup") || "";
  const deliveryFull = searchParams.get("delivery") || "";
  const pickupCity = searchParams.get("pickupCity") || "";
  const deliveryCity = searchParams.get("deliveryCity") || "";
  const weight = searchParams.get("weight") || "";
  const weightType = searchParams.get("type") || "ton";
  const materialsParam = searchParams.get("materials") || "[]";

  const pickupLat = searchParams.get("pickupLat") || "";
  const pickupLon = searchParams.get("pickupLon") || "";
  const deliveryLat = searchParams.get("deliveryLat") || "";
  const deliveryLon = searchParams.get("deliveryLon") || "";

  let materials = [];
  try {
    materials = JSON.parse(materialsParam);
  } catch {
    materials = [];
  }

  const pickup = pickupCity || pickupFull || "Pickup";
  const delivery = deliveryCity || deliveryFull || "Delivery";

  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const validateFields = () => {
    if (!fullName.trim()) {
      alert("Please enter your full name");
      return false;
    }

    if (!phoneNumber.trim()) {
      alert("Please enter WhatsApp number");
      return false;
    }

    if (!email.trim()) {
      alert("Please enter email address");
      return false;
    }

    const phoneRegex = /^[0-9+\-\s]{10,15}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      alert("Please enter a valid phone number");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const redirectToEstimate = () => {
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

  const handleVerifyOtp = async (otpOverride) => {
    const otpToVerify = (otpOverride ?? otp).trim();

    if (otpToVerify.length !== 6) {
      alert("Please enter the complete 6-digit OTP");
      return;
    }

    try {
      setVerifyingOtp(true);

      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpToVerify,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "OTP verification failed");
        return;
      }

      redirectToEstimate();
    } catch (error) {
      console.error("Verify OTP error:", error);
      alert("Something went wrong while verifying OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const sendOtpRequest = async (isResend = false) => {
    try {
      setSendingOtp(true);

      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: fullName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to send OTP");
        return false;
      }

      setOtpSent(true);
      setOtp("");
      setResendTimer(30);

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);

      alert(
        isResend
          ? "OTP resent to your email address"
          : "OTP sent to your email address"
      );

      return true;
    } catch (error) {
      console.error("Send OTP error:", error);
      alert("Something went wrong while sending OTP");
      return false;
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSendOtp = async () => {
    if (!validateFields()) return;
    await sendOtpRequest(false);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || sendingOtp) return;
    if (!validateFields()) return;
    await sendOtpRequest(true);
  };

  const handleOtpChange = async (index, value) => {
    const cleanValue = value.replace(/\D/g, "");

    if (!cleanValue) {
      const otpArray = otp.split("");
      while (otpArray.length < 6) otpArray.push("");
      otpArray[index] = "";
      setOtp(otpArray.join("").slice(0, 6));
      return;
    }

    const digit = cleanValue[cleanValue.length - 1];
    const otpArray = otp.split("");

    while (otpArray.length < 6) {
      otpArray.push("");
    }

    otpArray[index] = digit;
    const newOtp = otpArray.join("").slice(0, 6);
    setOtp(newOtp);

    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.replace(/\D/g, "").length === 6 && !verifyingOtp) {
      setTimeout(() => {
        handleVerifyOtp(newOtp);
      }, 150);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      const otpArray = otp.split("");
      while (otpArray.length < 6) otpArray.push("");

      if (otpArray[index]) {
        otpArray[index] = "";
        setOtp(otpArray.join("").slice(0, 6));
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    setOtp(pasted);

    const nextIndex = Math.min(pasted.length - 1, 5);
    otpRefs.current[nextIndex]?.focus();

    if (pasted.replace(/\D/g, "").length === 6 && !verifyingOtp) {
      setTimeout(() => {
        handleVerifyOtp(pasted);
      }, 150);
    }
  };

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

              <div className="w-10 shrink-0" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-4 py-8 md:px-6 md:py-10 lg:px-8">
        <div className="mx-auto max-w-[760px]">
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="border-b border-gray-100 px-5 py-6 text-center md:px-8 md:py-8">
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-gray-900 md:text-3xl">
                Enter Details
              </h1>
              <p className="mt-2 text-sm text-gray-600 md:text-base">
                Add your details to receive and verify your instant estimate.
              </p>
            </div>

            <div className="px-5 py-6 md:px-8 md:py-8">
              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-[14px] border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-red-700"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your WhatsApp number"
                    className="w-full rounded-[14px] border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-red-700"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-[14px] border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-red-700"
                  />
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="mt-2 rounded-[14px] bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sendingOtp ? "Sending OTP..." : "Send OTP"}
                  </button>
                ) : (
                  <div className="rounded-[18px] border border-gray-200 bg-gray-50 p-4 md:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-bold text-gray-900 md:text-base">
                        Enter OTP
                      </h3>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendTimer > 0 || sendingOtp}
                        className="self-start text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:text-gray-400 sm:self-auto"
                      >
                        {resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : sendingOtp
                            ? "Resending..."
                            : "Resend OTP"}
                      </button>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      We have sent a 6-digit verification code to your email.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap sm:gap-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otp[index] || ""}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          className="h-11 w-11 min-w-[44px] rounded-[12px] border border-gray-300 text-center text-base font-bold outline-none transition focus:border-red-700 sm:h-12 sm:w-12 md:h-14 md:w-14 md:text-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function EnterDetailsPage() {
  return (
    <Suspense fallback={null}>
      <EnterDetailsContent />
    </Suspense>
  );
}