import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared";
import {
  resolveInspectionPersona,
  visibleNavKeys,
} from "@/lib/auth/resolve-inspection-persona";
import { resolveInspectionShellContext } from "@/lib/auth/resolve-inspection-shell-context.server";
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
    redirect("/");
  }

  const configured = await isSupabaseConfigured();

  const headersList = await headers();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  const allowedNavKeys = Array.from(visibleNavKeys(personaCtx.persona));
  const shellContext = await resolveInspectionShellContext();

  return (
    <AppShell
      allowedNavKeys={allowedNavKeys}
      configured={configured}
      shellContext={shellContext}
    >
      {children}
    </AppShell>
  );
}
