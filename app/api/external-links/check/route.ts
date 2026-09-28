export const runtime = "nodejs";

// Hosts the External Links page is allowed to probe. Restricting this keeps the route
// from being usable as an open proxy to arbitrary (e.g. internal) URLs.
const ALLOWED_HOSTS = ["gofan.co", "nfhsnetwork.com"];

const TIMEOUT_MS = 8_000;

function isAllowed(host: string) {
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/**
 * "Test Connection" for External Links. The browser can't request gofan.co / nfhsnetwork.com
 * directly (CORS), so this server-only handler fetches the page and reports whether it
 * answered successfully. Body: `{ url }`. Response: `{ ok, status?, message? }`.
 */
export async function POST(request: Request) {
  const { url } = (await request.json().catch(() => ({}))) as { url?: string };

  let target: URL;
  try {
    target = new URL(url ?? "");
  } catch {
    return Response.json({ ok: false, message: "Enter a valid URL." }, { status: 400 });
  }
  if (target.protocol !== "https:" || !isAllowed(target.hostname)) {
    return Response.json(
      { ok: false, message: "Only GoFan and NFHS Network links can be tested." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return Response.json({ ok: res.ok, status: res.status });
  } catch {
    return Response.json({ ok: false, message: "The link could not be reached." });
  }
}
