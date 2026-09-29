import { routes } from "@/utils/routes";

// What differs between the per-game request queues: wording, endpoints and cache tags.
// The list, table and review dialog are shared.
export interface GameRequestConfig {
  // Singular role name, e.g. "Scorekeeper".
  role: string;
  // What the fan asked to do, e.g. "keep score" → "request to keep score for <game>".
  duty: string;
  // apiCall cache tags cleared after accept / reject: the queue's own + the role's pool
  // (accept adds the fan to the pool).
  cacheTags: string[];
  endpoints: {
    list: string;
    accept: (requestId: string) => string;
    reject: (requestId: string) => string;
  };
}

export const SCOREKEEPER_REQUESTS: GameRequestConfig = {
  role: "Scorekeeper",
  duty: "keep score",
  cacheTags: ["scorekeeper-requests", "scorekeeper-pool"],
  endpoints: {
    list: routes.api.proxyListScorekeeperRequests,
    accept: routes.api.proxyAcceptScorekeeperRequest,
    reject: routes.api.proxyRejectScorekeeperRequest,
  },
};

export const VIDEOGRAPHER_REQUESTS: GameRequestConfig = {
  role: "Videographer",
  duty: "film",
  cacheTags: ["videographer-requests", "videographer-pool"],
  endpoints: {
    list: routes.api.proxyListVideographerRequests,
    accept: routes.api.proxyAcceptVideographerRequest,
    reject: routes.api.proxyRejectVideographerRequest,
  },
};
