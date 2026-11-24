# Implementation Status and Release Plan

**Current baseline:** Nginap v1 foundation merged to `main`  
**Hotel:** Java Hotel, Jakarta Selatan  
**Operating mode:** Local hotel computer pilot. Not yet approved for public production.

## Implemented

| Area | Current implementation | Remaining caveat |
|---|---|---|
| Excel data | Workbook initialization and schema validation; serialized read/write queue; temporary-file write and atomic replacement; backup before each transaction | Restore procedure and Windows file-lock/disk-full recovery drills are not verified |
| Authentication | Bootstrap superadmin; scrypt password hashing; signed HttpOnly session; role checks; login rate limits | Must configure unique secrets and keep service private to hotel network |
| Roles | Superadmin, admin, receptionist; superadmin can create admin/receptionist accounts from dashboard | No password reset, account disable, or session revocation UI |
| Room inventory | Add/list physical rooms; configure Standard, Superior, Deluxe, Suite rates; room statuses and housekeeping controls | Real room list, category allocation, capacity, and rates must come from Java Hotel |
| Availability | Per-physical-room overlap check; room count; occupied, dirty, and maintenance rooms excluded; serialized booking writes | Correct only when all requests reach the same running hotel service |
| Guest booking | Public booking form, booking lookup by reference plus email, cancellation request | Browser must reach the hotel API. Public Vercel access needs a secure outbound relay first |
| Staff reservations | Walk-in form, reservations list, check-in/out actions, cancellation approval/rejection | No calendar view, manual room reassignment, no-show workflow, or printable voucher yet |
| Payments | Partial/full payment recording and payment ledger; basic collection/outstanding report | No refund workflow, gateway, or reconciliation with bank statements |
| Housekeeping | Room status controls and protection against changing occupied rooms | No housekeeping task assignment, staff workload, or inspection audit screen |
| Reports | Basic room occupancy, reservation counts, revenue, collections, outstanding balance; Excel export | No expense entry/report, tax/service charge breakdown, or date-range reporting |
| CI | GitHub Actions test, typecheck, and production build on Node.js 22 | One domain test suite currently covers the core reservation concurrency/idempotency/cancellation and room-state regression paths |

## Verified in GitHub Actions

- Nginap v1 foundation: tests, typecheck, and build passed.
- Occupied-room safety regression: tests, typecheck, and build passed.
- Staff operations UI: tests, typecheck, and build passed.

These are repository CI results. They do not replace Windows 10/11 runtime testing or end-to-end acceptance testing on the actual hotel computer.

## Release blockers before real guest use

1. **Public internet connectivity:** build a secure outbound relay/gateway with TLS, device authentication, request authentication, and recovery behavior. Never expose the hotel's port 4100 directly or configure public router port forwarding.
2. **Hotel configuration:** obtain the exact physical room numbers, category mapping, occupancy limits, rates, amenities, taxes/service charges, cancellation/no-show rules, and late check-out policy.
3. **Windows acceptance:** install and run on the actual hotel computer; verify startup after reboot, permissions, file locking, disk-full handling, process crash recovery, backup rotation, and restore from backup.
4. **Security review:** investigate and remediate the 5 dependency audit findings reported by `npm install` (3 moderate, 2 high) before production. Do not use `npm audit fix --force` without reviewing breaking changes.
5. **Operational UAT:** test guest, receptionist, admin, and superadmin workflows with hotel staff, including concurrent last-room booking, check-in/out at 12:00 WIB, payment reconciliation, cancellation approval, and workbook restore.
6. **Deployment:** deploy the public web only after the relay is ready and end-to-end tests pass. The local Excel API must remain private.

## Explicit non-completion status

Nginap is **implemented as a testable local pilot foundation**, not a fully released hotel system. No production deployment has been performed. No real room inventory or price data has been supplied. Do not accept real bookings until all release blockers above are closed.
