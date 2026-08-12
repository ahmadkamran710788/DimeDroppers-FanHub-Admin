/**
 * Reads a human-readable message out of a FanHub API error body.
 *
 * The backend wraps validation failures in an envelope whose top-level `message` is
 * only the *first* issue's text, stripped of the field it belongs to:
 *
 *   { "success": false, "statusCode": 400,
 *     "data": { "errors": [{ "path": "startDate", "message": "Required" }], "data": null },
 *     "message": "Required", "error": null }
 *
 * Surfacing `message` alone produces toasts like a bare "Required", which says nothing
 * about what to fix. Prefer the `errors` array and keep each issue's `path` attached.
 * A root-level issue carries `path: ""` — there is no field to name, so the message
 * stands on its own.
 */

interface ApiFieldError {
  path?: string;
  message?: string;
}

interface ApiErrorBody {
  message?: unknown;
  data?: { errors?: ApiFieldError[] } | null;
}

export function extractApiErrorMessage(json: unknown, fallback: string): string {
  const body = json as ApiErrorBody | null | undefined;

  const errors = body?.data?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const parts = errors
      .map((e) => {
        const message = typeof e?.message === "string" ? e.message.trim() : "";
        if (!message) return "";
        return e.path ? `${e.path}: ${message}` : message;
      })
      .filter(Boolean);

    if (parts.length > 0) return parts.join(", ");
  }

  if (typeof body?.message === "string" && body.message.trim()) return body.message;

  return fallback;
}
