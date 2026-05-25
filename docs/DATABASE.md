# داسم فحص — Database Architecture

> **Rule**: All inspection operational data lives in **Services DB** (Supabase).
> This is the **only** database for inspection data. No inspection tables in Core DB.

## Database

| Property | Value |
|----------|-------|
| Supabase Project | `bmfqfmsxtotdksvcqfrh` (DASM-services) |
| Backend Connection | `pgsql_services` (in DASM-Platform Laravel) |
| Primary Key Type | UUID (all tables) |

## Backend (DASM-Platform)

All inspection API endpoints are in `DASM-Platform/backend`:
- Models: `app/Models/CarInspectionReport.php`, `app/Models/CarReportImage.php`
- Both use `HasUuids` trait + `$connection = 'pgsql_services'`

## Tables (Services DB)

| Table | Purpose |
|-------|---------|
| `car_inspection_reports` | Completed reports (grade, notes) |
| `car_report_images` | Photos attached to reports |
| `marketplace_inspection_requests` | Booking requests |

## What stays in Core DB

- **Cars** — `car_inspection_reports.car_id` references Core `cars.id`
- **Users** — inspector/requester references Core `users.id`
- **Service subscriptions** — `service_subscriptions` + `platform_payments` (shared with shipping)
- **Financial ledger** — inspection fees via `FinancialLedgerService`
- **Auth** — `POST /api/login` on Core API

## Frontend (this repo)

- Calls backend at `NEXT_PUBLIC_API_URL` (default: `https://dasm-laravel.onrender.com`)
- Domain: `inspect.dasm.com.sa`
