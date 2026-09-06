import type { AppRole, InspectionServiceMode } from "@/types";

type CreateRequestContext = {
  userId: string;
  inspectionRole: string | null;
} | null;

export type CreateRequestIdentity = {
  dasmUserId: string | null;
  actorRole: AppRole;
  requiresOperationalAuthorization: boolean;
};

/**
 * Binds customer-created requests to the verified identity injected by
 * middleware. A hidden/form field is never trusted for a DASM customer.
 */
export function resolveCreateRequestIdentity(input: {
  jwtEnforced: boolean;
  context: CreateRequestContext;
  requestedDasmUserId: string;
}): CreateRequestIdentity {
  const requestedDasmUserId = input.requestedDasmUserId.trim() || null;

  if (!input.jwtEnforced) {
    return {
      dasmUserId: requestedDasmUserId,
      actorRole: "inspection_admin",
      requiresOperationalAuthorization: true,
    };
  }

  if (input.context?.inspectionRole === "dasm_user") {
    return {
      dasmUserId: input.context.userId.trim(),
      actorRole: "dasm_user",
      requiresOperationalAuthorization: false,
    };
  }

  return {
    dasmUserId: requestedDasmUserId,
    actorRole: "inspection_admin",
    requiresOperationalAuthorization: true,
  };
}

export type NormalizedCreateRequestInput = {
  title: string;
  vehicleLabel: string;
  serviceMode: InspectionServiceMode;
  fieldServiceAddress: string | null;
  preferredSlotAt: string | null;
};

export type NormalizeCreateRequestResult =
  | { ok: true; value: NormalizedCreateRequestInput }
  | { ok: false; message: string };

export function normalizeCreateRequestInput(input: {
  title: string;
  vehicleLabel: string;
  preferredServiceMode: string;
  fieldServiceAddress: string;
  preferredSlotAt: string;
}): NormalizeCreateRequestResult {
  const vehicleLabel = input.vehicleLabel.trim();
  if (!vehicleLabel) {
    return { ok: false, message: "وصف المركبة مطلوب." };
  }

  const title = input.title.trim() || `طلب فحص — ${vehicleLabel}`;
  const serviceMode: InspectionServiceMode =
    input.preferredServiceMode.trim() === "field" ? "field" : "workshop";
  const fieldServiceAddress = input.fieldServiceAddress.trim() || null;

  if (serviceMode === "field" && !fieldServiceAddress) {
    return {
      ok: false,
      message: "أدخل عنوان الفحص الميداني حتى تتمكن الورشة من خدمتك.",
    };
  }

  let preferredSlotAt: string | null = null;
  const preferredSlotRaw = input.preferredSlotAt.trim();
  if (preferredSlotRaw) {
    const parsed = new Date(preferredSlotRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, message: "موعد التفضيل غير صالح." };
    }
    preferredSlotAt = parsed.toISOString();
  }

  return {
    ok: true,
    value: {
      title,
      vehicleLabel,
      serviceMode,
      fieldServiceAddress: serviceMode === "field" ? fieldServiceAddress : null,
      preferredSlotAt,
    },
  };
}
