/**
 * DASM Inspection — domain types (V1)
 * References to DASM core platform via dasm_* fields.
 */

/** يطابق قيم Postgres enum inspection_app_role (بما فيها القيم التاريخية والجديدة في Phase 2). */
export type AppRole =
  | "super_admin"
  | "inspection_admin"
  | "workshop_manager"
  | "workshop_owner"
  | "mechanic"
  | "inspector"
  | "viewer"
  | "dasm_user";

export type InspectionRequestStatus =
  | "draft"
  | "submitted"
  | "assigned"
  | "in_progress"
  | "pending_review"
  | "approved"
  | "rejected"
  | "cancelled";

export type ReportItemStatus = "pass" | "warn" | "fail" | "na";

export interface Workshop {
  id: string;
  name: string;
  city: string;
  phone?: string;
  email?: string;
  isVerified: boolean;
  dasm_partner_ref?: string;
}

export interface Inspector {
  id: string;
  fullName: string;
  workshopId?: string;
  dasm_user_id?: string;
  active: boolean;
}

export interface InspectionRequest {
  id: string;
  title: string;
  dasm_car_id: string;
  vehicleLabel: string;
  dasm_user_id?: string;
  auction_reference?: string;
  status: InspectionRequestStatus;
  workshopId?: string;
  inspectorId?: string;
  createdAt: string;
  updatedAt: string;
  reportId?: string;
}

export interface InspectionReportItem {
  id: string;
  section: string;
  label: string;
  status: ReportItemStatus;
  notes?: string;
}

export interface InspectionReport {
  id: string;
  requestId: string;
  workshopId: string;
  inspectorId: string;
  overallSummary: string;
  items: InspectionReportItem[];
  submittedAt: string;
  approvedAt?: string;
  approvedByRole?: AppRole;
  rejectionReason?: string;
}

export interface InspectionAttachment {
  id: string;
  requestId: string;
  reportId?: string;
  fileName: string;
  mimeType: string;
  urlPlaceholder: string;
  uploadedAt: string;
}

export interface InspectionStatusHistory {
  id: string;
  requestId: string;
  status: InspectionRequestStatus;
  note?: string;
  actorRole: AppRole;
  createdAt: string;
}
