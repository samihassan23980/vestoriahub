import { connectDB } from "@/app/lib/mongodb";
import LegalPage from "@/app/models/legalPage";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ShieldCheck, ArrowLeft } from "lucide-react";

export const revalidate = 3600;

// ─── SEO METADATA GENERATION ───
export async function generateMetadata({ params }) {
  const { slug } = await params;
  await connectDB();
  const page = await LegalPage.findOne({ slug }).select("seo title").lean();

  if (!page) return { title: "Page Not Found | VestoriaHub" };

  return {
    title: page.seo?.metaTitle || `${page.title} `,
    description:
      page.seo?.metaDescription ||
      `Official ${page.title} document for VestoriaHub.`,
    robots: {
      index: page.seo?.indexable ?? true,
      follow: true,
    },
    // 💡 Added canonical alternates tag matching the dynamic path
    alternates: {
      canonical: `/legal/${slug}`,
    },
  };
}

// ─── MAIN SERVER COMPONENT ───
export default async function PublicLegalPage({ params }) {
  const { slug } = await params;

  await connectDB();
  // Fetch only published pages for the public view
  const page = await LegalPage.findOne({ slug, status: "published" }).lean();

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[800px] mx-auto px-6 py-16 md:py-24 bg-surface shadow-xl mt-8 mb-16 rounded-2xl border border-border">
        {/* ─── PAGE HEADER ─── */}
        <header className="mb-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-alt text-primary rounded-full border border-border">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-primary">
              Verified Official Document
            </span>
          </div>

          <h1 className="text-[40px] md:text-[52px] font-extrabold text-text-primary leading-tight tracking-tight">
            {page.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 pt-6 text-text-secondary border-t border-border">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-secondary" />
              <span className="text-[14px]">
                Last Revised:{" "}
                <strong className="text-text-primary font-semibold">
                  {new Date(
                    page.lastRevisedAt || page.updatedAt,
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span className="text-[14px]">
                VestoriaHub Legal & Compliance
              </span>
            </div>
          </div>
        </header>

        {/* ─── DYNAMIC RICH TEXT CONTENT ─── */}
        <div
          className="prose prose-lg max-w-none prose-invert
          prose-headings:text-text-primary prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-[28px] prose-h2:mt-14 prose-h2:mb-6 prose-h2:border-b prose-h2:border-border prose-h2:pb-4
          prose-h3:text-[22px] prose-h3:mt-8 prose-h3:mb-4
          prose-p:text-text-primary prose-p:leading-relaxed
          prose-li:text-text-primary prose-li:marker:text-primary
          prose-strong:text-text-primary prose-strong:font-semibold
          prose-a:text-primary prose-a:font-medium prose-a:underline-offset-4 hover:prose-a:text-primary-hover
          prose-img:rounded-xl prose-img:shadow-md
          
          /* ─── FORCE WHITE TEXT OVER INLINE STYLES ─── */
          [&_*]:!text-text-primary [&_a]:!text-primary"
        >
          <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </main>
    </div>
  );
}