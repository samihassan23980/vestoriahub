"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import {
  Search,
  ChevronRight,
  Tag,
  Zap,
  ArrowRight,
  Play,
  ChevronLeft,
  ShoppingBag,
} from "lucide-react";
import Swal from "sweetalert2";

const VideoBackground = ({ desktopUrl, mobileUrl, posterUrl, settings }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.defaultMuted = settings?.muted ?? true;
    videoRef.current.muted = settings?.muted ?? true;

    if (settings?.autoPlay !== false) {
      videoRef.current.play().catch(() => {});
    }
  }, [settings]);

  if (!desktopUrl) return null;

  return (
    <video
      ref={videoRef}
      autoPlay={settings?.autoPlay ?? true}
      loop={settings?.loop ?? true}
      muted={settings?.muted ?? true}
      playsInline
      poster={posterUrl || ""}
      className="w-full h-full object-cover opacity-90"
    >
      {mobileUrl && (
        <source src={mobileUrl} media="(max-width: 768px)" type="video/mp4" />
      )}
      <source src={desktopUrl} type="video/mp4" />
    </video>
  );
};

const IconComponent = ({ name, className }) => {
  const icons = { Tag, ChevronRight, Zap, ArrowRight, Play, ShoppingBag };
  const Icon = icons[name] || ArrowRight;
  return <Icon className={className} size={18} strokeWidth={2.5} />;
};

export default function HeroCarouselClient({ slides }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 7000);
    return () => clearInterval(interval);
  }, [emblaApi, slides.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    Swal.fire({
      title: "Searching Deals...",
      text: `Looking up best coupons for "${searchQuery.trim()}"`,
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
      // Updated to Body Gym Dark Theme hexes for SweetAlert portal injection
      background: "#13152B", // navy-600
      color: "#FFFFFF",
      iconColor: "#7C5CFC", // purple-500
      customClass: {
        popup:
          "rounded-[12px] shadow-[0_20px_60px_rgba(3,4,10,0.5)] border border-[#2A2D4A]",
      },
    });
  };

  const renderHeading = (text = "", highlight = "", isDarkTheme) => {
    if (!highlight || !text) return text;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span
          key={index}
          // The body gym template is dark-first; highlighted words pop with the Primary Purple
          className="text-[var(--color-primary)]"
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const getSlideHref = (slide) => {
    if (slide.slideType === "full_cta") return null;
    return slide.media?.globalLink || null;
  };

  const renderSlideContent = (slide) => {
    // Overriding the dynamic logic slightly since the template is globally dark
    const textColor = "text-[var(--color-text-primary)]";
    const subtextColor = "text-[var(--color-text-secondary)]";
    const alignment = slide.design?.alignment || "left";

    const alignmentClasses =
      {
        center: "items-center text-center mx-auto",
        right: "items-end text-right ml-auto",
        left: "items-start text-left",
      }[alignment] || "items-start text-left";

    const buttonAlignment =
      alignment === "center"
        ? "items-center"
        : alignment === "right"
          ? "items-end"
          : "items-start";

    const buttonJustify = alignment === "center" ? "justify-center" : "";
    const slideHref = getSlideHref(slide);

    const content = (
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20 py-[64px] lg:py-[96px] h-full flex items-center">
        <div
          className={`w-full max-w-[650px] flex flex-col ${alignmentClasses}`}
        >
          {slide.content?.badge && (
            <div className="inline-flex items-center gap-[6px] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)] px-[12px] py-[6px] rounded-[6px] text-[12px] font-semibold uppercase tracking-wider mb-[20px] lg:mb-[24px] shadow-sm">
              <Zap size={14} className="text-[var(--color-primary)]" />
              {slide.content.badge}
            </div>
          )}

          {slide.slideType !== "image_only" && slide.content?.heading && (
            <h1
              className={`${textColor} text-[36px] md:text-[48px] lg:text-[56px] font-bold leading-[1.2] tracking-tight mb-[16px] lg:mb-[24px]`}
            >
              {renderHeading(
                slide.content.heading,
                slide.content?.highlightWord,
                true, // forced dark theme behavior
              )}
            </h1>
          )}

          {slide.slideType !== "image_only" && slide.content?.subheading && (
            <p
              className={`${subtextColor} text-[16px] md:text-[18px] leading-[1.7] mb-[32px] lg:mb-[40px] font-regular`}
            >
              {slide.content.subheading}
            </p>
          )}

          {slide.slideType === "full_cta" && (
            <div className={`w-full flex flex-col ${buttonAlignment}`}>
              <form
                className="relative w-full max-w-[550px] mb-[32px] group"
                onSubmit={handleSearch}
              >
                <div className="absolute inset-y-0 left-[20px] flex items-center pointer-events-none z-10">
                  <Search className="h-5 w-5 text-[var(--color-lavender-500)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full h-[60px] pl-[56px] pr-[130px] rounded-[50px] border border-[var(--color-border)] bg-[var(--color-navy-700)] text-[var(--color-text-primary)] placeholder-[var(--color-lavender-500)] text-[16px] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[4px] focus:ring-[var(--color-primary)]/20 shadow-md transition-all"
                  placeholder="Search brands or categories..."
                />
                <button
                  type="submit"
                  className="absolute right-[8px] top-[8px] bottom-[8px] px-[24px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-[16px] font-semibold rounded-[50px] shadow-sm transition-all"
                >
                  Search
                </button>
              </form>

              <div
                className={`flex flex-wrap items-center gap-[16px] ${buttonJustify}`}
              >
                {slide.buttons?.primary?.label &&
                  slide.buttons?.primary?.url && (
                    <a
                      href={slide.buttons.primary.url}
                      className="group bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-[28px] py-[14px] rounded-[8px] font-bold text-[16px] flex items-center gap-[8px] hover:-translate-y-1 transition-all shadow-[0_8px_24px_rgba(124,92,252,0.25)]"
                    >
                      {slide.buttons.primary.label}
                      {slide.buttons.primary.icon && (
                        <IconComponent
                          name={slide.buttons.primary.icon}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      )}
                    </a>
                  )}
                {slide.buttons?.secondary?.label &&
                  slide.buttons?.secondary?.url && (
                    <a
                      href={slide.buttons.secondary.url}
                      className={`group px-[28px] py-[14px] rounded-[8px] font-semibold text-[16px] flex items-center gap-[8px] transition-all hover:-translate-y-1 ${
                        slide.buttons.secondary.style === "ghost"
                          ? "border-[1.5px] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-white"
                          : slide.buttons.secondary.style === "secondary"
                            ? "border-[2px] border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                            : "border-[1.5px] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-white"
                      }`}
                    >
                      {slide.buttons.secondary.label}
                      {slide.buttons.secondary.icon && (
                        <IconComponent
                          name={slide.buttons.secondary.icon}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      )}
                    </a>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    );

    if (slideHref) {
      return (
        <a
          href={slideHref}
          aria-label={
            slide.media?.altText || slide.internalName || "Hero slide"
          }
          className="block h-full w-full"
        >
          {content}
        </a>
      );
    }
    return content;
  };

  return (
    <section className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[700px] bg-[var(--color-background)] group border-b border-[var(--color-border)]">
      <div className="overflow-hidden h-full absolute inset-0" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {slides.map((slide, index) => {
            const isVideo = slide.media?.mediaType === "video";

            // LCP Optimization: Pehli slide ki image turant load hogi (priority)
            const isPriority = index === 0;

            return (
              <div
                key={slide._id}
                className="relative flex-[0_0_100%] min-w-0 h-full"
              >
                <div className="absolute inset-0 z-0 bg-[var(--color-navy-900)]">
                  {isVideo ? (
                    <VideoBackground
                      desktopUrl={slide.media?.desktopUrl}
                      mobileUrl={slide.media?.mobileUrl}
                      posterUrl={slide.media?.posterUrl}
                      settings={slide.media?.videoSettings}
                    />
                  ) : (
                    <>
                      {/* Next.js Image: Desktop vs Mobile Art Direction */}
                      {slide.media?.mobileUrl && (
                        <div className="block md:hidden relative w-full h-full">
                          <Image
                            src={slide.media.mobileUrl}
                            alt={
                              slide.media?.altText || slide.internalName || ""
                            }
                            fill
                            priority={isPriority}
                            sizes="100vw"
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div
                        className={`${slide.media?.mobileUrl ? "hidden md:block" : "block"} relative w-full h-full`}
                      >
                        <Image
                          src={slide.media?.desktopUrl}
                          alt={slide.media?.altText || slide.internalName || ""}
                          fill
                          priority={isPriority}
                          sizes="100vw"
                          className="object-cover"
                        />
                      </div>
                    </>
                  )}
                </div>

                {slide.design?.overlay?.active && (
                  <div
                    className="absolute inset-0 z-10"
                    style={{
                      backgroundColor: slide.design.overlay.color || "#060713", // fallback to navy-900
                      opacity:
                        typeof slide.design.overlay.opacity === "number"
                          ? slide.design.overlay.opacity
                          : 0.5,
                    }}
                  />
                )}

                {renderSlideContent(slide)}
              </div>
            );
          })}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-[16px] top-1/2 -translate-y-1/2 w-[48px] h-[48px] bg-[var(--color-surface)]/50 hover:bg-[var(--color-surface)] backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-30 border border-[var(--color-border)] hidden md:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-[16px] top-1/2 -translate-y-1/2 w-[48px] h-[48px] bg-[var(--color-surface)]/50 hover:bg-[var(--color-surface)] backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-30 border border-[var(--color-border)] hidden md:flex"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 flex items-center gap-[8px] z-30">
            {slides.map((slide, index) => (
              <button
                key={slide._id || index}
                onClick={() => scrollTo(index)}
                className={`transition-all duration-300 rounded-full ${selectedIndex === index ? "w-[32px] h-[8px] bg-[var(--color-primary)]" : "w-[8px] h-[8px] bg-[var(--color-lavender-500)] hover:bg-[var(--color-lavender-300)]"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
