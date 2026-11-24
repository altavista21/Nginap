import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

function relayConfig() {
  const origin = process.env.NGINAP_RELAY_ORIGIN ?? "";
  const token = process.env.NGINAP_RELAY_TOKEN ?? "";
  let parsed: URL;
  try { parsed = new URL(origin); } catch { throw new Error("NGINAP_RELAY_ORIGIN is not configured."); }
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("The relay origin must use HTTPS.");
  }
  if (token.length < 32) throw new Error("NGINAP_RELAY_TOKEN must contain at least 32 characters.");
  return { origin: parsed.origin, token };
}


async function proxy(request: NextRequest, context: RouteContext) {
  let config: ReturnType<typeof relayConfig>;
  try { config = relayConfig(); } catch {
    return NextResponse.json({ error: "Koneksi hotel belum dikonfigurasi." }, { status: 503 });
  }

  // Same-origin proxy only: block cross-site fetches and foreign Origin headers.
  const fetchSite = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  if (fetchSite === "cross-site" || (origin && origin !== request.nextUrl.origin)) {
    return NextResponse.json({ error: "Permintaan tidak diizinkan." }, { status: 403 });
  }

  const { path = [] } = await context.params;
  if (!path.length || path.some(segment => !/^[a-zA-Z0-9._-]+$/.test(segment))) {
    return NextResponse.json({ error: "Path API tidak valid." }, { status: 400 });
  }

  const url = new URL(config.origin);
  url.pathname = "/" + path.map(encodeURIComponent).join("/");
  url.search = request.nextUrl.search;

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
    if (body.byteLength > 64 * 1024) {
      return NextResponse.json({ error: "Ukuran permintaan terlalu besar." }, { status: 413 });
    }
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  if (contentType) headers.set("content-type", contentType);
  if (cookie) headers.set("cookie", cookie);
  headers.set("x-nginap-relay-token", config.token);
  headers.set("accept", request.headers.get("accept") ?? "application/json");

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json({ error: "Komputer hotel sedang tidak terhubung. Silakan coba kembali." }, { status: 503 });
  }

  const responseHeaders = new Headers();
  const type = upstream.headers.get("content-type");
  const disposition = upstream.headers.get("content-disposition");
  if (type) responseHeaders.set("content-type", type);
  if (disposition) responseHeaders.set("content-disposition", disposition);
  responseHeaders.set("cache-control", "no-store");
  // Preserve the hotel session cookie on the public website's own origin.
  for (const value of upstream.headers.getSetCookie()) responseHeaders.append("set-cookie", value);

  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export async function GET(request: NextRequest, context: RouteContext) { return proxy(request, context); }
export async function POST(request: NextRequest, context: RouteContext) { return proxy(request, context); }
export async function PATCH(request: NextRequest, context: RouteContext) { return proxy(request, context); }
export async function DELETE(request: NextRequest, context: RouteContext) { return proxy(request, context); }
