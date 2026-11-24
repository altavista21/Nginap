# Nginap Security Review

Initial source review: 24 November 2026  
Scope: Next.js public web app, same-origin relay, Express local API, staff session, Excel workbook storage and reservation workflows.

## Findings addressed in this hardening branch

| Finding | Risk | Remediation |
|---|---|---|
| Reservation lookup page still called the old public localhost API URL instead of the same-origin relay | Guest lookup and cancellation failed outside the hotel LAN and bypassed the intended proxy boundary | Route lookup and cancellation through `/api/nginap` |
| Public relay accepted arbitrary local paths, including `/health` | Unnecessary internal service metadata was exposed through the public web origin | Restrict proxy paths to the `/api/*` namespace |
| Proxy buffered the entire request before enforcing its 64 KiB cap | Oversized request could consume memory before rejection | Enforce declared length and stream with a hard byte limit |
| Idempotency key was globally searched and replayed without checking the booking owner | A reused key could disclose another booking reference, status and total | Require matching guest email, stay dates, room count and room category before replay |
| Reservation lookup had no rate limit | Increased risk of automated booking-reference/email guessing | Add per-client lookup throttling |
| Public cancellation shared the booking limiter and had no dedicated policy | Automated cancellation attempts were insufficiently constrained | Add a separate per-client cancellation limiter |
| Rate limiting saw only the relay/tunnel peer address | One visitor could consume the shared limit for every guest | Pass a validated edge client IP in a relay-only header and key local limits by it; verify this header at the production hosting edge before go-live |
| Housekeeping could mark a maintenance room as inspected and return it to Available | Staff could accidentally bypass the maintenance hold | Reject housekeeping transitions while room status is Maintenance |
| Date validation accepted normalized impossible dates such as February 31 | Invalid dates could enter reservation workflows | Require exact ISO calendar-date round-trip validation |

## Important residual risks and go-live blockers

1. **Trusted client IP must be verified in the actual hosting environment.** The proxy uses the platform-provided `x-real-ip` value and only forwards it after IP syntax validation. Confirm the hosting edge overwrites this header rather than accepting a visitor-supplied value. If this cannot be proven, use a managed rate-limit service or another trusted edge mechanism. Local in-memory rate limits are not distributed across multiple server instances.
2. **Excel contains personal data in plaintext.** Protect the Windows account and data/backup directories with restrictive NTFS ACLs, enable BitLocker on the hotel computer, and keep encrypted off-device backups. Workbook export must remain restricted to admin/superadmin.
3. **No production penetration test has been performed.** Automated tests and source review do not prove the deployed system is secure.
4. **No live tunnel or deployed end-to-end test has been performed.** Relay configuration, cookie behavior, host headers, client IP propagation and failure behavior must be tested on the actual hotel PC and production host.
5. **Staff session revocation and account disablement are not implemented as an operational feature.** Sessions are signed and expire after eight hours. A future staff-disable function must revoke existing sessions immediately.
6. **Login and public endpoint throttling require monitoring.** Tune limits only after observing normal hotel traffic. Do not disable throttling to work around shared-IP behavior.
7. **Keep secrets outside Git.** Use unique session, relay and bootstrap secrets. Remove the bootstrap key after initial administrator creation and rotate any secret that was exposed.

## Verification required

- [ ] CI tests, typecheck and production build pass.
- [ ] Requests without relay token receive 403 at the hotel API.
- [ ] Browser never receives relay token or Localtonet URL.
- [ ] Lookup and cancellation use same-origin proxy only.
- [ ] Public proxy cannot reach non-`/api/*` local endpoints.
- [ ] Requests larger than 64 KiB are rejected without full buffering.
- [ ] Cross-guest idempotency replay is rejected.
- [ ] Invalid dates and maintenance-room state bypass are rejected.
- [ ] Rate limits distinguish real visitors at the production edge.
- [ ] Staff authorization is tested for every role and every write endpoint.
- [ ] Excel file, backups and export access are checked on Windows.
- [ ] Restore from backup is tested before real guest data is stored.
