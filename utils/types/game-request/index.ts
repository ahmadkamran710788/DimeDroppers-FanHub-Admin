// Per-game staff requests: a fan asks to be the official scorekeeper or videographer of one
// game (docs/fanhub-scorekeeper-game-request-admin.md, docs/fanhub-videographer-game-request-admin.md).
// Both APIs return the same shape; only the game's "is official" flag is named per role.

export type GameRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface GameRequest {
  id: string;
  status: GameRequestStatus;
  // The fan's note.
  message: string | null;
  // The org's decision note + time.
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  fan: { id: string; name: string | null; email: string | null };
  game: {
    id: string;
    title: string;
    opponent: string | null;
    sport: string | null;
    gender: string | null;
    level: string | null;
    start: string;
    end: string | null;
    // Real UTC start — use this for display.
    utcTime: string;
    status: string | null;
    // This fan is currently the game's official scorekeeper / videographer (per role).
    isOfficialScorekeeper?: boolean;
    isOfficialVideographer?: boolean;
  };
  school: { id: string; name: string; logoUrl: string | null };
  // Fan is already an ACTIVE member of that role's pool; false means accepting will add them.
  inPool: boolean;
}

export interface GameRequestsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  errorCode: string | null;
  // One-element list; read data[0].
  data: [
    {
      items: GameRequest[];
      // Pending count for the school regardless of the status filter.
      pendingCount: number;
      pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
    },
  ];
}
