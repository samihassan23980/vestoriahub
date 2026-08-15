import { connectDB } from "@/app/lib/mongodb";
import LegalPage from "@/app/models/legalPage";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ShieldCheck, ArrowLeft, ChevronRight, FileText, CheckCircle2 } from "lucide-react";

export const revalidate = 3600;

// ─── SEO METADATA GENERATION ───
export async function generateMetadata({ params }) {
  const { slug } = await params;
  await connectDB();
  const page = await LegalPage.findOne({ slug }).select("seo title").lean();

  if (!page) return { title: "Page Not Found | VestoriaHub" };

  return {
    title: page.seo?.metaTitle || `${page.title} | VestoriaHub`,
    description:
      page.seo?.metaDescription ||
      `Official ${page.title} document and compliance policies for VestoriaHub.`,
    robots: {
      index: page.seo?.indexable ?? true,
      follow: true,
    },
    alternates: {
      canonical: `/legal/${slug}`,
    },
  };
}

// ─── MAIN SERVER COMPONENT ───
export default async function PublicLegalPage({ params }) {
  const { slug } = await params;

  await connectDB();
  const page = await LegalPage.findOne({ slug, status: "published" }).lean();

  if (!page) {
    notFound();
  }

  const formattedDate = new Date(
    page.lastRevisedAt || page.updatedAt || Date.now()
  ).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F8F0E5] font-sans pb-24 text-[#16241F]">
      
      {/* ── BREADCRUMB ── */}
      <nav aria-label="Breadcrumb" className="bg-[#FFFFFF] border-b border-[#E2D9CC] py-3.5">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-[12px] font-mono text-[#8A8F8C]">
          <Link href="/" className="hover:text-[#1C352D] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-[#BDD6C4] shrink-0" />
          <span className="text-[#8A8F8C]">Legal & Compliance</span>
          <ChevronRight size={12} className="text-[#BDD6C4] shrink-0" />
          <span className="text-[#10201B] font-bold truncate">{page.title}</span>
        </div>
      </nav>

      {/* ── HERO HEADER CARD ── */}
      <header className="bg-[#10201B] border-b border-[#25473C] text-[#FDFBF7] py-14 sm:py-16 relative overflow-hidden">
        {/* Background S-Wave Flow Accent */}
        <div className="absolute top-1/2 left-0 w-[200vw] lg:w-full h-[260px] -translate-y-1/2 pointer-events-none z-0 opacity-15">
          <svg viewBox="0 0 1440 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#A8C3B0]">
            <path
              d="M-100 150 C 300 350, 600 -50, 1000 150 C 1300 300, 1600 50, 1800 150"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M-100 170 C 300 370, 600 -30, 1000 170 C 1300 320, 1600 70, 1800 170"
              stroke="#D9A441"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 8"
              className="opacity-60"
            />
          </svg>
        </div>

        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#162B24] border border-[#25473C] text-[#D9A441] text-[11px] font-heading font-extrabold uppercase tracking-widest mb-4 shadow-xs">
            <ShieldCheck size={14} className="text-[#34D399]" />
            <span>Verified Official Policy</span>
          </div>

          <h1 className="text-[34px] sm:text-[44px] md:text-[50px] font-heading font-black tracking-tight text-[#FDFBF7] leading-[1.1] mb-5">
            {page.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[12.5px] font-mono text-[#A8C3B0] pt-4 border-t border-[#25473C]">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-[#D9A441]" />
              <span>
                Last Revised:{" "}
                <strong className="text-[#FDFBF7] font-semibold">{formattedDate}</strong>
              </span>
            </div>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-[#25473C]" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#34D399]" />
              <span>VestoriaHub Legal & Transparency Standards</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── DOCUMENT BODY ── */}
      <main className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-[#FFFFFF] border-2 border-[#E2D9CC] rounded-[24px] p-6 sm:p-10 md:p-14 shadow-xs">
          
          <div
            className="prose prose-lg max-w-none text-[#16241F]
              prose-headings:font-heading prose-headings:font-extrabold prose-headings:text-[#10201B] prose-headings:tracking-tight
              prose-h1:text-[30px] prose-h1:mb-6
              prose-h2:text-[24px] prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-[#E2D9CC]
              prose-h3:text-[19px] prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-[#6B7280] prose-p:text-[15px] prose-p:leading-relaxed prose-p:mb-5 font-normal
              prose-li:text-[#6B7280] prose-li:text-[15px] prose-li:leading-relaxed prose-li:marker:text-[#1C352D]
              prose-strong:text-[#10201B] prose-strong:font-bold
              prose-a:text-[#1C352D] prose-a:font-semibold prose-a:underline prose-a:decoration-[#D9A441] prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:text-[#D9A441]
              prose-blockquote:border-l-4 prose-blockquote:border-[#D9A441] prose-blockquote:bg-[#FDFBF7] prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:text-[#16241F]
              prose-table:border prose-table:border-[#E2D9CC] prose-table:rounded-xl prose-table:overflow-hidden
              prose-th:bg-[#FDFBF7] prose-th:text-[#10201B] prose-th:border-[#E2D9CC] prose-th:p-3
              prose-td:border-[#E2D9CC] prose-td:text-[#6B7280] prose-td:p-3
              prose-hr:border-[#E2D9CC] prose-hr:my-8"
          >
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </div>

          {/* Bottom Compliance Box */}
          <div className="mt-12 pt-8 border-t border-[#E2D9CC] flex flex-col sm:flex-row items-center justify-between gap-4 text-[#8A8F8C] text-[12px] font-mono">
            <p>© {new Date().getFullYear()} VestoriaHub.com. All rights reserved.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[#1C352D] hover:text-[#D9A441] font-heading font-bold uppercase tracking-wider text-[12px] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
          </div>

        </div>
      </main>

    </div>
  );
}