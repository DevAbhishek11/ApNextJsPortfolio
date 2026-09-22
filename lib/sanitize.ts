import sanitizeHtml from "sanitize-html";

// ---------------------------------------------------------------------------
// Server-side sanitization for rich-text HTML (blog bodies, project
// descriptions). Only editor-produced markup survives — scripts, event
// handlers, and unknown tags are stripped to prevent stored XSS.
// ---------------------------------------------------------------------------

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4",
    "strong", "b", "em", "i", "u", "s", "del", "mark", "code", "pre", "span",
    "a", "ul", "ol", "li", "blockquote",
    "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
    "sup", "sub",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["class"],
    span: ["class"],
    pre: ["class"],
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
    figure: ["class"],
  },
  allowedClasses: {
    code: [/^language-[a-z0-9-]+$/i],
    span: [/^hljs[-_a-z0-9]+$/i],
    pre: [/^hljs$/i, /^language-[a-z0-9-]+$/i],
    figure: [/^image$/i, /^image-with-caption$/i],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
  // Permit relative src/href (our own /uploads/... paths).
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
    }),
  },
};

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, options);
}

export function isSafeImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
