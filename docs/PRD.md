# Product Requirements Document — Nginap

**Version:** 1.0.0  
**Product:** Nginap  
**Hotel:** Java Hotel  
**Status:** Approved scope for phased implementation

## 1. Product overview

Nginap is a responsive web-based hotel reservation and property-operations system for one property: Java Hotel, Jalan Jend. Sudirman No. 40–45, Jakarta Selatan, DKI Jakarta, Indonesia.

The planned inventory is 101–200 physical rooms across four room categories: Standard, Superior, Deluxe, and Suite. Exact room counts, room numbers, prices, capacities, and amenities are configuration data to be supplied by the hotel; they must not be fabricated.

## 2. Confirmed operating decisions

| Item | Decision |
|---|---|
| Product name | Nginap |
| Property | Java Hotel |
| Operating system target | Windows 10 compatibility |
| Data store | Excel workbook on hotel computer |
| Guest channel | Public responsive website |
| Staff channel | Staff dashboard |
| Booking | Instant confirmation after safe allocation and persistence |
| Walk-in | Staff can create reservations |
| Payment | Pay at hotel; staff records payments |
| Cancellation | Guest requests; admin approval required |
| Check-in | 12:00 Asia/Jakarta |
| Check-out | 12:00 Asia/Jakarta |
| Currency | IDR |
| Room types | Standard, Superior, Deluxe, Suite |
| Capacity | 101–200 rooms |

## 3. User roles

- **Guest:** search availability, submit a booking, retrieve booking details, and request cancellation.
- **Receptionist:** create walk-in bookings, manage arrivals/departures, assign rooms, check guests in/out, and record payments.
- **Admin:** manage inventory, room rates, reservations, cancellation decisions, operational reports, and housekeeping.
- **Superadmin:** manage staff accounts and roles, configuration, audit review, and backup/restore operations.

## 4. Functional requirements

### 4.1 Guest website

- Hotel landing page and property information.
- Search by check-in date, check-out date, guest count, and room count.
- Display available room categories, amenities, images, and configured rates.
- Guest details form and booking submission.
- Unique booking reference and confirmation details.
- Booking lookup using reference plus a second verification factor.
- Cancellation request submission; no direct guest cancellation.
- Downloadable booking confirmation.

### 4.2 Reservation engine

- Availability is calculated per physical room, not merely per room category.
- Stay interval is half-open: check-in inclusive, check-out exclusive.
- A room is unavailable when another blocking reservation overlaps the requested interval.
- A cancellation request continues to block the room until an admin approves it.
- A booking is confirmed only after inventory allocation and workbook persistence succeed.
- Concurrent requests for the last room must result in at most one successful allocation.
- Requests must support idempotency to prevent duplicate bookings after retries.
- Store the quoted nightly rate and total as a booking-time snapshot.
- A reservation may contain multiple rooms.
- Check-out at 12:00 does not consume the next night's inventory; housekeeping must mark the room ready before operational reassignment.

### 4.3 Staff operations

- Role-protected login and session management.
- Reservation calendar and arrival/departure lists.
- Walk-in reservation creation.
- Room assignment and room-status management.
- Check-in and check-out workflow.
- Payment ledger supporting unpaid, partial, paid, and refunded states.
- Housekeeping tasks and room readiness.
- Guest search with restricted personal-data visibility.

### 4.4 Cancellation workflow

1. Guest submits a cancellation request.
2. Reservation status changes to Cancellation Requested.
3. The assigned room remains blocked.
4. Admin approves or rejects with a recorded reason.
5. Approval changes the reservation to Cancelled and releases inventory.
6. Rejection restores the prior active reservation state.
7. Every decision is recorded in the audit log.

### 4.5 Reports

- Occupancy by date and room category.
- Arrivals, departures, in-house guests, and no-shows.
- Gross room revenue and payment collection.
- Outstanding balances.
- Expenses.
- Excel export for operational reporting.

## 5. Workbook data model

Primary workbook: NGINAP_DATABASE.xlsx.

| Worksheet | Purpose |
|---|---|
| Users | Staff accounts and roles |
| Guests | Guest identity and contact data |
| RoomTypes | Standard, Superior, Deluxe, Suite |
| Rooms | Physical room inventory |
| Reservations | Booking header and lifecycle |
| ReservationRooms | Rooms allocated to a booking and rate snapshots |
| Payments | Payment ledger |
| Housekeeping | Cleaning and inspection status |
| Expenses | Operational expenses |
| AuditLogs | Append-only business audit events |
| Settings | Property and policy configuration |

Each entity uses a stable unique ID. Room number is a display/business identifier, not a primary key.

## 6. Status model

- Reservation: Confirmed, CheckedIn, CheckedOut, CancellationRequested, Cancelled, NoShow.
- Payment: Unpaid, PartiallyPaid, Paid, Refunded.
- Room: Available, Occupied, Dirty, Maintenance.
- Housekeeping: Pending, Cleaning, Clean, Inspected.

## 7. Non-functional requirements

- Mobile-first Indonesian UI.
- Asia/Jakarta timezone and IDR formatting.
- Server-side validation for every write.
- Role-based access control and secure sessions.
- Password hashing with Argon2id or bcrypt.
- Rate limiting and audit events for sensitive operations.
- Workbook access restricted to the local service account.
- Serialized workbook writes, integrity checks, recovery journal, and backups.
- No direct public exposure of the hotel's Windows service.
- Graceful failure: no false booking confirmation when local storage is unavailable.

## 8. Acceptance tests

- Available room booking persists and returns a unique reference.
- Overlapping reservation is rejected.
- Simultaneous attempts for the final room produce one winner.
- Idempotent retry does not duplicate a reservation.
- Cancellation request does not release inventory before approval.
- Admin approval releases inventory; rejection keeps the booking active.
- Check-in/out updates status and room state correctly.
- Partial and full payments reconcile with the outstanding balance.
- Workbook survives process restart and backup restoration.
- Workbook lock, disk-full, and interrupted-write failures do not create false confirmations.
- Unauthorized staff actions are rejected and audited.
- Exported reports reconcile with source transactions.

## 9. Out of scope for v1

OTA integrations, online payment gateway, native mobile app, multi-property support, smart locks, loyalty program, and external accounting integration.

## 10. Open configuration data

The hotel must provide actual room numbers/counts, per-category room allocation, rates, occupancy limits, bed types, amenities, image assets, tax/service-charge rules, no-show rules, late check-out fees, and guest identity requirements before production use.
