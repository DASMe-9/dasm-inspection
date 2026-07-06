import { PublicSiteHeader, PublicSiteFooter } from "@/components/public-site";
import { PUBLIC_BRAND } from "@/components/public-site/brand-tokens";

export default function PublicSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: PUBLIC_BRAND.white }}
      dir="rtl"
    >
      <PublicSiteHeader />
      <main className="flex-1">{children}</main>
      <PublicSiteFooter />
    </div>
  );
}
