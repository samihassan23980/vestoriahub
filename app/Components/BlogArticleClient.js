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
  Tag,
} from "lucide-react";

const TwitterIcon = ({ size = 15 }) => (
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

const FacebookIcon = ({ size = 15 }) => (
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

// ─── EMBEDDED DYNAMIC BLOCK RENDERER ──────────────────────────────────────────
const EmbeddedBlockRenderer = ({ blockData }) => {
  const [copied, setCopied] = useState(false);

  if (!blockData) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(blockData.button?.text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  switch (blockData.blockType) {
    case "deal_highlight":
      return (
        <div className="not-prose relative my-8 overflow-hidden rounded-[22px] border border-[#25473C] bg-[#10201B] p-5 sm:p-6 shadow-sm">
          <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 bg-[#D9A441]/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-heading font-extrabold uppercase tracking-widest text-[#D9A441]">
                <ShieldCheck size={14} className="text-[#34D399]" />
                <span>Verified Deal Highlight</span>
              </div>

              <h3 className="text-[1.25rem] sm:text-[1.375rem] font-heading font-extrabold text-[#FDFBF7] leading-snug">
                {blockData.title}
              </h3>

              {blockData.description && (
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#D5E4D9] font-normal">
                  {blockData.description}
                </p>
              )}

              {blockData.discountBadge && (
                <div className="mt-3 text-[1.75rem] font-heading font-black text-[#D9A441] leading-none">
                  {blockData.discountBadge}
                </div>
              )}
            </div>

            {blockData.button?.text && (
              <div className="w-full md:w-auto md:min-w-[220px]">
                <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-[#25473C] bg-[#162B24] p-3 shadow-inner">
                  <span className="font-mono text-[15px] font-bold text-[#FDFBF7] tracking-wider truncate">
                    {blockData.button.text}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11.5px] font-heading font-bold uppercase tracking-wider transition-all shadow-xs shrink-0 ${
                      copied
                        ? "bg-[#34D399] text-[#10201B]"
                        : "bg-[#D9A441] text-[#16241F] hover:bg-[#BE8E34]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCheck size={13} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case "product_card":
      return (
        <div className="not-prose relative my-8 flex flex-col gap-5 overflow-hidden rounded-[22px] border-2 border-[#E2D9CC] bg-[#FFFFFF] p-5 shadow-xs transition-all duration-300 hover:border-[#BDD6C4] sm:flex-row items-center">
          {blockData.discountBadge && (
            <div className="absolute left-4 top-4 z-10 rounded-full bg-[#D9A441] text-[#16241F] px-2.5 py-0.5 text-[9.5px] font-heading font-black uppercase tracking-wider shadow-xs">
              {blockData.discountBadge}
            </div>
          )}

          {blockData.imageUrl && (
            <div className="flex aspect-square w-full sm:w-[170px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#FDFBF7] border border-[#E2D9CC] p-3">
              <img
                src={blockData.imageUrl}
                alt={blockData.title || "Product Offer"}
                className="h-full w-full object-contain"
              />
            </div>
          )}

          <div className="flex flex-grow flex-col justify-between w-full">
            <div>
              <h3 className="text-[1.125rem] font-heading font-bold text-[#10201B] leading-snug">
                {blockData.title}
              </h3>

              {blockData.description && (
                <p className="mt-2 text-[13.5px] font-normal leading-relaxed text-[#6B7280] line-clamp-2">
                  {blockData.description}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#E2D9CC] pt-3.5 gap-4">
              {blockData.price ? (
                <span className="text-[1.5rem] font-heading font-black text-[#10201B] leading-none">
                  {blockData.price}
                </span>
              ) : <div />}

              {blockData.button?.url && (
                <a
                  href={blockData.button.url}
                  target={blockData.button?.isExternal ? "_blank" : "_self"}
                  rel={blockData.button?.isExternal ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1C352D] text-[#FDFBF7] hover:bg-[#10201B] px-5 py-2.5 text-[12.5px] font-heading font-bold uppercase tracking-wider shadow-xs transition-colors"
                >
                  <ShoppingCart size={14} className="text-[#D9A441]" />
                  <span>{blockData.button?.text || "Shop Now"}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      );

    case "custom_button":
      return (
        <div className="not-prose my-8 flex justify-center">
          <a
            href={blockData.button?.url || "#"}
            target={blockData.button?.isExternal ? "_blank" : "_self"}
            rel={blockData.button?.isExternal ? "noopener noreferrer" : undefined}
            className="group inline-flex items-center gap-2 rounded-full bg-[#1C352D] hover:bg-[#10201B] text-[#FDFBF7] font-heading font-bold text-[13.5px] px-6 py-3 shadow-xs transition-all duration-200"
          >
            <Sparkles size={15} className="text-[#D9A441]" />
            <span>{blockData.button?.text || "View Verified Deal"}</span>
            <ExternalLink size={14} className="text-[#D9A441]" />
          </a>
        </div>
      );

    default:
      return null;
  }
};

// ─── SOCIAL SHARE COMPONENT ───────────────────────────────────────────────────
export const ShareBar = () => {
  const [linkCopied, setLinkCopied] = useState(false);

  const share = (platform) => {
    const url = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
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
      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8A8F8C] mr-1">
        Share:
      </span>

      <button
        type="button"
        onClick={() => share("twitter")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2D9CC] bg-[#FDFBF7] hover:bg-[#EBF3EE] px-3 py-1.5 text-[12px] font-heading font-semibold text-[#1C352D] transition-colors"
      >
        <TwitterIcon size={12} />
        <span>Twitter</span>
      </button>

      <button
        type="button"
        onClick={() => share("facebook")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2D9CC] bg-[#FDFBF7] hover:bg-[#EBF3EE] px-3 py-1.5 text-[12px] font-heading font-semibold text-[#1C352D] transition-colors"
      >
        <FacebookIcon size={12} />
        <span>Facebook</span>
      </button>

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#BDD6C4] bg-[#EBF3EE] hover:bg-[#1C352D] hover:text-[#FDFBF7] px-3 py-1.5 text-[12px] font-heading font-bold text-[#1C352D] transition-all group/copy"
      >
        <Link2 size={12} className="text-[#D9A441]" />
        <span>{linkCopied ? "Copied!" : "Copy Link"}</span>
      </button>
    </div>
  );
};

// ─── MAIN ARTICLE CLIENT COMPONENT ────────────────────────────────────────────
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
        Math.min(100, Math.max(0, (-rect.top / readableHeight) * 100))
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
          (item) => item.placementToken === part
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
    <>
      {/* Scroll Progress Bar */}
      <div
        className="fixed left-0 top-0 z-[9999] h-[3px] bg-[#D9A441] transition-[width] duration-100 ease-out"
        style={{ width: `${scrollPct}%` }}
      />

      <article ref={articleRef} className="w-full min-w-0 font-sans">
        
        {/* Rich Text Body Container */}
        <div
          className="
            prose-custom max-w-none text-[#16241F]

            [&>p]:mb-5 [&>p]:text-[15px] [&>p]:font-normal [&>p]:leading-relaxed [&>p]:text-[#6B7280]

            [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:scroll-mt-28 [&_h2]:text-[1.45rem] [&_h2]:font-heading [&_h2]:font-extrabold [&_h2]:leading-tight [&_h2]:text-[#10201B] [&_h2]:border-b [&_h2]:border-[#E2D9CC] [&_h2]:pb-2.5

            [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:scroll-mt-28 [&_h3]:text-[1.18rem] [&_h3]:font-heading [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:text-[#10201B]

            [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:scroll-mt-28 [&_h4]:text-[15px] [&_h4]:font-heading [&_h4]:font-bold [&_h4]:text-[#1C352D]

            [&_ul]:mb-6 [&_ul]:list-none [&_ul]:pl-0
            [&_ul>li]:relative [&_ul>li]:py-1.5 [&_ul>li]:pl-6 [&_ul>li]:text-[15px] [&_ul>li]:leading-relaxed [&_ul>li]:text-[#6B7280]
            [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[11px] [&_ul>li]:before:h-[6px] [&_ul>li]:before:w-[6px] [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-[#D9A441] [&_ul>li]:before:content-['']

            [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-5
            [&_ol>li]:py-1.5 [&_ol>li]:text-[15px] [&_ol>li]:leading-relaxed [&_ol>li]:text-[#6B7280]

            [&_blockquote]:my-6 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-[#D9A441] [&_blockquote]:bg-[#FDFBF7] [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-[15px] [&_blockquote]:leading-relaxed [&_blockquote]:text-[#16241F] [&_blockquote]:font-normal

            [&_strong]:font-heading [&_strong]:font-bold [&_strong]:text-[#10201B]
            [&_a]:font-semibold [&_a]:text-[#1C352D] [&_a]:underline [&_a]:decoration-[#D9A441] [&_a]:decoration-2 [&_a]:underline-offset-4 hover:[&_a]:text-[#D9A441]

            [&_img]:my-7 [&_img]:w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-[#E2D9CC]

            [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:text-[13.5px]
            [&_th]:bg-[#FDFBF7] [&_th]:border [&_th]:border-[#E2D9CC] [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-heading [&_th]:font-bold [&_th]:text-[#10201B]
            [&_td]:border [&_td]:border-[#E2D9CC] [&_td]:px-4 [&_td]:py-3 [&_td]:text-[#6B7280]
            [&_tr:nth-child(even)_td]:bg-[#FDFBF7]
          "
        >
          {renderContent()}
        </div>

        {/* ── FAQ SECTION ── */}
        {article.faqs?.length > 0 && (
          <section className="mt-12 rounded-[22px] border-2 border-[#E2D9CC] bg-[#FDFBF7] p-5 sm:p-7 shadow-xs">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF3EE] border border-[#BDD6C4] text-[#1C352D]">
                <MessageSquare size={18} />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8F8C]">
                  Help Center
                </span>
                <h3 className="text-[1.35rem] font-heading font-extrabold text-[#10201B]">
                  Frequently Asked Questions
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {article.faqs.map((faq, index) => (
                <div
                  key={`${faq.question}-${index}`}
                  className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                    openFaq === index
                      ? "border-[#BDD6C4] bg-[#FFFFFF] shadow-2xs"
                      : "border-[#E2D9CC] bg-[#FFFFFF] hover:border-[#BDD6C4]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left outline-none sm:px-5"
                  >
                    <span className="text-[14.5px] font-heading font-bold leading-snug text-[#10201B]">
                      {faq.question}
                    </span>

                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-[#8A8F8C] transition-transform duration-200 ${
                        openFaq === index ? "rotate-180 text-[#D9A441]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden px-4 transition-all duration-300 ease-in-out sm:px-5 ${
                      openFaq === index
                        ? "max-h-[500px] pb-4 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="border-t border-[#E2D9CC] pt-3 text-[13.5px] font-normal leading-relaxed text-[#6B7280]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── ARTICLE TAGS ── */}
        {article.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2 pt-6 border-t border-[#E2D9CC]">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8A8F8C] mr-1">
              Tagged:
            </span>

            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#EBF3EE] border border-[#BDD6C4] px-3 py-1 text-[11.5px] font-heading font-semibold text-[#1C352D]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Floating Back-To-Top Trigger */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-8 right-8 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#1C352D] hover:bg-[#10201B] text-[#FDFBF7] shadow-lg transition-all duration-300 ${
          showBackTop
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp size={18} strokeWidth={2.5} />
      </button>
    </>
  );
}