import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { SupabaseSetupWarning } from "@/components/shared";
import { isSupabaseConfigured } from "@/lib/data/inspection";

export const dynamic = "force-dynamic";

export default async function MainShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // حماية: تحقق من وجود توكن DASM قبل عرض أي صفحة محمية
  const cookieStore = await cookies();
  const token =
    cookieStore.get("dasm_access_token")?.value ??
    cookieStore.get("inspection_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const configured = await isSupabaseConfigured();

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <Sidebar />
      <main className="flex-1 min-h-screen lg:mr-64">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
          {!configured && <SupabaseSetupWarning />}
          {children}
        </div>
        <MobileNav />
      </main>
    </div>
  );
}

function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 lg:hidden z-50 flex items-stretch justify-around gap-0 border-t border-gray-100 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] px-1"
      aria-label="التنقّل السفلي"
    >
      <NavLink href="/" label="الرئيسية" icon="🏠" />
      <NavLink href="/requests" label="الطلبات" icon="📋" />
      <NavLink href="/my-inspections" label="طلباتي" icon="👤" />
      <NavLink href="/workshops" label="الورش" icon="🔧" />
      <NavLink href="/subscription" label="الاشتراك" icon="💳" />
      <NavLink href="/settings" label="الإعدادات" icon="⚙️" />
    </nav>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      prefetch
      className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1 px-0.5 text-[9px] font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 min-h-[52px] justify-center sm:text-[10px]"
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="truncate w-full text-center leading-tight">{label}</span>
    </Link>
  );
}
