/* app/admin/editor/page.js */
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

export default function TextEditor({
  label,
  value,
  onChange,
  error,
  maxLength = 200000,
  // ⚡ NEW: pass your site's internal pages (stores/categories/blogs) for the
  // Smart Internal Linking Suggestions feature. Shape: [{ title, url }]
  internalLinksData = [],
  // ⚡ NEW: pass existing site content (other blog/category text) for the
  // Duplicate/Similar Content Checker. Shape: string[] or [{ label, text }]
  contentCorpus = [],
}) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

  const [selectedStyle, setSelectedStyle] = useState("p");
  const [selectedFont, setSelectedFont] = useState("Segoe UI");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [editorContent, setEditorContent] = useState(value || "");
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [isEditingHtml, setIsEditingHtml] = useState(false);
  const [htmlEditContent, setHtmlEditContent] = useState("");
  const [showFullscreenCode, setShowFullscreenCode] = useState(false);

  // ─── SEO & ANALYSIS STATES ───
  const [headingWarning, setHeadingWarning] = useState("");

  // ─── MODAL STATES ───
  const [showImageSeoModal, setShowImageSeoModal] = useState(false);
  const [imageSeoData, setImageSeoModalData] = useState({ url: "", alt: "", title: "" });

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkData, setLinkData] = useState({
    url: "",
    linkType: "internal", // 'internal' or 'affiliate'
    openInNewTab: false,
  });

  // ─── RESIZABLE IMAGE STATES ───
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePos, setImagePos] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [resizingInfo, setResizingInfo] = useState(null);

  // ⚡ NEW — LIVE SEO SCORE PANEL STATES
  const [focusKeyword, setFocusKeyword] = useState("");
  const [showSeoPanel, setShowSeoPanel] = useState(true);

  // ⚡ NEW — CONTENT LENGTH / TARGET TRACKER STATE
  const [targetWordCount, setTargetWordCount] = useState(1000);

  // ⚡ NEW — SMART INTERNAL LINKING SUGGESTIONS STATES
  const [internalLinkQuery, setInternalLinkQuery] = useState("");
  const [showInternalLinkSuggestions, setShowInternalLinkSuggestions] = useState(false);

  // ⚡ NEW — DUPLICATE / SIMILAR CONTENT CHECKER STATES
  const [duplicateResults, setDuplicateResults] = useState([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [showDuplicatePanel, setShowDuplicatePanel] = useState(false);

  // ⚡ NEW — BROKEN LINK CHECKER (IN-CONTENT) STATES
  const [brokenLinkResults, setBrokenLinkResults] = useState([]);
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [showBrokenLinkPanel, setShowBrokenLinkPanel] = useState(false);

  // ⚡ NEW — CONTENT QUALITY PANEL STATE (Active Voice / Paragraph Length / Formatting / AI Patterns)
  const [showContentQualityPanel, setShowContentQualityPanel] = useState(false);

  const headingColors = {
    h1: "#1F2937",
    h2: "#374151",
    h3: "#4B5563",
  };

  const tagClassMap = {
    p: "text-base leading-relaxed text-gray-700 my-2",
    h1: "text-3xl md:text-4xl font-bold text-gray-900 mt-6 mb-3 leading-tight",
    h2: "text-2xl md:text-3xl font-bold text-gray-800 mt-5 mb-2.5 leading-tight",
    h3: "text-xl md:text-2xl font-semibold text-gray-700 mt-4 mb-2 leading-tight",
    h4: "text-lg font-semibold text-gray-700 mt-3 mb-1.5",
    h5: "text-lg font-semibold text-gray-600 mt-3 mb-1.5",
    h6: "text-base font-semibold text-gray-600 mt-2 mb-1",
    ol: "list-decimal pl-8 my-3 space-y-2 text-gray-700",
    ul: "list-disc pl-8 my-3 space-y-2 text-gray-700",
    blockquote: "border-l-4 border-indigo-500 pl-4 italic text-gray-600 my-3 bg-indigo-50/50 py-2 rounded-r",
  };

  const buttonBaseClasses =
    "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150 cursor-pointer shadow-sm select-none";

  const selectBaseClasses =
    "border border-gray-300 rounded-md bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150";

  // ─── SAVE AND RESTORE SELECTION POSITION FOR MODALS ───
  const saveSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (typeof window === "undefined" || !savedRangeRef.current) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  };

  // 🔄 Sync prop `value` to editor on mount + parent updates
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const safeValue = value || "";
    if (safeValue !== editor.innerHTML) {
      editor.innerHTML = safeValue;
      setEditorContent(safeValue);
      analyzeContent(safeValue);
    }
  }, [value]);

  const openModal = (e) => {
    e?.preventDefault();
    setModalContent(editorContent);
    setHtmlEditContent(editorContent);
    setIsEditingHtml(false);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const applyHtmlChanges = (e) => {
    e?.preventDefault();
    if (!editorRef.current) return;
    try {
      editorRef.current.innerHTML = htmlEditContent;
      setEditorContent(htmlEditContent);
      setModalContent(htmlEditContent);
      analyzeContent(htmlEditContent);
      if (typeof onChange === "function") {
        onChange(htmlEditContent);
      }
      setIsEditingHtml(false);
      closeModal();
    } catch (err) {
      alert("Invalid HTML: " + err.message);
    }
  };

  const updateStyleSelection = () => {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let node = selection.anchorNode;
    while (node && node.nodeType !== 1) node = node.parentNode;

    if (node && /^H[1-6]$/.test(node.tagName)) {
      setSelectedStyle(node.tagName.toLowerCase());
    } else {
      setSelectedStyle("p");
    }
  };

  const applyFormat = (command, val = null) => {
    if (typeof document === "undefined") return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    updateStyleSelection();
    handleEditorChange();
  };

  const handleBackspace = (e) => {
    if (e.key !== "Backspace") return;
    const editor = editorRef.current;
    if (!editor) return;
    const currentContent = (editor.innerHTML || "").trim();
    if (!currentContent || currentContent === "<br>") setSelectedStyle("p");
  };

  const handleEnter = (e) => {
    if (e.key !== "Enter") return;
    const editor = editorRef.current;
    if (!editor) return;
    const currentContent = (editor.innerHTML || "").trim();
    if (!currentContent || currentContent === "<br>") {
      document.execCommand("formatBlock", false, "p");
      setSelectedStyle("p");
    }
  };

  // ─── IMAGE OVERLAY & RESIZING ───
  const updateImageOverlayPos = (img) => {
    if (!img) return;
    setImagePos({
      top: img.offsetTop,
      left: img.offsetLeft,
      width: img.offsetWidth,
      height: img.offsetHeight,
    });
  };

  const handleEditorClick = (e) => {
    if (e.target.tagName === "IMG") {
      setSelectedImage(e.target);
      updateImageOverlayPos(e.target);
    } else {
      if (!e.target.classList?.contains("resize-handle")) {
        setSelectedImage(null);
      }
    }
  };

  const handleMouseDownResize = (e, handleType, img) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = img.clientWidth;
    const startHeight = img.clientHeight;
    const aspectRatio = startWidth / startHeight;

    setResizingInfo({ img, startX, startWidth, aspectRatio, handleType });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizingInfo) return;
      const { img, startX, startWidth, aspectRatio, handleType } = resizingInfo;
      const dx = e.clientX - startX;
      let newWidth = startWidth;

      if (handleType === "right" || handleType === "bottom-right") {
        newWidth = startWidth + dx;
      } else if (handleType === "left" || handleType === "bottom-left") {
        newWidth = startWidth - dx;
      }

      if (newWidth > 50 && newWidth < 1200) {
        img.style.width = `${newWidth}px`;
        img.style.height = `${Math.round(newWidth / aspectRatio)}px`;
        updateImageOverlayPos(img);
      }
    },
    [resizingInfo]
  );

  const handleMouseUp = useCallback(() => {
    if (resizingInfo) {
      setResizingInfo(null);
      handleEditorChange();
    }
  }, [resizingInfo]);

  useEffect(() => {
    if (resizingInfo) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingInfo, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const onKeyUp = () => updateStyleSelection();
    const onMouseUp = () => updateStyleSelection();

    editor.addEventListener("keydown", handleBackspace);
    editor.addEventListener("keydown", handleEnter);
    editor.addEventListener("keyup", onKeyUp);
    editor.addEventListener("mouseup", onMouseUp);

    return () => {
      editor.removeEventListener("keydown", handleBackspace);
      editor.removeEventListener("keydown", handleEnter);
      editor.removeEventListener("keyup", onKeyUp);
      editor.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ⚡ FIXED SEO IMAGE INSERTER
  const openImageModal = (e) => {
    e?.preventDefault();
    saveSelection();
    setShowImageSeoModal(true);
  };

  const confirmSeoImageInsert = (e) => {
    e?.preventDefault();
    if (!imageSeoData.url || !imageSeoData.alt) {
      alert("Image URL and Alt Text are both required for SEO.");
      return;
    }

    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();

    const imgNode = document.createElement("img");
    imgNode.src = imageSeoData.url.trim();
    imgNode.alt = imageSeoData.alt.trim();
    imgNode.title = (imageSeoData.title || imageSeoData.alt).trim();
    imgNode.setAttribute("loading", "lazy");
    imgNode.style.maxWidth = "100%";
    imgNode.style.width = "400px";
    imgNode.style.height = "auto";
    imgNode.style.display = "inline-block";
    imgNode.style.cursor = "pointer";
    imgNode.style.borderRadius = "8px";
    imgNode.style.margin = "12px 0";

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(imgNode);
      
      range.setStartAfter(imgNode);
      range.setEndAfter(imgNode);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editor.appendChild(imgNode);
    }

    setShowImageSeoModal(false);
    setImageSeoModalData({ url: "", alt: "", title: "" });
    handleEditorChange();
  };

  // ⚡ LINK INSERTER
  const openLinkModal = (e) => {
    e?.preventDefault();
    saveSelection();
    setShowLinkModal(true);
  };

  const confirmLinkInsert = (e) => {
    e?.preventDefault();
    if (!linkData.url) {
      alert("Please enter a valid URL.");
      return;
    }

    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    document.execCommand("createLink", false, linkData.url.trim());

    try {
      const range = sel.getRangeAt(0);
      let anchor = range.startContainer?.parentNode;
      if (anchor && anchor.tagName !== "A") anchor = anchor.querySelector("a");

      if (anchor && anchor.tagName === "A") {
        if (linkData.linkType === "affiliate") {
          anchor.setAttribute("target", "_blank");
          anchor.setAttribute("rel", "sponsored nofollow noopener");
          anchor.className = "text-indigo-600 font-bold underline hover:text-indigo-800 transition-colors";
        } else {
          anchor.setAttribute("target", linkData.openInNewTab ? "_blank" : "_self");
          anchor.setAttribute("rel", "noopener noreferrer");
          anchor.className = "text-blue-600 font-semibold underline hover:text-blue-800 transition-colors";
        }
      }
    } catch (err) {
      console.error("Link Error:", err);
    }

    setShowLinkModal(false);
    setLinkData({ url: "", linkType: "internal", openInNewTab: false });
    handleEditorChange();
  };

  // ⚡ PROS & CONS GRID INSERTER
  const insertProsConsGrid = (e) => {
    e?.preventDefault();
    const prosConsHtml = `
      <div class="my-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <div class="bg-emerald-50/70 p-4 rounded-lg border border-emerald-200">
          <h4 class="text-emerald-800 font-bold text-sm mb-2 uppercase tracking-wide flex items-center gap-1">✓ Pros / Advantages</h4>
          <ul class="list-disc pl-5 space-y-1 text-sm text-emerald-950">
            <li>High performance and build quality</li>
            <li>Great value for money</li>
          </ul>
        </div>
        <div class="bg-rose-50/70 p-4 rounded-lg border border-rose-200">
          <h4 class="text-rose-800 font-bold text-sm mb-2 uppercase tracking-wide flex items-center gap-1">✕ Cons / Limitations</h4>
          <ul class="list-disc pl-5 space-y-1 text-sm text-rose-950">
            <li>Slightly premium price tag</li>
          </ul>
        </div>
      </div>
      <p><br></p>
    `;
    applyFormat("insertHTML", prosConsHtml);
  };

  // ⚡ CALLOUT BOX INSERTER
  const insertCalloutBox = (type = "tip", e) => {
    e?.preventDefault();
    const styles = {
      tip: "bg-amber-50 border-amber-400 text-amber-900",
      warning: "bg-rose-50 border-rose-500 text-rose-900",
      info: "bg-blue-50 border-blue-400 text-blue-900",
    };

    const calloutHtml = `
      <div class="my-4 p-4 border-l-4 rounded-r-lg ${styles[type]} shadow-sm">
        <strong class="block text-xs font-bold uppercase tracking-wider mb-1">${type.toUpperCase()} NOTE</strong>
        <p class="text-sm leading-relaxed">Add your key tip or editorial advice here...</p>
      </div>
      <p><br></p>
    `;
    applyFormat("insertHTML", calloutHtml);
  };

  // ⚡ E-E-A-T CITATION / REFERENCES BOX INSERTER
  const insertEeatCitationBox = (e) => {
    e?.preventDefault();
    const citationHtml = `
      <div class="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1">📚 Expert References & Sources</h4>
        <ol class="list-decimal pl-5 space-y-1 text-xs text-slate-600">
          <li>Manufacturer Official Specifications & Manuals</li>
          <li>Tested via Standardized Benchmarks</li>
        </ol>
      </div>
      <p><br></p>
    `;
    applyFormat("insertHTML", citationHtml);
  };

  // ⚡ E-E-A-T TRUST VERIFICATION BADGE
  const insertEeatTrustBadge = (e) => {
    e?.preventDefault();
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const badgeHtml = `
      <div class="my-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-3 text-emerald-900">
        <span class="text-xl">🛡️</span>
        <div>
          <strong class="block text-xs font-bold uppercase tracking-wide">Tested & Verified Editorial Content</strong>
          <span class="text-xs text-emerald-700">Hands-on reviewed and verified on ${today} by Sociantech Team.</span>
        </div>
      </div>
      <p><br></p>
    `;
    applyFormat("insertHTML", badgeHtml);
  };

  // ⚡ AUTO TABLE OF CONTENTS GENERATOR
  const generateTableOfContents = (e) => {
    e?.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;

    const headings = editor.querySelectorAll("h2, h3");
    if (headings.length === 0) {
      alert("No H2 or H3 headings found in content to generate Table of Contents!");
      return;
    }

    let tocHtml = `
      <div class="my-6 p-5 bg-indigo-50/50 border border-indigo-200 rounded-xl">
        <h3 class="text-indigo-950 font-bold text-base mb-3 flex items-center gap-2">📋 Table of Contents</h3>
        <ul class="space-y-1.5 text-sm">
    `;

    headings.forEach((heading, idx) => {
      const slug = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      heading.id = slug;
      const isSub = heading.tagName.toLowerCase() === "h3";

      tocHtml += `
        <li class="${isSub ? "ml-4 text-xs" : "font-semibold"}">
          <a href="#${slug}" class="text-indigo-600 hover:underline">${idx + 1}. ${heading.textContent}</a>
        </li>
      `;
    });

    tocHtml += `</ul></div><p><br></p>`;
    applyFormat("insertHTML", tocHtml);
  };

  // ⚡ POWERFUL GOOGLE DOCS CLEANER & AUTO SEO HEADING STRUCTURE
  const autoCleanSeoAndSpaces = (e) => {
    e?.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;

    // Reset tagged markers
    const taggedElems = editor.querySelectorAll("[data-tagged]");
    taggedElems.forEach((el) => el.removeAttribute("data-tagged"));

    let html = editor.innerHTML;

    // 1. Strip Google Docs inline styles & span wrappers that break layout
    html = html
      .replace(/<span[^>]*>/gi, "")
      .replace(/<\/span>/gi, "")
      .replace(/<div id="docs-internal-guid-[^>]*>/gi, "<div>")
      .replace(/style="[^"]*"/gi, "")
      .replace(/dir="[^"]*"/gi, "")
      .replace(/&nbsp;/g, " ");

    // 2. Remove empty headings, empty divs & redundant line breaks
    html = html
      .replace(/<h[1-6][^>]*>\s*(<br\s*\/?>)?\s*<\/h[1-6]>/gi, "")
      .replace(/(<(p|div)>\s*(<br\s*\/?>)?\s*<\/(p|div)>\s*){2,}/gi, "<p><br></p>")
      .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")
      .replace(/\s+/g, " ");

    editor.innerHTML = html;

    // 3. Re-apply Tailwind classes & URL Slugs to all Headings & Paragraphs
    const headings = editor.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((h, index) => {
      const tag = h.tagName.toLowerCase();
      const text = h.textContent.trim();
      const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      h.id = slug || `section-${index + 1}`;
      if (tagClassMap[tag]) {
        h.className = tagClassMap[tag];
        h.setAttribute("data-tagged", "true");
      }
      if (headingColors[tag]) {
        h.style.color = headingColors[tag];
      }
    });

    const paragraphs = editor.querySelectorAll("p");
    paragraphs.forEach((p) => {
      if (!p.getAttribute("data-tagged")) {
        p.className = tagClassMap.p;
        p.setAttribute("data-tagged", "true");
      }
    });

    handleEditorChange();
    alert("✨ Cleaned! Google Docs junk styles, empty headings & extra breaks removed.");
  };

  // ⚡ SEO CONTENT ANALYZER
  const analyzeContent = (html) => {
    const plainText = html.replace(/<[^>]*>/g, " ").trim();
    const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    setCharCount(plainText.length);
    setWordCount(words);

    if (typeof document !== "undefined") {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const headings = Array.from(tempDiv.querySelectorAll("h2, h3, h4, h5, h6"));
      let warning = "";

      for (let i = 0; i < headings.length - 1; i++) {
        const currLevel = parseInt(headings[i].tagName.replace("H", ""));
        const nextLevel = parseInt(headings[i + 1].tagName.replace("H", ""));

        if (nextLevel - currLevel > 1) {
          warning = `Skipped Heading Level: ${headings[i].tagName} is followed directly by ${headings[i + 1].tagName}. Keep sequence contiguous for SEO.`;
          break;
        }
      }
      setHeadingWarning(warning);
    }
  };

  const preventSubmit = (fn) => (e) => {
    e.preventDefault();
    fn(e);
  };

  const undoAction = (e) => {
    e?.preventDefault();
    applyFormat("undo");
  };

  const redoAction = (e) => {
    e?.preventDefault();
    applyFormat("redo");
  };

  const handleFontFamilyChange = (e) => {
    const fontFamily = e.target.value;
    applyFormat("fontName", fontFamily);
    setSelectedFont(fontFamily);
  };

  const handleEditorChange = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const elements = editor.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, ol, ul, blockquote"
    );

    elements.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const tailwindClass = tagClassMap[tag];
      if (tailwindClass && el.getAttribute("data-tagged") !== "true") {
        el.className = tailwindClass;
        el.setAttribute("data-tagged", "true");
      }

      if (headingColors[tag]) {
        el.style.color = headingColors[tag];
      }
    });

    if (selectedImage) {
      updateImageOverlayPos(selectedImage);
    }

    const html = editor.innerHTML;
    setEditorContent(html);
    analyzeContent(html);

    if (typeof onChange === "function") {
      onChange(html);
    }
  };

  const insertTable = (e) => {
    e?.preventDefault();
    if (typeof window === "undefined") return;

    const rows = prompt("Number of rows (default 3):", "3");
    const cols = prompt("Number of columns (default 3):", "3");

    if (!rows || !cols) return;

    let table =
      '<table style="border-collapse: collapse; width: 100%; margin: 12px 0;"><tbody>';
    for (let i = 0; i < parseInt(rows); i++) {
      table += "<tr>";
      for (let j = 0; j < parseInt(cols); j++) {
        table += `<td style="border: 1px solid #E5E7EB; padding: 10px; font-size: 14px;">Cell</td>`;
      }
      table += "</tr>";
    }
    table += "</tbody></table>";

    applyFormat("insertHTML", table);
  };

  const clearFormatting = (e) => {
    e?.preventDefault();
    if (typeof document === "undefined") return;
    document.execCommand("removeFormat", false, null);
    editorRef.current?.focus();
    handleEditorChange();
  };

  // ══════════════════════════════════════════════════════════════════
  // ⚡ NEW FEATURE 1 — SMART INTERNAL LINKING SUGGESTIONS
  // ══════════════════════════════════════════════════════════════════
  const internalLinkResults = useMemo(() => {
    if (!internalLinkQuery.trim()) return [];
    const q = internalLinkQuery.toLowerCase();
    return (internalLinksData || [])
      .filter(
        (item) =>
          item?.title?.toLowerCase().includes(q) ||
          item?.url?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [internalLinkQuery, internalLinksData]);

  const insertInternalLink = (item) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();

    const sel = window.getSelection();
    const hasRealSelection =
      sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;

    if (hasRealSelection) {
      document.execCommand("createLink", false, item.url);
      try {
        const range = sel.getRangeAt(0);
        let anchor = range.startContainer?.parentNode;
        if (anchor && anchor.tagName !== "A") anchor = anchor.querySelector("a");
        if (anchor && anchor.tagName === "A") {
          anchor.setAttribute("rel", "noopener noreferrer");
          anchor.className =
            "text-blue-600 font-semibold underline hover:text-blue-800 transition-colors";
        }
      } catch (err) {
        console.error("Internal Link Error:", err);
      }
      handleEditorChange();
    } else {
      const linkHtml = `<a href="${item.url}" rel="noopener noreferrer" class="text-blue-600 font-semibold underline hover:text-blue-800 transition-colors">${item.title}</a>&nbsp;`;
      applyFormat("insertHTML", linkHtml);
    }

    setInternalLinkQuery("");
    setShowInternalLinkSuggestions(false);
  };

  // ══════════════════════════════════════════════════════════════════
  // ⚡ NEW FEATURE 2 — DUPLICATE / SIMILAR CONTENT CHECKER
  // ══════════════════════════════════════════════════════════════════
  const getWordSet = (text) => {
    return new Set(
      (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
  };

  const jaccardSimilarity = (setA, setB) => {
    if (!setA.size || !setB.size) return 0;
    let intersection = 0;
    setA.forEach((w) => {
      if (setB.has(w)) intersection++;
    });
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  };

  const checkDuplicateContent = (e) => {
    e?.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;

    setIsCheckingDuplicates(true);

    const blocks = Array.from(editor.querySelectorAll("p, h2, h3, h4, li"))
      .map((el) => el.textContent.trim())
      .filter((t) => t.length >= 40);

    const results = [];
    const SIMILARITY_THRESHOLD = 0.6;

    // Internal check: repeated/near-duplicate paragraphs within this same content
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const sim = jaccardSimilarity(getWordSet(blocks[i]), getWordSet(blocks[j]));
        if (sim >= SIMILARITY_THRESHOLD) {
          results.push({
            text: blocks[i].slice(0, 110) + (blocks[i].length > 110 ? "..." : ""),
            matchedWith: "Duplicate paragraph within this same content",
            similarity: Math.round(sim * 100),
          });
        }
      }
    }

    // External check: compare against provided site corpus (other pages)
    if (Array.isArray(contentCorpus) && contentCorpus.length > 0) {
      blocks.forEach((block) => {
        contentCorpus.forEach((corpusItem) => {
          const corpusText =
            typeof corpusItem === "string" ? corpusItem : corpusItem?.text || "";
          const corpusLabel =
            typeof corpusItem === "string"
              ? "Existing site content"
              : corpusItem?.label || "Existing site content";

          if (!corpusText) return;

          const sim = jaccardSimilarity(getWordSet(block), getWordSet(corpusText));
          if (sim >= SIMILARITY_THRESHOLD) {
            results.push({
              text: block.slice(0, 110) + (block.length > 110 ? "..." : ""),
              matchedWith: corpusLabel,
              similarity: Math.round(sim * 100),
            });
          }
        });
      });
    }

    setDuplicateResults(results);
    setIsCheckingDuplicates(false);
    setShowDuplicatePanel(true);
  };

  // ══════════════════════════════════════════════════════════════════
  // ⚡ NEW FEATURE 3 — BROKEN LINK CHECKER (IN-CONTENT)
  // ══════════════════════════════════════════════════════════════════
  const checkBrokenLinks = async (e) => {
    e?.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;

    const anchors = Array.from(editor.querySelectorAll("a[href]"));
    const uniqueUrls = [
      ...new Set(anchors.map((a) => a.getAttribute("href")).filter(Boolean)),
    ];

    if (uniqueUrls.length === 0) {
      alert("No links found in the content to check.");
      return;
    }

    setIsCheckingLinks(true);
    setBrokenLinkResults([]);

    const results = await Promise.all(
      uniqueUrls.map(async (url) => {
        if (url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) {
          return { url, status: "skipped", ok: true, note: "Not a checkable web link" };
        }
        try {
          const res = await fetch(url, { method: "HEAD" });
          return {
            url,
            status: res.status,
            ok: res.ok,
            note: res.ok ? "OK" : "Returned an error status",
          };
        } catch (err) {
          // Usually CORS-blocked on a cross-origin link rather than truly broken
          try {
            await fetch(url, { method: "HEAD", mode: "no-cors" });
            return {
              url,
              status: "unverified",
              ok: true,
              note: "Cross-origin — status hidden by browser, verify manually",
            };
          } catch (err2) {
            return { url, status: "error", ok: false, note: "Unreachable or network error" };
          }
        }
      })
    );

    setBrokenLinkResults(results);
    setIsCheckingLinks(false);
    setShowBrokenLinkPanel(true);
  };

  // ══════════════════════════════════════════════════════════════════
  // ⚡ NEW FEATURE 6 — READABILITY SCORE (FLESCH-KINCAID)
  // No external npm dependency needed — calculated manually so it works
  // reliably inside Next.js client components without bundling issues.
  // ══════════════════════════════════════════════════════════════════

  // Approximate English syllable counter (heuristic, same logic most
  // readability libraries use under the hood).
  const countSyllables = (rawWord) => {
    let word = (rawWord || "").toLowerCase().trim();
    word = word.replace(/[^a-z]/g, "");
    if (!word) return 0;
    if (word.length <= 3) return 1;

    // Strip common silent-e / suffix patterns
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");

    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  // Core Flesch Reading Ease + Flesch-Kincaid Grade Level calculator
  const calculateReadability = (html) => {
    const plainText = (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    if (!plainText) {
      return {
        fleschScore: 0,
        gradeLevel: 0,
        label: "No content yet",
        sentenceCount: 0,
        avgWordsPerSentence: 0,
        avgSyllablesPerWord: 0,
      };
    }

    // Sentence count — split on . ! ? (keeps it dependency-free & fast)
    const sentenceMatches = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentenceMatches.length || 1;

    const words = plainText.split(/\s+/).filter(Boolean);
    const totalWords = words.length || 1;

    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

    const avgWordsPerSentence = totalWords / sentenceCount;
    const avgSyllablesPerWord = totalSyllables / totalWords;

    // Standard Flesch Reading Ease formula (0–100, higher = easier)
    const rawFlesch = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    // Standard Flesch-Kincaid Grade Level formula (US school grade)
    const rawGrade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

    const fleschScore = Math.max(0, Math.min(100, Math.round(rawFlesch)));
    const gradeLevel = Math.max(0, Math.round(rawGrade * 10) / 10);

    let label = "Very Difficult";
    let labelColor = "rose";
    if (fleschScore >= 90) {
      label = "Very Easy (5th grade)";
      labelColor = "emerald";
    } else if (fleschScore >= 80) {
      label = "Easy (6th grade)";
      labelColor = "emerald";
    } else if (fleschScore >= 70) {
      label = "Fairly Easy (7th grade)";
      labelColor = "emerald";
    } else if (fleschScore >= 60) {
      label = "Standard (8th–9th grade)";
      labelColor = "amber";
    } else if (fleschScore >= 50) {
      label = "Fairly Difficult (10th–12th grade)";
      labelColor = "amber";
    } else if (fleschScore >= 30) {
      label = "Difficult (College level)";
      labelColor = "rose";
    } else {
      label = "Very Difficult (College graduate)";
      labelColor = "rose";
    }

    return {
      fleschScore,
      gradeLevel,
      label,
      labelColor,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
    };
  };

  const preventSubmitLocal = preventSubmit; // (kept for clarity, unused alias)

  // ══════════════════════════════════════════════════════════════════
  // ⚡ NEW FEATURE 7 — CONTENT QUALITY ANALYSIS
  // (Active Voice Detector + Short Paragraph Highlighter +
  //  Content Formatting Score + AI Pattern Detection)
  // All pure JS/regex — no external API or npm package required.
  // ══════════════════════════════════════════════════════════════════
  const contentQualityAnalysis = useMemo(() => {
    if (typeof document === "undefined") {
      return {
        passiveInstances: [],
        passiveCount: 0,
        longParagraphs: [],
        formattingScore: 0,
        formattingChecks: [],
        aiPatterns: [],
        aiPatternCount: 0,
      };
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = editorContent;
    const plainText = (tempDiv.textContent || "").replace(/\s+/g, " ").trim();

    // ── 7a. ACTIVE VOICE / PASSIVE VOICE DETECTOR ──
    // Flags "to be" verb + past participle patterns, the classic passive-voice signature.
    const passiveRegex =
      /\b(am|is|are|was|were|be|been|being)\s+(\w+ed|born|built|bought|brought|caught|chosen|done|driven|drawn|eaten|fallen|felt|found|forgotten|given|gone|grown|heard|held|hidden|kept|known|laid|left|lost|made|meant|met|paid|put|read|ridden|risen|run|said|seen|sent|set|shown|shut|sold|spent|spoken|stolen|taken|taught|told|thought|understood|worn|written)\b/gi;
    const passiveMatchesRaw = plainText.match(passiveRegex) || [];
    const passiveCount = passiveMatchesRaw.length;
    const passiveInstances = [...new Set(passiveMatchesRaw.map((m) => m.trim().toLowerCase()))].slice(0, 10);

    // ── 7b. SHORT SENTENCE / PARAGRAPH HIGHLIGHTER ──
    // Flags any paragraph that's too dense to comfortably scan on mobile.
    const LONG_PARAGRAPH_SENTENCE_LIMIT = 4;
    const LONG_PARAGRAPH_WORD_LIMIT = 100;
    const paragraphEls = Array.from(tempDiv.querySelectorAll("p"));
    const longParagraphs = [];
    paragraphEls.forEach((p, idx) => {
      const pText = p.textContent.trim();
      if (!pText) return;
      const sentences = pText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const words = pText.split(/\s+/).filter(Boolean);
      if (
        sentences.length > LONG_PARAGRAPH_SENTENCE_LIMIT ||
        words.length > LONG_PARAGRAPH_WORD_LIMIT
      ) {
        longParagraphs.push({
          index: idx + 1,
          preview: pText.slice(0, 90) + (pText.length > 90 ? "..." : ""),
          sentenceCount: sentences.length,
          wordCount: words.length,
        });
      }
    });

    // ── 7c. CONTENT FORMATTING SCORE (Scannability) ──
    const headingEls = tempDiv.querySelectorAll("h2, h3");
    const listEls = tempDiv.querySelectorAll("ul, ol");
    const tableEls = tempDiv.querySelectorAll("table");
    const boldEls = tempDiv.querySelectorAll("strong, b");
    const totalWordsForFormatting = plainText.split(/\s+/).filter(Boolean).length || 1;
    const wordsPerHeading =
      headingEls.length > 0 ? totalWordsForFormatting / headingEls.length : totalWordsForFormatting;

    const formattingChecks = [];
    formattingChecks.push({
      label: "Heading density (~1 heading per 300 words)",
      passed: headingEls.length > 0 && wordsPerHeading <= 300,
      message:
        headingEls.length === 0
          ? "No H2/H3 headings found — add headings to break up content for scanners."
          : `~${Math.round(wordsPerHeading)} words per heading. ${
              wordsPerHeading <= 300
                ? "Good scan-friendly structure."
                : "Consider adding more headings to break up long sections."
            }`,
    });
    formattingChecks.push({
      label: "Uses bullet points or numbered lists",
      passed: listEls.length > 0,
      message:
        listEls.length > 0
          ? `${listEls.length} list(s) found — good for scannability.`
          : "Consider converting some points into a bullet or numbered list.",
    });
    formattingChecks.push({
      label: "Uses tables where relevant",
      passed: tableEls.length > 0,
      message:
        tableEls.length > 0
          ? `${tableEls.length} table(s) found.`
          : "Optional — tables help a lot for specs/comparisons content.",
    });
    formattingChecks.push({
      label: "Highlights key points in bold",
      passed: boldEls.length > 0,
      message:
        boldEls.length > 0
          ? `${boldEls.length} bold/strong element(s) found.`
          : "Bold a few key phrases so a scanning reader's eyes catch the important points.",
    });

    const formattingPassedCount = formattingChecks.filter((c) => c.passed).length;
    const formattingScore = Math.round((formattingPassedCount / formattingChecks.length) * 100);

    // ── 7d. AI PATTERN DETECTION ("AI Footprint" phrase list) ──
    // Common robotic/formal phrases that make AI-generated text feel unnatural.
    const AI_PATTERN_PHRASES = [
      "in today's fast-paced world",
      "in today's digital age",
      "it is important to note that",
      "it's important to note that",
      "in conclusion",
      "in summary",
      "delve into",
      "navigate the complexities",
      "unlock the potential",
      "unlock the power",
      "in the realm of",
      "when it comes to",
      "let's dive in",
      "dive into",
      "boasts",
      "seamless",
      "seamlessly",
      "tapestry",
      "testament to",
      "plays a pivotal role",
      "plays a crucial role",
      "game-changer",
      "game changer",
      "elevate your",
      "unleash",
      "embark on",
      "in this article, we will",
      "in this blog post",
      "whether you're a",
      "at the end of the day",
      "it goes without saying",
      "needless to say",
      "a myriad of",
      "a plethora of",
      "in a nutshell",
      "on the other hand",
      "furthermore",
      "moreover",
      "additionally",
    ];

    const lowerPlainText = plainText.toLowerCase();
    const aiPatterns = [];
    AI_PATTERN_PHRASES.forEach((phrase) => {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp("\\b" + escaped + "\\b", "gi");
      const matches = lowerPlainText.match(regex);
      if (matches && matches.length > 0) {
        aiPatterns.push({ phrase, count: matches.length });
      }
    });
    aiPatterns.sort((a, b) => b.count - a.count);
    const aiPatternCount = aiPatterns.reduce((sum, p) => sum + p.count, 0);

    return {
      passiveInstances,
      passiveCount,
      longParagraphs,
      formattingScore,
      formattingChecks,
      aiPatterns,
      aiPatternCount,
    };
  }, [editorContent]);

  // ══════════════════════════════════════════════════════════════════
  // ⚡ NEW FEATURE 4 & 5 — LIVE SEO SCORE PANEL + CONTENT LENGTH TRACKER
  // (now also includes Readability as part of the score, see FEATURE 6)
  // ══════════════════════════════════════════════════════════════════
  const seoAnalysis = useMemo(() => {
    const checks = [];
    const plainText = editorContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const lowerText = plainText.toLowerCase();
    const kw = focusKeyword.trim().toLowerCase();

    let hasKeywordInHeading = false;
    let firstParagraphHasKeyword = false;
    let imagesWithoutAlt = 0;
    let internalLinkCount = 0;

    if (typeof document !== "undefined") {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = editorContent;

      if (kw) {
        const headings = tempDiv.querySelectorAll("h1, h2, h3");
        hasKeywordInHeading = Array.from(headings).some((h) =>
          h.textContent.toLowerCase().includes(kw)
        );

        const firstP = tempDiv.querySelector("p");
        firstParagraphHasKeyword = firstP
          ? firstP.textContent.toLowerCase().includes(kw)
          : false;
      }

      const imgs = tempDiv.querySelectorAll("img");
      imagesWithoutAlt = Array.from(imgs).filter(
        (img) => !img.getAttribute("alt")?.trim()
      ).length;

      const links = tempDiv.querySelectorAll("a[href]");
      internalLinkCount = Array.from(links).filter((a) => {
        const href = a.getAttribute("href") || "";
        return href.startsWith("/") || href.startsWith("#");
      }).length;
    }

    let keywordDensity = 0;
    if (kw && wordCount > 0) {
      const occurrences = lowerText.split(kw).length - 1;
      keywordDensity = (occurrences / wordCount) * 100;
    }

    if (!kw) {
      checks.push({
        label: "Focus keyword set",
        passed: false,
        message: "Enter a focus keyword above to unlock full SEO analysis.",
      });
    } else {
      checks.push({
        label: "Keyword in heading (H1–H3)",
        passed: hasKeywordInHeading,
        message: hasKeywordInHeading
          ? "Focus keyword found in a heading."
          : "Add your focus keyword to at least one heading.",
      });
      checks.push({
        label: "Keyword in opening paragraph",
        passed: firstParagraphHasKeyword,
        message: firstParagraphHasKeyword
          ? "Keyword appears early in the content."
          : "Mention the keyword in your first paragraph.",
      });
      checks.push({
        label: "Keyword density (0.5%–2.5%)",
        passed: keywordDensity >= 0.5 && keywordDensity <= 2.5,
        message: `Current density: ${keywordDensity.toFixed(2)}%. ${
          keywordDensity < 0.5
            ? "Too low — use it a bit more."
            : keywordDensity > 2.5
            ? "Too high — risk of keyword stuffing."
            : "Good range."
        }`,
      });
    }

    checks.push({
      label: `Content length (target ${targetWordCount}+ words)`,
      passed: wordCount >= targetWordCount,
      message: `${wordCount} / ${targetWordCount} words written.`,
    });

    checks.push({
      label: "All images have alt text",
      passed: imagesWithoutAlt === 0,
      message:
        imagesWithoutAlt === 0
          ? "Every image has alt text."
          : `${imagesWithoutAlt} image(s) missing alt text.`,
    });

    checks.push({
      label: "Has at least one internal link",
      passed: internalLinkCount > 0,
      message:
        internalLinkCount > 0
          ? `${internalLinkCount} internal link(s) found.`
          : "Add at least one internal link.",
    });

    checks.push({
      label: "Heading structure is sequential",
      passed: !headingWarning,
      message: headingWarning || "Heading levels are in correct order.",
    });

    // ⚡ NEW: Readability check folded into the overall SEO score
    const readability = calculateReadability(editorContent);
    checks.push({
      label: "Readability (Flesch Reading Ease)",
      passed: readability.fleschScore >= 60,
      message: `Score: ${readability.fleschScore}/100 — ${readability.label}. ${
        readability.fleschScore >= 60
          ? "Easy for most readers to follow."
          : "Try shorter sentences and simpler words to improve this."
      }`,
    });

    const passedCount = checks.filter((c) => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);

    return { score, checks, readability };
  }, [editorContent, focusKeyword, wordCount, targetWordCount, headingWarning]);

  const scoreColorClasses =
    seoAnalysis.score >= 80
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : seoAnalysis.score >= 50
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-rose-100 text-rose-800 border-rose-300";

  // ⚡ NEW: color classes for the dedicated readability badge
  const readabilityColorClasses =
    seoAnalysis.readability.labelColor === "emerald"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : seoAnalysis.readability.labelColor === "amber"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-rose-100 text-rose-800 border-rose-300";

  // ⚡ NEW: color classes for the Content Quality toggle badge
  const totalQualityIssues =
    contentQualityAnalysis.passiveCount +
    contentQualityAnalysis.longParagraphs.length +
    contentQualityAnalysis.aiPatternCount;
  const qualityColorClasses =
    totalQualityIssues === 0
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : totalQualityIssues <= 5
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-rose-100 text-rose-800 border-rose-300";

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-sm font-bold text-gray-800 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Overflow-visible for Sticky Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
        {/* Toolbar - Fixed Sticky Top */}
        <div className="bg-gray-50/95 border-b border-gray-200 p-2.5 sticky top-0 z-40 shadow-sm backdrop-blur-md flex flex-wrap items-center gap-2 rounded-t-xl">
          {/* Row 1: History */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={preventSubmit(undoAction)}
              title="Undo (Ctrl+Z)"
              className={buttonBaseClasses}
            >
              ↩️ Undo
            </button>
            <button
              type="button"
              onClick={preventSubmit(redoAction)}
              title="Redo (Ctrl+Y)"
              className={buttonBaseClasses}
            >
              ↪️ Redo
            </button>
          </div>

          {/* Typography Styles */}
          <div className="flex items-center gap-2 border-r border-gray-300 pr-2">
            <select
              onChange={(e) => {
                const val = e.target.value;
                applyFormat("formatBlock", val);
                setSelectedStyle(val);
              }}
              value={selectedStyle}
              className={selectBaseClasses}
              title="Text style"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="h5">Heading 5</option>
              <option value="h6">Heading 6</option>
              <option value="blockquote">Quote</option>
            </select>

            <select
              onChange={handleFontFamilyChange}
              value={selectedFont}
              className={selectBaseClasses}
              title="Font family"
            >
              <option value="Segoe UI">Segoe UI</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
            </select>

            <select
              onChange={(e) => applyFormat("fontSize", e.target.value)}
              className={selectBaseClasses}
              defaultValue="3"
              title="Font size"
            >
              <option value="1">10px</option>
              <option value="2">13px</option>
              <option value="3">16px</option>
              <option value="4">18px</option>
              <option value="5">22px</option>
              <option value="6">28px</option>
              <option value="7">36px</option>
            </select>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("bold"))}
              title="Bold (Ctrl+B)"
              className={`${buttonBaseClasses} font-bold`}
            >
              B
            </button>
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("italic"))}
              title="Italic (Ctrl+I)"
              className={`${buttonBaseClasses} italic`}
            >
              I
            </button>
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("underline"))}
              title="Underline (Ctrl+U)"
              className={`${buttonBaseClasses} underline`}
            >
              U
            </button>
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("strikethrough"))}
              title="Strikethrough"
              className={`${buttonBaseClasses} line-through`}
            >
              S
            </button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <div className="flex items-center gap-1">
              <input
                type="color"
                title="Text Color"
                onChange={(e) => applyFormat("foreColor", e.target.value)}
                className="h-7 w-7 cursor-pointer border border-gray-300 rounded hover:border-gray-400"
                defaultValue="#000000"
              />
              <span className="text-[10px] text-gray-500 font-medium">Text</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="color"
                title="Highlight Color"
                onChange={(e) => applyFormat("backColor", e.target.value)}
                className="h-7 w-7 cursor-pointer border border-gray-300 rounded hover:border-gray-400"
                defaultValue="#FFFF00"
              />
              <span className="text-[10px] text-gray-500 font-medium">BG</span>
            </div>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("justifyLeft"))}
              title="Align Left"
              className={buttonBaseClasses}
            >
              ⬅️
            </button>
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("justifyCenter"))}
              title="Align Center"
              className={buttonBaseClasses}
            >
              ↔️
            </button>
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("justifyRight"))}
              title="Align Right"
              className={buttonBaseClasses}
            >
              ➡️
            </button>
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("justifyFull"))}
              title="Justify"
              className={buttonBaseClasses}
            >
              ⯈
            </button>
          </div>

          {/* Lists & Indentation */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("insertOrderedList"))}
              title="Ordered List"
              className={buttonBaseClasses}
            >
              1️⃣
            </button>
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("insertUnorderedList"))}
              title="Bullet List"
              className={buttonBaseClasses}
            >
              •
            </button>
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("indent"))}
              title="Increase Indent"
              className={buttonBaseClasses}
            >
              →
            </button>
            <button
              type="button"
              onClick={preventSubmit(() => applyFormat("outdent"))}
              title="Decrease Indent"
              className={buttonBaseClasses}
            >
              ←
            </button>
          </div>

          {/* Special Media Features */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={openLinkModal}
              title="Insert Standard / Affiliate Link"
              className={buttonBaseClasses}
            >
              🔗
            </button>
            <button
              type="button"
              onClick={openImageModal}
              title="Insert SEO Compliant Image"
              className={buttonBaseClasses}
            >
              🖼️
            </button>
            <button
              type="button"
              onClick={preventSubmit(insertTable)}
              title="Insert Table"
              className={buttonBaseClasses}
            >
              📊
            </button>
            <button
              type="button"
              onClick={preventSubmit(clearFormatting)}
              title="Clear Formatting"
              className={buttonBaseClasses}
            >
              🧹
            </button>
          </div>

          {/* ⚡ CONVERSION & E-E-A-T TOOLS */}
          <div className="flex flex-wrap items-center gap-1 bg-indigo-50/80 p-1 rounded-lg border border-indigo-200">
            <button
              type="button"
              onClick={insertProsConsGrid}
              className="px-2 py-1 text-xs font-bold text-emerald-700 bg-white border border-emerald-300 rounded hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
              title="Insert Pros & Cons Grid"
            >
              ⚖️ Pros/Cons
            </button>
            <button
              type="button"
              onClick={(e) => insertCalloutBox("tip", e)}
              className="px-2 py-1 text-xs font-bold text-amber-700 bg-white border border-amber-300 rounded hover:bg-amber-500 hover:text-white transition-all shadow-sm"
              title="Insert Tip Box"
            >
              💡 Tip Box
            </button>
            <button
              type="button"
              onClick={generateTableOfContents}
              className="px-2 py-1 text-xs font-bold text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              title="Generate Table of Contents"
            >
              📋 TOC
            </button>
            <button
              type="button"
              onClick={autoCleanSeoAndSpaces}
              className="px-2 py-1 text-xs font-bold text-purple-700 bg-white border border-purple-300 rounded hover:bg-purple-600 hover:text-white transition-all shadow-sm"
              title="Auto Fix Headings & Remove Extra Spaces"
            >
              ✨ Auto SEO & Clean
            </button>
            <button
              type="button"
              onClick={insertEeatCitationBox}
              className="px-2 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-700 hover:text-white transition-all shadow-sm"
              title="Insert E-E-A-T References Box"
            >
              📚 E-E-A-T Citation
            </button>
            <button
              type="button"
              onClick={insertEeatTrustBadge}
              className="px-2 py-1 text-xs font-bold text-teal-700 bg-white border border-teal-300 rounded hover:bg-teal-700 hover:text-white transition-all shadow-sm"
              title="Insert Verified Trust Badge"
            >
              🛡️ Trust Badge
            </button>
          </div>

          {/* ⚡ NEW: QUALITY & LINKING TOOLS */}
          <div className="flex flex-wrap items-center gap-1 bg-blue-50/80 p-1 rounded-lg border border-blue-200">
            <button
              type="button"
              onClick={preventSubmit(checkBrokenLinks)}
              disabled={isCheckingLinks}
              className="px-2 py-1 text-xs font-bold text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Check all links in content for broken/error status"
            >
              {isCheckingLinks ? "⏳ Checking..." : "🔍 Check Links"}
            </button>
            <button
              type="button"
              onClick={preventSubmit(checkDuplicateContent)}
              disabled={isCheckingDuplicates}
              className="px-2 py-1 text-xs font-bold text-orange-700 bg-white border border-orange-300 rounded hover:bg-orange-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Scan for duplicate or highly similar paragraphs"
            >
              {isCheckingDuplicates ? "⏳ Scanning..." : "🧬 Check Duplicates"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowSeoPanel((prev) => !prev);
              }}
              className={`px-2 py-1 text-xs font-bold border rounded transition-all shadow-sm ${scoreColorClasses}`}
              title="Toggle Live SEO Score panel"
            >
              📊 SEO Score: {seoAnalysis.score}%
            </button>
            {/* ⚡ NEW: Quick readability badge in toolbar */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowSeoPanel(true);
              }}
              className={`px-2 py-1 text-xs font-bold border rounded transition-all shadow-sm ${readabilityColorClasses}`}
              title="Flesch Reading Ease — click to view full readability breakdown"
            >
              📖 Readability: {seoAnalysis.readability.fleschScore}/100
            </button>
          </div>

          {/* ⚡ NEW: CONTENT QUALITY TOOLS — Active Voice, Paragraph Length, Formatting, AI Patterns */}
          <div className="flex flex-wrap items-center gap-1 bg-purple-50/80 p-1 rounded-lg border border-purple-200">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowContentQualityPanel((prev) => !prev);
              }}
              className={`px-2 py-1 text-xs font-bold border rounded transition-all shadow-sm ${qualityColorClasses}`}
              title="Toggle Content Quality panel: Active Voice, Paragraph Length, Formatting Score, AI Pattern Detection"
            >
              🧠 Content Quality {totalQualityIssues > 0 ? `(${totalQualityIssues})` : "✓"}
            </button>
          </div>

          {/* Extra View Controls */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={openModal}
              className={buttonBaseClasses}
              title="View/Edit HTML"
            >
              📄 HTML
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowHelpMenu(!showHelpMenu);
              }}
              className={buttonBaseClasses}
              title="Shortcuts Help"
            >
              ?
            </button>
          </div>
        </div>

        {/* ⚡ NEW: SECONDARY TOOLBAR ROW — Focus Keyword, Target Words, Internal Link Search */}
        <div className="bg-white border-b border-gray-200 px-3 py-2.5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">
              🎯 Focus Keyword
            </label>
            <input
              type="text"
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
              placeholder="e.g. best gaming laptop"
              className="w-44 px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">
              📏 Target Words
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">
              🔎 Internal Link
            </label>
            <input
              type="text"
              value={internalLinkQuery}
              onFocus={() => {
                saveSelection();
                setShowInternalLinkSuggestions(true);
              }}
              onChange={(e) => {
                setInternalLinkQuery(e.target.value);
                setShowInternalLinkSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowInternalLinkSuggestions(false), 150)}
              placeholder="Search a page/store to link..."
              className="w-56 px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />

            {showInternalLinkSuggestions && internalLinkQuery.trim() && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
                {internalLinkResults.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {internalLinksData.length === 0
                      ? "No internalLinksData provided to this editor."
                      : "No matching internal pages found."}
                  </div>
                ) : (
                  internalLinkResults.map((item, idx) => (
                    <button
                      key={`${item.url}-${idx}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertInternalLink(item)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-800">{item.title}</div>
                      <div className="text-gray-400 font-mono truncate">{item.url}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* SEO Warnings Banner */}
        {headingWarning && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 font-medium flex items-center gap-2">
            <span>⚠️ SEO Warning:</span>
            <span>{headingWarning}</span>
          </div>
        )}

        {/* ⚡ NEW: LIVE SEO SCORE PANEL (now includes Readability sub-card) */}
        {showSeoPanel && (
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                📊 Live SEO Score
                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${scoreColorClasses}`}>
                  {seoAnalysis.score}%
                </span>
              </h4>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowSeoPanel(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                title="Hide panel"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-1">
              {seoAnalysis.checks.map((check, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <span className={check.passed ? "text-emerald-600" : "text-rose-500"}>
                    {check.passed ? "✔" : "✕"}
                  </span>
                  <span className="text-gray-700">
                    <strong>{check.label}:</strong> {check.message}
                  </span>
                </li>
              ))}
            </ul>

            {/* ⚡ NEW: Dedicated Readability breakdown sub-panel */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                  📖 Readability Breakdown (Flesch-Kincaid)
                </h5>
                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${readabilityColorClasses}`}>
                  {seoAnalysis.readability.label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Reading Ease</div>
                  <div className="text-base font-bold text-gray-800">
                    {seoAnalysis.readability.fleschScore}
                    <span className="text-xs text-gray-400 font-normal">/100</span>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Grade Level</div>
                  <div className="text-base font-bold text-gray-800">
                    {seoAnalysis.readability.gradeLevel}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Avg Words/Sentence</div>
                  <div className="text-base font-bold text-gray-800">
                    {seoAnalysis.readability.avgWordsPerSentence}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Avg Syllables/Word</div>
                  <div className="text-base font-bold text-gray-800">
                    {seoAnalysis.readability.avgSyllablesPerWord}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 italic">
                💡 Aim for a score of 60+ (Standard or easier) for general web/blog content — Google
                associates easy-to-read content with better engagement & lower bounce rate.
              </p>
            </div>
          </div>
        )}

        {/* ⚡ NEW: CONTENT QUALITY PANEL — Active Voice / Paragraph Length / Formatting / AI Patterns */}
        {showContentQualityPanel && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                🧠 Content Quality Analysis
                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${qualityColorClasses}`}>
                  {totalQualityIssues} issue{totalQualityIssues === 1 ? "" : "s"} found
                </span>
              </h4>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowContentQualityPanel(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                title="Hide panel"
              >
                ✕
              </button>
            </div>

            {/* 7a. Active Voice Detector */}
            <div>
              <h5 className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-2">
                🗣️ Active Voice Check
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                    contentQualityAnalysis.passiveCount === 0
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {contentQualityAnalysis.passiveCount} passive phrase{contentQualityAnalysis.passiveCount === 1 ? "" : "s"}
                </span>
              </h5>
              {contentQualityAnalysis.passiveCount === 0 ? (
                <p className="text-xs text-emerald-600">✔ No passive voice detected — content reads directly and actively.</p>
              ) : (
                <>
                  <p className="text-xs text-gray-600 mb-1">
                    Passive voice makes sentences indirect (e.g. "was tested by" instead of "tested"). Consider rewriting these:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {contentQualityAnalysis.passiveInstances.map((phrase, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 font-mono"
                      >
                        {phrase}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 7b. Short Sentence / Paragraph Highlighter */}
            <div className="pt-3 border-t border-gray-100">
              <h5 className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-2">
                ✂️ Paragraph Length Check
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                    contentQualityAnalysis.longParagraphs.length === 0
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {contentQualityAnalysis.longParagraphs.length} long paragraph
                  {contentQualityAnalysis.longParagraphs.length === 1 ? "" : "s"}
                </span>
              </h5>
              {contentQualityAnalysis.longParagraphs.length === 0 ? (
                <p className="text-xs text-emerald-600">✔ All paragraphs are short and mobile-friendly (2–3 sentences each).</p>
              ) : (
                <ul className="space-y-1.5">
                  {contentQualityAnalysis.longParagraphs.map((p, idx) => (
                    <li key={idx} className="text-xs bg-amber-50 border border-amber-200 rounded-md p-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-amber-800">Paragraph #{p.index}</span>
                        <span className="text-amber-600">
                          {p.sentenceCount} sentences · {p.wordCount} words
                        </span>
                      </div>
                      <p className="text-gray-700">{p.preview}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 7c. Content Formatting Score */}
            <div className="pt-3 border-t border-gray-100">
              <h5 className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-2">
                🧩 Content Formatting Score
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                    contentQualityAnalysis.formattingScore >= 75
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : contentQualityAnalysis.formattingScore >= 50
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  }`}
                >
                  {contentQualityAnalysis.formattingScore}%
                </span>
              </h5>
              <ul className="space-y-1">
                {contentQualityAnalysis.formattingChecks.map((check, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <span className={check.passed ? "text-emerald-600" : "text-rose-500"}>
                      {check.passed ? "✔" : "✕"}
                    </span>
                    <span className="text-gray-700">
                      <strong>{check.label}:</strong> {check.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 7d. AI Pattern Detection */}
            <div className="pt-3 border-t border-gray-100">
              <h5 className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-2">
                🤖 AI Pattern Detection
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                    contentQualityAnalysis.aiPatternCount === 0
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  }`}
                >
                  {contentQualityAnalysis.aiPatternCount} instance{contentQualityAnalysis.aiPatternCount === 1 ? "" : "s"}
                </span>
              </h5>
              {contentQualityAnalysis.aiPatterns.length === 0 ? (
                <p className="text-xs text-emerald-600">✔ No common AI/robotic phrases detected — content sounds natural.</p>
              ) : (
                <>
                  <p className="text-xs text-gray-600 mb-1">
                    These phrases are common "AI footprints" — replace them with more natural, specific wording:
                  </p>
                  <ul className="space-y-1">
                    {contentQualityAnalysis.aiPatterns.map((p, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between text-xs bg-rose-50 border border-rose-200 rounded-md px-2 py-1"
                      >
                        <span className="text-rose-800 font-mono">"{p.phrase}"</span>
                        <span className="text-rose-600 font-bold">×{p.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        {/* ⚡ NEW: BROKEN LINK RESULTS PANEL */}
        {showBrokenLinkPanel && (
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                🔍 Link Check Results
              </h4>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowBrokenLinkPanel(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                title="Hide panel"
              >
                ✕
              </button>
            </div>
            {brokenLinkResults.length === 0 ? (
              <p className="text-xs text-gray-500">No links checked yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {brokenLinkResults.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <span className={r.ok ? "text-emerald-600" : "text-rose-500"}>
                      {r.ok ? "✔" : "✕"}
                    </span>
                    <span className="font-mono text-gray-700 truncate max-w-[260px]" title={r.url}>
                      {r.url}
                    </span>
                    <span className="text-gray-400">— {r.status}</span>
                    <span className="text-gray-500 italic">({r.note})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ⚡ NEW: DUPLICATE CONTENT RESULTS PANEL */}
        {showDuplicatePanel && (
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                🧬 Duplicate Content Check
              </h4>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDuplicatePanel(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                title="Hide panel"
              >
                ✕
              </button>
            </div>
            {duplicateResults.length === 0 ? (
              <p className="text-xs text-emerald-600">
                ✔ No significant duplicate or similar content found.
              </p>
            ) : (
              <ul className="space-y-2">
                {duplicateResults.map((r, idx) => (
                  <li key={idx} className="text-xs bg-orange-50 border border-orange-200 rounded-md p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-orange-800">{r.similarity}% similar</span>
                      <span className="text-orange-600 italic">{r.matchedWith}</span>
                    </div>
                    <p className="text-gray-700">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Help Menu */}
        {showHelpMenu && (
          <div className="bg-white border-b border-gray-200 p-3 text-xs text-gray-600 space-y-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div><strong>Ctrl+Z</strong> - Undo</div>
              <div><strong>Ctrl+Y</strong> - Redo</div>
              <div><strong>Ctrl+B</strong> - Bold</div>
              <div><strong>Ctrl+I</strong> - Italic</div>
              <div><strong>Ctrl+U</strong> - Underline</div>
              <div><strong>Ctrl+L</strong> - Insert Link</div>
            </div>
          </div>
        )}

        {/* Editor Writing Area */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorChange}
            onClick={handleEditorClick}
            className="w-full p-6 bg-white focus:outline-none overflow-y-auto min-h-96 leading-relaxed text-base relative font-sans"
            suppressContentEditableWarning
          />

          {/* Professional Image Resize Handle Overlays */}
          {selectedImage && (
            <div
              className="absolute border-2 border-blue-600 pointer-events-none transition-all duration-75 z-10"
              style={{
                top: `${imagePos.top}px`,
                left: `${imagePos.left}px`,
                width: `${imagePos.width}px`,
                height: `${imagePos.height}px`,
              }}
            >
              {/* Bottom-Right Handle */}
              <div
                className="resize-handle absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full cursor-se-resize pointer-events-auto shadow-md"
                onMouseDown={(e) =>
                  handleMouseDownResize(e, "bottom-right", selectedImage)
                }
              />
              {/* Bottom-Left Handle */}
              <div
                className="resize-handle absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full cursor-sw-resize pointer-events-auto shadow-md"
                onMouseDown={(e) =>
                  handleMouseDownResize(e, "bottom-left", selectedImage)
                }
              />
            </div>
          )}
        </div>

        {/* Footer with SEO Metrics & Progress Bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col gap-2 rounded-b-xl">
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-600 font-mono flex items-center gap-4">
              <div>
                Words: <span className="font-bold text-gray-900">{wordCount}</span>
              </div>
              <div>
                Chars:{" "}
                <span
                  className={
                    charCount > maxLength * 0.9 ? "text-red-600 font-semibold" : ""
                  }
                >
                  {charCount}
                </span>
                <span className="text-gray-500"> / {maxLength}</span>
              </div>
              {/* ⚡ NEW: quick readability glance in footer */}
              <div>
                Readability:{" "}
                <span
                  className={
                    seoAnalysis.readability.fleschScore >= 60
                      ? "text-emerald-600 font-semibold"
                      : "text-amber-600 font-semibold"
                  }
                >
                  {seoAnalysis.readability.fleschScore}/100
                </span>
              </div>
            </div>
            <div className="w-48 h-2 bg-gray-300 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  charCount > maxLength * 0.9 ? "bg-red-500" : "bg-blue-500"
                }`}
                role="progressbar"
                aria-valuenow={Math.min((charCount / maxLength) * 100, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  width: `${Math.min((charCount / maxLength) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* ⚡ NEW: CONTENT LENGTH / TARGET TRACKER ROW */}
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-600 font-mono">
              🎯 Target Progress:{" "}
              <span
                className={
                  wordCount >= targetWordCount
                    ? "text-emerald-600 font-bold"
                    : "text-gray-900 font-semibold"
                }
              >
                {wordCount}
              </span>
              <span className="text-gray-500"> / {targetWordCount} words</span>
            </div>
            <div className="w-48 h-2 bg-gray-300 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  wordCount >= targetWordCount ? "bg-emerald-500" : "bg-indigo-400"
                }`}
                role="progressbar"
                aria-valuenow={Math.min(
                  (wordCount / Math.max(targetWordCount, 1)) * 100,
                  100
                )}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  width: `${Math.min(
                    (wordCount / Math.max(targetWordCount, 1)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>}

      {/* SEO IMAGE ENFORCEMENT MODAL */}
      {showImageSeoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">🖼️ Insert SEO Image</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Image URL *</label>
              <input
                type="url"
                required
                value={imageSeoData.url}
                onChange={(e) => setImageSeoModalData({ ...imageSeoData, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Alt Text (Mandatory for SEO) *</label>
              <input
                type="text"
                required
                value={imageSeoData.alt}
                onChange={(e) => setImageSeoModalData({ ...imageSeoData, alt: e.target.value })}
                placeholder="Descriptive target keywords..."
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title Attribute</label>
              <input
                type="text"
                value={imageSeoData.title}
                onChange={(e) => setImageSeoModalData({ ...imageSeoData, title: e.target.value })}
                placeholder="Image Title..."
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:border-indigo-600"
              />
            </div>
            <p className="text-[11px] text-gray-500 italic">💡 Image scale/size can be freely adjusted after insertion by dragging handles.</p>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowImageSeoModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSeoImageInsert}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPROVED LINK INSERTER MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">🔗 Insert Link</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target URL *</label>
              <input
                type="text"
                required
                value={linkData.url}
                onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                placeholder="e.g. /store/nike or https://affiliate.com/deal"
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Link Classification</label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLinkData({ ...linkData, linkType: "internal" })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                    linkData.linkType === "internal"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  🌐 Internal Link
                </button>
                <button
                  type="button"
                  onClick={() => setLinkData({ ...linkData, linkType: "affiliate" })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                    linkData.linkType === "affiliate"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  💸 Affiliate Link
                </button>
              </div>
            </div>

            {linkData.linkType === "internal" ? (
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkData.openInNewTab}
                  onChange={(e) => setLinkData({ ...linkData, openInNewTab: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span className="text-xs font-medium text-gray-700">Open internal link in new tab</span>
              </label>
            ) : (
              <p className="text-[11px] text-indigo-600 bg-indigo-50 p-2 rounded border border-indigo-100 font-mono">
                ✓ Auto-applies: target="_blank" & rel="sponsored nofollow noopener"
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLinkInsert}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
              >
                Apply Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HTML Viewer/Editor Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="html-modal-title"
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-4xl w-full flex flex-col"
            style={{ maxHeight: "85vh" }}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-4">
                <h3
                  id="html-modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {isEditingHtml ? "Edit HTML Source" : "View HTML Source"}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingHtml(false)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      !isEditingHtml
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => setIsEditingHtml(true)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      isEditingHtml
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              {isEditingHtml ? (
                <textarea
                  value={htmlEditContent}
                  onChange={(e) => setHtmlEditContent(e.target.value)}
                  className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-auto min-h-[300px]"
                  spellCheck="false"
                  placeholder="Paste or edit your HTML here..."
                />
              ) : (
                <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 max-h-[400px]">
                  <pre
                    className="p-4 text-sm font-mono text-gray-800 whitespace-pre-wrap select-all overflow-x-auto"
                    style={{ wordBreak: "break-word" }}
                  >
                    <code>{modalContent}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center gap-2 bg-gray-50">
              <div className="text-xs text-gray-600">
                {isEditingHtml ? (
                  <span>
                    💡 Edit HTML directly and click "Apply Changes" to update
                    the editor
                  </span>
                ) : (
                  <span>
                    📋 Copy to clipboard or switch to Edit mode to modify HTML
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-2">
                {!isEditingHtml && (
                  <>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(modalContent);
                        alert("HTML copied to clipboard!");
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => setShowFullscreenCode(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
                    >
                      🖥️ Fullscreen
                    </button>
                  </>
                )}
                {isEditingHtml && (
                  <>
                    <button
                      onClick={() => {
                        setHtmlEditContent(modalContent);
                      }}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm font-medium transition-colors"
                    >
                      ↻ Reset / Undo
                    </button>
                    <button
                      onClick={applyHtmlChanges}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
                    >
                      ✓ Apply Changes
                    </button>
                  </>
                )}
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Code Viewer Modal */}
      {showFullscreenCode && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Fullscreen Header */}
          <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📄 Full HTML Code View
            </h2>
            <button
              onClick={() => setShowFullscreenCode(false)}
              className="text-gray-400 hover:text-white text-3xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Fullscreen Code Body */}
          <div className="flex-1 overflow-auto bg-gray-950 p-6">
            <pre
              className="text-green-400 font-mono text-sm whitespace-pre-wrap select-all overflow-x-auto"
              style={{ wordBreak: "break-word" }}
            >
              <code>{modalContent}</code>
            </pre>
          </div>

          {/* Fullscreen Footer */}
          <div className="bg-gray-900 border-t border-gray-700 px-6 py-4 flex justify-between items-center gap-2">
            <div className="text-sm text-gray-400">
              Total Characters:{" "}
              <span className="text-green-400 font-bold">
                {modalContent.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalContent);
                  alert("✓ HTML copied to clipboard!");
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
              >
                📋 Copy All
              </button>
              <button
                onClick={() => setShowFullscreenCode(false)}
                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}