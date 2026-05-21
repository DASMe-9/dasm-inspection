import { inspectionOpsLog } from "@/lib/inspection-ops-log";

const CORE_API_URL =
  process.env.DASM_CORE_API_URL ||
  process.env.DASM_API_URL ||
  "https://api.dasm.com.sa";

/**
 * ينشئ أو يعيد مسودة سيارة على Core عند غياب dasm_car_id (idempotent per request).
 */
export async function ensureDasmCarOnCore(input: {
  userId: number;
  vehicleLabel: string;
  inspectionRequestId: string;
  title?: string | null;
}): Promise<number | null> {
  const token = process.env.DASM_INSPECTION_INTERNAL_PULL_TOKEN?.trim();
  if (!token) {
    inspectionOpsLog("warn", "core_minimal_car_skipped", {
      reason: "missing_token",
      inspection_request_id: input.inspectionRequestId,
    });
    return null;
  }

  try {
    const res = await fetch(`${CORE_API_URL}/api/internal/dasm-inspection/cars/minimal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-DASM-Internal-Token": token,
      },
      body: JSON.stringify({
        user_id: input.userId,
        vehicle_label: input.vehicleLabel,
        inspection_request_id: input.inspectionRequestId,
        title: input.title ?? undefined,
      }),
      cache: "no-store",
    });

    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      data?: { car_id?: number };
      message?: string;
    };

    if (!res.ok || !body.ok || !body.data?.car_id) {
      inspectionOpsLog("warn", "core_minimal_car_failed", {
        status: res.status,
        inspection_request_id: input.inspectionRequestId,
        message: body.message,
      });
      return null;
    }

    inspectionOpsLog("warn", "core_minimal_car_ok", {
      inspection_request_id: input.inspectionRequestId,
      car_id: body.data.car_id,
    });

    return body.data.car_id;
  } catch (e) {
    inspectionOpsLog("error", "core_minimal_car_error", {
      inspection_request_id: input.inspectionRequestId,
      message: e instanceof Error ? e.message : "unknown",
    });
    return null;
  }
}
