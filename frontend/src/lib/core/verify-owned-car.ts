const CORE_API_URL =
  process.env.DASM_CORE_API_URL ||
  process.env.DASM_API_URL ||
  "https://api.dasm.com.sa";

export type OwnedCarResult =
  | { ok: true; carId: number; vehicleLabel: string }
  | { ok: false; status: number; message: string };

/** Verifies ownership through Core's authenticated owner-only car endpoint. */
export async function verifyOwnedCar(
  carId: number,
  platformToken: string,
  fetcher: typeof fetch = fetch
): Promise<OwnedCarResult> {
  if (!Number.isInteger(carId) || carId <= 0) {
    return { ok: false, status: 422, message: "معرّف المركبة غير صالح." };
  }
  if (!platformToken.trim()) {
    return { ok: false, status: 401, message: "جلسة داسم مطلوبة." };
  }

  try {
    const response = await fetcher(`${CORE_API_URL}/api/cars/${carId}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${platformToken.trim()}`,
      },
      cache: "no-store",
    });
    if (!response.ok) {
      if (response.status !== 401 && response.status !== 403 && response.status !== 404) {
        return {
          ok: false,
          status: 503,
          message: "تعذّر الاتصال بمنصة داسم للتحقق من المركبة.",
        };
      }

      return {
        ok: false,
        status: response.status === 401 ? 401 : 403,
        message: "المركبة غير موجودة ضمن مركبات هذا المستخدم.",
      };
    }

    const body = (await response.json().catch(() => null)) as
      | {
          data?: {
            car?: {
              id?: unknown;
              make?: unknown;
              model?: unknown;
              year?: unknown;
            };
          };
        }
      | null;
    const row = body?.data?.car;
    const returnedId = Number(row?.id);
    if (!Number.isInteger(returnedId) || returnedId !== carId) {
      return { ok: false, status: 502, message: "تعذّر التحقق من بيانات المركبة." };
    }

    const label = [row?.make, row?.model, row?.year]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(" ");

    return {
      ok: true,
      carId,
      vehicleLabel: label || `مركبة #${carId}`,
    };
  } catch {
    return { ok: false, status: 503, message: "تعذّر الاتصال بمنصة داسم للتحقق من المركبة." };
  }
}
