import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { InspectionTopNavbar } from "@/components/shared/InspectionTopNavbar";
import { MOBILE_BOTTOM_NAV_ITEMS } from "@/components/shared/nav-config";
import { SupabaseSetupWarning } from "@/components/shared/SupabaseSetupWarning";
import type { InspectionShellContext } from "@/lib/auth/inspection-shell-context";
import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";
import type { LucideIcon } from "lucide-react";

/**
 * قشرة التطبيق الموحّدة — شريط جانبي (سطح المكتب) + شريط علوي بهوية الورشة.
 * بطاقة الترحيب الكبيرة أُزيلت؛ الهوية تظهر مرة واحدة في النافبار.
 */
export function AppShell({
  allowedNavKeys,
  configured = true,
  shellContext = null,
  children,
}: {
  allowedNavKeys: InspectionNavKey[];
  configured?: boolean;
  shellContext?: InspectionShellContext | null;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_55%,#eef2f7_100%)] dark:bg-none dark:bg-[#0a1626]"
      dir="rtl"
    >
      <Sidebar allowedNavKeys={allowedNavKeys} />
      <main className="flex-1 min-h-screen lg:mr-64">
        <div className="mx-auto max-w-[1440px] px-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:px-6 md:py-5 lg:pb-8">
          {!configured && <SupabaseSetupWarning />}
          {shellContext ? (
            <InspectionTopNavbar
              personDisplayName={shellContext.personDisplayName}
              workshopProfileHref={shellContext.workshopProfileHref}
              workshopPublicHref={shellContext.workshopPublicHref}
              workshopWelcome={shellContext.workshopWelcome}
              email={shellContext.email}
              userCode={shellContext.userCode}
              areaLabel={shellContext.areaLabel}
              city={shellContext.city}
            />
          ) : null}
          <div className="space-y-6">{children}</div>
        </div>
        <MobileNav allowedNavKeys={allowedNavKeys} />
      </main>
    </div>
  );
}

function MobileNav({
  allowedNavKeys,
}: {
  allowedNavKeys: InspectionNavKey[];
}) {
  const allowed = new Set(allowedNavKeys);
  const customerMobileKeys = new Set<InspectionNavKey>([
    "requests",
    "my_inspections",
    "my_vehicles",
    "workshops",
    "settings",
  ]);
  const isCustomer = allowed.has("my_vehicles");
  const items = MOBILE_BOTTOM_NAV_ITEMS.filter(
    (item) =>
      allowed.has(item.key) && (!isCustomer || customerMobileKeys.has(item.key))
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 lg:hidden z-50 flex items-stretch justify-around gap-0 border-t border-white/10 bg-[#0B1E3A]/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(2,8,20,0.35)] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] px-1"
      aria-label="التنقّل السفلي"
    >
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
        />
      ))}
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  const Icon = icon;
  return (
    <Link
      href={href}
      prefetch
      className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1 px-0.5 text-[9px] font-medium text-slate-300 hover:bg-white/5 hover:text-white active:bg-white/10 min-h-[52px] justify-center sm:text-[10px]"
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className="truncate w-full text-center leading-tight">{label}</span>
    </Link>
  );
}
