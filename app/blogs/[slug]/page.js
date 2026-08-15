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
  TrendingUp,
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
        tags: ["blogs", `blog-${slug}`] // 🔥 Tag base cache added here
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
      title: "Article Not Found | BUYMETHIS",
      description: "This BUYMETHIS article could not be found.",
    };
  }

  const title = article.seo?.metaTitle || `${article.title} | BUYMETHIS`;
  const description =
    article.seo?.metaDescription ||
    article.excerpt ||
    "Read expert buying guides, deal insights, and smarter shopping advice from BUYMETHIS.";

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
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4 text-center sm:px-6">
      {/* danger state styling using standard tailwind reds since danger wasn't mapped in your inline configuration */}
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
        <AlertCircle size={36} className="text-red-500" />
      </div>

      <h2 className="text-[1.5rem] font-bold leading-[1.25] text-text-primary sm:text-[1.75rem] lg:text-[2rem] xl:text-[2.25rem]">
        Article Not Found
      </h2>

      <p className="mt-3 max-w-sm text-[0.9375rem] leading-[1.7] text-text-secondary sm:text-base">
        {message || "This article could not be found or has been removed."}
      </p>

      <Link
        href="/blogs"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,92,252,0.24)] transition-all duration-200 hover:bg-primary-hover sm:px-5 sm:py-3 lg:text-[0.9375rem]"
      >
        <ArrowLeft size={15} />
        Return to Articles
      </Link>
    </main>
  );
}

const MetaPill = ({ icon: Icon, children, green = false }) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 text-[0.8125rem] font-normal leading-[1.5] sm:text-sm",
      green ? "text-green-400" : "text-white/70",
    )}
  >
    <Icon size={14} className={green ? "" : "text-secondary"} />
    {children}
  </span>
);

const SidebarTableOfContents = ({ items }) => {
  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card lg:rounded-[14px]">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-secondary">
          <ListChecks size={18} />
        </span>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary sm:text-[11px]">
            Quick Jump
          </span>

          <h3 className="text-[0.9375rem] font-semibold leading-[1.4] text-text-primary sm:text-[1rem] lg:text-[1.0625rem]">
            Table of Contents
          </h3>
        </div>
      </div>

      <nav className="grid gap-2">
        {items.map((item, index) => (
          <a
            key={`${item.id}-${index}`}
            href={`#${item.id}`}
            className={cx(
              "group flex items-start gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-background hover:text-secondary",
              item.level === 3 && "pl-8",
            )}
          >
            <span className="font-mono text-[0.8125rem] font-bold tracking-wider text-secondary">
              {String(index + 1).padStart(2, "0")}
            </span>

            <span className="line-clamp-2">{item.title}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

const MobileTableOfContents = ({ items }) => {
  if (!items.length) return null;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pt-8 sm:px-6 lg:hidden">
      <div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-secondary">
            <ListChecks size={20} />
          </span>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary sm:text-[11px]">
              Article Navigation
            </span>

            <h2 className="text-[0.9375rem] font-semibold leading-[1.4] text-text-primary sm:text-[1rem]">
              Table of Contents
            </h2>
          </div>
        </div>

        <nav className="grid gap-2 sm:grid-cols-2">
          {items.map((item, index) => (
            <a
              key={`mobile-${item.id}-${index}`}
              href={`#${item.id}`}
              className="group flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-text-primary transition-all duration-200 hover:border-secondary hover:bg-surface-alt hover:text-secondary"
            >
              <span className="font-mono text-[0.8125rem] font-bold tracking-wider text-secondary">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="line-clamp-1">{item.title}</span>

              <ChevronRight
                size={14}
                className="ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              />
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
    className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-all duration-200 ease-out hover:-translate-y-1 hover:border-secondary hover:shadow-card-hover"
  >
    <div className="relative aspect-video w-full overflow-hidden bg-background">
      <Image
        src={post.featuredImage?.url || fallbackImage}
        alt={post.featuredImage?.alt || post.title}
        fill
        loading="lazy"
        sizes="(max-width: 640px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
      />

      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />

      <div className="absolute left-4 top-4">
        <span className="inline-flex rounded-md border border-secondary/40 bg-background/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary backdrop-blur sm:text-[11px]">
          {post.category?.name || "Article"}
        </span>
      </div>
    </div>

    <div className="flex flex-grow flex-col p-4 sm:p-5">
      <h3 className="line-clamp-2 text-[1.125rem] font-semibold leading-[1.3] text-text-primary transition-colors group-hover:text-secondary sm:text-[1.25rem] lg:text-[1.375rem]">
        {post.title}
      </h3>

      {post.excerpt ? (
        <p className="mt-3 line-clamp-2 text-[0.9375rem] leading-[1.7] text-text-secondary sm:line-clamp-3 sm:text-base">
          {post.excerpt}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-2 text-[0.8125rem] leading-[1.5] text-text-secondary sm:text-sm">
          <CalendarDays size={13} className="text-secondary" />
          {formatDate(post.publishedAt)}
        </div>

        <ArrowRight
          size={16}
          className="text-secondary transition-transform duration-200 group-hover:translate-x-1"
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
      name: article.author?.name || "BUYMETHIS Editorial Team",
    },
    publisher: {
      "@type": "Organization",
      name: "BUYMETHIS",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/blogs/${article.slug || slug}`,
    },
  };

  return (
    <main className="min-h-screen bg-background text-text-primary selection:bg-primary selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="relative overflow-hidden bg-background border-b border-border">
        {article.featuredImage?.url ? (
          <Image
            src={article.featuredImage.url}
            alt={article.featuredImage.alt || article.title}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover opacity-[0.14]"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(124,92,252,0.15),transparent_32%),radial-gradient(circle_at_92%_22%,rgba(155,138,251,0.15),transparent_36%)]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-white/50 sm:text-[11px] md:justify-start"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>

            <ChevronRight size={12} />

            <Link href="/blogs" className="transition-colors hover:text-white">
              Blog
            </Link>

            <ChevronRight size={12} />

            {article.category?.slug ? (
              <>
                <Link
                  href={`/blog-categories/${article.category.slug}`}
                  className="text-secondary transition-colors hover:text-white"
                >
                  {article.category.name}
                </Link>

                <ChevronRight size={12} />
              </>
            ) : null}

            <span className="line-clamp-1 max-w-[220px] text-white/70">
              {article.title}
            </span>
          </nav>

          <div className="mx-auto max-w-5xl text-center md:text-left">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-white/10 px-4 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.05em] text-secondary backdrop-blur sm:text-[0.6875rem]">
              <Tag size={13} />
              {article.category?.name || "General"}
            </span>

            <h1 className="text-[2rem] font-bold leading-[1.2] tracking-tight text-white sm:text-[2.5rem] lg:text-[3rem] xl:text-[3.25rem]">
              {article.title}
            </h1>

            {article.excerpt ? (
              <p className="mt-6 max-w-3xl text-[0.9375rem] font-normal leading-[1.7] text-text-secondary sm:text-base">
                {article.excerpt}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5 md:flex-row md:items-center md:justify-between lg:rounded-[14px]">
              <div className="flex flex-wrap items-center justify-center gap-5 md:justify-start">
                <div className="flex items-center gap-3">
                  {article.author?.avatar ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-secondary/35">
                      <Image
                        src={article.author.avatar}
                        alt={article.author.name || "Author"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-alt text-secondary">
                      <span className="text-[0.9375rem] font-semibold">
                        {(article.author?.name || "B")[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="text-left">
                    <p className="text-sm font-semibold text-white sm:text-base">
                      {article.author?.name || "BUYMETHIS Editorial Team"}
                    </p>

                    {article.author?.role ? (
                      <p className="mt-0.5 text-[0.8125rem] leading-[1.5] text-text-secondary sm:text-sm">
                        {article.author.role}
                      </p>
                    ) : null}
                  </div>
                </div>

                <span className="hidden h-9 w-px bg-white/10 md:block" />

                <div className="flex flex-wrap items-center justify-center gap-4">
                  {publishedDateShort ? (
                    <time dateTime={article.publishedAt || article.createdAt}>
                      <MetaPill icon={CalendarDays}>
                        {publishedDateShort}
                      </MetaPill>
                    </time>
                  ) : null}

                  {article.readTimeMinutes ? (
                    <MetaPill icon={Clock}>
                      {article.readTimeMinutes} min read
                    </MetaPill>
                  ) : null}

                  <MetaPill icon={ShieldCheck} green>
                    Editorial Review
                  </MetaPill>
                </div>
              </div>

              <div className="flex justify-center md:justify-end">
                <ShareBar />
              </div>
            </div>
          </div>
        </div>
      </header>

      {article.featuredImage?.url ? (
        <section className="relative z-20 mx-auto -mt-8 w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="relative h-[280px] overflow-hidden rounded-xl border border-border bg-surface shadow-modal sm:h-[380px] md:h-[480px] lg:h-[560px] lg:rounded-[14px]">
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.alt || article.title}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
              className="object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />
          </div>
        </section>
      ) : null}

      <MobileTableOfContents items={tableOfContents} />

      <section className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16 xl:py-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0">
            <BlogArticleClient article={article} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-6 flex flex-col gap-6">
              <SidebarTableOfContents items={tableOfContents} />

              <div className="overflow-hidden rounded-xl border border-primary/30 bg-surface shadow-card-hover lg:rounded-[14px]">
                <div className="relative p-5">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.15),transparent_38%)]" />

                  <div className="relative">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-secondary">
                      <BookOpen size={22} />
                    </div>

                    <h3 className="text-[0.9375rem] font-semibold leading-[1.4] text-text-primary sm:text-[1rem] lg:text-[1.0625rem]">
                      Smarter Shopping Starts Here
                    </h3>

                    <p className="mt-3 text-[0.9375rem] leading-[1.7] text-text-secondary sm:text-base">
                      Explore more BUYMETHIS buying guides, verified savings,
                      and expert deal insights.
                    </p>

                    <Link
                      href="/blogs"
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover"
                    >
                      Browse Articles
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>

              {publishedDate ? (
                <div className="rounded-xl border border-border bg-surface p-5 shadow-card lg:rounded-[14px]">
                  <span className="mb-2 inline-flex items-center gap-2 rounded-md bg-background px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary sm:text-[11px]">
                    <TrendingUp size={12} />
                    Article Info
                  </span>

                  <div className="mt-4 grid gap-3 text-[0.9375rem] leading-[1.7] text-text-secondary sm:text-base">
                    <div className="flex items-center justify-between gap-4">
                      <span>Published</span>
                      <strong className="text-right text-text-primary">
                        {publishedDate}
                      </strong>
                    </div>

                    {article.readTimeMinutes ? (
                      <div className="flex items-center justify-between gap-4">
                        <span>Read Time</span>
                        <strong className="text-text-primary">
                          {article.readTimeMinutes} min
                        </strong>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-4">
                      <span>Review</span>
                      <strong className="text-green-400">Editorial</strong>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      {article.relatedPosts?.length > 0 ? (
        <section className="mx-auto w-full max-w-[1280px] px-4 pb-20 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card lg:rounded-[14px]">
            <div className="border-b border-border bg-background px-4 py-8 sm:px-6 md:px-8">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-surface px-4 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.05em] text-secondary sm:text-[0.6875rem]">
                <Sparkles size={14} />
                Continue Reading
              </span>

              <h2 className="text-[1.5rem] font-bold leading-[1.25] text-text-primary sm:text-[1.75rem] lg:text-[2rem] xl:text-[2.25rem]">
                You Might Also Like
              </h2>

              <p className="mt-2 max-w-2xl text-[0.9375rem] leading-[1.7] text-text-secondary sm:text-base">
                More buying guides, deal insights, and editorial picks selected
                for smarter shopping.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 bg-background p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 lg:gap-6">
              {article.relatedPosts.map((post) => (
                <RelatedPostCard key={post._id || post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}