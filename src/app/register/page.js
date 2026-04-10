"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-[#111827]">
      <div className="flex min-h-screen flex-col items-center justify-between px-4 py-0">
        
        {/* Top Section - Centers the form */}
        <div className="flex flex-1 flex-col items-center justify-center w-full mb-12">
          <div className="mx-auto flex w-full max-w-[1050px] flex-col items-center justify-center">

            {/* LOGO - Manually set clickable area only on visible logo */}
            <div className="relative mb-0 mt-1 flex justify-center">
              {/* Logo Image - visible only */}
              <div className="relative h-[200px] w-[700px] md:h-[220px] md:w-[760px] pointer-events-none">
                <Image
                  src="/logo.png"
                  alt="MJ Logistic Services Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* Manual Clickable Area - exactly where visible logo is */}
              <Link
                href="/"
                className="absolute cursor-pointer"
                style={{
                  width: "130px",
                  height: "110px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "transparent",
                }}
              />
            </div>

            {/* TOP NAV TEXT */}
            <div className="-mt-10 mb-1 text-center">
              <p className="text-[22px] font-bold tracking-[-0.02em] text-[#202124] md:text-[28px]">
                <span className="text-[#202124]">Book Cargo</span>
                <span className="px-2 text-[#bdbdbd]">|</span>
                <span className="text-[#202124]">Track Shipment</span>
              </p>
            </div>

            {/* REGISTER CARD */}
            <div className="w-full max-w-[500px] rounded-2xl bg-white px-5 py-6 shadow-lg md:px-7 md:py-8">
              
              <h1 className="mb-5 text-center text-[22px] font-medium tracking-[-0.02em] text-[#202124] md:text-[24px]">
                Create Your Account
              </h1>

              {/* COMPANY NAME */}
              <label className="mb-2 block text-[13px] font-semibold text-[#202124] md:text-[14px]">
                Company Name
              </label>
              <div className="mb-4 flex h-[48px] w-full items-center rounded-xl border border-[#e5e7eb] bg-white px-3 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                <span className="mr-2 text-lg text-red-600">🏢</span>
                <input
                  type="text"
                  placeholder="Enter Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-full w-full border-none bg-transparent text-[14px] text-[#111827] placeholder:text-[#9ca3af] outline-none md:text-[15px]"
                />
              </div>

              {/* FULL NAME */}
              <label className="mb-2 block text-[13px] font-semibold text-[#202124] md:text-[14px]">
                Full Name
              </label>
              <div className="mb-4 flex h-[48px] w-full items-center rounded-xl border border-[#e5e7eb] bg-white px-3 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                <span className="mr-2 text-lg text-red-600">👤</span>
                <input
                  type="text"
                  placeholder="Enter Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-full w-full border-none bg-transparent text-[14px] text-[#111827] placeholder:text-[#9ca3af] outline-none md:text-[15px]"
                />
              </div>

              {/* EMAIL ADDRESS */}
              <label className="mb-2 block text-[13px] font-semibold text-[#202124] md:text-[14px]">
                Email Address
              </label>
              <div className="mb-4 flex h-[48px] w-full items-center rounded-xl border border-[#e5e7eb] bg-white px-3 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                <span className="mr-2 text-lg text-red-600">✉️</span>
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full w-full border-none bg-transparent text-[14px] text-[#111827] placeholder:text-[#9ca3af] outline-none md:text-[15px]"
                />
              </div>

              {/* MOBILE NUMBER */}
              <label className="mb-2 block text-[13px] font-semibold text-[#202124] md:text-[14px]">
                Mobile Number
              </label>
              <div className="mb-5 flex h-[48px] w-full items-center rounded-xl border border-[#e5e7eb] bg-white px-3 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                <span className="mr-2 text-lg text-red-600">📞</span>
                <input
                  type="tel"
                  placeholder="Enter Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="h-full w-full border-none bg-transparent text-[14px] text-[#111827] placeholder:text-[#9ca3af] outline-none md:text-[15px]"
                />
              </div>

              {/* SEND OTP BUTTON */}
              <button className="h-[48px] w-full rounded-xl bg-gradient-to-r from-[#e31313] to-[#d90404] text-[15px] font-medium text-white shadow-md transition hover:opacity-95 md:text-[16px]">
                Send OTP
              </button>

              {/* LOGIN LINK */}
              <p className="mt-5 text-center text-[13px] text-[#202124] md:text-[14px]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-red-600 hover:underline"
                >
                  Login
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="w-full bg-red-700">
          <div className="mx-auto w-full max-w-[1050px] px-4 py-6">
            
            {/* Footer Contact Section - All 3 columns center aligned */}
            <div className="border-t border-white/20 pt-6">
              <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3 md:gap-6">
                
                {/* Address - Center aligned */}
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/80 md:text-sm">
                    ADDRESS
                  </h3>
                  <p className="text-xs text-white/70 md:text-sm">
                    Office # 123, Business Center<br />
                    Main Boulevard, Lahore<br />
                    Pakistan
                  </p>
                </div>
                
                {/* Phone - Center aligned */}
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/80 md:text-sm">
                    PHONE
                  </h3>
                  <p className="text-xs text-white/70 md:text-sm">
                    +92 300 1234567<br />
                    Fax: +92 42 12345678
                  </p>
                </div>
                
                {/* Email - Center aligned */}
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/80 md:text-sm">
                    EMAIL
                  </h3>
                  <p className="text-xs text-white/70 md:text-sm">
                    info@mjlogistics.com<br />
                    support@mjlogistics.com
                  </p>
                </div>
                
              </div>
            </div>

            {/* COPYRIGHT BAR */}
            <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/20 pt-4 text-center md:flex-row">
              <p className="text-[11px] text-white/60 md:text-xs">
                © 2025 MJ Logistic Services. All rights reserved.
              </p>
              <div className="flex gap-4 text-[11px] text-white/60 md:text-xs">
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}