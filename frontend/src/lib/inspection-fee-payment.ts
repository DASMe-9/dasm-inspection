"use client";

const API_BASE = (
  process.env.NEXT_PUBLIC_DASM_CORE_URL || "https://api.dasm.com.sa"
)
  .trim()
  .replace(/\/$/, "");

export type InspectionFeePaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "waived";

export interface InspectionFeeCheckoutResult {
  client_secret: string | null;
  public_key: string;
  payment_ref: string;
  amount_sar: number;
}

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("inspection_token") ??
        localStorage.getItem("dasm_token") ??
        localStorage.getItem("dasm_access_token")
      : null;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function isInspectionFeePayEnabled(): boolean {
  return process.env.NEXT_PUBLIC_INSPECTION_FEE_PAYMOB_ENABLED !== "false";
}

export function canPayInspectionFee(
  quotedFeeSar: number | null | undefined,
  status: InspectionFeePaymentStatus | undefined
): boolean {
  if (!isInspectionFeePayEnabled()) return false;
  if (status === "paid" || status === "waived") return false;
  const fee = quotedFeeSar != null ? Number(quotedFeeSar) : NaN;
  return Number.isFinite(fee) && fee > 0;
}

export async function createInspectionFeeCheckout(
  inspectionRequestId: string,
  amountSar: number
): Promise<InspectionFeeCheckoutResult> {
  const res = await fetch(`${API_BASE}/api/inspection/fee/checkout`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      inspection_request_id: inspectionRequestId,
      amount_sar: amountSar,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error") {
    throw new Error(data.message || "تعذّر إنشاء جلسة الدفع.");
  }
  return {
    client_secret: data.client_secret ?? null,
    public_key: data.public_key,
    payment_ref: data.payment_ref,
    amount_sar: Number(data.amount_sar),
  };
}

declare global {
  interface Window {
    Paymob?: (
      publicKey: string,
      options: {
        clientSecret: string;
        onSuccess: (data: unknown) => void;
        onError: (err: unknown) => void;
        onPending: (data: unknown) => void;
      }
    ) => void;
  }
}

export function openPaymobCheckout(
  result: InspectionFeeCheckoutResult,
  callbacks: {
    onSuccess?: () => void;
    onError?: () => void;
    onPending?: () => void;
  }
): void {
  if (!result.client_secret) {
    callbacks.onSuccess?.();
    return;
  }

  const script = document.createElement("script");
  script.src = "https://ksa.paymob.com/unifiedcheckout/static/js/main.js";
  script.onload = () => {
    window.Paymob?.(result.public_key, {
      clientSecret: result.client_secret!,
      onSuccess: () => callbacks.onSuccess?.(),
      onError: () => callbacks.onError?.(),
      onPending: () => callbacks.onPending?.(),
    });
  };
  document.head.appendChild(script);
}
