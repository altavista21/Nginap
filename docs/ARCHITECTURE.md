# Architecture and Security

## 1. Deployment shape

- Public web application: guest-facing Next.js application hosted on a public web host.
- Hotel node: Node.js service on the hotel's Windows computer.
- Workbook: private local file owned exclusively by the hotel node.
- Secure connector: an outbound authenticated connection from the hotel node to a public API gateway/relay. The hotel computer must not accept arbitrary inbound internet traffic.

The initial repository contains the web shell and local service foundation. The public relay, authentication, and reservation APIs are future implementation phases.

## 2. Excel storage rules

- The workbook is not a browser database and is never placed in a public static directory.
- Only one service process may own the workbook.
- All workbook mutations go through one serialized queue.
- Writes use a temporary file and replacement strategy; backups are created before destructive updates.
- A transaction journal and recovery procedure are required before booking writes are enabled.
- The workbook must not be opened in desktop Excel while the service is running.
- Backups must be copied to a separate device or protected external destination and restore-tested.

Excel is not a transactional multi-user database. The service must enforce a single writer and concurrency tests. If measured load, reliability, or concurrency exceeds safe workbook limits, a transactional database migration should be proposed rather than silently weakening integrity.

## 3. Security boundaries

- Bind the local service to loopback by default.
- Do not expose its port with router port-forwarding.
- Use outbound tunnel/relay with strong service identity and TLS.
- Separate public guest APIs from staff-only APIs.
- Staff sessions use secure, HttpOnly, SameSite cookies.
- Enforce role checks server-side for every staff operation.
- Guest booking lookup requires a booking reference and an additional verification factor.
- Never return identity numbers, password hashes, or internal audit details to public endpoints.
- Apply request size limits, schema validation, rate limiting, and generic error responses.
- Keep secrets in environment variables, never in Git.
- Log security events without logging passwords, session tokens, or full identity numbers.

## 4. Windows operations

- Run the service under a dedicated least-privilege Windows account.
- Configure automatic startup and restart on failure only after installation/testing procedures are written.
- Use NTFS permissions to restrict workbook and backup directories.
- Monitor disk space and service health.
- Windows 10 is the requested compatibility target, but its standard support ended on 14 October 2025. Production must use a supported OS or an eligible, actively enrolled Extended Security Updates arrangement. Prefer migration to a supported Windows release.

## 5. Failure behavior

If the hotel node, workbook, or relay is unavailable, the public booking flow must fail closed: do not show a confirmed booking until a durable allocation has been committed and acknowledged. Retries must use idempotency keys. Reconciliation must identify pending or uncertain outcomes before accepting another allocation.
