"use client";

import { usePathname } from "next/navigation";
import { WorkshopWelcomeBanner } from "@/components/shared/WorkshopWelcomeBanner";
import type { InspectionShellContext } from "@/lib/auth/inspection-shell-context";

type Props = Pick<
  InspectionShellContext,
  "workshopWelcome" | "email" | "userCode" | "areaLabel" | "city"
>;

/** يخفى الترحيب في صفحة ملف الورشة (لها رأسها الخاص). */
export function WorkshopWelcomeBannerGate(props: Props) {
  const pathname = usePathname();
  if (pathname.startsWith("/workshop/profile")) return null;
  return <WorkshopWelcomeBanner {...props} />;
}
