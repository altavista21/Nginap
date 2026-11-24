# Nginap

Hotel Reservation & Management System for Java Hotel.

## Product decisions
- Single hotel, planned capacity 101–200 rooms.
- Room categories: Standard, Superior, Deluxe, Suite.
- Guest website supports online booking; staff can create walk-in reservations.
- Instant confirmation only after inventory allocation is safely persisted.
- Payment is collected at the hotel and recorded by staff.
- Cancellation requests require admin approval.
- Check-in and check-out: 12:00 WIB.
- Operational workbook is stored on the hotel's Windows computer.

## Architecture
- apps/web: Next.js guest-facing web application.
- apps/local-server: Node.js service that owns the private Excel workbook.
- docs: product, architecture, and delivery documentation.

The browser must never read or write the workbook directly. Do not expose the local service port to the public internet.

## Run locally
Requires Node.js 20.11+ and npm 10+.

1. Copy .env.example to .env.
2. Run npm install.
3. Run npm run dev.
4. Web: http://localhost:3000. Local health: http://localhost:4100/health.

The local service initializes NGINAP_DATABASE.xlsx in its configured data directory.

## Current status
Phase 0 foundation only. Guest booking, staff authentication, inventory workflows, payments, cancellation approval, public relay, and production connectivity are not implemented. Do not treat this as production-ready.

See docs/PRD.md, docs/ARCHITECTURE.md, and docs/IMPLEMENTATION_PLAN.md.
