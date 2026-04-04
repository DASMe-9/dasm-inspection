import { PhoneFrame } from "@/components/shared";
import { Header } from "@/components/shared";
import { BottomNav } from "@/components/shared";
import { SupabaseSetupWarning } from "@/components/shared";
import { isSupabaseConfigured } from "@/lib/data/inspection";

export const dynamic = "force-dynamic";

export default async function MainShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = await isSupabaseConfigured();

  return (
    <PhoneFrame role="workshop" topBar={<Header />}>
      <div className="pb-24 space-y-4">
        {!configured && <SupabaseSetupWarning />}
        {children}
      </div>
      <BottomNav />
    </PhoneFrame>
  );
}
