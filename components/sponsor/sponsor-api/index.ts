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

// The packages and physical assets the sponsor already has active (at one organization, or anywhere), as
// cart item keys: the same item can't be activated twice. Up to the API's page cap; null when it fails.
export async function activeActivationKeys(schoolId?: string): Promise<Set<string> | null> {
  const r = await sponsorRequest<PackageActivationsPage>("GET", routes.api.sponsorActivations, {
    params: { status: "ACTIVE", schoolId, page: 1, limit: 100 },
  });
  return r.view ? new Set(r.view.items.map(activationItemKey)) : null;
}

// "$1,234.50" from cents; never rounded.
export const formatCents = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
