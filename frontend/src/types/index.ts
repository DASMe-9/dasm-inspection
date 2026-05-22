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
  | "dispatched"
  | "on_site"
  | "in_progress"
  | "pending_review"
  | "approved"
  | "rejected"
  | "cancelled";

export type ReportItemStatus = "pass" | "warn" | "fail" | "na";

/** يطابق Postgres enum inspection_service_mode */
export type InspectionServiceMode = "workshop" | "field";

/** يطابق Postgres enum inspection_fee_payment_status */
export type InspectionFeePaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "waived";

export type InspectionWorkshopApplicationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

export interface WorkshopServicePricing {
  workshopSar: number | null;
  fieldSar: number | null;
  currency: string;
}

export type WorkshopReviewModerationStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface InspectionNotification {
  id: string;
  dasmUserId: string;
  workshopId?: string;
  kind: string;
  title: string;
  body?: string;
  readAt?: string;
  createdAt: string;
}

export interface WorkshopReview {
  id: string;
  workshopId: string;
  dasmUserId: string;
  inspectionRequestId: string;
  rating: number;
  comment?: string;
  status: WorkshopReviewModerationStatus;
  rejectionReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  createdAt: string;
}

export interface Workshop {
  id: string;
  /** مسار عام: /workshops/[slug] */
  slug: string;
  name: string;
  city: string;
  phone?: string;
  email?: string;
  isVerified: boolean;
  dasm_partner_ref?: string;
  /** أسعار فعّالة (تخصيص الورشة مع fallback للمنصّة) */
  pricing?: WorkshopServicePricing;
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
  serviceMode: InspectionServiceMode;
  fieldServiceAddress?: string;
  quotedFeeSar?: number | null;
  /** عرض إصلاح اختياري — منفصل عن رسوم خدمة الفحص */
  repairQuoteSar?: number | null;
  repairQuoteNotes?: string;
  repairQuoteOfferedAt?: string;
  inspectionFeePaymentStatus?: InspectionFeePaymentStatus;
  inspectionFeePaymentRef?: string;
  inspectionFeePaidAt?: string;
  dispatchedAt?: string;
  onSiteAt?: string;
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
