"use client";

import React, { useState, useEffect, useRef } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
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
      {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        roles: Object.values(ROLES),
      },
      {
        name: "Analytics & Reports",
        href: "/admin/analytics",
        icon: BarChart2,
        roles: ADMIN_MANAGER,
      },
      {
        name: "Activity Logs",
        href: "/admin/activity-logs",
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
        roles: [
          ...ADMIN_MANAGER,
          ROLES.SEO_MANAGER,
          ROLES.CONTENT_MANAGER,
          ROLES.BLOG_EDITOR,
        ],
      },
      {
        name: "Brands & Stores",
        href: "/admin/stores",
        icon: Store,
        roles: [
          ...ADMIN_MANAGER,
          ROLES.SEO_MANAGER,
          ROLES.CONTENT_MANAGER,
          ROLES.STORE_EDITOR,
        ],
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
        roles: [
          ...ADMIN_MANAGER,
          ROLES.CONTENT_MANAGER,
          ROLES.STORE_EDITOR,
        ],
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
      {
        name: "Users & Roles",
        href: "/admin/users",
        icon: Users,
        roles: ADMIN_ONLY,
      },
      {
        name: "Firewall",
        href: "/admin/firewall",
        icon: ShieldCheck,
        roles: ADMIN_ONLY,
      },
      {
        name: "Legal Pages",
        href: "/admin/legal",
        icon: FileText,
        roles: ADMIN_MANAGER,
      },
      {
        name: "Global Settings",
        href: "/admin/settings",
        icon: Settings,
        roles: ADMIN_MANAGER,
      },
    ],
  },
];

function getNavForRole(role) {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.roles.includes(role)
      ),
    }))
    .filter((group) => group.items.length > 0);
}

function getInitials(name) {
  if (!name) return "AD";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AdminLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // ─── PERSIST COLLAPSE STATE ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedCollapseState = localStorage.getItem("admin_sidebar_collapsed");
      if (savedCollapseState !== null) {
        setIsSidebarCollapsed(savedCollapseState === "true");
      }
    } catch {
      // Ignore local storage errors
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const nextState = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(nextState));
      } catch {
        // Ignore local storage errors
      }
      return nextState;
    });
  };

  // ─── SECURE SESSION MANAGEMENT ────────────────────────────────────────────
  const sessionTimerRef = useRef(null);
  const redirectingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let requestController = null;

    const clearSessionTimer = () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };

    const redirectExpired = async () => {
      if (redirectingRef.current) return;

      redirectingRef.current = true;
      clearSessionTimer();

      if (mounted) {
        setIsAuthChecking(true);
      }

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch (error) {
        console.error("Session logout request failed:", error);
      }

      localStorage.removeItem("adminuser");

      window.location.replace("/signin?reason=session_expired");
    };

    const verifyAccess = async () => {
      if (!mounted || redirectingRef.current) return;

      if (requestController) {
        requestController.abort();
      }

      const controller = new AbortController();
      requestController = controller;

      try {
        const response = await fetch("/api/auth/session-status", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!mounted || controller.signal.aborted) {
          return;
        }

        if (response.status === 401) {
          await redirectExpired();
          return;
        }

        if (!response.ok) {
          console.error("Session status check failed:", response.status);
          return;
        }

        const data = await response.json();

        if (!mounted || controller.signal.aborted) {
          return;
        }

        const validRole = Object.values(ROLES).includes(data.role);
        const validExpiry = Number.isFinite(data.expiresAt);

        if (!data.authenticated || !validRole || !validExpiry) {
          await redirectExpired();
          return;
        }

        const remainingMs = data.expiresAt - Date.now();

        if (remainingMs <= 0) {
          await redirectExpired();
          return;
        }

        clearSessionTimer();

        sessionTimerRef.current = setTimeout(
          redirectExpired,
          Math.min(remainingMs, 2147483647)
        );

        let displayName = "Administrator";

        try {
          const raw = localStorage.getItem("adminuser");

          if (raw) {
            const parsed = JSON.parse(raw);

            if (
              typeof parsed?.name === "string" &&
              parsed.name.trim()
            ) {
              displayName = parsed.name;
            }
          }
        } catch {
          // Invalid display cache does not grant access.
        }

        if (mounted) {
          setCurrentUser({
            name: displayName,
            role: data.role,
          });

          setIsAuthChecking(false);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Session verification unavailable:", error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        verifyAccess();
      }
    };

    const handleFocus = () => {
      verifyAccess();
    };

    verifyAccess();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;

      if (requestController) {
        requestController.abort();
      }

      clearSessionTimer();

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // ─── CLOSE MOBILE SIDEBAR ON NAVIGATION ──────────────────────────────────
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // ─── MANUAL LOGOUT ────────────────────────────────────────────────────────
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
        if (redirectingRef.current) return;

        redirectingRef.current = true;

        if (sessionTimerRef.current) {
          clearTimeout(sessionTimerRef.current);
          sessionTimerRef.current = null;
        }

        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin",
          });
        } catch (error) {
          console.error("Logout API call failed:", error);
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
          window.location.replace("/signin");
        });
      }
    });
  };

  // ─── AUTH LOADING SCREEN ─────────────────────────────────────────────────
  if (isAuthChecking) {
    return (
      <div className="admin-isolated-theme h-screen w-screen flex flex-col items-center justify-center font-sans">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-[80px] h-[80px] border-[3px] rounded-full animate-ping opacity-25" />
          <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center shadow-sm z-10 border bg-white">
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

  // ─── VERIFIED USER PRESENTATION ──────────────────────────────────────────
  const visibleNavGroups = getNavForRole(currentUser?.role);
  const displayName = currentUser?.name || "Administrator";
  const displayRole = ROLE_LABELS[currentUser?.role] || "Unknown Role";
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
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 shrink-0 border-r ${
          isSidebarCollapsed ? "lg:w-[72px]" : "lg:w-[260px]"
        } w-[260px] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`h-[72px] flex items-center border-b shrink-0 px-4 transition-all duration-300 ${
            isSidebarCollapsed ? "lg:justify-center" : "justify-between px-6"
          }`}>
            <Link
              href="/admin"
              className="flex items-center gap-2 focus:outline-none overflow-hidden"
              title="PieSoluttion Admin"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm border bg-[var(--adm-surface-sub)]">
                P
              </div>
              <span
                className={`font-black text-lg tracking-tight whitespace-nowrap transition-all duration-200 ${
                  isSidebarCollapsed ? "lg:hidden" : "block"
                }`}
              >
                Pie<span className="opacity-90">Soluttion</span>
              </span>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg transition-colors border"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 custom-scrollbar overflow-x-hidden">
            {visibleNavGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                {/* Section Title or Compact Divider */}
                {isSidebarCollapsed ? (
                  <div className="hidden lg:flex justify-center my-3">
                    <div className="w-5 h-[1.5px] rounded-full bg-[var(--adm-border)]" />
                  </div>
                ) : (
                  <h3 className="px-3 text-[10.5px] font-extrabold uppercase tracking-wider mb-2.5 opacity-70">
                    {group.title}
                  </h3>
                )}

                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    return (
                      <li key={item.name} className="relative group">
                        <Link
                          href={item.href}
                          className={`flex items-center rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                            isSidebarCollapsed
                              ? "lg:justify-center lg:px-0 lg:w-11 lg:h-11 mx-auto"
                              : "px-3 py-2.5 gap-3"
                          } ${
                            isActive
                              ? "bg-primary shadow-sm"
                              : "hover:bg-[var(--adm-surface-sub)]"
                          }`}
                        >
                          <item.icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                            className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                          />

                          <span
                            className={`flex-1 truncate transition-opacity duration-200 ${
                              isSidebarCollapsed ? "lg:hidden" : "block"
                            }`}
                          >
                            {item.name}
                          </span>

                          {isActive && !isSidebarCollapsed && (
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" />
                          )}
                        </Link>

                        {/* Collapsed Tooltip */}
                        {isSidebarCollapsed && (
                          <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg border bg-[var(--adm-surface)] text-[var(--adm-text-title)] pointer-events-none">
                            {item.name}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* User Profile & Collapse Controls Footer */}
          <div className="p-3 border-t shrink-0 flex flex-col gap-2 bg-[var(--adm-surface-alt)]">
            <div
              onClick={handleLogout}
              className={`flex items-center rounded-xl transition-all cursor-pointer group hover:bg-[var(--adm-surface-sub)] ${
                isSidebarCollapsed
                  ? "lg:justify-center lg:p-2"
                  : "gap-3 px-3 py-2.5"
              }`}
              title={isSidebarCollapsed ? `Sign out (${displayName})` : "Sign Out"}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm border bg-[var(--adm-surface)] text-[12px]">
                {initials}
              </div>

              <div
                className={`flex-1 min-w-0 transition-opacity duration-200 ${
                  isSidebarCollapsed ? "lg:hidden" : "block"
                }`}
              >
                <p className="text-[13px] font-bold truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[10.5px] font-medium truncate mt-0.5 opacity-80">
                  {displayRole}
                </p>
              </div>

              <LogOut
                size={16}
                className={`transition-colors shrink-0 ${
                  isSidebarCollapsed ? "lg:hidden" : "block"
                }`}
              />
            </div>

            {/* Desktop Collapse / Expand Toggle Button */}
            <div className="hidden lg:flex items-center justify-center pt-1 border-t border-[var(--adm-border)]">
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold hover:bg-[var(--adm-surface-sub)] transition-colors border"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen size={16} />
                ) : (
                  <>
                    <PanelLeftClose size={16} />
                    <span className="truncate">Collapse Sidebar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-[72px] flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30 border-b">
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl transition-all border"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Top Navbar Collapse Shortcut for Desktop */}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-2 rounded-xl transition-all border hover:bg-[var(--adm-surface-sub)]"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>

            {/* Search Bar */}
            <div className="hidden sm:flex items-center relative w-full max-w-md group">
              <Search
                size={17}
                className="absolute left-4 opacity-70 transition-colors pointer-events-none"
              />

              <input
                type="text"
                placeholder="Search coupons, stores, or blogs..."
                className="w-full pl-11 pr-12 py-2 rounded-xl text-[13px] border transition-all font-medium focus:outline-none"
              />

              <div className="absolute right-3 px-2 py-0.5 rounded text-[10px] font-bold border opacity-75">
                ⌘K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-4">
            <button
              className="relative p-2.5 rounded-xl transition-all border hover:bg-[var(--adm-surface-sub)]"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full border bg-[var(--adm-gold)]" />
            </button>

            <div className="h-6 w-[1px] hidden sm:block border-r" />

            <div className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-transparent">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border bg-[var(--adm-surface)]">
                <span className="font-bold text-[12px]">{initials}</span>
              </div>

              <div className="text-left hidden md:block">
                <p className="text-[12px] font-bold leading-none">
                  {displayName}
                </p>
                <p className="text-[10px] font-medium leading-none mt-1 opacity-80">
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