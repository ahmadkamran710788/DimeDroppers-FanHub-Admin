// Photobooth gallery and Fan Wall: /fanhub/org/photobooth/jobs and /fanhub/org/fan-wall.

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

// One fan photobooth image (a "job"). `resultUrl` is a presigned image URL, set once COMPLETED.
export interface PhotoboothJob {
  id: string;
  status: PhotoboothJobStatus;
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

// One image on the wall; `id` is the wall item id (for remove and reorder).
export interface FanWallItem {
  id: string;
  sortOrder: number;
  createdAt: string;
  photoboothJob: Omit<PhotoboothJob, "progress" | "fan"> & {
    fan: { id: string; name: string; avatarUrl: string | null };
  };
}

export interface FanWallPage {
  items: FanWallItem[];
  pagination: FanWallPagination;
}
