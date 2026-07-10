import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { ClipboardList, Car, Wrench } from "lucide-react";
import {
  RequestCard,
  NewInspectionRequestForm,
  RequestListFilters,
} from "@/components/inspection";
import { SectionCard, EmptyState, PersonaPageHero } from "@/components/shared";
import { AdSlot } from "@/components/ads/AdSlot";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { buildRequestListScope } from "@/lib/auth/request-list-scope.server";
import { getPlatformDefaultPricing } from "@/lib/data/inspection-pricing-data";
import {
  listInspectionRequests,
  listInspectionRequestsForDasmUser,
  listWorkshops,
} from "@/lib/data/inspection";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { requestListHeroStats } from "@/lib/inspection-request-hero-stats";

export default async function RequestsListPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const cookieStore = cookies();
  const firstParam = (key: string): string => {
    const raw = searchParams?.[key];
    if (typeof raw === "string") return raw.trim();
    if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0].trim();
    return "";
  };

  const presetDasmUserId =
    firstParam("dasm_user_id") || (await resolveDasmUserId()) || "";
  const presetDasmCarId = firstParam("dasm_car_id");
  const presetVehicleLabel = firstParam("vehicle_label");
  const presetTitle = firstParam("title");

  const headersList = headers();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  const workshops = await listWorkshops();
  const workshopOptions = workshops.map((w) => ({ id: w.id, name: w.name }));
  const scope = await buildRequestListScope(searchParams, workshopOptions);

  const list = scope.usePlatformUserScope
    ? await listInspectionRequestsForDasmUser(
        scope.platformUserId!,
        scope.listOpts
      )
    : await listInspectionRequests(scope.listOpts);

  const workshopNameById = new Map(workshopOptions.map((w) => [w.id, w.name]));

  const platformPricing = await getPlatformDefaultPricing();
  const hideNewRequestForm = isWorkshopOperatorRole(personaCtx.persona);
  const createFormWorkshops = workshops
    .filter((w) => w.isVerified && !w.isSuspended)
    .map((w) => ({
      id: w.id,
      name: w.name,
      city: w.city,
      isVerified: w.isVerified,
      pricing: w.pricing,
    }));

  const scopedNote = scope.scopedNote;
  const stats = requestListHeroStats(list);
  const isCustomer = personaCtx.persona === "dasm_user";
  const isInspector = ["inspector", "mechanic", "viewer"].includes(personaCtx.persona);
  const isWorkshopOp = isWorkshopOperatorRole(personaCtx.persona);

  const heroVariant = isCustomer ? "customer" : isInspector ? "inspector" : "neutral";
  const heroTitle = isWorkshopOp
    ? "طلبات الورشة"
    : isInspector
      ? "مهام الفحص"
      : isCustomer
        ? "طلب فحص جديد"
        : "طلبات الفحص";
  const heroDescription = isWorkshopOp
    ? "تابع طلبات ورشتك من الإسناد حتى الاعتماد."
    : isInspector
      ? "الطلبات المُسندة إليك — ميداني أو في الورشة."
      : "أنشئ طلباً جديداً أو تابع المسار من القائمة أدناه.";
  const HeroIcon = isCustomer ? Car : isInspector ? ClipboardList : Wrench;

  return (
    <div className="space-y-5 md:space-y-6" dir="rtl">
      <PersonaPageHero
        variant={heroVariant}
        eyebrow="مسار الفحص الفني"
        title={heroTitle}
        description={scopedNote ? `${heroDescription} ${scopedNote}` : heroDescription}
        icon={HeroIcon}
        stats={[
          { label: "نشطة", value: String(stats.active) },
          { label: "قيد التنفيذ", value: String(stats.inProgress) },
          { label: "بانتظار المراجعة", value: String(stats.pendingReview) },
          { label: "معتمدة", value: String(stats.approved) },
        ]}
      />

      {!hideNewRequestForm ? (
        <SectionCard>
          <NewInspectionRequestForm
            defaultDasmUserId={presetDasmUserId}
            defaultDasmCarId={presetDasmCarId}
            defaultVehicleLabel={presetVehicleLabel}
            defaultTitle={presetTitle}
            platformPricing={platformPricing}
            workshops={createFormWorkshops}
          />
        </SectionCard>
      ) : null}

      <Suspense
        fallback={
          <div
            className="h-14 animate-pulse rounded-xl bg-gray-100/80"
            aria-hidden
          />
        }
      >
        <RequestListFilters
          workshopOptions={scope.workshopOptions}
          lockedWorkshopId={scope.lockedWorkshopId}
          lockedWorkshopName={scope.lockedWorkshopName}
          showWorkshopFilter={scope.showWorkshopFilter}
          showServiceModeFilter={scope.showServiceModeFilter}
          resultCount={list.length}
        />
      </Suspense>

      <SectionCard>
        {list.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات"
            description="جرّب تغيير فلتر الحالة أو نوع الخدمة، أو أنشئ طلباً لبدء المسار: إسناد ← فحص ← تقرير ← اعتماد أو رفض."
          />
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                showServiceMode
                workshopName={
                  scope.showWorkshopFilter && r.workshopId
                    ? workshopNameById.get(r.workshopId)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* W-007 — DASM Ads inline slot (booking surface) */}
      <AdSlot slotKey="inspection.booking.inline" />
    </div>
  );
}
