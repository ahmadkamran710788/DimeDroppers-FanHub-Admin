// Fan uploads, photobooth images and the Fan Wall: /fanhub/org/fan-wall/drafts, /fanhub/org/photobooth/jobs and
// /fanhub/org/fan-wall (FANHUB_FAN_WALL_UPLOAD_ADMIN.md).

export type PhotoboothJobStatus = "COMPLETED" | "FAILED" | "QUEUED" | (string & {});

export interface FanWallPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  isLast: boolean;
}

export interface PhotoboothTemplate {
  id: string;
  name: string;
  sport: string | null;
}

export interface PhotoboothGame {
  id: string;
  title: string | null;
  sports: string | null;
  utcTime: string | null;
}

// Where the org's review of an image stands: PENDING (not reviewed), ACCEPTED (on the fan wall) or REJECTED.
export type PhotoboothReviewStatus = "PENDING" | "ACCEPTED" | "REJECTED";

// One fan photobooth image (a "job"). `resultUrl` is a presigned image URL, set once COMPLETED.
export interface PhotoboothJob {
  id: string;
  status: PhotoboothJobStatus;
  reviewStatus: PhotoboothReviewStatus;
  progress: number;
  resultUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  fan: { id: string; name: string; email: string; avatarUrl: string | null };
  template: PhotoboothTemplate;
  game: PhotoboothGame;
}

export interface PhotoboothGallery {
  items: PhotoboothJob[];
  pagination: FanWallPagination;
  summary: { totalJobs: number; completedCount: number; failedCount: number; queuedCount: number };
}

export interface FanWallFan {
  id: string;
  name: string;
  avatarUrl: string | null;
}

// One photo a fan uploaded from the app, waiting for (or past) the org's review.
export interface FanWallDraft {
  id: string;
  schoolId: string;
  // A tournament submission's event; null for a school.
  eventId: string | null;
  status: PhotoboothReviewStatus;
  imageUrl: string;
  // null when the uploader's account was removed.
  fan: FanWallFan | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface FanWallDraftPage {
  items: FanWallDraft[];
  pagination: FanWallPagination;
}

// One image on the wall; `id` is the wall item id (for remove and reorder). A photobooth image or a fan's
// upload: exactly one of photoboothJob / upload is set (older responses have no source: photobooth).
export interface FanWallItem {
  id: string;
  sortOrder: number;
  createdAt: string;
  source?: "PHOTOBOOTH" | "UPLOAD";
  photoboothJob:
    | (Omit<PhotoboothJob, "progress" | "fan" | "reviewStatus"> & {
        fan: FanWallFan;
      })
    | null;
  upload?: { imageUrl: string; fan: FanWallFan | null } | null;
}

export interface FanWallPage {
  items: FanWallItem[];
  pagination: FanWallPagination;
}
