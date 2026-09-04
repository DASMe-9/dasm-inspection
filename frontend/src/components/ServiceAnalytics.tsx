"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { disableServiceAnalytics, updateServiceAnalytics } from "@/lib/service-analytics";

export default function ServiceAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    updateServiceAnalytics(pathname);
    return disableServiceAnalytics;
  }, [pathname]);
  return null;
}
