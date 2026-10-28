import { routes } from "@/utils/routes";

// What differs between the per-game request queues: wording and endpoints.
// The list, table and review dialog are shared.
export interface GameRequestConfig {
  // Singular role name, e.g. "Scorekeeper".
  role: string;
  // What the fan asked to do, e.g. "keep score" → "request to keep score for <game>".
  duty: string;
  endpoints: {
    list: string;
    accept: (requestId: string) => string;
    reject: (requestId: string) => string;
  };
}

export const SCOREKEEPER_REQUESTS: GameRequestConfig = {
  role: "Scorekeeper",
  duty: "keep score",
  endpoints: {
    list: routes.api.listScorekeeperRequests,
    accept: routes.api.acceptScorekeeperRequest,
    reject: routes.api.rejectScorekeeperRequest,
  },
};

export const VIDEOGRAPHER_REQUESTS: GameRequestConfig = {
  role: "Videographer",
  duty: "film",
  endpoints: {
    list: routes.api.listVideographerRequests,
    accept: routes.api.acceptVideographerRequest,
    reject: routes.api.rejectVideographerRequest,
  },
};
