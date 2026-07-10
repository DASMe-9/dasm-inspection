import type {
  InspectionAttachment,
  InspectionReport,
  InspectionReportItem,
  InspectionRequest,
  InspectionRequestStatus,
  InspectionServiceMode,
  InspectionStatusHistory,
  Inspector,
  ReportItemStatus,
  AppRole,
  Workshop,
} from "@/types";

type DbWorkshop = {
  id: string;
  owner_user_id: string | null;
  slug: string;
  name: string;
  city: string;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  is_suspended?: boolean | null;
  suspended_at?: string | null;
  suspended_by?: string | null;
  suspension_reason?: string | null;
  dasm_partner_ref: string | null;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  map_link?: string | null;
  working_hours?: string | null;
  commercial_registration?: string | null;
  bank_iban?: string | null;
  bank_beneficiary_name?: string | null;
  views_count?: number | null;
  is_featured?: boolean | null;
  featured_program_label?: string | null;
};

type DbInspector = {
  id: string;
  workshop_id: string | null;
  full_name: string;
  dasm_user_id: string | null;
  active: boolean;
};

type DbRequest = {
  id: string;
  title: string;
  dasm_car_id: string;
  vehicle_label: string;
  dasm_user_id: string | null;
  auction_reference: string | null;
  status: InspectionRequestStatus;
  service_mode: InspectionServiceMode | null;
  field_service_address: string | null;
  field_scheduled_at: string | null;
  field_service_lat: number | string | null;
  field_service_lng: number | string | null;
  quoted_fee_sar: number | string | null;
  repair_quote_sar: number | string | null;
  repair_quote_notes: string | null;
  repair_quote_offered_at: string | null;
  inspection_fee_payment_status: string | null;
  inspection_fee_payment_ref: string | null;
  inspection_fee_paid_at: string | null;
  dispatched_at: string | null;
  on_site_at: string | null;
  workshop_id: string | null;
  inspector_id: string | null;
  preferred_workshop_id: string | null;
  preferred_slot_at: string | null;
  report_id: string | null;
  created_at: string;
  updated_at: string;
};

type DbReport = {
  id: string;
  request_id: string;
  workshop_id: string;
  inspector_id: string;
  overall_summary: string;
  submitted_at: string;
  approved_at: string | null;
  approved_by_role: AppRole | null;
  rejection_reason: string | null;
  final_score?: number | string | null;
  letter_grade?: string | null;
  haraj_track?: string | null;
  section_grades?: Record<string, number | null> | null;
  public_token?: string | null;
};

type DbReportItem = {
  id: string;
  report_id: string;
  section: string;
  label: string;
  status: ReportItemStatus;
  notes: string | null;
  sort_order: number;
};

type DbAttachment = {
  id: string;
  request_id: string;
  report_id: string | null;
  file_name: string;
  mime_type: string;
  storage_path: string | null;
  uploaded_at: string;
};

type DbHistory = {
  id: string;
  request_id: string;
  status: InspectionRequestStatus;
  note: string | null;
  actor_role: AppRole;
  created_at: string;
};

function parseCoord(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapWorkshop(row: DbWorkshop): Workshop {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? undefined,
    slug: row.slug,
    name: row.name,
    city: row.city,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    isVerified: row.is_verified,
    isSuspended: row.is_suspended ?? false,
    suspendedAt: row.suspended_at ?? undefined,
    suspendedBy: row.suspended_by ?? undefined,
    suspensionReason: row.suspension_reason ?? undefined,
    dasm_partner_ref: row.dasm_partner_ref ?? undefined,
    description: row.description ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    instagram: row.instagram ?? undefined,
    mapLink: row.map_link ?? undefined,
    workingHours: row.working_hours ?? undefined,
    commercialRegistration: row.commercial_registration ?? undefined,
    bankIban: row.bank_iban ?? undefined,
    bankBeneficiaryName: row.bank_beneficiary_name ?? undefined,
    viewsCount: row.views_count ?? undefined,
    isFeatured: row.is_featured ?? undefined,
    featuredProgramLabel: row.featured_program_label ?? undefined,
  };
}

export function mapInspector(row: DbInspector): Inspector {
  return {
    id: row.id,
    fullName: row.full_name,
    workshopId: row.workshop_id ?? undefined,
    dasm_user_id: row.dasm_user_id ?? undefined,
    active: row.active,
  };
}

export function mapRequest(row: DbRequest): InspectionRequest {
  const quoted =
    row.quoted_fee_sar != null ? Number(row.quoted_fee_sar) : null;
  const repair =
    row.repair_quote_sar != null ? Number(row.repair_quote_sar) : null;
  return {
    id: row.id,
    title: row.title,
    dasm_car_id: row.dasm_car_id,
    vehicleLabel: row.vehicle_label,
    dasm_user_id: row.dasm_user_id ?? undefined,
    auction_reference: row.auction_reference ?? undefined,
    status: row.status,
    serviceMode: row.service_mode === "field" ? "field" : "workshop",
    fieldServiceAddress: row.field_service_address?.trim() || undefined,
    fieldScheduledAt: row.field_scheduled_at ?? undefined,
    fieldServiceLat: parseCoord(row.field_service_lat),
    fieldServiceLng: parseCoord(row.field_service_lng),
    quotedFeeSar: Number.isFinite(quoted) ? quoted : null,
    repairQuoteSar: Number.isFinite(repair) ? repair : null,
    repairQuoteNotes: row.repair_quote_notes?.trim() || undefined,
    repairQuoteOfferedAt: row.repair_quote_offered_at ?? undefined,
    inspectionFeePaymentStatus: (row.inspection_fee_payment_status ??
      "unpaid") as InspectionRequest["inspectionFeePaymentStatus"],
    inspectionFeePaymentRef: row.inspection_fee_payment_ref?.trim() || undefined,
    inspectionFeePaidAt: row.inspection_fee_paid_at ?? undefined,
    dispatchedAt: row.dispatched_at ?? undefined,
    onSiteAt: row.on_site_at ?? undefined,
    workshopId: row.workshop_id ?? undefined,
    inspectorId: row.inspector_id ?? undefined,
    preferredWorkshopId: row.preferred_workshop_id ?? undefined,
    preferredSlotAt: row.preferred_slot_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reportId: row.report_id ?? undefined,
  };
}

export function mapReportItem(row: DbReportItem): InspectionReportItem {
  return {
    id: row.id,
    section: row.section,
    label: row.label,
    status: row.status,
    notes: row.notes ?? undefined,
  };
}

export function mapReport(
  row: DbReport,
  items: InspectionReportItem[]
): InspectionReport {
  const score =
    row.final_score == null || row.final_score === ""
      ? null
      : Number(row.final_score);
  return {
    id: row.id,
    requestId: row.request_id,
    workshopId: row.workshop_id,
    inspectorId: row.inspector_id,
    overallSummary: row.overall_summary,
    items,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at ?? undefined,
    approvedByRole: row.approved_by_role ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    finalScore: Number.isFinite(score as number) ? (score as number) : null,
    letterGrade: row.letter_grade ?? null,
    harajTrack: row.haraj_track ?? null,
    sectionGrades: row.section_grades ?? null,
    publicToken: row.public_token ?? null,
  };
}

export function mapAttachment(row: DbAttachment): InspectionAttachment {
  return {
    id: row.id,
    requestId: row.request_id,
    reportId: row.report_id ?? undefined,
    fileName: row.file_name,
    mimeType: row.mime_type,
    urlPlaceholder: row.storage_path ?? "",
    uploadedAt: row.uploaded_at,
  };
}

export function mapHistory(row: DbHistory): InspectionStatusHistory {
  return {
    id: row.id,
    requestId: row.request_id,
    status: row.status,
    note: row.note ?? undefined,
    actorRole: row.actor_role,
    createdAt: row.created_at,
  };
}
