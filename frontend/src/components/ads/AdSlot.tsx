"use client";

import { useEffect, useRef, useState } from "react";
import {
  type AdSlotContext,
  type DasmAd,
  getAdsSessionId,
  isVideoAd,
  serveAds,
  trackAdEvent,
} from "@/lib/ads-client";

// W-007 — DASM Ads slot for the inspection surface. Renders image or video
// (Package B), tracks impression (on view) + click, and renders nothing when
// there is no ad or ads are unavailable (page never breaks).

interface Props {
  slotKey: string;
  context?: AdSlotContext;
  className?: string;
}

function adHref(ad: DasmAd): string | null {
  return ad.target_url || ad.rendered?.target_url || null;
}

export function AdSlot({ slotKey, context = {}, className = "" }: Props) {
  const [ad, setAd] = useState<DasmAd | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const tracked = useRef(false);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sid = getAdsSessionId();
    setSessionId(sid);
    let cancelled = false;
    serveAds(slotKey, sid, { surface: "inspection", user_type: "guest", ...context })
      .then((ads) => {
        if (!cancelled) setAd(ads[0] ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey]);

  useEffect(() => {
    if (!ad || !sessionId || !rootRef.current || tracked.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5 && !tracked.current) {
          tracked.current = true;
          trackAdEvent(ad, "impression", sessionId, {
            slot: slotKey,
            visible_ratio: entry.intersectionRatio,
            viewport_seconds: 1,
          });
          obs.disconnect();
        }
      },
      { threshold: [0.5] },
    );
    obs.observe(rootRef.current);
    return () => obs.disconnect();
  }, [ad, sessionId, slotKey]);

  if (!ad) return null;

  const r = ad.rendered ?? {};
  const href = adHref(ad);
  const showVideo = isVideoAd(r) && !videoFailed;
  const poster = r.poster_url || r.image_url || undefined;
  const title = r.headline || "إعلان ممول";

  const onClick = () => {
    if (sessionId) trackAdEvent(ad, "click", sessionId, { slot: slotKey });
  };

  const media = showVideo ? (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      src={r.video_url ?? undefined}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={title}
      onError={() => setVideoFailed(true)}
      className="h-full w-full object-cover"
    />
  ) : r.image_url || poster ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={(r.image_url || poster) as string} alt={title} className="h-full w-full object-cover" loading="lazy" />
  ) : null;

  const inner = (
    <div className="flex items-center gap-3">
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">{media}</div>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold text-amber-600">إعلان ممول</span>
        <p className="truncate text-sm font-bold">{title}</p>
        {r.subtitle && <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>}
      </div>
    </div>
  );

  return (
    <section ref={rootRef} data-dasm-ad-slot={slotKey} dir="rtl" className={`rounded-xl border bg-card p-3 ${className}`}>
      {href ? (
        <a href={href} onClick={onClick} target="_blank" rel="noopener noreferrer" className="block">
          {inner}
        </a>
      ) : (
        inner
      )}
    </section>
  );
}
