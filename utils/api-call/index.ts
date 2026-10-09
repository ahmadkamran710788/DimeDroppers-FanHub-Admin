import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import toast from "react-hot-toast";
import { config } from "@/config";
import { routes } from "@/utils/routes";
import { clearFanhubSession } from "@/utils/auth/session";

const BASE_URL = config.apiUrl;

// Full backend URL for a `routes.api` path (with or without a leading slash). For the few
// callers that need a raw `fetch`; pass `credentials: "include"` so the auth cookies go along.
export const backendUrl = (endpoint: string) => `${BASE_URL}/${endpoint.replace(/^\/+/, "")}`;

const apiCache = new Map<string, ApiResponse<unknown>>();

interface ApiCallParams {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  showSuccessToast?: boolean;
  successMessage?: string;
  // Scoped cache invalidation: only evict cache entries whose key contains one of
  // these strings. Avoids wiping unrelated caches on every mutation.
  invalidates?: string[];
  // For the auth endpoints (sign in / sign up): a 401 there is the real answer
  // ("Invalid email or password"), not an expired session, so don't refresh or sign out.
  skipAuthRefresh?: boolean;
  // Internal. Set on the single post-refresh retry so an endpoint that keeps
  // returning 401 signs the user out instead of recursing forever.
  _isRetry?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  status: number | null;
  message: string;
}

const formatBackendMessage = (msg: unknown): string => {
  if (!msg || typeof msg !== "string") return "";

  // Typically "fieldName: This value is already used."
  const colonIndex = msg.indexOf(": ");
  if (colonIndex > 0 && colonIndex < 30) {
    const field = msg.substring(0, colonIndex);
    let errorPart = msg.substring(colonIndex + 2);

    if (errorPart.toLowerCase().startsWith("this value")) {
      errorPart = `This ${field}` + errorPart.substring(10);
    }

    return errorPart.charAt(0).toUpperCase() + errorPart.slice(1);
  }

  return msg;
};

// Single-flight refresh: concurrent 401s share ONE in-flight refresh and all
// receive its real result. The old boolean guard made every caller BUT the first
// return `false` (a spurious "refresh failed"), which surfaced a bogus "Session
// expired" toast even though the refresh actually succeeded.
let refreshPromise: Promise<boolean> | null = null;

function attemptTokenRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        // The backend reads the refreshToken cookie and sets fresh token cookies.
        const res = await fetch(backendUrl(routes.api.authRefresh), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        return res.ok;
      } catch {
        return false;
      }
    })();
    // Reset after settle so a later expiry triggers a fresh refresh.
    void refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Genuine expiry (refresh token truly dead / offline): clear the client session
// and hard-redirect to sign-in. `apiCall` is a plain util — not a hook — so it
// can't reach the router/auth context; a full reload also resets that context.
// Guarded so concurrent failures only trigger one sign-out.
let isLoggingOut = false;

function forceSignOut() {
  if (typeof window === "undefined" || isLoggingOut) return;
  isLoggingOut = true;
  clearFanhubSession();
  void fetch(backendUrl(routes.api.authSignout), { method: "POST", credentials: "include" })
    .catch(() => null)
    .finally(() => {
    window.location.assign(routes.ui.signIn);
  });
}

export default async function apiCall<T = unknown>({
  endpoint,
  method,
  data,
  headers,
  showSuccessToast = false,
  successMessage,
  invalidates,
  skipAuthRefresh = false,
  _isRetry = false,
}: ApiCallParams): Promise<ApiResponse<T>> {
  const cacheKey = `${method}:${endpoint}:${JSON.stringify(data || {})}`;

  if (method === "GET" && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey) as ApiResponse<T>;
  }

  try {
    // No Authorization header here by design: the auth cookies are httpOnly, so the
    // browser cannot read them. Backend endpoints get them via `withCredentials` (the
    // backend sets and reads the cookies); the remaining /api/* route handlers attach
    // the FanHub API key server-side.
    const axiosConfig: AxiosRequestConfig = {
      url: endpoint.startsWith("/api/") ? endpoint : backendUrl(endpoint),
      method,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
    };

    if (data && ["POST", "PUT", "PATCH"].includes(method)) {
      axiosConfig.data = data;
    }

    if (data && method === "GET") {
      axiosConfig.params = data;
    }

    const response: AxiosResponse<T> = await axios(axiosConfig);

    if (showSuccessToast) {
      toast.success(successMessage || "Request successful");
    }

    const result = {
      success: true,
      data: response.data,
      status: response.status,
      message: successMessage || "Request successful",
    };

    // Cache successful GET requests
    if (method === "GET") {
      apiCache.set(cacheKey, result);
    }
    // Scoped invalidation: evict only cache entries matching the invalidates list.
    // Falls back to clearing all if no invalidates list is provided (legacy behaviour).
    else if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (invalidates && invalidates.length > 0) {
        for (const key of apiCache.keys()) {
          if (invalidates.some((pattern) => key.includes(pattern))) {
            apiCache.delete(key);
          }
        }
      } else {
        apiCache.clear();
      }
    }

    return result;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const rawBackendMessage =
        error.response?.data?.violations?.[0]?.message ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.detail;

      const backendMessage = formatBackendMessage(rawBackendMessage);

      let errorMessage: string;

      switch (status) {
        case 400:
          errorMessage = "Invalid request. Please check your input.";
          break;
        case 401: {
          if (skipAuthRefresh) {
            errorMessage = backendMessage || "Invalid email or password.";
            break;
          }
          // Silently attempt a token refresh then retry the original request once.
          // `_isRetry` bounds this to exactly one attempt: the retry already carries
          // a freshly refreshed token, so a second 401 means the session is dead
          // rather than stale.
          const refreshed = !_isRetry && (await attemptTokenRefresh());
          if (refreshed) {
            // Retry without propagating the 401 further — don't pass invalidates to
            // avoid a double-invalidation on the retry.
            return apiCall({ endpoint, method, data, headers, showSuccessToast, successMessage, _isRetry: true });
          }
          // Genuine expiry: refresh really failed. Sign the user out gracefully
          // instead of leaving them stuck on a toast with stale UI.
          errorMessage = "Session expired. Please sign in again.";
          forceSignOut();
          break;
        }
        case 403:
          errorMessage = "You don't have permission to perform this action.";
          break;
        case 404:
          errorMessage = "The requested resource was not found.";
          break;
        case 409:
          errorMessage = backendMessage || "This resource already exists.";
          break;
        case 422:
          errorMessage =
            backendMessage || "Validation failed. Please check your input.";
          break;
        case 429:
          errorMessage = "Too many requests. Please try again later.";
          break;
        case 500:
          errorMessage = "Something went wrong. Please try again later.";
          break;
        case 502:
        case 503:
        case 504:
          errorMessage =
            "Server is currently unavailable. Please try again later.";
          break;
        default:
          errorMessage = "Something went wrong. Please try again.";
      }

      toast.error(errorMessage);

      return {
        success: false,
        data: error.response?.data || null,
        status: status || null,
        message: errorMessage,
      };
    }

    if (error instanceof Error) {
      if (error.message === "Network Error") {
        toast.error("Please check your network and try again.");
        return {
          success: false,
          data: null,
          status: null,
          message: "Please check your network and try again.",
        };
      }

      toast.error("An unexpected error occurred. Please try again.");
      return {
        success: false,
        data: null,
        status: null,
        message: "An unexpected error occurred. Please try again.",
      };
    }

    toast.error("An unexpected error occurred. Please try again.");
    return {
      success: false,
      data: null,
      status: null,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
