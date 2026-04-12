"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [loadType, setLoadType] = useState("part");
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const wrapperRef = useRef(null);

  const navItems = useMemo(
    () => [
      { label: "Home", href: "#home" },
      { label: "Services", href: "#services" },
      { label: "Fleet", href: "#fleet" },
      { label: "Machinery", href: "#machinery" },
      { label: "Platform", href: "#platform" },
      { label: "Industries", href: "#industries" },
      { label: "Contact", href: "#footer-contact" },
    ],
    []
  );

  const services = [
    {
      icon: "/services/ftl2.png",
      title: "Full Truck Load (FTL)",
      desc: "Dedicated vehicle allocation for bulk and direct cargo movement.",
    },
    {
      icon: "/services/ltl.png",
      title: "Part Load (LTL)",
      desc: "Shared-capacity movement for smaller and cost-sensitive shipments.",
    },
    {
      icon: "/services/fleet-contract.png",
      title: "Dedicated Fleet Contracts",
      desc: "Long-term fleet support for repeat and structured business movement.",
    },
    {
      icon: "/services/on-demand.png",
      title: "On-Demand Transport",
      desc: "Quick transport support for urgent and dynamic shipment needs.",
    },
    {
      icon: "/services/route-planning.png",
      title: "Route Planning",
      desc: "Route control to improve timing, visibility, and operating efficiency.",
    },
    {
      icon: "/services/nationwide.png",
      title: "Nationwide Distribution",
      desc: "Organized cargo coverage across major cities and industrial routes.",
    },
  ];

  const cargoFleetCategories = [
    {
      name: "Suzuki Pickup",
      capacity: "0.5–1 Ton",
      use: "Local deliveries",
      image: "/Fleet Images/suzuki.png",
    },
    {
      name: "Shehzore",
      capacity: "1–2 Tons",
      use: "Small load hauling",
      image: "/Fleet Images/shehzore.png",
    },
    {
      name: "Mazda Truck",
      capacity: "3–5 Tons",
      use: "Medium duty transport",
      image: "/Fleet Images/mazda.png",
    },
    {
      name: "Delivery Truck",
      capacity: "5–8 Tons",
      use: "Urban distribution",
      image: "/Fleet Images/delivery-truck.png",
    },
    {
      name: "Box Truck",
      capacity: "8–12 Tons",
      use: "Packaged & retail goods",
      image: "/Fleet Images/box-truck.png",
    },
    {
      name: "Curtain Side Trailer",
      capacity: "15–25 Tons",
      use: "Flexible cargo loading",
      image: "/Fleet Images/curtain-side-trailer.png",
    },
    {
      name: "Flatbed Trailer",
      capacity: "20–35 Tons",
      use: "Steel & construction cargo",
      image: "/Fleet Images/flatbed-trailer.png",
    },
    {
      name: "Lowbed Trailer",
      capacity: "20–45 Tons",
      use: "Heavy machinery movement",
      image: "/Fleet Images/lowbed-trailer.png",
    },
    {
      name: "Container Trailer",
      capacity: "20ft / 40ft",
      use: "Import / export shipping",
      image: "/Fleet Images/container-trailer.png",
    },
    {
      name: "Oil Tanker",
      capacity: "10,000–45,000 Ltrs",
      use: "Fuel & petroleum transport",
      image: "/Fleet Images/oil-tanker.png",
    },
    {
      name: "Water Tanker",
      capacity: "5,000–45,000 Ltrs",
      use: "Water supply & site usage",
      image: "/Fleet Images/water-tanker.png",
    },
    {
      name: "Dump Truck / Tipper",
      capacity: "10–30 Tons",
      use: "Sand, gravel & material movement",
      image: "/Fleet Images/dump-truck.png",
    },
  ];

  const machineryCategories = [
    {
      name: "Excavator",
      use: "Heavy digging & excavation",
      image: "/Machinery Images/excavator.png",
    },
    {
      name: "Backhoe Loader",
      use: "Multi-purpose utility machine",
      image: "/Machinery Images/backhoe-loader.png",
    },
    {
      name: "Wheel Loader",
      use: "Material loading & shifting",
      image: "/Machinery Images/wheel-loader.png",
    },
    {
      name: "Bulldozer",
      use: "Land clearing & heavy pushing",
      image: "/Machinery Images/bulldozer.png",
    },
    {
      name: "Motor Grader",
      use: "Road leveling & finishing",
      image: "/Machinery Images/motor-grader.png",
    },
    {
      name: "Crawler Excavator",
      use: "Large-scale excavation",
      image: "/Machinery Images/crawler-excavator.png",
    },
    {
      name: "Skid Steer Loader",
      use: "Compact site operations",
      image: "/Machinery Images/skid-steer-loader.png",
    },
    {
      name: "Forklift",
      use: "Warehouse & material handling",
      image: "/Machinery Images/forklift.png",
    },
    {
      name: "Mobile Crane",
      use: "General lifting operations",
      image: "/Machinery Images/mobile-crane.png",
    },
    {
      name: "Truck-Mounted Crane",
      use: "Flexible lifting & transport",
      image: "/Machinery Images/truck-mounted-crane.png",
    },
    {
      name: "Road Roller",
      use: "Soil & asphalt compaction",
      image: "/Machinery Images/road-roller.png",
    },
    {
      name: "Concrete Pump Truck",
      use: "Concrete placement at height",
      image: "/Machinery Images/concrete-pump-truck.png",
    },
  ];

  const fleetManagementCards = [
    {
      icon: "/fleet-icons/onboarding.png",
      title: "Fleet Onboarding",
      desc: "Verified vehicles, owner profiling, and controlled onboarding.",
    },
    {
      icon: "/fleet-icons/compliance.png",
      title: "Compliance",
      desc: "Permits, fitness, taxes, and document monitoring.",
    },
    {
      icon: "/fleet-icons/driver-management.png",
      title: "Driver Management",
      desc: "Driver verification, checks, and performance visibility.",
    },
    {
      icon: "/fleet-icons/preventive-maintenance.png",
      title: "Preventive Maintenance",
      desc: "Scheduled servicing and inspection control.",
    },
    {
      icon: "/fleet-icons/live-tracking.png",
      title: "Live Tracking",
      desc: "Movement visibility for vehicles and shipments.",
    },
    {
      icon: "/fleet-icons/dispatch-control.png",
      title: "Dispatch Control",
      desc: "Job allocation, trip execution, and route coordination.",
    },
  ];

  const industries = [
    {
      title: "Textile Industry",
      image: "/industries/textile2.png",
    },
    {
      title: "FMCG & Retail",
      image: "/industries/fmcg2.png",
    },
    {
      title: "Oil, Gas & Petroleum",
      image: "/industries/oil&gas2.png",
    },
    {
      title: "Construction & Infrastructure",
      image: "/industries/construction2.png",
    },
    {
      title: "Agriculture & Commodities",
      image: "/industries/agriculture2.png",
    },
    {
      title: "Industrial & Manufacturing",
      image: "/industries/industrial2.png",
    },
    {
      title: "Cold Chain & Food Logistics",
      image: "/industries/cold-storage.png",
    },
    {
      title: "Automotive & Auto Parts",
      image: "/industries/automotive2.png",
    },
  ];

  const faqs = [
    {
      q: "How does the estimate and booking process work?",
      a: "Users enter pickup and delivery locations, select load type, and receive an instant estimate. After that, our team shares a formal quotation. Once approved, the order is confirmed and executed through our controlled dispatch system.",
    },
    {
      q: "Do you operate your own fleet or partner fleets?",
      a: "We operate through a managed fleet network that includes both owned and verified partner vehicles. All fleets are onboarded, verified, and monitored under our system to ensure consistent service quality and reliability.",
    },
    {
      q: "Can I book machinery and equipment as well?",
      a: "Yes. In addition to transport vehicles, we also provide machinery and equipment such as excavators, loaders, cranes, and other site equipment through our structured network.",
    },
    {
      q: "Is live tracking available?",
      a: "Yes. Live tracking is available once the order is confirmed, providing real-time visibility of shipment movement, status updates, and route tracking.",
    },
    {
      q: "Who is responsible for vehicle and cargo insurance?",
      a: "Vehicle insurance is managed by MJ Logistics to ensure operational reliability. Cargo insurance is the responsibility of the client unless otherwise agreed in the contract.",
    },
    {
      q: "What happens in case of delays or operational issues?",
      a: "Our system provides real-time monitoring, route tracking, and operational control. In case of any delay or issue, our operations team actively manages the situation and keeps the client informed.",
    },
    {
      q: "Do you provide cargo client software?",
      a: "Yes. We provide cargo client software that allows users to manage estimates, bookings, shipment tracking, and history in a structured way. Pricing for the software is separate and depends on usage and requirements. A demo can be arranged to help you understand the system before onboarding.",
    },
    {
      q: "Do you offer fleet management solutions?",
      a: "Yes. We provide a complete fleet management solution covering compliance, preventive maintenance, driver management, tracking, and operations control. Pricing is offered separately based on fleet size and requirements, and a detailed demo can be arranged.",
    },
    {
      q: "Can fleet owners register their vehicles with MJ Logistic Services?",
      a: "Yes. Fleet owners can onboard their vehicles into our network by providing required documentation such as vehicle papers, permits, and driver details. Once verified, the vehicles are added to our managed fleet system.",
    },
    {
      q: "What are the requirements for fleet onboarding?",
      a: "Fleet onboarding requires valid vehicle documents, compliance records, and verified driver information. Additionally, drivers must have a mobile device to enable tracking connectivity with our system for real-time visibility and control.",
    },
    {
      q: "How do you ensure fleet quality and compliance?",
      a: "All vehicles in our network go through a verification process, including documentation checks, compliance monitoring, and operational standards. We also maintain preventive maintenance and performance tracking to ensure reliability.",
    },
    {
      q: "What types of cargo do you handle?",
      a: "We handle a wide range of cargo including general goods, industrial materials, construction loads, liquid transport, and temperature-sensitive shipments through specialized vehicles.",
    },
  ];

  const customerLogos = [
    { id: 1, name: "BE Energy", src: "/Customers Logos/be-energy.png" },
    { id: 2, name: "Bestway", src: "/Customers Logos/bestway.png" },
    { id: 3, name: "BGP", src: "/Customers Logos/bgp.png" },
    { id: 4, name: "Caltex", src: "/Customers Logos/caltex.png" },
    { id: 5, name: "Dewan Petroleum", src: "/Customers Logos/dewan-petroleum.png" },
    { id: 6, name: "Interwood", src: "/Customers Logos/shell.png" },
    { id: 7, name: "Lucky Cement", src: "/Customers Logos/lucky-cement.png" },
    { id: 8, name: "PEL", src: "/Customers Logos/pel.png" },
    { id: 9, name: "Shabbir Tiles", src: "/Customers Logos/diamond-paints.png" },
    { id: 10, name: "Shabbir Tiles", src: "/Customers Logos/hibib-oil.png" },
    { id: 11, name: "Shabbir Tiles", src: "/Customers Logos/jotun.png" },
    { id: 12, name: "Shabbir Tiles", src: "/Customers Logos/lucky-cement.png" },
    { id: 13, name: "Shabbir Tiles", src: "/Customers Logos/master-plastic.png" },
    { id: 14, name: "Shabbir Tiles", src: "/Customers Logos/pel-2.png" },
    { id: 15, name: "Shabbir Tiles", src: "/Customers Logos/wilson's.png" },
    { id: 16, name: "Shabbir Tiles", src: "/Customers Logos/shabbir-tiles.png" },
  ];

  const fleetPartnerLogos = [
    { id: 1, name: "Partner 1", src: "/Fleet Partners Logos/3a-logistics2.png" },
    { id: 2, name: "Partner 2", src: "/Fleet Partners Logos/agility2.png" },
    { id: 3, name: "Partner 3", src: "/Fleet Partners Logos/aucts2.png" },
    { id: 4, name: "Partner 4", src: "/Fleet Partners Logos/balance2.png" },
    { id: 5, name: "Partner 5", src: "/Fleet Partners Logos/bsl2.png" },
    { id: 6, name: "Partner 6", src: "/Fleet Partners Logos/cfi2.png" },
    { id: 7, name: "Partner 7", src: "/Fleet Partners Logos/mehmood3.png" },
    { id: 8, name: "Partner 8", src: "/Fleet Partners Logos/momentum2.png" },
    { id: 9, name: "Partner 9", src: "/Fleet Partners Logos/moveit2.png" },
    { id: 10, name: "Partner 10", src: "/Fleet Partners Logos/pak-china2.png" },
    { id: 11, name: "Partner 11", src: "/Fleet Partners Logos/shaheen2.png" },
    { id: 12, name: "Partner 12", src: "/Fleet Partners Logos/silk2.png" },
    { id: 13, name: "Partner 13", src: "/Fleet Partners Logos/tg2.png" },
    { id: 14, name: "Partner 14", src: "/Fleet Partners Logos/tm2.png" },
    { id: 15, name: "Partner 15", src: "/Fleet Partners Logos/tml2.png" },
  ];

  const handleLogoClick = () => {
    window.location.href = "/";
  };

  const handleCheckPrice = () => {
    if (!pickup.trim()) {
      alert("Please enter pick-up city");
      return;
    }

    if (!delivery.trim()) {
      alert("Please enter drop city");
      return;
    }

    if (!pickupLocation) {
      alert("Please select pick-up city from the dropdown");
      return;
    }

    if (!deliveryLocation) {
      alert("Please select drop city from the dropdown");
      return;
    }

    const params = new URLSearchParams({
      pickup: pickupLocation.label,
      pickupCity: pickupLocation.city || "",
      pickupLat: String(pickupLocation.lat),
      pickupLon: String(pickupLocation.lon),

      delivery: deliveryLocation.label,
      deliveryCity: deliveryLocation.city || "",
      deliveryLat: String(deliveryLocation.lat),
      deliveryLon: String(deliveryLocation.lon),

      loadType,
    });

    window.location.href = `/business-quote?${params.toString()}`;
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setPickupSuggestions([]);
        setDeliverySuggestions([]);
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
            setPickupSuggestions(Array.isArray(data?.results) ? data.results : []);
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
      if (activeField === "delivery" && delivery.trim().length >= 2) {
        fetch(`/api/places?text=${encodeURIComponent(delivery)}`)
          .then((res) => res.json())
          .then((data) => {
            setDeliverySuggestions(Array.isArray(data?.results) ? data.results : []);
          })
          .catch(() => setDeliverySuggestions([]));
      } else {
        setDeliverySuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [delivery, activeField]);

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-0 md:px-6 lg:px-8">
          <button
            onClick={handleLogoClick}
            className="relative h-11 w-36 md:h-[52px] md:w-[170px] lg:h-[58px] lg:w-[190px]"
            aria-label="Go to homepage"
          >
            <Image
              src="/logo-6.png"
              alt="MJ Logistics Services"
              fill
              className="object-contain"
              priority
            />
          </button>

          <nav className="hidden items-center gap-6 xl:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-gray-700 transition hover:text-red-600"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              aria-label="My account"
              className="rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-red-800 focus:outline-none"
            >
              My Account
            </button>
          </nav>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 xl:hidden"
            aria-label="Open menu"
          >
            <div className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 bg-gray-800" />
              <span className="block h-0.5 w-5 bg-gray-800" />
              <span className="block h-0.5 w-5 bg-gray-800" />
            </div>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white xl:hidden">
            <div className="mx-auto flex max-w-[1400px] flex-col px-4 py-3 md:px-6">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="py-3 text-sm font-medium text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <button
                type="button"
                aria-label="My account"
                className="mt-2 rounded-full bg-red-700 px-5 py-3 text-center text-sm font-semibold text-white transition duration-200 hover:bg-red-800 focus:outline-none"
              >
                My Account
              </button>
            </div>
          </div>
        )}
      </header>

      <section
        id="home"
        className="scroll-mt-24 relative overflow-hidden bg-white px-4 pb-16 pt-24 md:px-6 md:pt-28 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.97)_32%,rgba(255,255,255,0.72)_52%,rgba(255,255,255,0.18)_68%,rgba(255,255,255,0)_100%)]" />
          <Image
            src="/hero-3.png"
            alt="MJ Logistics hero background"
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        <div className="relative z-20 mx-auto max-w-[1400px]">
          <div className="max-w-[760px]">
            <h1 className="text-4xl font-bold leading-[1.06] tracking-[-0.03em] text-gray-900 sm:text-5xl lg:text-[64px]">
              Move Cargo Faster.
              <br />
              Manage Fleets Better.
            </h1>

            <p className="mt-5 max-w-[560px] text-base leading-7 text-gray-700 md:text-lg">
              From heavy transport to machinery handling, we deliver across Pakistan with precision, reliability, and operational control.
            </p>

            <div className="mt-7 inline-flex rounded-2xl border border-gray-200 bg-white/90 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm">
              <button
                onClick={() => setLoadType("part")}
                className={`min-w-[128px] rounded-2xl px-6 py-3 text-sm font-semibold transition ${loadType === "part"
                  ? "bg-red-600 text-white shadow"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Part Load
              </button>
              <button
                onClick={() => setLoadType("full")}
                className={`min-w-[128px] rounded-2xl px-6 py-3 text-sm font-semibold transition ${loadType === "full"
                  ? "bg-red-600 text-white shadow"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Full Load
              </button>
            </div>

            <div
              ref={wrapperRef}
              className="relative z-30 mt-7 w-full rounded-[30px] border border-white/70 bg-white/95 p-3 shadow-[0_25px_70px_rgba(15,23,42,0.14)] backdrop-blur"
            >
              <div className="grid overflow-visible rounded-[24px] border border-gray-200 bg-white md:grid-cols-[1fr_1fr_200px]">
                <div className="relative border-b border-gray-200 md:border-b-0 md:border-r">
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => {
                      setPickup(e.target.value);
                      setPickupLocation(null);
                      setActiveField("pickup");
                    }}
                    onFocus={() => setActiveField("pickup")}
                    placeholder="Pickup City"
                    className="h-[56px] w-full rounded-l-[24px] bg-transparent px-5 text-base text-gray-900 outline-none md:h-[64px] md:px-6"
                  />

                  {activeField === "pickup" && pickupSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-40 max-h-72 overflow-y-auto rounded-b-[20px] border border-gray-200 bg-white shadow-2xl">
                      {pickupSuggestions.map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setPickup(item.label);
                            setPickupLocation(item);
                            setPickupSuggestions([]);
                            setActiveField(null);
                          }}
                          className="block w-full border-b border-gray-100 px-5 py-3 text-left text-sm text-gray-800 hover:bg-gray-50 md:px-6"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative border-b border-gray-200 md:border-b-0 md:border-r">
                  <input
                    type="text"
                    value={delivery}
                    onChange={(e) => {
                      setDelivery(e.target.value);
                      setDeliveryLocation(null);
                      setActiveField("delivery");
                    }}
                    onFocus={() => setActiveField("delivery")}
                    placeholder="Drop City"
                    className="h-[56px] w-full bg-transparent px-5 text-base text-gray-900 outline-none md:h-[64px] md:px-6"
                  />

                  {activeField === "delivery" && deliverySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-40 max-h-72 overflow-y-auto rounded-b-[20px] border border-gray-200 bg-white shadow-2xl">
                      {deliverySuggestions.map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setDelivery(item.label);
                            setDeliveryLocation(item);
                            setDeliverySuggestions([]);
                            setActiveField(null);
                          }}
                          className="block w-full border-b border-gray-100 px-5 py-3 text-left text-sm text-gray-800 hover:bg-gray-50 md:px-6"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheckPrice}
                  className="h-[56px] rounded-b-[24px] bg-red-700 px-5 text-base font-semibold text-white transition hover:bg-red-800 md:h-[64px] md:rounded-b-none md:rounded-r-[24px]"
                >
                  Check Price
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                <div className="text-sm font-bold text-red-700">Instant Estimate</div>
                <div className="mt-1 text-xs text-gray-600">Quick route-based start</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                <div className="text-sm font-bold text-red-700">Controlled Dispatch</div>
                <div className="mt-1 text-xs text-gray-600">Managed job allocation</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                <div className="text-sm font-bold text-red-700">Live Tracking</div>
                <div className="mt-1 text-xs text-gray-600">Real-time shipment visibility</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white py-9">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Trusted By Industry Leaders
          </p>
          <div className="relative mt-6 overflow-hidden">
            <div className="animate-marquee-left flex gap-10 whitespace-nowrap">
              {[...customerLogos, ...customerLogos].map((logo, index) => (
                <div
                  key={`${logo.name}-${index}`}
                  className="relative inline-flex h-16 w-32 items-center justify-center rounded-2xl border border-gray-200 bg-white p-3 shadow-sm md:h-20 md:w-40"
                >
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    className="object-contain p-3"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-gray-50 py-9">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Our Fleet Partners
          </p>
          <div className="relative mt-6 overflow-hidden">
            <div className="animate-marquee-right flex gap-10 whitespace-nowrap">
              {[...fleetPartnerLogos, ...fleetPartnerLogos].map((logo, index) => (
                <div
                  key={`${logo.name}-${index}`}
                  className="relative inline-flex h-16 w-32 items-center justify-center rounded-2xl border border-gray-200 bg-white p-3 shadow-sm md:h-20 md:w-40"
                >
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    className="object-contain p-3"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="scroll-mt-24 bg-white px-4 py-14 md:px-6 md:py-18 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Logistics Services
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
              Core transport services built for speed, control, and reliable execution.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((item) => (
              <div
                key={item.title}
                className="group rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-red-600 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="relative h-16 w-16 shrink-0 ml-5">
                    <Image
                      src={item.icon}
                      alt={item.title}
                      fill
                      className="object-contain scale-175 transition-transform duration-300 group-hover:scale-130"
                    />
                  </div>

                  <div className="h-10 w-10 rounded-full border border-red-100 bg-red-50 opacity-0 transition-all duration-300 group-hover:opacity-100" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-14 md:px-6 md:py-18 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Fleet Management Solutions
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
              Structured fleet control through compliance, maintenance, tracking, and operational visibility.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {fleetManagementCards.map((item) => (
              <div
                key={item.title}
                className="group rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-red-600 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="relative h-16 w-16 shrink-0 ml-5">
                    <Image
                      src={item.icon}
                      alt={item.title}
                      fill
                      className="object-contain scale-175 transition-transform duration-300 group-hover:scale-130"
                    />
                  </div>

                  <div className="h-10 w-10 rounded-full border border-red-100 bg-red-50 opacity-0 transition-all duration-300 group-hover:opacity-100" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="fleet"
        className="scroll-mt-24 bg-white px-4 py-14 md:px-6 md:py-18 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-[900px] text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Our Fleet & Partner Network
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
              Pakistan-relevant transport categories from pickups to trailers, tankers, and heavy movement support.
            </p>
          </div>

          <div className="mt-10 rounded-[28px] border border-gray-200 bg-red-50 px-5 py-4 text-center">
            <div className="text-lg font-bold text-red-700 md:text-2xl">
              Load Capacity Range: 1 Ton to 45 Tons
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cargoFleetCategories.map((item) => (
              <div
                key={item.name}
                className="overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-sm"
              >
                <div className="relative h-52 w-full bg-gray-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                  <div className="mt-1 text-sm font-semibold text-red-700">{item.capacity}</div>
                  <p className="mt-2 text-sm text-gray-600">{item.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="machinery"
        className="scroll-mt-24 bg-gray-50 px-4 py-14 md:px-6 md:py-18 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-[900px] text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Machinery & Equipment
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
              Pakistan-relevant machinery categories for excavation, lifting, roadwork, and site operations.
            </p>
          </div>

          <div className="mt-10 rounded-[28px] border border-gray-200 bg-red-50 px-5 py-4 text-center">
            <div className="text-lg font-bold text-red-700 md:text-2xl">
              Machinery Range: Compact Equipment to Heavy-Duty Site Machines
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {machineryCategories.map((item) => (
              <div
                key={item.name}
                className="overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-sm"
              >
                <div className="relative h-52 w-full bg-gray-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="platform"
        className="scroll-mt-24 bg-white px-4 py-14 md:px-6 md:py-18 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-[780px] text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Digital Platforms for Cargo & Fleet Operations
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
              Purpose-built digital platforms for shipment booking, live tracking, fleet monitoring, compliance control, and day-to-day operational visibility.
            </p>
          </div>

          <div className="mt-12 grid gap-10">
            <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="grid items-center gap-10 p-6 md:p-8 xl:grid-cols-[0.9fr_1.1fr] xl:p-10">
                <div>
                  <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                    Cargo Clients Platform
                  </div>

                  <h3 className="mt-5 text-2xl font-bold text-gray-900 md:text-3xl">
                    Manage bookings, monitor shipments, and maintain full order visibility.
                  </h3>

                  <p className="mt-4 max-w-[560px] text-sm leading-7 text-gray-600 md:text-base">
                    Built for cargo clients who need a clearer and more controlled process — from booking requests and live shipment tracking to order monitoring, delivery follow-up, and commercial visibility.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      "Booking Requests",
                      "Live Shipment Tracking",
                      "Active Order Monitoring",
                      "Commercial Visibility",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group">
                  <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
                    <Image
                      src="/platform/cargo-dashboard-final.png"
                      alt="Cargo Client Dashboard"
                      width={1620}
                      height={1080}
                      className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      priority={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="grid items-center gap-10 p-6 md:p-8 xl:grid-cols-[0.9fr_1.1fr] xl:p-10">
                <div>
                  <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                    Fleet Management Platform
                  </div>

                  <h3 className="mt-5 text-2xl font-bold text-gray-900 md:text-3xl">
                    Manage compliance, maintenance, drivers, and dispatch from one structured platform.
                  </h3>

                  <p className="mt-4 max-w-[560px] text-sm leading-7 text-gray-600 md:text-base">
                    Designed for transport operators and fleet owners who need structured control over vehicle status, compliance alerts, preventive maintenance, driver monitoring, dispatch activity, and overall fleet performance.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      "Compliance Monitoring",
                      "Preventive Maintenance",
                      "Driver Visibility",
                      "Dispatch Control",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group">
                  <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
                    <Image
                      src="/platform/fleet-dashboard-final.png"
                      alt="Fleet Management Dashboard"
                      width={1620}
                      height={1080}
                      className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="industries"
        className="scroll-mt-24 bg-gray-50 px-4 py-14 md:px-6 md:py-18 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-[780px] text-center">

            <h2 className="mt-5 text-3xl font-bold text-gray-900 md:text-4xl">
              Industries We Serve
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
              Structured logistics support across major commercial and industrial sectors.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {industries.map((industry) => (
              <div
                key={industry.title}
                className="group relative overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
              >
                <div className="relative h-[220px] w-full overflow-hidden">
                  <Image
                    src={industry.image}
                    alt={industry.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-base font-bold leading-6 text-white md:text-lg">
                      {industry.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 md:px-6 md:py-18 lg:px-8">
        <div className="mx-auto max-w-[980px]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.q}
                className="overflow-hidden rounded-[22px] border border-gray-200 bg-gray-50"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-gray-900 md:px-6"
                >
                  <span>{faq.q}</span>
                  <span className="text-xl text-red-600">
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4 text-sm leading-6 text-gray-600 md:px-6">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-24 bg-gray-50 px-4 py-16 md:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">

            {/* TOP VISUAL - OPTIONAL */}
            <div className="border-b border-gray-200">
              <div className="relative h-[180px] w-full md:h-[240px] overflow-hidden">
                <Image
                  src="/operational presence/top-picture.png"
                  alt="MJ Logistics operational coverage"
                  fill
                  className="object-cover object-[center_70%]"
                />
              </div>
            </div>

            {/* CONTENT */}
            <div className="px-6 py-8 md:px-10 md:py-10">
              <div className="mx-auto max-w-[860px] text-center">
                <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
                  Partner Offices Across Pakistan
                </h2>

                <p className="mx-auto mt-4 max-w-[760px] text-sm leading-7 text-gray-600 md:text-base">
                  We operate through multiple partner offices across key cities in Pakistan, enabling coordinated cargo movement, fleet support, and localized operational execution across different regions.
                </p>
              </div>

              {/* ALL CITIES IN ONE GRID */}
              <div className="mx-auto mt-10 max-w-[1040px]">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    "Rawalpindi",
                    "Islamabad",
                    "Lahore",
                    "Karachi",
                    "Faisalabad",
                    "Multan",
                    "Peshawar",
                    "Quetta",
                    "Gilgit",
                    "Skardu",
                    "Sialkot",
                    "Hyderabad",
                  ].map((city) => (
                    <div
                      key={city}
                      className="flex items-center gap-3 rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:bg-white hover:shadow-md"
                    >
                      <div className="text-sm font-semibold text-gray-900 md:text-base">
                        {city}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer
        id="footer-contact"
        className="bg-gray-950 px-4 py-14 text-gray-400 md:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

            {/* COLUMN 1 — BRAND */}
            <div className="flex flex-col items-start">
              <h4 className="text-base font-semibold text-white">MJ Logistic Services</h4>

              <p className="mt-4 max-w-[280px] text-sm leading-7 text-gray-400">
                Controlled Logistics. Reliable Delivery. Optimized Fleet.
              </p>

              <div className="mt-5 flex gap-3">
                {/* Facebook */}
                <a
                  href="https://facebook.com/yourpage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-red-500 hover:bg-red-600"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12a10 10 0 10-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-4 3.8-4 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.5V12H17l-.5 3h-2.7v7A10 10 0 0022 12z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com/yourchannel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-red-500 hover:bg-red-600"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.8zM9.8 15.5v-7l6.2 3.5-6.2 3.5z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* COLUMN 2 — QUICK LINKS */}
            <div className="flex flex-col items-start">
              <h4 className="text-base font-semibold text-white">Quick Links</h4>

              <div className="mt-4 space-y-3 text-sm">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block transition hover:text-red-400"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* COLUMN 3 — RESOURCES */}
            <div className="flex flex-col items-start">
              <h4 className="text-base font-semibold text-white">Resources</h4>

              <div className="mt-4 space-y-3 text-sm">
                <button type="button" className="block text-left transition hover:text-red-400">
                  About Us
                </button>

                <button type="button" className="block text-left transition hover:text-red-400">
                  Service Policies
                </button>

                <button type="button" className="block text-left transition hover:text-red-400">
                  Safety & Compliance
                </button>

                <button type="button" className="block text-left transition hover:text-red-400">
                  Fleet Onboarding Guide
                </button>

                <button type="button" className="block text-left transition hover:text-red-400">
                  Shipping / Booking Process
                </button>
              </div>
            </div>

            {/* COLUMN 4 — CONTACT */}
            <div className="flex flex-col items-start">
              <h4 className="text-base font-semibold text-white">Contact</h4>

              <div className="mt-4 space-y-3 text-sm">
                <div className="space-y-1 text-white font-medium">
                  <div>+92 334 6466818</div>
                  <div>+92 331 6163283</div>
                  <div>+92 335 5012211</div>
                </div>

                <a
                  href="mailto:info@mjlogisticservices.com"
                  className="block transition hover:text-red-400"
                >
                  info@mjlogisticservices.com
                </a>

                <div className="leading-6 text-gray-400">
                  Opposite kohinoor Textile Mill, Main Peshawar Road, Rawalpindi
                </div>
              </div>

              <div className="mt-6 flex w-full max-w-[240px] flex-col gap-3">
                <a
                  href="#home"
                  className="inline-flex justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-red-600"
                >
                  Go to Estimate Flow
                </a>

                <a
                  href="https://wa.me/923346466818"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-red-600"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>

          </div>

          {/* BOTTOM BAR */}
          <div className="mt-12 border-t border-white/10 pt-6">
            <div className="flex flex-col items-center justify-between gap-3 text-center text-sm text-gray-400 md:flex-row md:text-left">

              <div>
                © {new Date().getFullYear()} MJ Logistic Services. All rights reserved.
              </div>

              <div className="flex flex-wrap items-center justify-center gap-5 md:justify-end">
                <button className="transition hover:text-red-400">Privacy Policy</button>
                <button className="transition hover:text-red-400">Terms</button>
                <button className="transition hover:text-red-400">Blog</button>
              </div>

            </div>
          </div>

        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes marquee-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes marquee-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-marquee-left {
          animation: marquee-left 30s linear infinite;
          display: flex;
          width: fit-content;
        }

        .animate-marquee-right {
          animation: marquee-right 30s linear infinite;
          display: flex;
          width: fit-content;
        }

        .animate-marquee-left:hover,
        .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </main>
  );
}