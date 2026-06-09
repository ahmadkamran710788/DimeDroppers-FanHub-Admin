# Step 2 — Import Schedule

**Route**: `/setup-wizard/import-schedule`
**File**: `app/(setup)/setup-wizard/import-schedule/page.tsx`

## Purpose

Allow admins to import their team's game schedule via CSV file upload, ICS calendar URL, or direct API connection to a scheduling platform.

## Import Methods

### A. CSV Upload
- Drag-and-drop or file picker
- Accepts `.csv` files
- **⏳ Remaining**: parse and POST CSV to backend; show parsed preview before confirming

### B. ICS Calendar Sync
| Field | Type | Notes |
|-------|------|-------|
| icsUrl[0..3] | text inputs | 4 URL slots; validates `https://` + `.ics` suffix |
| autoSync | toggle | enables automatic re-sync on schedule change |

- Green border + checkmark on valid `.ics` URL
- Red border + X icon on invalid URL
- **⏳ Remaining**: POST ICS URLs to backend for import; poll for import status

### C. API Platform Connections
Platforms: Exposure Events, Team Snap, Sports Engine, LeagueApps

| Action | UI | ⏳ Backend |
|--------|----|-----------|
| Connect | Opens modal → stub input | OAuth flow or API key exchange |
| Delete | Sets status to "not-connected" | DELETE request to disconnect |

Connect modal is currently stubbed — input field is present but does nothing.

## Import Summary Cards (static demo data)
These 8 stat cards should be populated from the backend after a successful import:
- Data Quality Score, Schedule Source, Sport Detected, Season Detected, Total Games, Date Range, Locations, Sync Type

## API Integration

```ts
// CSV upload (multipart)
await apiCall({ endpoint: routes.api.saveSchedule, method: "POST", /* FormData */ });

// ICS sync
await apiCall({
  endpoint: routes.api.saveSchedule,
  method: "POST",
  data: { type: "ics", urls: icsUrls.filter(Boolean), autoSync },
});

// Platform connect
await apiCall({
  endpoint: routes.api.connectPlatform(platformId),  // "setup/connect/:platform"
  method: "POST",
  data: { apiKey },
});

// Platform disconnect
await apiCall({
  endpoint: routes.api.connectPlatform(platformId),
  method: "DELETE",
});
```

## UI States to Handle

- Loading state while import is processing
- Success state — populate summary stats from response
- Error state — show which URLs failed / which platforms rejected credentials
- Empty state — user hasn't imported anything yet (currently renders static demo data)
