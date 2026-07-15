import { cookies, headers } from "next/headers";
import { PublicSiteHeader, PublicSiteFooter } from "@/components/public-site";
import { AppShell } from "@/components/shared";
import {
  resolveInspectionPersona,
  visibleNavKeys,
} from "@/lib/auth/resolve-inspection-persona";
import { resolveInspectionShellContext } from "@/lib/auth/resolve-inspection-shell-context.server";

// قشرة تكيّفية: نقرأ توكن الدخول لتحديد القشرة، فيلزم التصيير الديناميكي.
export const dynamic = "force-dynamic";

export default async function PublicSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("dasm_access_token")?.value ??
    cookieStore.get("inspection_token")?.value;

  // مستخدم داخل: غلّف الصفحة العامة بقشرة اللوحة نفسها — فلا يخرج من القشرة
  // (شريط جانبي + شريط سفلي) عند فتح الورش/من نحن/الخصوصية/الشروط.
  if (token) {
    const headersList = await headers();
    const personaCtx = resolveInspectionPersona(headersList, cookieStore);
    const allowedNavKeys = Array.from(visibleNavKeys(personaCtx.persona));
    const shellContext = await resolveInspectionShellContext();
    return (
      <AppShell
        allowedNavKeys={allowedNavKeys}
        shellContext={shellContext}
      >
        {children}
      </AppShell>
    );
  }

  // زائر غير مسجّل: الموقع العام يتبع ثيم html.dark (لا نفرض خلفية بيضاء).
  return (
    <div
      className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[var(--background)] dark:text-[var(--foreground)]"
      dir="rtl"
    >
      <PublicSiteHeader />
      <main className="flex-1">{children}</main>
      <PublicSiteFooter />
    </div>
  );
}
