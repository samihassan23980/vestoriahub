"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Copy,
  CheckCheck,
  ArrowUp,
  Sparkles,
  ShieldCheck,
  ShoppingCart,
  ExternalLink,
  Link2,
  MessageSquare,
  Star,
} from "lucide-react";

const TwitterIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const FacebookIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const EmbeddedBlockRenderer = ({ blockData }) => {
  const [copied, setCopied] = useState(false);

  if (!blockData) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(blockData.button?.text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  switch (blockData.blockType) {
    case "deal_highlight":
      return (
        <div className="not-prose relative my-10 overflow-hidden rounded-xl border border-[rgba(124,92,252,0.28)] bg-[var(--navy-800)] p-4 shadow-card-hover sm:p-5 lg:rounded-[14px] lg:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(110,79,245,0.22),transparent_34%)]" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#22C55E]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#22C55E] sm:text-[11px]">
                  Editor Verified
                </span>
              </div>

              <h3 className="text-[1.125rem] font-semibold leading-[1.3] text-white sm:text-[1.25rem] lg:text-[1.375rem]">
                {blockData.title}
              </h3>

              {blockData.description ? (
                <p className="mt-2 text-[0.9375rem] leading-[1.7] text-white/68 sm:text-base">
                  {blockData.description}
                </p>
              ) : null}

              {blockData.discountBadge ? (
                <div className="mt-4 text-[1.75rem] font-bold leading-none text-[var(--purple-400)] sm:text-[2rem] lg:text-[2.25rem]">
                  {blockData.discountBadge}
                </div>
              ) : null}
            </div>

            {blockData.button?.text ? (
              <div className="w-full md:w-auto md:min-w-[240px]">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-[var(--purple-400)]/50 bg-white/10 px-3 py-2 sm:px-4 sm:py-2.5">
                  <span className="font-mono text-[1rem] font-bold tracking-wider text-[var(--purple-300)] sm:text-[1.125rem] lg:text-[1.25rem]">
                    {blockData.button.text}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:py-2 sm:text-sm ${
                      copied
                        ? "bg-[#22C55E] text-white"
                        : "bg-[var(--purple-700)] text-white hover:bg-[var(--purple-800)]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCheck size={14} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      );

    case "product_card":
      return (
        <div className="not-prose relative my-10 flex flex-col gap-5 overflow-hidden rounded-xl border border-[var(--indigo-line)] bg-[var(--navy-600)] p-4 shadow-card transition-all duration-200 hover:border-[var(--purple-500)] hover:shadow-card-hover sm:p-5 md:flex-row lg:rounded-[14px]">
          {blockData.discountBadge ? (
            <div className="absolute left-5 top-4 z-10 rounded-md bg-[var(--purple-600)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-white sm:text-[11px]">
              {blockData.discountBadge}
            </div>
          ) : null}

          {blockData.imageUrl ? (
            <div className="flex aspect-square w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--navy-500)] p-4 md:w-[200px]">
              <img
                src={blockData.imageUrl}
                alt={blockData.title || "Product"}
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}

          <div className="flex flex-grow flex-col justify-center">
            <h3 className="text-[1.125rem] font-semibold leading-[1.3] text-white sm:text-[1.25rem] lg:text-[1.375rem]">
              {blockData.title}
            </h3>

            {blockData.description ? (
              <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-[1.7] text-[var(--lavender-400)] sm:text-base">
                {blockData.description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-4 border-t border-[var(--indigo-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              {blockData.price ? (
                <span className="text-[1.75rem] font-bold leading-none text-white sm:text-[2rem] lg:text-[2.25rem]">
                  {blockData.price}
                </span>
              ) : null}

              {blockData.button?.url ? (
                <a
                  href={blockData.button.url}
                  target={blockData.button?.isExternal ? "_blank" : "_self"}
                  rel={
                    blockData.button?.isExternal
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--purple-700)] px-4 py-2.5 text-sm font-semibold !text-white transition-all duration-200 hover:bg-[var(--purple-800)] sm:px-5 sm:py-3 lg:text-[0.9375rem]"
                >
                  <ShoppingCart size={15} className="!text-white" />
                  {blockData.button?.text || "Shop Now"}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      );

    case "custom_button":
      return (
        <div className="not-prose my-10 flex justify-center">
          <a
            href={blockData.button?.url || "#"}
            target={blockData.button?.isExternal ? "_blank" : "_self"}
            rel={
              blockData.button?.isExternal ? "noopener noreferrer" : undefined
            }
            className="group inline-flex items-center gap-2 rounded-lg bg-[var(--purple-700)] px-4 py-2.5 text-sm font-semibold !text-white shadow-[0_8px_24px_rgba(124,92,252,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--purple-800)] sm:px-5 sm:py-3 lg:text-[0.9375rem]"
          >
            <Sparkles size={16} className="!text-white" />
            {blockData.button?.text || "View Deal"}
            <ExternalLink
              size={16}
              className="!text-white transition-transform duration-200 group-hover:translate-x-1"
            />
          </a>
        </div>
      );

    case "amazon_gallery":
      return (
        <div className="not-prose relative my-10 overflow-hidden rounded-xl border border-[var(--indigo-line)] bg-[var(--navy-600)] shadow-card sm:rounded-[14px]">
          <div className="flex flex-col md:flex-row">
            {/* Image side */}
            <div className="relative flex w-full flex-shrink-0 items-center justify-center bg-[var(--navy-500)] p-6 md:w-[280px]">
              {blockData.discountBadge ? (
                <div className="absolute left-4 top-4 z-10 rounded-md bg-[var(--purple-600)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-white sm:text-[11px]">
                  {blockData.discountBadge}
                </div>
              ) : null}

              <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 backdrop-blur">
                <Star size={11} className="fill-[#F6BE00] text-[#F6BE00]" />
                <span className="text-[10px] font-semibold text-white">
                  Marketplace Pick
                </span>
              </div>

              {blockData.imageUrl ? (
                <img
                  src={blockData.imageUrl}
                  alt={blockData.title || "Product"}
                  className="aspect-square w-full max-w-[220px] object-contain"
                />
              ) : (
                <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-lg bg-[var(--navy-600)] text-[var(--lavender-500)]">
                  No Image
                </div>
              )}
            </div>

            {/* Content side */}
            <div className="flex flex-grow flex-col justify-center p-5 sm:p-6">
              <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--purple-950)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--purple-300)] sm:text-[11px]">
                Amazon Gallery
              </span>

              <h3 className="text-[1.125rem] font-semibold leading-[1.3] text-white sm:text-[1.25rem] lg:text-[1.375rem]">
                {blockData.title}
              </h3>

              {blockData.description ? (
                <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-[1.7] text-[var(--lavender-400)] sm:text-base">
                  {blockData.description}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col gap-4 border-t border-[var(--indigo-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                {blockData.price ? (
                  <span className="text-[1.75rem] font-bold leading-none text-white sm:text-[2rem] lg:text-[2.25rem]">
                    {blockData.price}
                  </span>
                ) : null}

                {blockData.button?.url ? (
                  <a
                    href={blockData.button.url}
                    target={blockData.button?.isExternal ? "_blank" : "_self"}
                    rel={
                      blockData.button?.isExternal
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--purple-700)] px-4 py-2.5 text-sm font-semibold !text-white transition-all duration-200 hover:bg-[var(--purple-800)] sm:px-5 sm:py-3 lg:text-[0.9375rem]"
                  >
                    {blockData.button?.text || "View on Amazon"}
                    <ExternalLink size={15} className="!text-white" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export const ShareBar = () => {
  const [linkCopied, setLinkCopied] = useState(false);

  const share = (platform) => {
    const url = encodeURIComponent(window.location.href);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "noopener,width=600,height=400");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-white/55 sm:text-[11px]">
        Share
      </span>

      <button
        type="button"
        onClick={() => share("twitter")}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15"
      >
        <TwitterIcon size={13} />
        Twitter
      </button>

      <button
        type="button"
        onClick={() => share("facebook")}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15"
      >
        <FacebookIcon size={13} />
        Facebook
      </button>

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--purple-500)] px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--purple-600)]"
      >
        <Link2 size={13} />
        {linkCopied ? "Copied" : "Copy Link"}
      </button>
    </div>
  );
};

export default function BlogArticleClient({ article }) {
  const [scrollPct, setScrollPct] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const articleRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;

      if (!el) return;

      const rect = el.getBoundingClientRect();
      const readableHeight = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.round(
        Math.min(100, Math.max(0, (-rect.top / readableHeight) * 100)),
      );

      setScrollPct(progress);
      setShowBackTop(window.scrollY > 600);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const renderContent = () => {
    if (!article?.content) return null;

    const regex = /(\{\{embed:[^}]+\}\})/g;
    const parts = article.content.split(regex);

    return parts.map((part, index) => {
      if (part.match(regex)) {
        const block = article.embeddedBlocks?.find(
          (item) => item.placementToken === part,
        );

        return block ? (
          <EmbeddedBlockRenderer key={`embed-${index}`} blockData={block} />
        ) : null;
      }

      return (
        <div
          key={`content-${index}`}
          className="contents"
          dangerouslySetInnerHTML={{ __html: part }}
        />
      );
    });
  };

  if (!article) return null;

  return (
    <div className="bg-[var(--navy-800)] text-white min-h-screen">
      <div
        className="fixed left-0 top-0 z-[9999] h-[3px] bg-gradient-to-r from-[var(--purple-500)] to-[var(--purple-700)] transition-[width] duration-100 ease-out"
        style={{ width: `${scrollPct}%` }}
      />

      <article ref={articleRef} className="w-full min-w-0">
        <div
          className="
            prose-custom max-w-none rounded-xl border border-[var(--indigo-line)] bg-[var(--navy-600)] p-4 shadow-card sm:p-6 lg:rounded-[14px] lg:p-8

            [&_*]:![color:inherit]

            [&>p]:mb-6 [&>p]:text-[0.9375rem] [&>p]:font-normal [&>p]:leading-[1.7] [&>p]:![color:var(--lavender-400)] sm:[&>p]:text-base

            [&_h1]:![color:white] [&_h2]:![color:white] [&_h3]:![color:white] [&_h4]:![color:white] [&_h5]:![color:white] [&_h6]:![color:white]

            [&_h2]:mt-12 [&_h2]:mb-5 [&_h2]:scroll-mt-28 [&_h2]:text-[1.5rem] [&_h2]:font-bold [&_h2]:leading-[1.25] sm:[&_h2]:text-[1.75rem] lg:[&_h2]:text-[2rem] xl:[&_h2]:text-[2.25rem]

            [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:scroll-mt-28 [&_h3]:text-[1.125rem] [&_h3]:font-semibold [&_h3]:leading-[1.3] sm:[&_h3]:text-[1.25rem] lg:[&_h3]:text-[1.375rem]

            [&_h4]:mt-6 [&_h4]:mb-3 [&_h4]:scroll-mt-28 [&_h4]:text-[0.9375rem] [&_h4]:font-semibold [&_h4]:leading-[1.4] sm:[&_h4]:text-[1rem] lg:[&_h4]:text-[1.0625rem]

            [&_ul]:mb-6 [&_ul]:list-none [&_ul]:pl-0
            [&_ul>li]:relative [&_ul>li]:py-1.5 [&_ul>li]:pl-6 [&_ul>li]:text-[0.9375rem] [&_ul>li]:leading-[1.7] [&_ul>li]:![color:var(--lavender-400)] sm:[&_ul>li]:text-base
            [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[15px] [&_ul>li]:before:h-[6px] [&_ul>li]:before:w-[6px] [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-[var(--purple-500)] [&_ul>li]:before:content-['']

            [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6
            [&_ol>li]:py-1.5 [&_ol>li]:text-[0.9375rem] [&_ol>li]:leading-[1.7] [&_ol>li]:![color:var(--lavender-400)] sm:[&_ol>li]:text-base

            [&_blockquote]:my-8 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--purple-500)] [&_blockquote]:bg-[var(--navy-500)] [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-[0.9375rem] [&_blockquote]:leading-[1.7] [&_blockquote]:![color:var(--lavender-300)] sm:[&_blockquote]:text-base

            [&_strong]:font-semibold [&_strong]:![color:white]
            [&_a]:font-medium [&_a]:![color:var(--purple-400)] [&_a]:underline [&_a]:decoration-[var(--purple-400)]/30 [&_a]:underline-offset-4 hover:[&_a]:decoration-[var(--purple-400)]

            [&_img]:my-8 [&_img]:w-full [&_img]:rounded-xl [&_img]:shadow-card

            [&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:text-sm
            [&_th]:bg-[var(--navy-800)] [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:![color:white]
            [&_td]:border [&_td]:border-[var(--indigo-line)] [&_td]:px-4 [&_td]:py-3 [&_td]:![color:var(--lavender-400)]
            [&_tr:nth-child(even)_td]:bg-[var(--navy-500)]

            [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-2 [&>p:first-of-type]:first-letter:text-[3.25rem] [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:leading-[0.85] [&>p:first-of-type]:first-letter:![color:white]
          "
        >
          {renderContent()}
        </div>

        {article.faqs?.length > 0 ? (
          <section className="mt-12 rounded-xl border border-[var(--indigo-line)] bg-[var(--navy-600)] p-4 shadow-card sm:mt-16 sm:p-6 lg:rounded-[14px] lg:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--purple-950)] text-[var(--purple-300)]">
                <MessageSquare size={20} />
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--purple-400)] sm:text-[11px]">
                  Help Center
                </span>

                <h3 className="text-[1.5rem] font-bold leading-[1.25] text-white sm:text-[1.75rem] lg:text-[2rem] xl:text-[2.25rem]">
                  Frequently Asked Questions
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {article.faqs.map((faq, index) => (
                <div
                  key={`${faq.question}-${index}`}
                  className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                    openFaq === index
                      ? "border-[var(--purple-500)] bg-[var(--navy-600)] shadow-card"
                      : "border-[var(--indigo-line)] bg-[var(--navy-500)] hover:border-[var(--purple-500)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left outline-none sm:px-5"
                  >
                    <span className="text-[0.9375rem] font-semibold leading-[1.4] text-white sm:text-[1rem] lg:text-[1.0625rem]">
                      {faq.question}
                    </span>

                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[var(--lavender-500)] transition-transform duration-200 ${
                        openFaq === index ? "rotate-180 text-[var(--purple-400)]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden px-4 transition-all duration-300 ease-in-out sm:px-5 ${
                      openFaq === index
                        ? "max-h-[600px] pb-5 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="border-t border-[var(--indigo-line)] pt-4 text-[0.9375rem] leading-[1.7] text-[var(--lavender-400)] sm:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {article.tags?.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 rounded-xl border border-[var(--indigo-line)] bg-[var(--navy-600)] p-4 shadow-card sm:p-5">
            <span className="mr-1 self-center text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--lavender-500)] sm:text-[11px]">
              Tags:
            </span>

            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--purple-950)] px-4 py-1.5 text-xs font-medium text-[var(--purple-300)] transition-colors hover:bg-[var(--purple-500)] hover:text-white sm:text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--purple-700)] text-white shadow-card-hover transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--purple-800)] ${
          showBackTop
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp size={19} />
      </button>
    </div>
  );
}