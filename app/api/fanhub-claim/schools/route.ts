import { config } from "@/config";
import { routes } from "@/utils/routes";

export const runtime = "nodejs";

/**
 * School search for the public claim page. The browser can't hold the backend's x-fanhub-key (anything
 * shipped to the client is readable), so it posts here and this same-origin, server-only handler attaches
 * the key and forwards the request to the FanHub API. No auth cookies/token are involved — the page is
 * public. Body: `{ search }`. Response: the backend's JSON (`data[0].items`) passed straight through.
 */
export async function POST(request: Request) {
  const { search } = (await request.json().catch(() => ({}))) as { search?: string };

  const apiKey = process.env.FANHUB_API_KEY;
  if (!apiKey) {
    return Response.json({ message: "Search is not configured." }, { status: 500 });
  }

  try {
    const res = await fetch(`${config.apiUrl}/${routes.api.fanhubSchoolsList}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The shared backend key — stays on the server, never sent to the browser.
        "x-fanhub-key": apiKey,
      },
      body: JSON.stringify({ search: search ?? "", page: 1, limit: 20 }),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);
    return Response.json(json ?? { data: [] }, { status: res.status });
  } catch {
    return Response.json({ message: "Couldn't reach the search service." }, { status: 502 });
  }
}
