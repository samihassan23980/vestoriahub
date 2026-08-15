import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  CalendarDays,
  Tag,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import BlogArticleClient, {
  ShareBar,
} from "@/app/Components/BlogArticleClient";

const fallbackImage = "/fallback-blog.jpg";

const cx = (...classes) => classes.filter(Boolean).join(" ");

async function getBlogData(slug) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/public/blogs/${slug}`, {
      next: { 
        revalidate: 3600,
        tags: ["blogs", `blog-${slug}`]
      },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    console.error("BlogDetailPage fetch error:", err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getBlogData(slug);

  if (!article) {
    return {
      title: "Article Not Found | VestoriaHub",
      description: "This VestoriaHub article could not be found.",
    };
  }

  const title = article.seo?.metaTitle || `${article.title} | VestoriaHub`;
  const description =
    article.seo?.metaDescription ||
    article.excerpt ||
    "Read expert buying guides, verified coupon insights, and smarter shopping advice from VestoriaHub.";

  return {
    title,
    description,
    alternates: {
      canonical: `/blogs/${article.slug || slug}`,
    },
    openGraph: {
      title,
      description,
      images: article.featuredImage?.url
        ? [
            {
              url: article.featuredImage.url,
              alt: article.featuredImage.alt || article.title,
            },
          ]
        : [],
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: [article.author?.name].filter(Boolean),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.featuredImage?.url ? [article.featuredImage.url] : [],
    },
  };
}

function formatDate(date, variant = "short") {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-US", {
    month: variant === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
  });
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "and")
    .replace(/&nbsp;/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stripHtml(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, "")
    .trim();
}

function getArticleHtml(article) {
  return (
    article.content ||
    article.body ||
    article.description ||
    article.articleContent ||
    ""
  );
}

function buildArticleWithToc(article) {
  const html = getArticleHtml(article);

  if (!html || typeof html !== "string") {
    return {
      article,
      tableOfContents: [],
    };
  }

  const usedIds = new Map();
  const tableOfContents = [];

  const contentWithHeadingIds = html.replace(
    /<h([2-3])([^>]*)>(.*?)<\/h\1>/gi,
    (fullMatch, level, attrs = "", innerHtml) => {
      const title = stripHtml(innerHtml);

      if (!title) return fullMatch;

      const existingIdMatch = attrs.match(/\sid=["']([^"']+)["']/i);
      let id = existingIdMatch?.[1] || slugify(title);

      if (!id) return fullMatch;

      const count = usedIds.get(id) || 0;
      usedIds.set(id, count + 1);

      if (count > 0) {
        id = `${id}-${count + 1}`;
      }

      tableOfContents.push({
        id,
        title,
        level: Number(level),
      });

      if (existingIdMatch) {
        return `<h${level}${attrs}>${innerHtml}</h${level}>`;
      }

      return `<h${level}${attrs} id="${id}" class="scroll-mt-28">${innerHtml}</h${level}>`;
    },
  );

  const updatedArticle = {
    ...article,
    content: contentWithHeadingIds,
    body:
      article.body && article.body === html
        ? contentWithHeadingIds
        : article.body,
    description:
      article.description && article.description === html
        ? contentWithHeadingIds
        : article.description,
    articleContent:
      article.articleContent && article.articleContent === html
        ? contentWithHeadingIds
        : article.articleContent,
  };

  return {
    article: updatedArticle,
    tableOfContents: tableOfContents.slice(0, 10),
  };
}

function ErrorState({ message }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#F8F0E5] px-4 text-center sm:px-6">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFFFFF] border border-[#E2D9CC] shadow-xs">
        <AlertCircle size={32} className="text-[#C1432F]" />
      </div>

      <h2 className="text-[1.5rem] font-heading font-extrabold text-[#10201B] tracking-tight">
        Article Not Found
      </h2>

      <p className="mt-2.5 max-w-sm text-[14.5px] leading-relaxed text-[#6B7280]">
        {message || "This specific article could not be found or has been updated."}
      </p>

      <Link
        href="/blogs"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1C352D] hover:bg-[#10201B] px-6 py-2.5 text-sm font-heading font-bold text-[#FDFBF7] shadow-xs transition-all"
      >
        <ArrowLeft size={15} className="text-[#FDFBF7]" />
        <span className="text-[#FDFBF7]">Return to Editorial Feed</span>
      </Link>
    </main>
  );
}

const SidebarTableOfContents = ({ items }) => {
  if (!items.length) return null;

  return (
    <div className="rounded-[22px] border border-[#E2D9CC] bg-[#FFFFFF] p-5 shadow-xs">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF3EE] border border-[#BDD6C4] text-[#1C352D]">
          <ListChecks size={16} />
        </span>

        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8F8C] block">
            Navigation
          </span>
          <h3 className="text-[14px] font-heading font-bold text-[#10201B] leading-none">
            Table of Contents
          </h3>
        </div>
      </div>

      <nav className="grid gap-1">
        {items.map((item, index) => (
          <a
            key={`${item.id}-${index}`}
            href={`#${item.id}`}
            className={cx(
              "group flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#FDFBF7] hover:text-[#10201B]",
              item.level === 3 && "pl-6 text-[12.5px]",
            )}
          >
            <span className="font-mono text-[11px] font-bold text-[#D9A441] shrink-0 mt-0.5">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="line-clamp-2 leading-snug">{item.title}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

const MobileTableOfContents = ({ items }) => {
  if (!items.length) return null;

  return (
    <section className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:hidden pt-6">
      <div className="rounded-2xl border border-[#E2D9CC] bg-[#FFFFFF] p-4 shadow-xs">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF3EE] text-[#1C352D]">
            <ListChecks size={16} />
          </span>
          <h2 className="text-[14px] font-heading font-bold text-[#10201B]">
            Table of Contents
          </h2>
        </div>

        <nav className="grid gap-1.5 sm:grid-cols-2">
          {items.map((item, index) => (
            <a
              key={`mobile-${item.id}-${index}`}
              href={`#${item.id}`}
              className="group flex items-center gap-2 rounded-lg border border-[#E2D9CC] bg-[#FDFBF7] px-3 py-2 text-[12.5px] font-medium text-[#16241F] transition-colors hover:border-[#BDD6C4] hover:bg-[#EBF3EE]"
            >
              <span className="font-mono text-[10.5px] font-bold text-[#D9A441]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="line-clamp-1 flex-1">{item.title}</span>
              <ChevronRight size={13} className="text-[#8A8F8C]" />
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
};

const RelatedPostCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="group flex h-full flex-col overflow-hidden rounded-[22px] border-2 border-[#E2D9CC] hover:border-[#BDD6C4] bg-[#FFFFFF] shadow-xs transition-all duration-300 hover:-translate-y-1 p-4"
  >
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-[#F1E7D8] border border-[#E2D9CC] mb-3.5">
      <Image
        src={post.featuredImage?.url || fallbackImage}
        alt={post.featuredImage?.alt || post.title}
        fill
        loading="lazy"
        sizes="(max-width: 640px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute top-2.5 left-2.5">
        <span className="inline-flex rounded-full bg-[#10201B]/90 backdrop-blur-md px-2.5 py-0.5 text-[9.5px] font-heading font-extrabold uppercase tracking-wider text-[#D9A441] border border-[#25473C]">
          {post.category?.name || "Insight"}
        </span>
      </div>
    </div>

    <div className="flex flex-grow flex-col justify-between">
      <div>
        <h3 className="line-clamp-2 text-[16px] font-heading font-bold text-[#10201B] leading-snug transition-colors group-hover:text-[#D9A441]">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-[13px] font-normal leading-relaxed text-[#6B7280]">
            {post.excerpt}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#E2D9CC] pt-3 text-[11px] font-mono text-[#8A8F8C]">
        <span className="flex items-center gap-1">
          <CalendarDays size={12} className="text-[#D9A441]" />
          {formatDate(post.publishedAt)}
        </span>
        <ArrowRight
          size={14}
          className="text-[#1C352D] transition-transform duration-200 group-hover:translate-x-1"
        />
      </div>
    </div>
  </Link>
);

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const originalArticle = await getBlogData(slug);

  if (!originalArticle) return <ErrorState />;

  const { article, tableOfContents } = buildArticleWithToc(originalArticle);

  const publishedDate = formatDate(
    article.publishedAt || article.createdAt,
    "long",
  );

  const publishedDateShort = formatDate(
    article.publishedAt || article.createdAt,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage?.url,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt || article.publishedAt || article.createdAt,
    author: {
      "@type": "Person",
      name: article.author?.name || "VestoriaHub Editorial Desk",
    },
    publisher: {
      "@type": "Organization",
      name: "VestoriaHub",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/blogs/${article.slug || slug}`,
    },
  };

  return (
    <main className="min-h-screen bg-[#F8F0E5] text-[#16241F] font-sans antialiased pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── BREADCRUMB ── */}
      <nav
        aria-label="Breadcrumb"
        className="bg-[#FFFFFF] border-b border-[#E2D9CC] py-3.5"
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-[11.5px] font-mono text-[#8A8F8C] overflow-x-auto whitespace-nowrap">
          <Link href="/" className="text-[#8A8F8C] hover:text-[#1C352D] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-[#BDD6C4] shrink-0" />
          <Link href="/blogs" className="text-[#8A8F8C] hover:text-[#1C352D] transition-colors">
            Editorial
          </Link>
          <ChevronRight size={12} className="text-[#BDD6C4] shrink-0" />

          {article.category?.slug && (
            <>
              <Link
                href={`/categories/${article.category.slug}`}
                className="text-[#1C352D] font-bold hover:text-[#D9A441] transition-colors"
              >
                {article.category.name}
              </Link>
              <ChevronRight size={12} className="text-[#BDD6C4] shrink-0" />
            </>
          )}

          <span className="text-[#10201B] font-bold truncate max-w-[280px]">
            {article.title}
          </span>
        </div>
      </nav>

      {/* ── MINIMAL CLEAN HEADER SECTION ── */}
      <header className="w-full bg-[#FFFFFF] border-b border-[#E2D9CC] py-10 sm:py-14">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
          
          {/* Category Eyebrow Pill */}
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF3EE] border border-[#BDD6C4] px-3.5 py-1 text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#1C352D]">
              <Tag size={12} className="text-[#D9A441]" />
              <span className="text-[#1C352D]">{article.category?.name || "Shopping Guide"}</span>
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDFBF7] border border-[#E2D9CC] px-2.5 py-1 text-[11px] font-mono font-semibold text-[#427867]">
              <ShieldCheck size={13} className="text-[#34D399]" />
              <span className="text-[#427867]">Verified Guide</span>
            </span>
          </div>

          {/* Article Title */}
          <h1 className="text-[28px] sm:text-[38px] md:text-[44px] font-heading font-extrabold leading-[1.12] text-[#10201B] tracking-tight mb-4">
            {article.title}
          </h1>

          {/* Subtitle / Excerpt */}
          {article.excerpt && (
            <p className="text-[15px] sm:text-[17px] font-normal leading-relaxed text-[#6B7280] mb-8">
              {article.excerpt}
            </p>
          )}

          {/* Minimal Meta Row + Author Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#E2D9CC]">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EBF3EE] border border-[#BDD6C4] text-[#1C352D] font-heading font-extrabold text-[14px]">
                {(article.author?.name || "V")[0].toUpperCase()}
              </div>

              <div className="text-left">
                <p className="text-[13.5px] font-heading font-bold text-[#10201B] leading-none">
                  {article.author?.name || "VestoriaHub Editorial"}
                </p>
                <div className="flex items-center gap-2 text-[11.5px] font-mono text-[#8A8F8C] mt-1">
                  {publishedDateShort && (
                    <span className="flex items-center gap-1 text-[#8A8F8C]">
                      <CalendarDays size={11} className="text-[#D9A441]" />
                      {publishedDateShort}
                    </span>
                  )}
                  {article.readTimeMinutes && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#8A8F8C]">
                        <Clock size={11} /> {article.readTimeMinutes} min read
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end">
              <ShareBar />
            </div>
          </div>

        </div>
      </header>

      {/* ── FEATURED IMAGE ── */}
      {article.featuredImage?.url && (
        <section className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 pt-8">
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-[24px] border-2 border-[#E2D9CC] bg-[#F1E7D8] shadow-xs">
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.alt || article.title}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1360px) 100vw, 1360px"
              className="object-cover"
            />
          </div>
        </section>
      )}

      <MobileTableOfContents items={tableOfContents} />

      {/* ── TWO-COLUMN ARTICLE CONTENT BODY ── */}
      <section className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          
          {/* Main Article Document Canvas */}
          <article className="min-w-0 bg-[#FFFFFF] border-2 border-[#E2D9CC] rounded-[24px] p-6 sm:p-10 md:p-12 shadow-xs">
            <BlogArticleClient article={article} />
          </article>

          {/* Sticky Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-6">
              <SidebarTableOfContents items={tableOfContents} />

              {/* Verified Shopping Callout Box */}
              <div className="rounded-[22px] border border-[#25473C] bg-[#10201B] p-5 text-[#FDFBF7] shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#162B24] border border-[#25473C] text-[#D9A441]">
                  <BookOpen size={18} />
                </div>

                <h3 className="text-[15px] font-heading font-extrabold uppercase tracking-tight text-[#FDFBF7] mb-2 leading-tight">
                  Shop Smarter With Verified Coupons
                </h3>

                <p className="text-[12.5px] leading-relaxed text-[#D5E4D9] font-normal mb-4">
                  Every promotional code and markdown on VestoriaHub is audited daily to ensure genuine checkout savings.
                </p>

                <Link
                  href="/stores"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D9A441] hover:bg-[#BE8E34] text-[#16241F] font-heading font-bold text-[12px] px-4 py-2 transition-all shadow-xs"
                >
                  <span className="!text-[#16241F]">Explore Partner Stores</span>
                  <ArrowRight size={13} className="text-[#16241F]" />
                </Link>
              </div>

              {/* Metadata Card */}
              {publishedDate && (
                <div className="rounded-[22px] border border-[#E2D9CC] bg-[#FFFFFF] p-5 shadow-xs text-[12.5px] font-mono text-[#6B7280]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E2D9CC]">
                    <span>Published</span>
                    <strong className="text-[#10201B] font-bold">{publishedDate}</strong>
                  </div>

                  {article.readTimeMinutes && (
                    <div className="flex items-center justify-between py-2.5 border-b border-[#E2D9CC]">
                      <span>Read Time</span>
                      <strong className="text-[#10201B] font-bold">{article.readTimeMinutes} mins</strong>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2.5">
                    <span>Audit Status</span>
                    <strong className="text-[#34D399] font-bold flex items-center gap-1">
                      <ShieldCheck size={13} /> Tested Daily
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </aside>

        </div>
      </section>

      {/* ── RELATED POSTS FOOTER ── */}
      {article.relatedPosts?.length > 0 && (
        <section className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 pt-4 pb-12">
          <div className="rounded-[24px] border-2 border-[#E2D9CC] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs">
            <div className="mb-6 pb-4 border-b border-[#E2D9CC] flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#D9A441] mb-1">
                  <Sparkles size={13} /> Keep Reading
                </span>
                <h2 className="text-[20px] sm:text-[24px] font-heading font-extrabold text-[#10201B] tracking-tight">
                  Related Guides & Reviews
                </h2>
              </div>

              <Link
                href="/blogs"
                className="hidden sm:inline-flex items-center gap-1 text-[12.5px] font-heading font-bold text-[#1C352D] hover:text-[#D9A441] transition-colors"
              >
                <span>View All Articles</span>
                <ArrowRight size={13} className="text-[#1C352D]" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {article.relatedPosts.map((post, idx) => (
                <RelatedPostCard key={post._id || post.slug || idx} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}