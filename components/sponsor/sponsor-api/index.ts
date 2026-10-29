import { activationItemKey } from "@/context/sponsor-cart";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { PackageActivationsPage } from "@/utils/types/sponsor-packages";

// A field-level validation error from the backend (`path` = the field name).
export interface FieldError {
  path: string;
  message: string;
}

export interface SponsorApiResult<T> {
  status: number;
  // data[0] of the envelope on success.
  view?: T;
  // The backend's own message on failure (e.g. 409 "The package price has changed…").
  message?: string;
  // data.errors on a validation failure; empty otherwise (429 and 500 bodies have none).
  errors?: FieldError[];
}

const NETWORK_ERROR = "Please check your network and try again.";

export type QueryParams = Record<string, string | number | undefined>;

// "?a=1&b=2" without the empty values; "" when nothing is left.
export const toQuery = (params?: QueryParams) => {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "");
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : "";
};

// The sponsor-packages, sponsor profile and Sponsor AI calls: backendFetch (not apiCall) so the backend's
// message reaches the screen untouched and nothing is cached (prices and availability change after an
// activation). A FormData body is sent as multipart: the browser sets the Content-Type with its boundary.
export async function sponsorRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  endpoint: string,
  { params, body, headers }: { params?: QueryParams; body?: unknown; headers?: Record<string, string> } = {}
): Promise<SponsorApiResult<T>> {
  const multipart = body instanceof FormData;
  try {
    const res = await backendFetch(`${endpoint}${toQuery(params)}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !multipart && { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (res.ok) return { status: res.status, view: json?.data?.[0] as T };
    return {
      status: res.status,
      message: json?.message || "Something went wrong, please try again.",
      errors: Array.isArray(json?.data?.errors) ? (json.data.errors as FieldError[]) : [],
    };
  } catch {
    return { status: 0, message: NETWORK_ERROR };
  }
}

// Cart item key → the stores (ids) it is already active for; an empty set when activated without stores.
export type ActiveActivations = Map<string, Set<string>>;

// The packages and physical assets the sponsor already has active (at one organization, or anywhere). Without
// stores the same item isn't activated twice; with stores it can be, for stores that don't have it yet. Up to
// the API's page cap; null when it fails.
export async function activeActivations(schoolId?: string): Promise<ActiveActivations | null> {
  const r = await sponsorRequest<PackageActivationsPage>("GET", routes.api.sponsorActivations, {
    params: { status: "ACTIVE", schoolId, page: 1, limit: 100 },
  });
  if (!r.view) return null;
  const active: ActiveActivations = new Map();
  for (const activation of r.view.items) {
    const key = activationItemKey(activation);
    const stores = active.get(key) ?? new Set<string>();
    for (const location of activation.locations ?? []) if (location.id) stores.add(location.id);
    active.set(key, stores);
  }
  return active;
}

// "$1,234.50" from cents; never rounded.
export const formatCents = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
