// A note on an event (Docs & General Info). The API calls it a document: `name` is the note's title.
export interface EventDocument {
  id: string;
  name: string;
  description: string;
  fanHubSchoolEventId: string;
  schoolId: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
    role: "ORGANISER" | "SPONSOR";
  };
}

export interface EventDocumentList {
  items: EventDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Every response wraps its payload in a one-element `data` list.
export interface EventDocumentResponse {
  data: EventDocument[];
}
