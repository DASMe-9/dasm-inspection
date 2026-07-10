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

export interface WorkshopEducationalVideo {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  sortOrder?: number;
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
  /** DASM Platform users.id لمالك الورشة. */
  ownerUserId?: string;
  /** مسار عام: /workshops/[slug] */
  slug: string;
  name: string;
  city: string;
  phone?: string;
  email?: string;
  isVerified: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  dasm_partner_ref?: string;
  /** أسعار فعّالة (تخصيص الورشة مع fallback للمنصّة) */
  pricing?: WorkshopServicePricing;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  whatsapp?: string;
  instagram?: string;
  mapLink?: string;
  workingHours?: string;
  commercialRegistration?: string;
  bankIban?: string;
  bankBeneficiaryName?: string;
  viewsCount?: number;
  isFeatured?: boolean;
  featuredProgramLabel?: string;
  galleryUrls?: string[];
  repairShowcaseUrls?: string[];
  educationalVideos?: WorkshopEducationalVideo[];
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
  fieldScheduledAt?: string;
  fieldServiceLat?: number | null;
  fieldServiceLng?: number | null;
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
  /** تفضيل العميل عند الإنشاء — ليس إسناداً نهائياً */
  preferredWorkshopId?: string;
  /** موعد مفضّل عند الإنشاء — قد يُنسخ إلى field_scheduled_at عند الإسناد الميداني */
  preferredSlotAt?: string;
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
  /** Persisted on approve (weighted model). Null for drafts / pre-approve. */
  finalScore?: number | null;
  letterGrade?: string | null;
  harajTrack?: string | null;
  sectionGrades?: Record<string, number | null> | null;
  /** Unguessable public share token — only meaningful after approve. */
  publicToken?: string | null;
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

export type ExternalReportOcrStatus =
  | "pending"
  | "processing"
  | "processed"
  | "failed";

export interface ExternalVehicleReport {
  id: string;
  dasmUserId: string;
  dasmCarId?: string;
  vehicleLabel?: string;
  reportSource?: string;
  reportDate?: string;
  fileName: string;
  mimeType: string;
  ocrStatus: ExternalReportOcrStatus;
  extractedSummary: Record<string, unknown>;
  maintenanceReminders: unknown[];
  createdAt: string;
  updatedAt: string;
}

export type VehicleMaintenanceServiceType =
  | "oil_change"
  | "oil_filter"
  | "air_filter"
  | "cabin_filter"
  | "fuel_filter"
  | "tires"
  | "brakes"
  | "battery"
  | "coolant"
  | "transmission"
  | "obd_scan"
  | "periodic_inspection"
  | "other";

export type VehicleMaintenanceRecordSource =
  | "user_entry"
  | "external_report"
  | "workshop_entry"
  | "core_import";

export interface VehicleMaintenanceRecord {
  id: string;
  dasmUserId: string;
  dasmCarId?: string;
  vehicleLabel?: string;
  serviceType: VehicleMaintenanceServiceType;
  serviceDate: string;
  odometerKm?: number;
  nextDueDate?: string;
  nextDueOdometerKm?: number;
  providerName?: string;
  notes?: string;
  source: VehicleMaintenanceRecordSource;
  createdAt: string;
  updatedAt: string;
}

export type VehicleObdScanSeverity =
  | "clear"
  | "info"
  | "warning"
  | "critical"
  | "unknown";

export type VehicleObdScanSource =
  | "user_entry"
  | "mobile_reader"
  | "workshop_entry"
  | "external_report";

export interface VehicleObdScan {
  id: string;
  dasmUserId: string;
  dasmCarId?: string;
  vehicleLabel?: string;
  scanDate: string;
  odometerKm?: number;
  readerName?: string;
  protocol?: string;
  vin?: string;
  dtcCodes: string[];
  readinessMonitors: Record<string, unknown>;
  liveData: Record<string, unknown>;
  batteryVoltage?: number;
  summary?: string;
  severity: VehicleObdScanSeverity;
  source: VehicleObdScanSource;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionStatusHistory {
  id: string;
  requestId: string;
  status: InspectionRequestStatus;
  note?: string;
  actorRole: AppRole;
  createdAt: string;
}
