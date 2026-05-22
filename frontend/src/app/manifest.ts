import type { MetadataRoute } from "next";

/** PWA manifest — لوحة الورشة (خطوة 36) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "داسم — لوحة الورشة",
    short_name: "ورشتي",
    description: "إدارة فحوصات الورشة — inspect.dasm.com.sa",
    start_url: "/workshop",
    scope: "/",
    display: "standalone",
    background_color: "#0c1f3d",
    theme_color: "#0c1f3d",
    orientation: "portrait-primary",
    lang: "ar",
    dir: "rtl",
    categories: ["business", "utilities"],
    icons: [
      {
        src: "/icons/workshop-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/workshop-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/workshop-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "الطلبات",
        short_name: "طلبات",
        url: "/requests",
        description: "قائمة طلبات الفحص",
      },
      {
        name: "ميداني",
        short_name: "ميداني",
        url: "/workshop/field",
        description: "تقويم الزيارات الميدانية",
      },
      {
        name: "الفريق",
        short_name: "فريق",
        url: "/workshop/team",
        description: "إدارة المفتشين",
      },
    ],
  };
}
