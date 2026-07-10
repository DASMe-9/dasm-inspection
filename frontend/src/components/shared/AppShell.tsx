import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { InspectionTopNavbar } from "@/components/shared/InspectionTopNavbar";
import { WorkshopWelcomeBannerGate } from "@/components/shared/WorkshopWelcomeBannerGate";
import { MOBILE_BOTTOM_NAV_ITEMS } from "@/components/shared/nav-config";
import { SupabaseSetupWarning } from "@/components/shared/SupabaseSetupWarning";
import type { InspectionShellContext } from "@/lib/auth/inspection-shell-context";
import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";

/**
 * قشرة التطبيق الموحّدة — شريط جانبي (سطح المكتب) + شريط علوي + ترحيب الورشة.
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
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
          {!configured && <SupabaseSetupWarning />}
          {shellContext ? (
            <>
              <InspectionTopNavbar
                personDisplayName={shellContext.personDisplayName}
                coreProfileUrl={shellContext.coreProfileUrl}
                workshopProfileHref={shellContext.workshopProfileHref}
              />
              <WorkshopWelcomeBannerGate
                workshopWelcome={shellContext.workshopWelcome}
                email={shellContext.email}
                userCode={shellContext.userCode}
                areaLabel={shellContext.areaLabel}
                city={shellContext.city}
              />
            </>
          ) : null}
          <div className={shellContext?.workshopWelcome ? "mt-6 space-y-6" : "space-y-6"}>
            {children}
          </div>
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
  const items = MOBILE_BOTTOM_NAV_ITEMS.filter((x) => allowed.has(x.key));

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
  icon: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1 px-0.5 text-[9px] font-medium text-slate-300 hover:bg-white/5 hover:text-white active:bg-white/10 min-h-[52px] justify-center sm:text-[10px]"
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="truncate w-full text-center leading-tight">{label}</span>
    </Link>
  );
}
