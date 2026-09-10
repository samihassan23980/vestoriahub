"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

// ─── EXACT ISOLATED THEME IMPORT ─────────────────────────────────────────────
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

// ─── ROLES ──────────────────────────────────────────────────────────────────
const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  SEO_MANAGER: "seo_manager",
  CONTENT_MANAGER: "content_manager",
  BLOG_EDITOR: "blog_editor",
  STORE_EDITOR: "store_editor",
  AFFILIATE_EDITOR: "affiliate_editor",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.MANAGER]: "Manager",
  [ROLES.SEO_MANAGER]: "SEO Manager",
  [ROLES.CONTENT_MANAGER]: "Content Manager",
  [ROLES.BLOG_EDITOR]: "Blog Editor",
  [ROLES.STORE_EDITOR]: "Store Editor",
  [ROLES.AFFILIATE_EDITOR]: "Affiliate Editor",
};

const ADMIN_MANAGER = [ROLES.ADMIN, ROLES.MANAGER];
const ADMIN_ONLY = [ROLES.ADMIN];

// ─── NAV CONFIG ─────────────────────────────────────────────────────────────
const navGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: Object.values(ROLES) },
      {
        name: "Analytics & Reports",
        href: "/admin/analytics",
        icon: BarChart2,
        roles: ADMIN_MANAGER,
      },
    ],
  },
  {
    title: "Content Management",
    items: [
      {
        name: "Blog Editor",
        href: "/admin/blogs",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER, ROLES.CONTENT_MANAGER, ROLES.BLOG_EDITOR],
      },
      {
        name: "Brands & Stores",
        href: "/admin/stores",
        icon: Store,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER, ROLES.CONTENT_MANAGER, ROLES.STORE_EDITOR],
      },
      {
        name: "Affiliate Products",
        href: "/admin/affiliate-products",
        icon: Network,
        roles: [
          ...ADMIN_MANAGER,
          ROLES.SEO_MANAGER,
          ROLES.CONTENT_MANAGER,
          ROLES.AFFILIATE_EDITOR,
        ],
      },
      {
        name: "Coupons & Offers",
        href: "/admin/coupons",
        icon: Tag,
        roles: [...ADMIN_MANAGER, ROLES.CONTENT_MANAGER, ROLES.STORE_EDITOR],
      },
      {
        name: "Categories",
        href: "/admin/categories",
        icon: Layers,
        roles: [
          ...ADMIN_MANAGER,
          ROLES.SEO_MANAGER,
          ROLES.CONTENT_MANAGER,
          ROLES.BLOG_EDITOR,
          ROLES.STORE_EDITOR,
          ROLES.AFFILIATE_EDITOR,
        ],
      },
      {
        name: "Media Library",
        href: "/admin/media",
        icon: ImageIcon,
        roles: [
          ...ADMIN_MANAGER,
          ROLES.CONTENT_MANAGER,
          ROLES.BLOG_EDITOR,
          ROLES.STORE_EDITOR,
          ROLES.AFFILIATE_EDITOR,
        ],
      },
      {
        name: "Slider",
        href: "/admin/slider",
        icon: Store,
        roles: [...ADMIN_MANAGER, ROLES.CONTENT_MANAGER],
      },
      {
        name: "Affiliate Networks",
        href: "/admin/networks",
        icon: Network,
        roles: [...ADMIN_MANAGER, ROLES.CONTENT_MANAGER],
      },
      {
        name: "Countries & Geo",
        href: "/admin/countries",
        icon: Globe,
        roles: [...ADMIN_MANAGER, ROLES.CONTENT_MANAGER],
      },
    ],
  },
  {
    title: "SEO Management",
    items: [
      {
        name: "Internal Linking Hub",
        href: "/admin/internal-links",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "SEO Link Health & Clusters",
        href: "/admin/seo-audit",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Meta Data Fixes",
        href: "/admin/seo-metadata",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Empty Store Fixes",
        href: "/admin/empty-stores",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Broken Links Checker",
        href: "/admin/affiliate-links",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Keyword Optimization",
        href: "/admin/keyword-optimizer",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "CTR Booster",
        href: "/admin/ctr-booster",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "AI CTR Booster",
        href: "/admin/ai-ctr-booster",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Topical Authority & Cluster Mesh Architect",
        href: "/admin/ai-topic-mesh",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Keyword-Intelligence Cluster Matrix",
        href: "/admin/keyword-cluster-matrix",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Specific Blog Authority Matrix",
        href: "/admin/single-blog-matrix",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Year Checker",
        href: "/admin/stale-content",
        icon: FileText,
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
    ],
  },
  {
    title: "Platform & Settings",
    items: [
      { name: "Users & Roles", href: "/admin/users", icon: Users, roles: ADMIN_ONLY },
      { name: "Firewall", href: "/admin/firewall", icon: ShieldCheck, roles: ADMIN_ONLY },
      { name: "Legal Pages", href: "/admin/legal", icon: FileText, roles: ADMIN_MANAGER },
      { name: "Global Settings", href: "/admin/settings", icon: Settings, roles: ADMIN_MANAGER },
    ],
  },
];

function getNavForRole(role) {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

function getInitials(name) {
  if (!name) return "AD";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AdminLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // ─── AUTHENTICATION GUARD ────────────────────────────────────────────────
  useEffect(() => {
    const verifyAccess = () => {
      const raw = localStorage.getItem("adminuser");
      if (!raw) {
        router.push("/signin");
        return;
      }

      let user = { name: "Administrator", role: ROLES.ADMIN };
      try {
        const parsed = JSON.parse(raw);
        user = {
          name: parsed.name || "Administrator",
          role: parsed.role || ROLES.ADMIN,
        };
      } catch {
        // Fallback for legacy format
      }

      setCurrentUser(user);
      setIsAuthChecking(false);
    };
    verifyAccess();
  }, [router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // ─── LOGOUT ─────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Swal.fire({
      title: "Sign Out",
      text: "Are you sure you want to log out of the admin panel?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, sign out",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {
          console.error("Logout API call failed:", e);
        }

        localStorage.removeItem("adminuser");

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Signed out successfully",
          showConfirmButton: false,
          timer: 1200,
        }).then(() => {
          router.push("/signin");
          router.refresh();
        });
      }
    });
  };

  if (isAuthChecking) {
    return (
      <div className="admin-isolated-theme h-screen w-screen flex flex-col items-center justify-center font-sans">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-[80px] h-[80px] border-[3px] rounded-full animate-ping opacity-25" />
          <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center shadow-sm z-10 border">
            <ShieldCheck size={32} />
          </div>
        </div>
        <h2 className="text-[24px] font-bold tracking-tight mb-2">
          Verifying Access
        </h2>
        <p className="text-[14px] flex items-center gap-2 font-medium">
          <Loader2 size={16} className="animate-spin" />
          Securing connection...
        </p>
      </div>
    );
  }

  const visibleNavGroups = getNavForRole(currentUser?.role || ROLES.ADMIN);
  const displayName = currentUser?.name || "Administrator";
  const displayRole = ROLE_LABELS[currentUser?.role] || "Admin";
  const initials = getInitials(displayName);

  return (
    <div className="admin-isolated-theme flex h-screen font-sans overflow-hidden w-full">
      {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shrink-0 border-r ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-[72px] flex items-center justify-between px-6 border-b shrink-0">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 focus:outline-none"
            >
              <span className="font-heading font-black text-lg tracking-tight">
                Pie<span>Solution</span>
              </span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
            {visibleNavGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group ${
                            isActive ? "bg-primary" : ""
                          }`}
                        >
                          <item.icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                            className="transition-colors"
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full" />
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
          <div className="p-4 border-t shrink-0">
            <div
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm border">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] font-medium truncate mt-0.5">
                  {displayRole}
                </p>
              </div>
              <LogOut
                size={16}
                className="transition-colors shrink-0"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-[72px] flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg transition-all"
            >
              <Menu size={22} />
            </button>

            {/* Search Bar */}
            <div className="hidden sm:flex items-center relative w-full max-w-md group">
              <Search
                size={18}
                className="absolute left-4 opacity-70 transition-colors"
              />
              <input
                type="text"
                placeholder="Search coupons, stores, or blogs..."
                className="w-full pl-11 pr-12 py-2.5 rounded-full text-[13px] border transition-all font-medium"
              />
              <div className="absolute right-3 px-2 py-0.5 rounded text-[10px] font-bold border">
                ⌘K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 ml-4">
            <button className="relative p-2 rounded-lg transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full border" />
            </button>

            <div className="h-6 w-[1px] hidden sm:block border-r" />

            <div className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-transparent">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border">
                <span className="font-bold text-[12px]">{initials}</span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[12px] font-bold leading-none">
                  {displayName}
                </p>
                <p className="text-[10px] font-medium leading-none mt-1">
                  {displayRole}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Children Canvas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="min-h-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;