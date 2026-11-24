# Implementation Plan and Verified Scope

| Area | Implemented in this delivery | Production caveat |
|---|---|---|
| Excel storage | Workbook schema validation, serialized read/write transactions, atomic temp-file replacement, pre-write backup | Restore drill and Windows file-lock testing still required |
| Authentication | Bootstrap superadmin, scrypt password hashing, signed HttpOnly session cookie, role checks, login rate limit | Configure secrets and TLS before public exposure |
| Inventory | Create/list physical rooms, four room types, status and housekeeping | Hotel must import its real room list and rates |
| Availability | Per-room date overlap checks, room-count limits | Only valid when all booking traffic reaches the same hotel service |
| Reservations | Guest booking, walk-in, idempotency key, durable write before confirmation | Online booking is not public-internet connected yet |
| Operations | Check-in/out, payment recording, housekeeping | Staff UI and operational acceptance tests pending |
| Cancellation | Guest request; room remains blocked; admin approval/rejection | Staff UI pending |
| Reports | Occupancy, revenue, collection, outstanding balance; workbook export | Reconciliation against hotel sample data pending |
| Guest experience | Landing page only | Search/booking/lookup UI pending |
| Deployment | Local service binds loopback by default | Secure outbound relay, Windows installer/service and TLS pending |

## Remaining release blockers
1. Build and typecheck in clean environment; resolve all compiler failures.
2. Add automated domain tests for overlap, idempotency, cancellation hold, payment totals and concurrency.
3. Add browser UI for guest booking and staff operations.
4. Implement a secure outbound relay for true public internet reservations; do not expose the hotel computer's port.
5. Perform Windows 10/11 runtime, backup restore, disk-full and file-lock drills.
6. Populate and verify the actual room inventory, prices, taxes, capacities and hotel policies.

A repository commit is not equivalent to a production-ready release. Nginap must remain in pilot/local-network mode until the release blockers pass.
