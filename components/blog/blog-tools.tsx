"use client";

import { useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { LinkedinIcon, XIcon } from "@/components/ui/brand-icons";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Client-side enhancers for the rendered (server-generated) blog body:
// syntax highlighting, TOC scroll-spy, share actions.
// ---------------------------------------------------------------------------

export function CodeHighlighter() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hljs = (await import("highlight.js/lib/common")).default;
        if (!mounted) return;
        document
          .querySelectorAll<HTMLElement>(".richtext pre code:not([data-highlighted])")
          .forEach((block) => {
            const cls = block.className.match(/language-([a-z0-9-]+)/)?.[1];
            // Skip blocks already highlighted at editor save time (they contain spans)
            if (block.querySelector("span")) {
              block.setAttribute("data-highlighted", "yes");
              return;
            }
            try {
              if (cls && hljs.getLanguage(cls)) {
                hljs.highlightElement(block);
                block.setAttribute("data-highlighted", "yes");
              } else {
                block.setAttribute("data-highlighted", "plain");
              }
            } catch {
              block.setAttribute("data-highlighted", "error");
            }
          });
      } catch {
        /* highlighter is progressive enhancement only */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return null;
}

export function TableOfContents({
  toc,
}: {
  toc: { id: string; text: string; level: 2 | 3 }[];
}) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => !!el);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  return (
    <nav aria-label="Table of contents">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
        On this page
      </p>
      <ul className="mt-3 space-y-1 border-l border-border">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1.5 pr-2 text-[0.83rem] leading-snug transition-colors duration-150",
                item.level === 3 ? "pl-7" : "pl-4",
                activeId === item.id
                  ? "border-accent font-medium text-accent"
                  : "border-transparent text-muted hover:border-border-strong hover:text-ink",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ShareButtons({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  // Resolve at click time, so navigation and hydration cannot leave a stale URL.
  const currentUrl = () => window.location.href;

  const share = (target: string) => {
    window.open(target, "_blank", "noopener,noreferrer,width=640,height=520");
  };

  const iconCls =
    "inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent";

  return (
    <div className="flex items-center gap-2" aria-label="Share this article">
      <button
        className={iconCls}
        aria-label="Share on X / Twitter"
        onClick={() =>
          share(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text || title)}&url=${encodeURIComponent(currentUrl())}`,
          )
        }
      >
        <XIcon size={15} />
      </button>
      <button
        className={iconCls}
        aria-label="Share on LinkedIn"
        onClick={() =>
          share(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl())}`)
        }
      >
        <LinkedinIcon size={15} />
      </button>
      <button
        className={iconCls}
        aria-label="Copy link"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(currentUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard unavailable */
          }
        }}
      >
        {copied ? <Check size={15} className="text-emerald-500" /> : <Link2 size={15} />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
