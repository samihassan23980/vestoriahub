// lib/navigation-config.js

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  SEO_MANAGER: "seo_manager",
  CONTENT_MANAGER: "content_manager",
  BLOG_EDITOR: "blog_editor",
  STORE_EDITOR: "store_editor",
  AFFILIATE_EDITOR: "affiliate_editor",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin — full access, including security settings",
  [ROLES.MANAGER]: "Manager — full operational access",
  [ROLES.SEO_MANAGER]: "SEO Manager — SEO tools + content optimization",
  [ROLES.CONTENT_MANAGER]: "Content Manager — oversees all content types",
  [ROLES.BLOG_EDITOR]: "Blog Editor — blog content only",
  [ROLES.STORE_EDITOR]: "Store Editor — store/brand content only",
  [ROLES.AFFILIATE_EDITOR]: "Affiliate Editor — affiliate product content only",
};

// Shorthand groups so the list below stays readable
const ALL = Object.values(ROLES);
const ADMIN_MANAGER = [ROLES.ADMIN, ROLES.MANAGER];
const ADMIN_ONLY = [ROLES.ADMIN];

export const navGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: "LayoutDashboard", roles: ALL },
      {
        name: "Analytics & Reports",
        href: "/admin/analytics",
        icon: "BarChart2",
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
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER, ROLES.CONTENT_MANAGER, ROLES.BLOG_EDITOR],
      },
      {
        name: "Brands & Stores",
        href: "/admin/stores",
        icon: "Store",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER, ROLES.CONTENT_MANAGER, ROLES.STORE_EDITOR],
      },
      {
        name: "Affiliate Products",
        href: "/admin/affiliate-products",
        icon: "Network",
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
        icon: "Tag",
        roles: [...ADMIN_MANAGER, ROLES.CONTENT_MANAGER, ROLES.STORE_EDITOR],
      },
      {
        name: "Categories",
        href: "/admin/categories",
        icon: "Layers",
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
        icon: "ImageIcon",
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
        icon: "Store",
        roles: [...ADMIN_MANAGER, ROLES.CONTENT_MANAGER],
      },
      {
        name: "Affiliate Networks",
        href: "/admin/networks",
        icon: "Network",
        roles: [...ADMIN_MANAGER, ROLES.CONTENT_MANAGER],
      },
      {
        name: "Countries & Geo",
        href: "/admin/countries",
        icon: "Globe",
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
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "SEO Link Health & Clusters",
        href: "/admin/seo-audit",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Meta Data Fixes",
        href: "/admin/seo-metadata",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Empty Store Fixes",
        href: "/admin/empty-stores",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Broken Links Checker",
        href: "/admin/affiliate-links",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Keyword Optimization",
        href: "/admin/keyword-optimizer",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "CTR Booster",
        href: "/admin/ctr-booster",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "AI CTR Booster",
        href: "/admin/ai-ctr-booster",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Topical Authority & Cluster Mesh Architect",
        href: "/admin/ai-topic-mesh",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Keyword-Intelligence Cluster Matrix",
        href: "/admin/keyword-cluster-matrix",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Specific Blog Authority Matrix",
        href: "/admin/single-blog-matrix",
        icon: "FileText",
        roles: [...ADMIN_MANAGER, ROLES.SEO_MANAGER],
      },
      {
        name: "Year Checker",
        href: "/admin/stale-content",
        icon: "FileText",
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
        icon: "Users",
        roles: ADMIN_ONLY, // security-critical — assigning roles is admin-only
      },
      {
        name: "Firewall",
        href: "/admin/firewall",
        icon: "ShieldCheck",
        roles: ADMIN_ONLY, // security-critical
      },
      {
        name: "Legal Pages",
        href: "/admin/legal",
        icon: "FileText",
        roles: ADMIN_MANAGER,
      },
      {
        name: "Global Settings",
        href: "/admin/settings",
        icon: "Settings",
        roles: ADMIN_MANAGER,
      },
    ],
  },
];

// Filters the full nav tree down to what a given role can see. Empty
// groups (all items filtered out) are dropped entirely, so the sidebar
// never shows a section header with nothing under it.
export function getNavForRole(role) {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}