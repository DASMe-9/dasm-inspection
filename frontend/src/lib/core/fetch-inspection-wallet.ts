import "server-only";

import { inspectionOpsLog } from "@/lib/inspection-ops-log";

const CORE_API_URL =
  process.env.DASM_CORE_API_URL ||
  process.env.DASM_API_URL ||
  "https://api.dasm.com.sa";

export interface InspectionWalletBalance {
  balanceSar: number;
  currency: string;
}

export interface InspectionLedgerSummary {
  entryCount: number;
  totalAmountSar: number;
  inspectionRevenueSar: number;
  byEntryType: Record<string, number>;
}

function internalHeaders(token: string): HeadersInit {
  return {
    Accept: "application/json",
    "X-DASM-Internal-Token": token,
  };
}

async function callInternal<T>(path: string): Promise<T | null> {
  const token = process.env.DASM_INSPECTION_INTERNAL_PULL_TOKEN?.trim();
  if (!token) {
    inspectionOpsLog("warn", "wallet_fetch_skipped", {
      path,
      reason: "missing_DASM_INSPECTION_INTERNAL_PULL_TOKEN",
    });
    return null;
  }
  try {
    const res = await fetch(`${CORE_API_URL}/api/internal/dasm-inspection${path}`, {
      headers: internalHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) {
      inspectionOpsLog("warn", "wallet_fetch_failed", {
        path,
        status: res.status,
      });
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    inspectionOpsLog("error", "wallet_fetch_error", {
      path,
      message: e instanceof Error ? e.message : "unknown",
    });
    return null;
  }
}

/** رصيد محفظة الفحص للمستخدم (ريال) عبر جسر Core الداخلي. */
export async function getInspectionWalletBalance(
  dasmUserId: string
): Promise<InspectionWalletBalance | null> {
  const uid = dasmUserId.trim();
  if (!/^\d+$/.test(uid)) return null;
  const body = await callInternal<{
    data?: { balance_sar?: number; currency?: string };
  }>(`/wallet/balance?user_id=${uid}`);
  if (!body?.data) return null;
  return {
    balanceSar: Number(body.data.balance_sar ?? 0),
    currency: body.data.currency ?? "SAR",
  };
}

/** ملخّص ليدجر الفحص للمستخدم (إيرادات/حركات) عبر جسر Core الداخلي. */
export async function getInspectionLedgerSummary(
  dasmUserId: string
): Promise<InspectionLedgerSummary | null> {
  const uid = dasmUserId.trim();
  if (!/^\d+$/.test(uid)) return null;
  const body = await callInternal<{
    data?: {
      summary?: {
        entry_count?: number;
        total_amount_sar?: number;
        inspection_revenue_sar?: number;
        by_entry_type?: Record<string, number>;
      };
    };
  }>(`/ledger/summary?user_id=${uid}`);
  const s = body?.data?.summary;
  if (!s) return null;
  return {
    entryCount: Number(s.entry_count ?? 0),
    totalAmountSar: Number(s.total_amount_sar ?? 0),
    inspectionRevenueSar: Number(s.inspection_revenue_sar ?? 0),
    byEntryType: s.by_entry_type ?? {},
  };
}
