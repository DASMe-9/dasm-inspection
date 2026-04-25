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
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 lg:pb-6">
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
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden flex items-center justify-around py-2.5 px-2 border-t bg-white z-50 shadow-lg">
      <NavLink href="/" label="الرئيسية" icon="🏠" />
      <NavLink href="/requests" label="الطلبات" icon="📋" />
      <NavLink href="/workshops" label="الورش" icon="🔧" />
      <NavLink href="/settings" label="الإعدادات" icon="⚙️" />
    </nav>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-gray-600 hover:bg-gray-100 text-[11px] font-medium"
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
