"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { disableServiceAnalytics, updateServiceAnalytics } from "@/lib/service-analytics";

export default function ServiceAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    const handle = window.setTimeout(() => updateServiceAnalytics(pathname), 1200);

    return () => {
      window.clearTimeout(handle);
      disableServiceAnalytics();
    };
  }, [pathname]);
  return null;
}
