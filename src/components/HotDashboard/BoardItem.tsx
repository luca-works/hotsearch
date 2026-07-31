import { Check, Copy, Sparkles } from "lucide-react";
import React, { useEffect,useRef, useState } from "react";
import { createPortal } from "react-dom";

interface HotBadge {
  label: string;
  className: string;
}

const getHotBadge = (rank: number, title: string): HotBadge | null => {
  if (rank === 1) {
    return { 
      label: "爆", 
      className: "bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-md shadow-[0_2px_6px_rgba(239,68,68,0.25)] animate-pulse shrink-0" 
    };
  }
  if (rank === 2 || rank === 3) {
    return { 
      label: "热", 
      className: "bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-md shadow-[0_2px_6px_rgba(249,115,22,0.2)] shrink-0" 
    };
  }
  
  // Stable hash based on title content for other rank items to display "新", "荐", etc.
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const code = Math.abs(hash) % 100;
  
  if (code < 15) {
    return { 
      label: "新", 
      className: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-md shadow-[0_2px_6px_rgba(16,185,129,0.2)] shrink-0" 
    };
  } else if (code >= 85 && code < 92) {
    return { 
      label: "荐", 
      className: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-md shadow-[0_2px_6px_rgba(59,130,246,0.18)] shrink-0" 
    };
  }
  return null;
};

interface BoardItemProps {
  item: {
    title: string;
    url: string;
    hot?: string;
  };
  rank: number;
  theme: string;
  searchQuery?: string;
}

export const BoardItem: React.FC<BoardItemProps> = ({
  item,
  rank,
  theme,
  searchQuery,
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placement: "top" | "bottom" } | null>(null);
  const [copied, setCopied] = useState(false);

  const renderTitle = (title: string) => {
    if (!searchQuery || !searchQuery.trim()) return title;
    const query = searchQuery.trim().toLowerCase();
    const parts = title.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query ? (
        <mark key={i} className="bg-amber-400/35 text-amber-500 font-black rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const titleRef = useRef<HTMLAnchorElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(`${item.title} ${item.url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateCoordinates = () => {
    if (titleRef.current && containerRef.current) {
      const titleEl = titleRef.current;
      const overflowing = titleEl.scrollWidth > titleEl.clientWidth;
      setIsOverflowing(overflowing);

      if (overflowing) {
        const targetEl = badgeRef.current || titleEl;
        const targetRect = targetEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

        let computedLeft = targetRect.left + scrollX;
        let computedWidth = Math.max(260, containerRect.right - targetRect.left - 42);

        // Dynamic offset bounds calculation
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 12; // Safety margin from viewport edges
        const rightBound = scrollX + viewportWidth - padding;
        const leftBound = scrollX + padding;

        // Correct overflow on the right edge
        if (computedLeft + computedWidth > rightBound) {
          const potentialWidth = rightBound - computedLeft;
          if (potentialWidth >= 260) {
            computedWidth = potentialWidth;
          } else {
            // Shift leftwards to maintain the minimum width without clipping
            computedWidth = Math.min(260, viewportWidth - padding * 2);
            computedLeft = rightBound - computedWidth;
          }
        }

        // Correct overflow on the left edge
        if (computedLeft < leftBound) {
          computedLeft = leftBound;
          computedWidth = Math.min(computedWidth, rightBound - computedLeft);
        }

        // Top/Bottom flip positioning based on viewport height and estimated tooltip height
        const estimatedHeight = 110; // Tooltip average height plus some buffer
        const spaceAbove = targetRect.top;
        const spaceBelow = viewportHeight - targetRect.bottom;

        let placement: "top" | "bottom" = "top";
        if (spaceAbove < estimatedHeight && spaceBelow > spaceAbove) {
          placement = "bottom";
        }

        const calculatedTop = placement === "top"
          ? targetRect.top + scrollY
          : targetRect.bottom + scrollY;

        setCoords({
          top: calculatedTop,
          left: computedLeft,
          width: computedWidth,
          placement,
        });
      }
    }
  };

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const observer = new ResizeObserver(() => {
      updateCoordinates();
    });

    observer.observe(containerEl);

    // Run once on load to populate coordinates/overflow status
    updateCoordinates();

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleMouseEnter = () => {
    updateCoordinates();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  useEffect(() => {
    if (isHovered) {
      const handleScroll = () => {
        setIsHovered(false);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      document.addEventListener("scroll", handleScroll, true);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        document.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [isHovered]);

  const handleContainerClick = () => {
    window.open(item.url, "_blank", "noreferrer");
  };

  const badge = getHotBadge(rank, item.title);

  return (
    <div
      ref={containerRef}
      className={`h-[40px] px-3.5 flex items-center justify-between gap-2.5 group relative w-full min-w-0 transition-colors duration-200 cursor-pointer select-none ${
        theme === 'dark' ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-500/5'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Rank */}
        {rank <= 3 ? (
          <span
            className={`flex size-5 shrink-0 select-none items-center justify-center rounded-full text-[11px] font-extrabold tabular-nums leading-none text-white shadow-sm ${
              rank === 1
                ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/25 ring-1 ring-rose-400/30"
                : rank === 2
                ? "bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-500/20 ring-1 ring-orange-300/30"
                : "bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-500/20 ring-1 ring-yellow-300/30"
            }`}
          >
            {rank}
          </span>
        ) : (
          <span
            className={`w-5 shrink-0 text-center font-mono text-[14px] font-bold tabular-nums leading-none ${
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {rank}
          </span>
        )}

        {/* Front Badge Marker for "爆", "热", "新", "荐", etc. */}
        {badge && (
          <span
            ref={badgeRef}
            className={`shrink-0 select-none leading-none ${badge.className}`}
          >
            {badge.label}
          </span>
        )}

        {/* Content Title container */}
        <div className="relative min-w-0 flex-1 py-0.5">
          <a
            ref={titleRef}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()} // Prevent double-triggering container click
            title="" // Clear native window title
            className={`text-[14.5px] font-semibold leading-none truncate hover:underline block w-full ${
              theme === "dark"
                ? "text-gray-200 group-hover:text-amber-400"
                : "text-slate-700 group-hover:text-[#ff8200]"
            }`}
          >
            {renderTitle(item.title)}
          </a>
        </div>
      </div>

      {/* Hot Value & Actions */}
      <div className="relative flex items-center shrink-0 min-w-0 select-none pr-6 h-full">
        {item.hot && (
          <span
            className={`text-[11.5px] font-mono font-bold transition-opacity duration-200 group-hover:opacity-0 ${
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {item.hot}
          </span>
        )}
        
        {/* Copy/Share Action Button */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center">
          <button
            onClick={handleCopy}
            title="复制标题和链接"
            type="button"
            className={`p-1 rounded-md border shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
              theme === "dark"
                ? "border-[#1e2942] bg-[#162035] text-slate-300 hover:bg-[#1f2d4e] hover:text-white"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {copied ? (
              <Check className="size-3 text-emerald-500 animate-pulse" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copied && createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#0e1726]/90 px-4 py-2.5 text-xs font-bold text-emerald-400 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <Check className="size-4 shrink-0 text-emerald-400" />
          <span>已成功复制热搜标题与链接到剪贴板</span>
        </div>,
        document.body
      )}

      {/* Tooltip Rendered via high-performance Portal directly to document.body */}
      {isHovered && isOverflowing && coords && createPortal(
        <>
          <style>{`
            :root {
              --tooltip-z-index: 9999999;
            }
            @keyframes tooltip-fade-slide-up {
              from {
                opacity: 0;
                transform: translateY(-100%) translateY(-1px);
              }
              to {
                opacity: 1;
                transform: translateY(-100%) translateY(-6px);
              }
            }
            @keyframes tooltip-fade-slide-down {
              from {
                opacity: 0;
                transform: translateY(1px);
              }
              to {
                opacity: 1;
                transform: translateY(6px);
              }
            }
          `}</style>
          <div
            style={{
              position: "absolute",
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              width: `${coords.width}px`,
              height: "auto",
              animation: coords.placement === "top"
                ? "tooltip-fade-slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                : "tooltip-fade-slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              backdropFilter: "blur(12px) saturate(180%)",
              WebkitBackdropFilter: "blur(12px) saturate(180%)",
              zIndex: "var(--tooltip-z-index, 9999999)",
              background: theme === "dark"
                ? "linear-gradient(to bottom, rgba(16, 20, 38, 0.8) 0%, rgba(8, 10, 20, 0.6) 100%) padding-box, linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.01) 100%) border-box"
                : "linear-gradient(rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.82)) padding-box, linear-gradient(135deg, rgba(255, 255, 255, 0.70) 0%, rgba(226, 232, 240, 0.40) 100%) border-box",
              border: "1px solid transparent",
            }}
            className={`rounded-xl p-2.5 text-xs pointer-events-none select-none whitespace-normal leading-normal ${
              theme === "dark"
                ? "text-slate-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),inset_0_1px_1.5px_rgba(255,255,255,0.15)]"
                : "text-slate-800 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.85)]"
            }`}
          >
            {/* Tooltip Arrow Pointer */}
            <div
              style={{
                position: "absolute",
                left: "24px",
                width: "8px",
                height: "8px",
                transform: "rotate(45deg)",
                background: theme === "dark"
                  ? "rgba(16, 20, 38, 0.8)"
                  : "rgba(255, 255, 255, 0.88)",
                ...(coords.placement === "top"
                  ? {
                      bottom: "-4px",
                      borderRight: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(226, 232, 240, 0.70)",
                      borderBottom: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(226, 232, 240, 0.70)",
                    }
                  : {
                      top: "-4px",
                      borderLeft: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(226, 232, 240, 0.70)",
                      borderTop: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(226, 232, 240, 0.70)",
                    }),
                backdropFilter: "blur(12px)",
                zIndex: -1,
              }}
            />
            <div className="text-[12px] text-[#ff8200] font-bold font-mono mb-1.5 flex items-center gap-1 px-2">
              <Sparkles className="h-2.5 w-2.5 shrink-0 text-[#ff8200]" />
              <span>完整热搜</span>
            </div>
            <div className={`h-[0.5px] w-full mb-1.5 ${
              theme === "dark" ? "bg-white/10" : "bg-slate-200/50"
            }`} />
            <div className={`font-bold leading-relaxed text-[14px] break-all px-2 py-0.5 ${
              theme === "dark" ? "text-slate-100" : "text-slate-800"
            }`}>
              {item.title}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
