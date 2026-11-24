# Implementation Plan

Delivery is incremental. A phase is not complete merely because files exist; its acceptance tests must pass.

| Phase | Scope | Exit criteria |
|---|---|---|
| 0 | Project foundation, app shells, local workbook initialization, documentation | Install, typecheck, build, health check, workbook creation verified |
| 1 | Excel data engine and recovery journal | Schema validation, serialized writes, backup/restore and failure tests |
| 2 | Authentication and RBAC | Staff login, secure sessions, role matrix and rate limiting |
| 3 | Hotel inventory | Room types, physical rooms, pricing, housekeeping |
| 4 | Reservation engine | Availability, instant booking, idempotency, concurrency protection |
| 5 | Operations | Walk-in, check-in/out, payment ledger, cancellation approval |
| 6 | Guest website | Search, room details, booking, lookup and cancellation request |
| 7 | Reports and audit | Reconciled reports, exports, audit review |
| 8 | Deployment and QA | Secure relay, Windows service setup, backup restore drill, end-to-end and load tests |

## Phase 0 implementation status

- [x] Repository initialized on main.
- [x] Monorepo structure added.
- [x] Next.js guest-facing shell added.
- [x] Local Node.js service shell added.
- [x] Excel workbook schema and initialization added.
- [x] Health endpoint added.
- [x] Product and architecture documentation added.
- [ ] Dependencies installed and typecheck/build executed in a clean environment.
- [ ] Windows 10 runtime smoke test.

## Guardrails

- Do not add invented room inventory or prices.
- Do not expose the local Excel service to the public internet.
- Do not claim booking is operational until the concurrency, persistence, and recovery acceptance tests pass.
- Do not add payment gateway or OTA scope without product approval.
