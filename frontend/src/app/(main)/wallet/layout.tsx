import { requireWorkshopDashboardPersona } from "@/lib/auth/require-workshop-persona.server";

// حارس خادمي: المحفظة = أرباح/صرف الورشة لمالك/مدير الورشة والأدمن فقط. العميل
// يدفع رسوم الفحص مباشرةً عبر PayMob ولا يملك رصيد محفظة.
export const dynamic = "force-dynamic";

export default async function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWorkshopDashboardPersona();
  return <>{children}</>;
}
