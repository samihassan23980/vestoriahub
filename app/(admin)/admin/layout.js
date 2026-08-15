"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
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
      confirmButtonColor: "#6E4FF5", // var(--purple-600)
      cancelButtonColor: "#262A52",  // var(--navy-400)
      confirmButtonText: "Yes, sign out",
      cancelButtonText: "Cancel",
      background: "#13152B",         // var(--navy-600)
      color: "#FFFFFF",
      customClass: {
        popup: "rounded-[16px] border border-[var(--indigo-line)]",
        confirmButton: "rounded-[8px] font-bold px-5 py-2 text-white",
        cancelButton: "rounded-[8px] font-bold px-5 py-2 text-white",
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
          background: "#13152B",
          color: "#FFFFFF",
          iconColor: "#7C5CFC",
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0A0B1E] font-sans">
        <div className="relative flex items-center justify-center mb-[24px]">
          <div className="absolute w-[80px] h-[80px] border-4 border-[#7C5CFC] rounded-full animate-ping opacity-20" />
          <div className="w-[64px] h-[64px] bg-[#13152B] border border-[#2A2D4A] rounded-full flex items-center justify-center shadow-xl">
            <ShieldCheck size={32} className="text-[#7C5CFC]" />
          </div>
        </div>
        <h2 className="text-white text-[24px] font-bold tracking-tight mb-[8px]">
          Verifying Access
        </h2>
        <p className="text-[#A0A3BD] text-[14px] flex items-center gap-[8px]">
          <Loader2 size={16} className="animate-spin text-[#7C5CFC]" />
          Securing connection...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-isolated-theme flex h-screen bg-[#0A0B1E] font-sans overflow-hidden text-white w-full">
      
      {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#03040A]/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shrink-0 border-r border-[#2A2D4A] bg-[#13152B] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-[72px] flex items-center justify-between px-6 border-b border-[#2A2D4A] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">
                VestoriaHub
              </span>
              <span className="px-2 py-0.5 rounded bg-[#7C5CFC]/20 text-[10px] font-bold uppercase tracking-wider text-[#7C5CFC]">
                Admin
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-full hover:bg-white/10 text-[#A0A3BD] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 admin-scroll-container">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#A0A3BD] opacity-60 mb-3">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-semibold transition-all duration-150 group ${
                            isActive
                              ? "bg-[#7C5CFC] text-white shadow-lg shadow-[#7C5CFC]/15"
                              : "text-[#A0A3BD] hover:bg-[#181A38] hover:text-white"
                          }`}
                        >
                          <item.icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={isActive ? "text-white" : "text-[#A0A3BD] group-hover:text-white"}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#fff]" />
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
          <div className="p-4 border-t border-[#2A2D4A] shrink-0 bg-[#0A0B1E]/40">
            <div
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#181A38] transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-[#7C5CFC] flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
                SU
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-white truncate">Super Admin</p>
                <p className="text-[12px] text-[#A0A3BD] truncate">Control Panel</p>
              </div>
              <LogOut
                size={16}
                className="text-[#A0A3BD] group-hover:text-red-400 transition-colors shrink-0"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-[72px] bg-[#13152B] border-b border-[#2A2D4A] flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 -ml-2 text-[#A0A3BD] hover:text-white hover:bg-[#181A38] rounded-xl transition-all"
            >
              <Menu size={22} />
            </button>

            {/* Global Admin Search Bar */}
            <div className="hidden sm:flex items-center relative w-full max-w-md group">
              <Search
                size={18}
                className="absolute left-4 text-[#A0A3BD] opacity-60 group-focus-within:text-[#7C5CFC] group-focus-within:opacity-100 transition-colors"
              />
              <input
                type="text"
                placeholder="Search coupons, stores, or blogs..."
                className="w-full pl-11 pr-12 py-2.5 bg-[#0A0B1E] border-[1.5px] border-[#2A2D4A] rounded-full text-[14px] text-white placeholder:text-[#A0A3BD]/40 focus:outline-none focus:border-[#7C5CFC] focus:bg-[#060713] transition-all"
              />
              <div className="absolute right-3 px-2 py-0.5 rounded-md text-[10px] font-bold text-[#A0A3BD] bg-[#13152B] border border-[#2A2D4A]">
                ⌘K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 ml-4">
            {/* Notification Badge */}
            <button className="relative p-2.5 text-[#A0A3BD] hover:text-white hover:bg-[#181A38] rounded-xl transition-all">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-400 rounded-full border-2 border-[#13152B]" />
            </button>

            <div className="h-8 w-[1px] bg-[#2A2D4A] hidden sm:block" />

            {/* Profile Frame */}
            <div className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-transparent">
              <div className="w-9 h-9 rounded-full bg-[#7C5CFC] flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                <span className="text-white font-bold text-[13px]">SU</span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[13px] font-bold text-white leading-tight">Super Admin</p>
                <p className="text-[11px] text-[#A0A3BD] leading-tight mt-0.5">Secure Session</p>
              </div>
            </div>
          </div>
        </header>

        {/* ─── DYNAMIC CHILDREN CANVAS ─── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0A0B1E] admin-scroll-container">
          <div className="min-h-full p-4 sm:p-6 lg:p-8 text-white">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;