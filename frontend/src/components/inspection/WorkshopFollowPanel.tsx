"use client";

import { useTransition } from "react";
import {
  followWorkshopAction,
  unfollowWorkshopAction,
} from "@/app/actions/workshop-follows";
import { Bell, BellOff, Users } from "lucide-react";

export function WorkshopFollowPanel({
  workshopId,
  workshopSlug,
  followerCount,
  isFollowing,
  dasmUserId,
}: {
  workshopId: string;
  workshopSlug: string;
  followerCount: number;
  isFollowing: boolean;
  dasmUserId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  if (!dasmUserId) {
    return (
      <p className="text-sm text-gray-600">
        سجّل الدخول لمتابعة الورشة وتلقّي تنبيهات عند نشاط جديد.
      </p>
    );
  }

  const hidden = (
    <>
      <input type="hidden" name="workshop_id" value={workshopId} />
      <input type="hidden" name="workshop_slug" value={workshopSlug} />
    </>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
        <Users className="h-4 w-4" aria-hidden />
        {followerCount} متابع
      </span>
      {isFollowing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => unfollowWorkshopAction(fd));
          }}
        >
          {hidden}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <BellOff className="h-4 w-4" aria-hidden />
            إلغاء المتابعة
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => followWorkshopAction(fd));
          }}
        >
          {hidden}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            <Bell className="h-4 w-4" aria-hidden />
            متابعة الورشة
          </button>
        </form>
      )}
    </div>
  );
}
