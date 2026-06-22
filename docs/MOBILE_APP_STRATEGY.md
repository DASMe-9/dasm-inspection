# DASM Inspection Mobile App Strategy

**Status:** implementation guide
**Scope:** web-first inspection platform with mobile shells for workshops and DASM users.

## Product Decision

DASM Inspection should not become separate products per device. The web app remains
the operational source of truth, while mobile apps use the same API, auth claims,
workflow states, checklist template, pricing, payments, notifications, and report
approval path.

There are two mobile experiences:

1. **Workshop app**
   - For workshop owners, managers, inspectors, and mechanics.
   - Supports team visibility, assigned jobs, field visits, GPS arrival, checklist
     execution, photo capture, report submission, and owner approval/rejection.
   - Uses the same `inspection_report_items` rows created from
     `frontend/src/lib/checklist/default-report-items.ts`.

2. **DASM user app**
   - For the vehicle owner or requester.
   - Supports creating an inspection request, choosing workshop or field service,
     selecting or confirming GPS location, seeing the field inspection fee, paying
     through Core payment flow, tracking technician movement/status, viewing the
     approved report, importing external inspection reports, tracking maintenance
     reminders, and seeing the report attached to the car permanently.

## Shared Contract

All web and mobile clients must use:

- DASM Platform identity as the source of users and roles.
- `inspection_role`, `workshop_id`, and `inspector_record_id` JWT claims for
  scoped access.
- `inspection_requests.service_mode = "field"` for outside-location service.
- `inspection_service_pricing.service_mode = "field"` for technician visit cost.
- Core payment checkout for inspection fee payment.
- `inspection_reports` and `inspection_report_items` for the report body.
- `inspection_external_vehicle_reports` for external workshop/provider reports
  uploaded by the DASM user while OCR is pending or in progress.
- `inspection_vehicle_maintenance_records` for user, workshop, imported, or
  OCR-derived periodic service records and due reminders.
- `inspection_vehicle_obd_scans` for OBD/computer diagnostics, whether manually
  entered, captured by a mobile reader, supplied by a workshop, or extracted from
  an external report.
- `POST /api/internal/dasm-inspection/reports/sync` to attach approved reports to
  Core cars.

## Permanent Vehicle Profile

The permanent vehicle identity belongs in DASM Core, not in the inspection
service. Inspection stores technical records against Core identifiers.

Core should own:

- canonical vehicle profile: make, model, year, trim, VIN/chassis, plate where
  allowed, color, odometer history, fuel/engine/transmission attributes, and
  media;
- current owner relation;
- ownership transfer history;
- privacy-preserving public ownership counters;
- links to DASM inspection reports, imported external reports, auctions, sale
  listings, and service records.

The user app should let a subscriber enter vehicle information once. The same
vehicle profile may be created by:

- the DASM user directly;
- a workshop owner/operator during intake;
- Core when an inspection request arrives without an existing `dasm_car_id`.

When a vehicle transfers to a new owner, Core must preserve the vehicle profile
and append an ownership transfer event. Public buyer-facing surfaces should show
privacy-safe history such as:

- number of previous DASM owners;
- transfer dates or month/year granularity when policy allows;
- inspection and service timeline;
- auction/listing history when public;
- never previous owner names, phone numbers, IDs, exact account references, or
  private contact details.

Inspection and mobile apps should only display the anonymized ownership history
provided by Core. They should not infer or expose previous owners from local
inspection request data.

## External Report Import And Maintenance

The DASM user app should include a technical-history vault and a periodic
maintenance log:

1. User uploads a PDF/image inspection report from another workshop or provider.
2. App stores the file under the user's inspection history and optional
   `dasm_car_id`.
3. OCR/reader pipeline extracts vehicle identifiers, inspection findings,
   mileage, date, maintenance recommendations, and due reminders.
4. Extracted reminders become user-visible service tasks such as oil change,
   filters, tires, brakes, coolant, transmission service, and next periodic
   maintenance.
5. Extracted facts should be marked as imported/unverified until a DASM workshop
   confirms them or a trusted provider integration supplies signed data.

The maintenance log must also support manual user entry before OCR exists:

- service type: oil, oil filter, air filter, cabin filter, fuel filter, tires,
  brakes, battery, coolant, transmission, OBD/computer scan, periodic inspection,
  or other;
- service date and odometer;
- next due date or next due odometer;
- provider/workshop name;
- notes;
- source: user entry, external report, workshop entry, or Core import.

## OBD Computer Diagnostics

Modern vehicles can expose diagnostic data through the dashboard OBD port. DASM
should treat this as a low-cost technical-history input, not as a replacement for
a certified workshop inspection.

Current web increment:

- user can enter a self-scan result manually if they own a reader;
- system stores VIN, reader/protocol, odometer, battery voltage, DTC codes,
  severity, and summary against the DASM user and optional Core car id;
- the scan also creates an `obd_scan` item in the maintenance timeline so the
  vehicle history remains readable in one place;
- source stays explicit so buyer-facing and workshop-facing surfaces can
  distinguish user-entered data from workshop-confirmed data.

Mobile increment:

- support Bluetooth/ELM327-style readers from the user app where platform support
  allows it;
- capture readiness monitors and live data into the existing JSON columns;
- keep raw self-scan data labeled as user/mobile-reader evidence until a DASM
  workshop validates or signs the result.

## Field Inspection Flow

1. User opens the DASM user app and chooses field inspection.
2. App captures current GPS and lets the user refine the address.
3. App shows the effective field service price:
   - workshop-specific price when selected,
   - otherwise platform default field price.
4. User pays through the Core inspection fee checkout.
5. Request becomes visible to the selected workshop/operator.
6. Workshop assigns inspector/mechanic.
7. Inspector app shows the assigned field job and navigates to the location.
8. Inspector confirms arrival with GPS.
9. Inspector completes checklist, photos, notes, measurements, and submits report.
10. Workshop owner/manager approves the report.
11. Inspection service syncs the approved summary and report URL to Core.
12. Core car details show the latest primary DASM inspection and preserve older
    approved reports as history.

## Workshop Team Permissions

Current implementation supports:

- workshop owner/manager dashboard,
- adding active inspectors with `dasm_user_id`,
- mobile matching of `dasm_user_id` to `inspection_inspectors`,
- inspector-only mutation for assigned in-progress checklist items.

Next required increment for fine-grained permissions:

- add team capability fields or a role column to `inspection_inspectors`, for
  example `team_role`, `can_read_requests`, `can_inspect`, `can_approve_reports`;
- expose those fields in `/workshop/team`;
- enforce them in mobile and web mutation guards;
- keep owner as implicit full-access manager.

Minimum launch rule:

- each approved workshop should have an owner plus at least one active team member,
  unless the owner is explicitly also registered as the active inspector/mechanic.

## Mobile Build Direction

Use the existing Flutter app as the shared mobile shell, with role-based entry:

- workshop/operator role opens workshop workspace;
- inspector/mechanic role opens assigned jobs and checklist execution;
- dasm_user role opens user requests, field booking, payment, and tracking.

If product/store separation is required later, publish two branded app entries
from the same codebase and API contract rather than forking business logic.
