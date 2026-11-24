# Secure Internet Relay for Java Hotel

## Architecture

```text
Guest/staff browser
  |
  | HTTPS, same-origin
  v
Public Next.js website
  |
  | Server-side HTTPS request + X-Nginap-Relay-Token
  v
Localtonet HTTP/HTTPS tunnel
  |
  | Encrypted outbound tunnel (hotel PC initiates connection)
  v
127.0.0.1:4100 on the hotel PC
  |
  v
Excel workbook + backups on the hotel PC
```

The browser never receives the relay secret and never connects directly to port 4100. The local API rejects every request without the shared relay token. The hotel PC initiates the tunnel; no router port-forwarding, public IP, or inbound firewall rule is required.

## 1. Create two independent secrets

Generate a relay token and session secret on a trusted computer. Run this twice in PowerShell with Node.js installed:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Use one value for `NGINAP_RELAY_TOKEN` and the other for `NGINAP_SESSION_SECRET`. Do not reuse either value as the Localtonet AuthToken. Never commit secrets or paste them into chat, screenshots, or support tickets.

## 2. Configure the hotel computer

In the repository root `.env`, set:

```dotenv
NGINAP_HOST=127.0.0.1
NGINAP_PORT=4100
NGINAP_SESSION_SECRET=<unique-48-byte-secret>
NGINAP_RELAY_TOKEN=<unique-different-48-byte-secret>
NGINAP_COOKIE_SECURE=true
NGINAP_ALLOWED_ORIGIN=http://localhost:3000
```

Keep the API bound to `127.0.0.1`. Do not change it to `0.0.0.0`. Restart the local API after changing the environment. Confirm the local API responds on loopback only.

## 3. Create the Localtonet HTTP tunnel

1. Create a Localtonet account and a device-specific AuthToken.
2. Install the Localtonet Windows console client on the hotel computer.
3. In Localtonet Dashboard, open **My Tunnels → HTTP** and create an HTTP tunnel.
4. Select the hotel computer's device token and a nearby region.
5. Set local IP to `127.0.0.1` and local port to `4100`.
6. Start the tunnel and copy its HTTPS URL, for example `https://your-subdomain.localto.net`.
7. Put that HTTPS origin into Vercel as `NGINAP_RELAY_ORIGIN`. Do not add a trailing API path.

Use the HTTP tunnel, not TCP, because the Vercel proxy sends HTTPS requests to an HTTPS web endpoint. Enable Localtonet access controls/WAF if available, but keep the application relay-token check: network access controls are an additional layer, not a replacement for application authentication.

**Transport note:** Localtonet's managed HTTP tunnel terminates visitor HTTPS at Localtonet. The onward device tunnel is encrypted, but the API request is not end-to-end TLS all the way to the hotel process. The high-entropy relay token protects the API from unauthenticated direct calls. Review Localtonet's data handling before transmitting guest personal data. If end-to-end TLS to the hotel process is mandatory, use a TLS pass-through tunnel and configure a valid certificate on the hotel API instead.

## 4. Configure the public web project

In the Vercel project settings, add these **server-only** environment variables to Production (and Preview only if intentionally testing with a separate hotel tunnel):

- `NGINAP_RELAY_ORIGIN`: the Localtonet HTTPS origin.
- `NGINAP_RELAY_TOKEN`: exactly the same secret as the hotel API.\n- `NGINAP_TRUSTED_EDGE=vercel`: only when the public Next.js app is deployed directly on Vercel. Vercel documents that `x-real-ip` is the same as `x-forwarded-for`, which Vercel overwrites to prevent client IP spoofing. Leave this unset or `none` on other hosts until their ingress header behavior is verified.

Do not prefix either variable with `NEXT_PUBLIC_`. Do not put the Localtonet AuthToken in Vercel. Set `NGINAP_COOKIE_SECURE=true` on the hotel API. Redeploy the web project after setting environment variables.

The browser now calls only the same-origin `/api/nginap/*` route. The Next.js server forwards requests to the tunnel and attaches the relay token. Session cookies are returned to the website origin.

## 5. Keep Localtonet online after reboot

Install the Localtonet console client as a Windows service from an Administrator PowerShell:

```powershell
.\localtonet.exe --install-service --authtoken <LOCALTONET_AUTHTOKEN>
.\localtonet.exe --status-service --authtoken <LOCALTONET_AUTHTOKEN>
```

Create and start the HTTP tunnel separately in the Localtonet dashboard. Verify the device is Online and the tunnel is Started. Keep the hotel API service configured to start automatically too; Localtonet's service does not start the Node.js hotel API.

## 6. Verification checklist

Do not enable public booking until all checks pass:

- [ ] Hotel API listens only on `127.0.0.1:4100`.
- [ ] `GET /health` without `X-Nginap-Relay-Token` returns HTTP 403, including through the public tunnel.
- [ ] A request with the correct token reaches the API.
- [ ] The public Next.js website can query room types through `/api/nginap/api/public/room-types`.
- [ ] Browser developer tools show no Localtonet URL or relay token.
- [ ] Staff login sets a Secure, HttpOnly, SameSite=Strict session cookie on the website origin.
- [ ] Staff dashboard, booking, lookup, cancellation and export work through the proxy.
- [ ] Stop the Localtonet tunnel: public booking fails closed with HTTP 503 and does not claim success.
- [ ] Restart hotel PC and verify both API and Localtonet services recover.
- [ ] Run concurrent last-room booking tests after the relay is active.

## Operational limits

The Localtonet Free plan currently documents one tunnel total, 1 GB monthly transfer, and no 30-minute session cutoff for HTTP tunnels. Confirm current limits in the provider dashboard before go-live. A tunnel is unavailable whenever the hotel PC, local API, network, or Localtonet client is offline. A public website deployment alone does not make the hotel workbook available.

## Secret rotation

To rotate the relay token, generate a new value, update the hotel `.env` and Vercel Production environment variable in a coordinated maintenance window, restart the local API, then redeploy the web project. Confirm the old token no longer works. Never leave both old and new tokens accepted during normal operation.
