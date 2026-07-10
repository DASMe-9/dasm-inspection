const SA_IBAN_RE = /^SA\d{22}$/i;

export function normalizeSaudiIban(raw: string): string | null {
  const v = raw.replace(/\s+/g, "").toUpperCase();
  if (!v) return null;
  return SA_IBAN_RE.test(v) ? v : null;
}

export type WorkshopKycStatus = {
  hasOwner: boolean;
  hasCommercialRegistration: boolean;
  hasIban: boolean;
  hasBeneficiary: boolean;
  complete: boolean;
  missing: string[];
};

export function evaluateWorkshopKyc(input: {
  ownerUserId?: string | null;
  commercialRegistration?: string | null;
  bankIban?: string | null;
  bankBeneficiaryName?: string | null;
}): WorkshopKycStatus {
  const missing: string[] = [];
  const hasOwner = Boolean(input.ownerUserId?.trim());
  const hasCommercialRegistration = Boolean(
    input.commercialRegistration?.trim()
  );
  const hasIban = Boolean(normalizeSaudiIban(input.bankIban ?? ""));
  const hasBeneficiary = Boolean(input.bankBeneficiaryName?.trim());

  if (!hasOwner) missing.push("ربط حساب المالك");
  if (!hasCommercialRegistration) missing.push("السجل التجاري");
  if (!hasIban) missing.push("رقم الآيبان");
  if (!hasBeneficiary) missing.push("اسم المستفيد البنكي");

  return {
    hasOwner,
    hasCommercialRegistration,
    hasIban,
    hasBeneficiary,
    complete:
      hasOwner && hasCommercialRegistration && hasIban && hasBeneficiary,
    missing,
  };
}
