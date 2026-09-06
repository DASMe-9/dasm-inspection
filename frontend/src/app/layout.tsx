import ServiceAnalytics from "@/components/ServiceAnalytics";
import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "DASM — الفحص الفني",
  description: "نظام فحص السيارات والورش — تكامل مع منصة DASM",
  applicationName: "داسم الفحص",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "ورشتي",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c1f3d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* تطبيق الوضع الداكن قبل الرسم لمنع الوميض */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('dasm-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        {process.env.VERCEL_ENV === "production" && <ServiceAnalytics />}
      </body>
    </html>
  );
}
