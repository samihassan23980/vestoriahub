"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import "./admin-theme.css";
import {
  LayoutDashboard,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  BarChart2,
  Tag,
  ShoppingBag,
  Store,
  Layers,
  FileText,
  Image as ImageIcon,
  Users,
  Network,
  Globe,
  Settings,
  Loader2,
  ShieldCheck,
} from "lucide-react";

const AdminLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // ─── AUTHENTICATION GUARD ────────────────────────────────────────────────
  useEffect(() => {
    const verifyAccess = () => {
      const adminUser = localStorage.getItem("adminuser");
      if (!adminUser) {
        router.push("/signin");
      } else {
        setIsAuthChecking(false);
      }
    };
    verifyAccess();
  }, [router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // ─── LOGOUT FUNCTIONALITY ─────────────────────────────────────────────────
  const handleLogout = () => {
    Swal.fire({
      title: "Sign Out",
      text: "Are you sure you want to log out of the admin panel?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1C352D",
      cancelButtonColor: "#E2D9CC",
      confirmButtonText: "Yes, sign out",
      cancelButtonText: "Cancel",
      background: "#FFFFFF",
      color: "#16241F",
      iconColor: "#D9A441",
      customClass: {
        popup: "rounded-2xl border border-[#E2D9CC] shadow-xl",
        confirmButton: "rounded-lg font-bold px-6 py-2.5 !text-[#FDFBF7]",
        cancelButton: "rounded-lg font-bold px-6 py-2.5 !text-[#16241F]",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("adminuser");
        router.push("/signin");

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Signed out successfully",
          showConfirmButton: false,
          timer: 1500,
          background: "#FFFFFF",
          color: "#16241F",
          iconColor: "#D9A441",
          customClass: {
            popup: "rounded-xl border border-[#E2D9CC]",
          },
        });
      }
    });
  };

  const navGroups = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Analytics & Reports", href: "/admin/analytics", icon: BarChart2 },
      ],
    },
    {
      title: "Offers & Deals",
      items: [
        { name: "Coupons & Offers", href: "/admin/coupons", icon: Tag },
        { name: "Amazon Deals", href: "/admin/amazon-deals", icon: ShoppingBag },
      ],
    },
    {
      title: "Content Management",
      items: [
        { name: "Brands & Stores", href: "/admin/stores", icon: Store },
        { name: "Categories", href: "/admin/categories", icon: Layers },
        { name: "Blog Editor", href: "/admin/blogs", icon: FileText },
        { name: "Slider", href: "/admin/slider", icon: Store },
      ],
    },
    {
      title: "Platform & Settings",
      items: [
        { name: "Media Library", href: "/admin/media", icon: ImageIcon },
        { name: "Affiliate Networks", href: "/admin/networks", icon: Network },
        { name: "Firewall", href: "/admin/firewall", icon: ShieldCheck },
        { name: "Affiliate Products", href: "/admin/affiliate-products", icon: Network },
        { name: "Countries & Geo", href: "/admin/countries", icon: Globe },
        { name: "Users & Roles", href: "/admin/users", icon: Users },
        { name: "Legal Pages", href: "/admin/legal", icon: FileText },
        { name: "Global Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8F0E5] font-sans">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 border-4 border-[#D9A441] rounded-full animate-ping opacity-25" />
          <div className="w-16 h-16 bg-[#FFFFFF] border border-[#E2D9CC] rounded-full flex items-center justify-center shadow-lg">
            <ShieldCheck size={32} className="text-[#D9A441]" />
          </div>
        </div>
        <h2 className="!text-[#10201B] text-[24px] font-heading font-extrabold tracking-tight mb-2">
          Verifying Access
        </h2>
        <p className="!text-[#6B7280] text-[14px] flex items-center gap-2 font-medium">
          <Loader2 size={16} className="animate-spin text-[#D9A441]" />
          Securing session connection...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-isolated-theme flex h-screen bg-[#F8F0E5] font-sans overflow-hidden !text-[#16241F] w-full">
      
      {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#10201B]/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[265px] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shrink-0 border-r border-[#E2D9CC] bg-[#FFFFFF] ${
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          
          {/* Top Brand Logo Section */}
          <div className="h-[74px] flex items-center justify-between px-6 border-b border-[#E2D9CC] shrink-0 bg-[#FFFFFF]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D9A441] text-[#16241F] flex items-center justify-center font-extrabold shadow-xs">
                <Tag size={16} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-[18px] tracking-tight !text-[#10201B]">
                  Vestoria<span className="text-[#D9A441]">Hub</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#EBF3EE] border border-[#BDD6C4] text-[9.5px] font-heading font-extrabold uppercase tracking-wider text-[#1C352D]">
                  Admin
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#F8F0E5] text-[#6B7280] hover:text-[#10201B] transition-colors"
              aria-label="Close sidebar"
            >
              <X size={19} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-7 custom-scrollbar">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="px-3 text-[10.5px] font-heading font-extrabold uppercase tracking-widest !text-[#8A8F8C] mb-2.5">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 group ${
                            isActive
                              ? "bg-[#1C352D] !text-[#FDFBF7] shadow-sm"
                              : "!text-[#16241F] hover:bg-[#F8F0E5] hover:!text-[#10201B]"
                          }`}
                        >
                          <item.icon
                            size={17}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={isActive ? "text-[#D9A441]" : "text-[#8A8F8C] group-hover:text-[#1C352D]"}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D9A441]" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* User Profile Footer */}
          <div className="p-3.5 border-t border-[#E2D9CC] shrink-0 bg-[#FDFBF7]">
            <div
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#EBF3EE] border border-transparent hover:border-[#BDD6C4] transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D9A441] to-[#BE8E34] text-[#16241F] flex items-center justify-center font-heading font-extrabold text-[12px] shrink-0 shadow-xs">
                SU
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-heading font-bold !text-[#10201B] truncate">Super Admin</p>
                <p className="text-[11px] !text-[#6B7280] truncate">Control Suite</p>
              </div>
              <LogOut
                size={16}
                className="text-[#8A8F8C] group-hover:text-[#C1432F] transition-colors shrink-0"
              />
            </div>
          </div>

        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Navbar Header */}
        <header className="h-[74px] bg-[#FFFFFF] border-b border-[#E2D9CC] flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-[#6B7280] hover:text-[#10201B] hover:bg-[#F8F0E5] rounded-xl transition-all"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>

            {/* Global Admin Search Bar */}
            <div className="hidden sm:flex items-center relative w-full max-w-md group">
              <Search
                size={16}
                className="absolute left-4 text-[#8A8F8C] group-focus-within:text-[#1C352D] transition-colors"
              />
              <input
                type="text"
                placeholder="Search coupons, stores, blogs, or analytics..."
                className="w-full pl-11 pr-14 py-2 bg-[#FDFBF7] border border-[#E2D9CC] rounded-full text-[13px] !text-[#16241F] placeholder-[#8A8F8C] focus:outline-none focus:border-[#1C352D] focus:ring-2 focus:ring-[#1C352D]/10 transition-all shadow-xs"
              />
              <div className="absolute right-3 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-[#6B7280] bg-[#FFFFFF] border border-[#E2D9CC]">
                ⌘K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-4">
            {/* Notification Badge */}
            <button 
              className="relative p-2.5 text-[#6B7280] hover:text-[#10201B] hover:bg-[#F8F0E5] rounded-xl border border-transparent hover:border-[#E2D9CC] transition-all"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#C1432F] rounded-full ring-2 ring-[#FFFFFF]" />
            </button>

            <div className="h-7 w-[1px] bg-[#E2D9CC] hidden sm:block" />

            {/* Profile Frame */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D9A441] to-[#BE8E34] text-[#16241F] flex items-center justify-center shrink-0 shadow-xs font-heading font-extrabold text-[12.5px]">
                SU
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[13px] font-heading font-bold !text-[#10201B] leading-tight">Super Admin</p>
                <p className="text-[11px] !text-[#6B7280] leading-tight mt-0.5">Active Session</p>
              </div>
            </div>
          </div>
        </header>

        {/* ─── DYNAMIC CHILDREN CANVAS ─── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8F0E5] custom-scrollbar">
          <div className="min-h-full p-4 sm:p-6 lg:p-8 !text-[#16241F]">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;