"use client";
import React, { useState } from "react";
import {
  ShieldCheck,
  Copy,
  CheckCheck,
  Clock,
  Users,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Star,
  Award,
  GraduationCap,
  HeartPulse,
  Info,
  ChevronDown,
} from "lucide-react";

// --- DUMMY STORE DATA ---
const STORE = {
  name: "Nike",
  logo: "N",
  rating: 4.8,
  reviewCount: 16,
  activeCodes: 1,
  verified30Days: 8,
  avgDiscount: "21%",
  bestDiscount: "25%",
  about:
    "Nike's mission is to bring inspiration and innovation to every athlete in the world, extending this to all shoppers by believing, 'if you have a body, you are an athlete.' This philosophy drives the brand to empower athletes of all levels by pioneering sport innovations that expand human potential.",
  policies: [
    { label: "Return Policy", value: "60-day returns" },
    { label: "Shipping Policy", value: "Free standard shipping over $50" },
    {
      label: "Status Discounts",
      value: "Students, Military, First Responders",
    },
    { label: "Payment Options", value: "PayPal, Apple Pay, Google Pay" },
  ],
};

const OFFERS = [
  {
    id: 1,
    type: "Code",
    title: "20% Off Storewide at Nike w/Code",
    description:
      "Take 20% off your entire purchase, including clearance items. Excludes Apple Watch and new SNKRS releases.",
    discount: "20% OFF",
    code: "CYBER20",
    isVerified: true,
    lastUsed: "5 mins ago",
    usesToday: 766,
    lastVerified: "2 hours ago",
    verifierInitials: "AM",
    expires: "Ends in 2 days",
  },
  {
    id: 2,
    type: "Code",
    title: "15% Off Select Items (Members Only)",
    description:
      "Sign in to your Nike+ account and use this community code to get 15% off when you buy 2 or more items.",
    discount: "15% OFF",
    code: "MEMBER15",
    isVerified: false,
    lastUsed: "1 hour ago",
    usesToday: 125,
    lastVerified: "1 day ago",
    verifierInitials: "BT",
    expires: "Ends today",
  },
  {
    id: 3,
    type: "Deal",
    title: "Up to 40% Off New Markdowns",
    description:
      "Shop the clearance section to save up to 40% on running shoes, activewear, and accessories. No code required.",
    discount: "UP TO 40%",
    code: null,
    isVerified: true,
    lastUsed: "12 mins ago",
    usesToday: 484,
    lastVerified: "5 hours ago",
    verifierInitials: "LP",
    expires: "Ongoing",
  },
  {
    id: 4,
    type: "Code",
    title: "Free Expedited Shipping on Orders $50+",
    description:
      "Get free 2-day shipping on your entire order when you spend $50 or more. Must apply code at checkout.",
    discount: "FREE SHIP",
    code: "FREESHIP50",
    isVerified: true,
    lastUsed: "2 mins ago",
    usesToday: 1042,
    lastVerified: "1 hour ago",
    verifierInitials: "JD",
    expires: "Ends in 5 days",
  },
  {
    id: 5,
    type: "Code",
    title: "Extra 10% Off First App Purchase",
    description:
      "Download the Nike App and use this promo code at checkout to receive an additional 10% off your first in-app order.",
    discount: "10% OFF",
    code: "APPONLY10",
    isVerified: true,
    lastUsed: "45 mins ago",
    usesToday: 312,
    lastVerified: "3 hours ago",
    verifierInitials: "RK",
    expires: "Ongoing",
  },
  {
    id: 6,
    type: "Deal",
    title: "Up to 30% Off Men's Basketball Shoes",
    description:
      "Save big on top-performing basketball footwear, including select LeBron, Kevin Durant, and Jordan styles. Prices as marked.",
    discount: "UP TO 30%",
    code: null,
    isVerified: true,
    lastUsed: "20 mins ago",
    usesToday: 590,
    lastVerified: "4 hours ago",
    verifierInitials: "SJ",
    expires: "Ends tomorrow",
  },
  {
    id: 7,
    type: "Code",
    title: "Flash Sale: $30 Off Orders of $150+",
    description:
      "Take $30 off your cart total when you spend $150 or more. Valid for a limited time. Excludes gift cards and customized Nike By You shoes.",
    discount: "$30 OFF",
    code: "FLASH30",
    isVerified: true,
    lastUsed: "8 mins ago",
    usesToday: 893,
    lastVerified: "30 mins ago",
    verifierInitials: "AM",
    expires: "Ends in 12 hours",
  },
  {
    id: 8,
    type: "Code",
    title: "25% Off Birthday Month VestoriaHub",
    description:
      "Community submitted birthday VestoriaHub code. May be account-bound. Apply at checkout to see if your account qualifies for the discount.",
    discount: "25% OFF",
    code: "BDAY25OFF",
    isVerified: false,
    lastUsed: "3 hours ago",
    usesToday: 45,
    lastVerified: "2 days ago",
    verifierInitials: "TC",
    expires: "Ongoing",
  },
];

const STATUS_DISCOUNTS = [
  {
    icon: Award,
    title: "Military Discount",
    discount: "10% Off",
    verify: "GovX",
  },
  {
    icon: GraduationCap,
    title: "Student Discount",
    discount: "10% Off",
    verify: "UNiDAYS",
  },
  {
    icon: HeartPulse,
    title: "Medical Professional",
    discount: "10% Off",
    verify: "ID.me",
  },
];

const RESELLERS = [
  { name: "Saks Fifth Avenue", code: "TAKE20", discount: "20% Off Storewide" },
  { name: "Foot Locker", code: "LKS15", discount: "15% Off Orders $75+" },
  { name: "Dick's Sporting Goods", code: "SAVE10", discount: "$10 Off $50" },
];

const SIMILAR_STORES = [
  { name: "Adidas", discount: "25% OFF", code: "MFHSADP19" },
  { name: "Under Armour", discount: "Free Shipping", code: null },
  { name: "Fabletics", discount: "70% OFF 2 Items", code: null },
];

const FAQS = [
  {
    q: "How do I apply a promo code during Nike checkout?",
    a: "During checkout, look for the 'Do you have a promo code?' box above your order summary. Enter your code and click 'Apply'.",
  },
  {
    q: "Why isn't my Nike promo code working?",
    a: "Common reasons include: the code has expired, it doesn't apply to the items in your cart (like new SNKRS drops), or it requires you to be logged into a Nike+ account.",
  },
  {
    q: "Can I stack multiple promo codes on a single Nike order?",
    a: "Generally, no. Nike only allows one promo code per order. However, you can often use a promo code on items that are already discounted in the clearance section.",
  },
];

// --- COMPONENTS ---

const RowCouponCard = ({ coupon }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!coupon.code) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1A1340] rounded-[16px] border border-white/5 flex flex-col md:flex-row relative group transition-all duration-300 hover:-translate-y-[2px] shadow-[0_4px_20px_rgba(26,19,64,0.12)] hover:shadow-[0_16px_40px_rgba(26,19,64,0.25)] hover:border-[#4A3DBF]/50 overflow-hidden mb-[24px]">
      {/* ZONE 1: DISCOUNT (Left) */}
      <div className="flex md:flex-col items-center justify-center p-[24px] bg-gradient-to-b from-white/5 to-transparent border-b md:border-b-0 md:border-r border-white/10 shrink-0 md:w-[200px]">
        <div className="flex flex-col items-start md:items-center">
          <div className="text-[#F4A836] text-[28px] md:text-[32px] font-bold leading-none mb-[4px] text-center">
            {coupon.discount}
          </div>
          <div className="text-white/50 text-[10px] font-bold tracking-[0.1em] uppercase">
            {coupon.type === "Code" ? "Promo Code" : "Verified Deal"}
          </div>
        </div>
      </div>

      {/* ZONE 2: CONTENT (Middle) */}
      <div className="flex flex-col justify-between flex-grow p-[24px]">
        <div>
          <h3 className="text-white text-[18px] md:text-[20px] font-bold leading-[1.3] mb-[8px] group-hover:text-[#F4A836] transition-colors">
            {coupon.title}
          </h3>
          <p className="text-white/70 text-[14px] leading-[1.6] mb-[20px] max-w-[600px]">
            {coupon.description}
          </p>
        </div>

        {/* Trust Metrics */}
        <div className="flex flex-wrap items-center gap-[16px] md:gap-[24px] text-[12px] font-medium">
          <div className="flex items-center gap-[6px] text-[#22B07D] bg-[#22B07D]/10 px-[10px] py-[4px] rounded-full">
            <Users size={14} /> {coupon.usesToday} uses today
          </div>
          <div className="flex items-center gap-[6px] text-white/50">
            <Clock size={14} /> Last used {coupon.lastUsed}
          </div>
          <div className="flex items-center gap-[6px] text-white/50 border-l border-white/10 pl-[16px] md:pl-[24px]">
            {coupon.isVerified ? (
              <>
                <div className="w-[20px] h-[20px] rounded-full bg-[#4A3DBF] text-white flex items-center justify-center text-[9px] font-bold">
                  {coupon.verifierInitials}
                </div>
                <span>Verified {coupon.lastVerified}</span>
              </>
            ) : (
              <span className="text-[#F4A836]">Unverified Community Code</span>
            )}
          </div>
        </div>
      </div>

      {/* ZONE 3: ACTION (Right) */}
      <div className="flex flex-col items-center md:items-end justify-center p-[24px] bg-white/5 border-t md:border-t-0 md:border-l border-white/10 shrink-0 md:w-[240px]">
        {coupon.type === "Code" ? (
          <div className="w-full flex flex-col items-center md:items-end gap-[12px]">
            <div
              className="w-full relative group/code cursor-pointer"
              onClick={handleCopy}
            >
              <div className="absolute inset-0 border-[1.5px] border-dashed border-[#F4A836]/50 rounded-[8px] group-hover/code:bg-[#F4A836]/10 transition-colors" />
              <div className="relative flex items-center justify-between p-[12px_16px]">
                <span className="font-mono text-[16px] font-bold text-[#F4A836] tracking-[0.1em]">
                  {coupon.code}
                </span>
                {copied ? (
                  <CheckCheck size={18} className="text-[#22B07D]" />
                ) : (
                  <Copy
                    size={18}
                    className="text-[#F4A836]/70 group-hover/code:text-[#F4A836] transition-colors"
                  />
                )}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className={`w-full py-[12px] rounded-[8px] text-[14px] font-bold transition-all duration-150 flex items-center justify-center gap-[8px] ${copied ? "bg-[#22B07D] text-white" : "bg-[#FF6B35] hover:bg-[#e05520] text-white"}`}
            >
              {copied ? "Code Copied!" : "Copy Code"}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center md:items-end gap-[12px]">
            <button className="w-full bg-[#2D2380] hover:bg-[#4A3DBF] text-white py-[14px] rounded-[8px] text-[14px] font-bold transition-all duration-150 flex items-center justify-center gap-[8px]">
              Get Deal <ExternalLink size={16} />
            </button>
          </div>
        )}
        <div className="text-[11px] text-white/40 mt-[16px] text-center md:text-right w-full">
          {coupon.expires}
        </div>
      </div>
    </div>
  );
};

const AccordionItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#E0DEF5] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-[20px] flex items-center justify-between text-left focus:outline-none"
      >
        <span className="text-[#1A1340] text-[16px] font-bold">{question}</span>
        <ChevronDown
          size={20}
          className={`text-[#7775A0] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[200px] mb-[20px]" : "max-h-0"}`}
      >
        <p className="text-[#7775A0] text-[15px] leading-[1.6]">{answer}</p>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function SingleStorePage() {
  return (
    <div className="min-h-screen bg-[#F7F6FF] font-sans pb-[96px]">
      {/* ── HEADER BREADCRUMB ── */}
      <div className="bg-white border-b border-[#E0DEF5] py-[16px]">
        <div className="max-w-[1280px] mx-auto px-[24px] flex items-center gap-[6px] text-[12px] text-[#7775A0] font-medium">
          <a href="/" className="hover:text-[#2D2380] transition-colors">
            Home
          </a>
          <ChevronRight size={12} />
          <a href="/stores" className="hover:text-[#2D2380] transition-colors">
            Stores
          </a>
          <ChevronRight size={12} />
          <span className="text-[#2D2380] font-bold">
            {STORE.name} Promo Codes
          </span>
        </div>
      </div>

      {/* ── STORE PROFILE HERO ── */}
      <div className="bg-white border-b border-[#E0DEF5] pb-[48px] pt-[32px]">
        <div className="max-w-[1280px] mx-auto px-[24px] flex flex-col lg:flex-row gap-[48px] lg:items-center justify-between">
          {/* Brand Info */}
          <div className="flex items-center gap-[24px]">
            <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full bg-[#F7F6FF] border border-[#E0DEF5] flex items-center justify-center text-[#1A1340] font-bold text-[40px] shadow-sm shrink-0">
              {STORE.logo}
            </div>
            <div>
              <h1 className="text-[#1A1340] text-[32px] md:text-[40px] font-bold leading-none mb-[8px]">
                {STORE.name} Promo Codes
              </h1>
              <div className="flex items-center gap-[12px] text-[14px] text-[#7775A0] font-medium">
                <div className="flex items-center gap-[4px] text-[#F4A836]">
                  <Star size={16} className="fill-current" />
                  <span className="text-[#1A1340] font-bold">
                    {STORE.rating}
                  </span>
                </div>
                <span>({STORE.reviewCount} ratings)</span>
              </div>
            </div>
          </div>

          {/* Intelligence Panel */}
          <div className="bg-gradient-to-br from-[#1A1340] to-[#2D2380] rounded-[16px] p-[24px] shadow-lg flex items-center gap-[32px] w-full lg:w-auto relative overflow-hidden">
            <div className="absolute -right-[20px] -top-[20px] w-[150px] h-[150px] rounded-full bg-[#F4A836]/5 pointer-events-none" />

            <div>
              <div className="flex items-center gap-[6px] text-[#F4A836] text-[11px] font-bold tracking-[0.08em] uppercase mb-[8px]">
                <TrendingUp size={14} /> Savings Intelligence
              </div>
              <div className="text-white text-[14px] leading-[1.5] max-w-[340px]">
                {STORE.name} is an occasional code merchant, with{" "}
                <strong className="text-white">
                  {STORE.verified30Days} verified
                </strong>{" "}
                in the last 30 days, and currently has{" "}
                <strong className="text-white">
                  {STORE.activeCodes} active code
                </strong>
                .
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-[24px] pl-[24px] border-l border-white/10">
              <div>
                <div className="text-white/50 text-[11px] font-bold uppercase tracking-[0.06em] mb-[4px]">
                  Avg Discount
                </div>
                <div className="text-white text-[24px] font-bold">
                  {STORE.avgDiscount}
                </div>
              </div>
              <div>
                <div className="text-white/50 text-[11px] font-bold uppercase tracking-[0.06em] mb-[4px]">
                  Best of Year
                </div>
                <div className="text-[#F4A836] text-[24px] font-bold">
                  {STORE.bestDiscount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className="max-w-[1280px] mx-auto px-[24px] pt-[48px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[48px] items-start">
          {/* MAIN CONTENT (Left - 8 Cols) */}
          <div className="col-span-1 lg:col-span-8">
            <div className="flex items-center justify-between mb-[24px]">
              <h2 className="text-[#1A1340] text-[24px] font-bold">
                Top Codes & Verifications
              </h2>
              <span className="text-[#7775A0] text-[14px] font-medium bg-white px-[12px] py-[6px] rounded-full border border-[#E0DEF5]">
                {OFFERS.length} Active Offers
              </span>
            </div>

            {/* Coupons List */}
            <div className="mb-[48px]">
              {OFFERS.map((offer) => (
                <RowCouponCard key={offer.id} coupon={offer} />
              ))}
            </div>

            {/* Status Discounts (Student, Military, etc) */}
            <div className="bg-white border border-[#E0DEF5] rounded-[16px] p-[32px] shadow-[0_2px_16px_rgba(26,19,64,0.04)] mb-[48px]">
              <h3 className="text-[#1A1340] text-[20px] font-bold mb-[8px]">
                Special Status Discounts
              </h3>
              <p className="text-[#7775A0] text-[14px] mb-[24px]">
                Constant savings for eligible groups. Requires verification via
                third-party services.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px]">
                {STATUS_DISCOUNTS.map((status, i) => (
                  <div
                    key={i}
                    className="border border-[#E0DEF5] rounded-[12px] p-[20px] hover:border-[#2D2380] transition-colors cursor-pointer group"
                  >
                    <status.icon
                      className="text-[#2D2380] mb-[12px]"
                      size={24}
                    />
                    <div className="text-[#1A1340] text-[15px] font-bold mb-[4px]">
                      {status.title}
                    </div>
                    <div className="text-[#F4A836] font-bold text-[18px] mb-[8px]">
                      {status.discount}
                    </div>
                    <div className="text-[12px] text-[#7775A0] flex items-center gap-[4px]">
                      Verify with {status.verify}{" "}
                      <ChevronRight
                        size={12}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Profile / About */}
            <div className="bg-white border border-[#E0DEF5] rounded-[16px] p-[32px] shadow-[0_2px_16px_rgba(26,19,64,0.04)] mb-[48px]">
              <div className="flex items-center gap-[8px] mb-[16px]">
                <Info size={20} className="text-[#2D2380]" />
                <h3 className="text-[#1A1340] text-[20px] font-bold">
                  About {STORE.name}
                </h3>
              </div>
              <p className="text-[#7775A0] text-[15px] leading-[1.7] mb-[32px]">
                {STORE.about}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[24px] pt-[24px] border-t border-[#E0DEF5]">
                {STORE.policies.map((p, i) => (
                  <div key={i}>
                    <div className="text-[#1A1340] font-bold text-[14px] mb-[4px]">
                      {p.label}
                    </div>
                    <div className="text-[#7775A0] text-[14px]">{p.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white border border-[#E0DEF5] rounded-[16px] p-[32px] shadow-[0_2px_16px_rgba(26,19,64,0.04)]">
              <h3 className="text-[#1A1340] text-[20px] font-bold mb-[24px]">
                {STORE.name} Promo Codes FAQ
              </h3>
              <div>
                {FAQS.map((faq, i) => (
                  <AccordionItem key={i} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR (Right - 4 Cols) */}
          <aside className="col-span-1 lg:col-span-4 flex flex-col gap-[32px] lg:sticky lg:top-[32px]">
            {/* Similar Competitor Deals */}
            <div className="bg-white border border-[#E0DEF5] rounded-[16px] p-[24px] shadow-[0_2px_12px_rgba(26,19,64,0.04)]">
              <h3 className="text-[#1A1340] text-[16px] font-bold mb-[20px]">
                Competitor Discounts
              </h3>
              <div className="flex flex-col gap-[16px]">
                {SIMILAR_STORES.map((sim, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-[8px] pb-[16px] border-b border-[#F7F6FF] last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#1A1340] font-bold text-[14px]">
                        {sim.name}
                      </span>
                      <span className="text-[#F4A836] font-bold text-[14px]">
                        {sim.discount}
                      </span>
                    </div>
                    {sim.code ? (
                      <div className="bg-[#F7F6FF] border border-[#E0DEF5] rounded-[6px] px-[12px] py-[8px] flex items-center justify-between group cursor-pointer hover:border-[#2D2380] transition-colors">
                        <span className="font-mono text-[13px] text-[#2D2380] font-bold">
                          {sim.code}
                        </span>
                        <span className="text-[11px] font-bold text-[#7775A0] group-hover:text-[#2D2380]">
                          Copy
                        </span>
                      </div>
                    ) : (
                      <button className="text-[#2D2380] text-[12px] font-bold text-left hover:underline">
                        Get Deal →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Authorized Resellers */}
            <div className="bg-white border border-[#E0DEF5] rounded-[16px] p-[24px] shadow-[0_2px_12px_rgba(26,19,64,0.04)]">
              <h3 className="text-[#1A1340] text-[16px] font-bold mb-[8px]">
                Authorized Resellers
              </h3>
              <p className="text-[#7775A0] text-[12px] mb-[20px] leading-[1.5]">
                Can't find a direct code? Try these working codes from official{" "}
                {STORE.name} retailers.
              </p>
              <div className="flex flex-col gap-[20px]">
                {RESELLERS.map((reseller, i) => (
                  <div key={i} className="flex flex-col gap-[8px]">
                    <div className="text-[#1A1340] text-[14px] font-bold leading-tight">
                      {reseller.discount}
                    </div>
                    <div className="text-[#7775A0] text-[12px]">
                      at {reseller.name}
                    </div>
                    <div className="bg-[#EEEDFE] rounded-[6px] px-[12px] py-[8px] flex items-center justify-between group cursor-pointer hover:bg-[#2D2380] transition-colors">
                      <span className="font-mono text-[13px] text-[#2D2380] font-bold group-hover:text-white">
                        {reseller.code}
                      </span>
                      <span className="text-[11px] font-bold text-[#2D2380] group-hover:text-white">
                        Copy Code
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
