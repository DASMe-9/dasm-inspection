"use client";

const API_BASE = (
  process.env.NEXT_PUBLIC_DASM_CORE_URL || "https://api.dasm.com.sa"
)
  .trim()
  .replace(/\/$/, "");

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("inspection_token") ??
        localStorage.getItem("dasm_token")
      : null;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ServiceSubscription {
  id: number;
  service: "shipping" | "inspection";
  status: "trial" | "active" | "past_due" | "cancelled" | "suspended";
  is_on_trial: boolean;
  trial_ends_at: string | null;
  trial_days_left: number;
  tier: number;
  fee_sar: number;
  discount_sar: number;
  effective_fee_sar: number;
  period_start: string | null;
  period_end: string | null;
  prev_month_income_sar: number;
  activated_at: string | null;
}

export interface SubPaymentRecord {
  id: number;
  platform: string;
  amount: string;
  status: string;
  payment_ref: string;
  paymob_payment_method: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CheckoutResult {
  client_secret: string | null;
  public_key: string;
  payment_ref: string;
  amount_sar: number;
}

export async function enrollSubscription(): Promise<ServiceSubscription> {
  const res = await fetch(`${API_BASE}/api/service-subscription/enroll`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ service: "inspection" }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.subscription as ServiceSubscription;
}

export async function fetchSubscriptionStatus(): Promise<ServiceSubscription | null> {
  const res = await fetch(
    `${API_BASE}/api/service-subscription/status?service=inspection`,
    { headers: authHeaders() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.subscription as ServiceSubscription) ?? null;
}

export async function createSubscriptionCheckout(): Promise<CheckoutResult> {
  const res = await fetch(`${API_BASE}/api/service-subscription/checkout`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ service: "inspection" }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as CheckoutResult;
}

export async function fetchSubscriptionHistory(): Promise<SubPaymentRecord[]> {
  const res = await fetch(
    `${API_BASE}/api/service-subscription/history?service=inspection`,
    { headers: authHeaders() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.payments as SubPaymentRecord[]) ?? [];
}
