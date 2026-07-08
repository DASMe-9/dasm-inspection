import { requireWorkshopDashboardPersona } from "@/lib/auth/require-workshop-persona.server";

// حارس خادمي: «الاشتراك الشهري» = شرائح عمولة الورشة (B2B) لمالك/مدير الورشة والأدمن
// فقط. يمنع تسريب التسعير للعميل حتى عند فتح /subscription مباشرةً بالرابط.
export const dynamic = "force-dynamic";

export default async function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWorkshopDashboardPersona();
  return <>{children}</>;
}
