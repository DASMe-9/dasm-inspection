"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, Users } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { WorkshopFollowersPanel } from "@/components/workshop/WorkshopFollowersPanel";
import { WorkshopReviewsPanel } from "@/components/workshop/WorkshopReviewsPanel";
import type { WorkshopReview } from "@/types";
import type { WorkshopFollower } from "@/types/workshop-insights";

type TabId = "reviews" | "followers";

const TABS: { id: TabId; label: string; icon: typeof Star }[] = [
  { id: "reviews", label: "التقييمات", icon: Star },
  { id: "followers", label: "المتابعون", icon: Users },
];

export type WorkshopReputationStats = {
  followerCount: number;
  reviewCount: number;
  pendingCount: number;
  averageRating: number | null;
};

export function WorkshopReputationHub({
  initialTab,
  followers,
  reviews,
  pendingCount,
  stats,
}: {
  initialTab?: string;
  followers: WorkshopFollower[];
  reviews: WorkshopReview[];
  pendingCount: number;
  stats: WorkshopReputationStats;
}) {
  const [tab, setTab] = useState<TabId>("reviews");

  useEffect(() => {
    if (initialTab === "followers" || initialTab === "reviews") {
      setTab(initialTab);
    }
  }, [initialTab]);

  const selectTab = useCallback((next: TabId) => {
    setTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          value={stats.averageRating != null ? stats.averageRating.toFixed(1) : "—"}
          label="متوسط التقييم"
        />
        <StatCard value={stats.reviewCount} label="إجمالي التقييمات" />
        <StatCard value={stats.pendingCount} label="بانتظار المراجعة" />
        <StatCard value={stats.followerCount} label="المتابعون" />
      </section>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="التقييمات والمتابعون">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "bg-[#1e3a5f] text-white"
                    : "text-slate-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel">
        {tab === "reviews" ? (
          <WorkshopReviewsPanel reviews={reviews} pendingCount={pendingCount} />
        ) : (
          <WorkshopFollowersPanel followers={followers} />
        )}
      </div>
    </div>
  );
}
