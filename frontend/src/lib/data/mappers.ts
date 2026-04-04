import type {
  InspectionAttachment,
  InspectionReport,
  InspectionReportItem,
  InspectionRequest,
  InspectionRequestStatus,
  InspectionStatusHistory,
  Inspector,
  ReportItemStatus,
  AppRole,
  Workshop,
} from "@/types";

type DbWorkshop = {
  id: string;
  name: string;
  city: string;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  dasm_partner_ref: string | null;
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
  workshop_id: string | null;
  inspector_id: string | null;
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

export function mapWorkshop(row: DbWorkshop): Workshop {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    isVerified: row.is_verified,
    dasm_partner_ref: row.dasm_partner_ref ?? undefined,
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
  return {
    id: row.id,
    title: row.title,
    dasm_car_id: row.dasm_car_id,
    vehicleLabel: row.vehicle_label,
    dasm_user_id: row.dasm_user_id ?? undefined,
    auction_reference: row.auction_reference ?? undefined,
    status: row.status,
    workshopId: row.workshop_id ?? undefined,
    inspectorId: row.inspector_id ?? undefined,
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
