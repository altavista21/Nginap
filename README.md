# Nginap

Sistem reservasi dan operasional untuk Java Hotel, Jakarta Selatan.

## Repository structure
- `apps/web`: Next.js guest site, booking form, reservation lookup and staff dashboard.
- `apps/local-server`: Node.js API and Excel workbook owner.
- `docs/PRD.md`: approved product scope.
- `docs/ARCHITECTURE.md`: architecture and security boundaries.
- `docs/SETUP_WINDOWS.md`: local installation guide.
- `docs/SECURE_RELAY.md`: secure Localtonet outbound relay guide.
- `docs/IMPLEMENTATION_PLAN.md`: implemented scope and release blockers.

## Confirmed hotel configuration
- Single property: Java Hotel.
- Planned capacity: 101–200 rooms. Real room inventory is entered by hotel staff.
- Categories: Standard, Superior, Deluxe, Suite.
- Check-in/check-out: 12:00 WIB.
- Cancellation: admin approval required.
- Payments are recorded at the hotel; no payment gateway in v1.
- Primary data store: `NGINAP_DATABASE.xlsx` on the hotel computer.

## Run locally
Requires Node.js 22 LTS and npm 10+.
1. Copy `.env.example` to `.env`.
2. Set unique `NGINAP_SESSION_SECRET` (32+ chars) and `NGINAP_BOOTSTRAP_KEY` (24+ chars).
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`, booking at `/booking`, lookup at `/booking/lookup`, staff at `/staff`.

See [Windows setup](docs/SETUP_WINDOWS.md).

## Implemented in main
- Excel workbook initialization and schema checks.
- Serialized workbook transactions and pre-write backup.
- Staff bootstrap, scrypt password hashing, signed HttpOnly sessions and role-protected endpoints.
- Room inventory and category-rate management.
- Availability by physical room and overlapping dates.
- Guest reservation, idempotency key, lookup and cancellation request.
- Admin cancellation decision, check-in/out, payment ledger, housekeeping and reports.
- Excel export.
- Guest booking and lookup pages; staff dashboard.
- Automated domain test and CI workflow definitions.

## Release status
The main branch contains a CI-verified local pilot foundation, not a production-ready public reservation service. GitHub Actions test, typecheck, and build passed for the merged changes. Windows runtime and end-to-end acceptance tests are still outstanding. A secure outbound Localtonet HTTP relay and same-origin Next.js API proxy are implemented in this branch. They still require provider account setup, secret configuration, Vercel environment variables, and end-to-end runtime verification before public booking is enabled. Do not expose port 4100 to the public internet.

Real room numbers, category counts, rates, taxes, capacity and hotel policy details must be supplied by Java Hotel. Do not accept real guest bookings until release blockers in `docs/IMPLEMENTATION_PLAN.md` have passed.
