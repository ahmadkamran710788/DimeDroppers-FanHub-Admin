export const routes = {
  ui: {
    indexRoute: "/",
    profile: "/profile",
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    schedule: "/schedule",
    scorekeepers: "/scorekeepers",
    videographers: "/videographers",
    scorekeeperRequests: "/scorekeeper-requests",
    videographerRequests: "/videographer-requests",
    importSchedule: "/schedule/import",
    gameRecap: (gameId: string) => `/schedule/games/${gameId}/recap`,
    gameHighlights: (gameId: string) => `/schedule/games/${gameId}/highlights`,
    gameShop: (gameId: string) => `/schedule/games/${gameId}/shop`,
    externalLinks: "/external-links",
    activations: "/activations",
    teams: "/teams",
    addTeam: "/teams/add",
    teamDetails: (teamId: string) => `/teams/${teamId}`,
    buyTickets: "/buy-tickets",
    fundraising: "/fundraising",
    commandCenter: "/command-center",
    engagement: "/engagement",
    createFundraisingCampaign: "/fundraising/create",
    media: "/media",
    digitalCollectibles: "/digital-collectibles",
    teamShop: "/team-shop",
    recognition: "/recognition",
    // Opens the page on the Recognition Posts section.
    recognitionPosts: "/recognition?view=posts",
    addRecognition: "/recognition/add",
    sponsors: "/sponsors",
    helpCenter: "/help-center",
    addSponsor: "/sponsors/add",
    sponsorAddOns: "/sponsors/add-ons",
    userDetails: (id: string | number) => `users/${id}`,
    setupWizard: {
      organizationDetails: "/setup-wizard/organization-details",
    },
  },

  api: {
    getArea: "areas",
    editArea: (id: string | number) => `areas/${id}`,
    // FanHub Org Auth. `auth*` are the upstream paths appended to config.apiUrl on the
    // server (in the route handlers); `proxyAuth*` are the internal Next routes the browser
    // posts to, which set the httpOnly accessToken/refreshToken cookies server-side.
    authSignin: "fanhub/org-auth/signin",
    proxyAuthSignin: "/api/auth/signin",
    authSignup: "fanhub/org-auth/signup",
    proxyAuthSignup: "/api/auth/signup",
    authRefresh: "fanhub/org-auth/refresh",
    proxyAuthRefresh: "/api/auth/refresh",
    // Hands the browser the current access token (read from the httpOnly cookie, renewed if
    // stale) so apiCall can call the org endpoints below directly with a Bearer header.
    proxyAuthToken: "/api/auth/token",
    // Clears the auth cookies (no upstream call).
    proxyAuthSignout: "/api/auth/signout",
    // Returns the org from the decoded accessToken cookie (no upstream call needed
    // when the token carries the org claims; falls back to upstream if not).
    proxyAuthMe: "/api/auth/me",
    // FanHub — Step 1 "Create School". `createSchool` is the upstream path appended to
    // config.apiUrl on the server; `proxyCreateSchool` is the internal Next route the
    // browser posts to (which injects the x-fanhub-key header server-side).
    createSchool: "fanhub/schools",
    proxyCreateSchool: "/api/fanhub/schools",
    // FanHub — Step 1 "Update School" (when the user comes Back and re-submits an
    // already-created school). `updateSchool` is the upstream PUT path; `proxyUpdateSchool`
    // is the static internal route the browser PUTs to with ?schoolId=… (injects x-fanhub-key).
    updateSchool: (schoolId: string) => `fanhub/schools/${schoolId}`,
    proxyUpdateSchool: "/api/fanhub/schools/update",
    // FanHub — Setup Wizard rehydrate. `getSchool` is the upstream path (school +
    // its schedule events) appended to config.apiUrl on the server; `proxyGetSchool`
    // is the static internal Next route the browser GETs with ?schoolId=… (the server
    // route injects x-fanhub-key and forwards to getSchool).
    getSchool: (schoolId: string, schedule = 5) => `fanhub/schools/${schoolId}?schedule=${schedule}`,
    proxyGetSchool: "/api/fanhub/schools/get",
    // FanHub — Step 2 "Import Schedule". Upstream paths appended to config.apiUrl on the
    // server; proxy* are internal Next routes the browser posts to (inject x-fanhub-key).
    icsSportsEngine: "fanhub/ics/sportsengine",
    proxyIcsSportsEngine: "/api/fanhub/ics/sportsengine",
    icsTeamSnap: "fanhub/ics/teamsnap",
    proxyIcsTeamSnap: "/api/fanhub/ics/teamsnap",
    importIcs: (schoolId: string) => `fanhub/schools/${schoolId}/import-ics`,
    proxyImportIcs: "/api/fanhub/schools/import-ics",
    // FanHub — Step 2 "Upload schedule (pdf/jpg/png)". The browser posts multipart
    // form-data (the schedule file) to proxyScrapeMaxpreps with ?schoolId=…; the server
    // route appends scrapeMaxpreps(schoolId) to config.apiUrl and injects x-fanhub-key.
    scrapeMaxpreps: (schoolId: string) => `fanhub/scrape/maxpreps/${schoolId}`,
    proxyScrapeMaxpreps: "/api/fanhub/scrape/maxpreps",
    // FanHub — Step 3 "Choose Activations". Upstream path appended to config.apiUrl on the
    // server; proxy is the internal Next route the browser PATCHes to (injects x-fanhub-key).
    featureLinks: (schoolId: string) => `fanhub/schools/${schoolId}/feature-links`,
    proxyFeatureLinks: "/api/fanhub/schools/feature-links",
    // External Links → "Test Connection" (server-side reachability check).
    proxyCheckExternalLink: "/api/external-links/check",
    // FanHub org endpoints (fanhub/org/*). The browser calls these straight on the backend:
    // apiCall / backendFetch (utils/api-call) attach the Bearer access token. No Next route
    // in between — they work with the token alone, no x-fanhub-key.
    //
    // Schedule CRUD
    listSchedules: "fanhub/org/schedules",
    createSchedule: "fanhub/org/schedules",
    getSchedule: (id: string) => `fanhub/org/schedules/${id}`,
    updateSchedule: (id: string) => `fanhub/org/schedules/${id}`,
    deleteSchedule: (id: string) => `fanhub/org/schedules/${id}`,
    // Scorekeeper pool. A pool member is either org-invited (status INVITED) or
    // fan-requested (REQUESTED); the org then accepts/rejects the REQUESTED ones.
    listScorekeeperPool: "fanhub/org/scorekeeper-pool",
    inviteScorekeeper: "fanhub/org/scorekeeper-pool",
    acceptScorekeeper: (memberId: string) => `fanhub/org/scorekeeper-pool/${memberId}/accept`,
    rejectScorekeeper: (memberId: string) => `fanhub/org/scorekeeper-pool/${memberId}/reject`,
    // Scorekeeper game requests — a fan asks to keep score for one game; the org reviews
    // (docs/fanhub-scorekeeper-game-request-admin.md).
    listScorekeeperRequests: "fanhub/org/scorekeeper-requests",
    acceptScorekeeperRequest: (requestId: string) => `fanhub/org/scorekeeper-requests/${requestId}/accept`,
    rejectScorekeeperRequest: (requestId: string) => `fanhub/org/scorekeeper-requests/${requestId}/reject`,
    // Videographer game requests — same shape as scorekeeper game requests
    // (docs/fanhub-videographer-game-request-admin.md).
    listVideographerRequests: "fanhub/org/videographer-requests",
    acceptVideographerRequest: (requestId: string) => `fanhub/org/videographer-requests/${requestId}/accept`,
    rejectVideographerRequest: (requestId: string) => `fanhub/org/videographer-requests/${requestId}/reject`,
    // Videographer pool — mirror of the scorekeeper pool (docs/fanhub-videographer-pool-api.md).
    listVideographerPool: "fanhub/org/videographer-pool",
    inviteVideographer: "fanhub/org/videographer-pool",
    acceptVideographer: (memberId: string) => `fanhub/org/videographer-pool/${memberId}/accept`,
    rejectVideographer: (memberId: string) => `fanhub/org/videographer-pool/${memberId}/reject`,
    revokeVideographer: (memberId: string) => `fanhub/org/videographer-pool/${memberId}`,
    // Scorekeeper — bulk-assign a fan to schedule games (PUT). Note the path is /scorekeeper
    // (singular), a sibling of /scorekeeper-pool. Body: { fanId, scheduleEventIds }.
    bulkAssignScorekeeper: "fanhub/org/scorekeeper/bulk-assign",
    // Exposure Events API integration (tournament orgs only).
    exposureSettings: "fanhub/org/exposure/settings",
    exposureSync: "fanhub/org/exposure/sync",
    exposureSyncStatus: "fanhub/org/exposure/sync/status",
    // List synced Exposure events (the FanHubSchoolEvent rows)
    listExposureEvents: "fanhub/org/exposure/events",
    // Per-event sub-resources. The :id is the FanHubSchoolEvent id (e.g. evt-uuid-1111),
    // NOT the numeric exposureEventId.
    exposureEventDivisions: (id: string) => `fanhub/org/exposure/events/${id}/divisions`,
    exposureEventGames: (id: string) => `fanhub/org/exposure/events/${id}/games`,
    exposureEventTeams: (id: string) => `fanhub/org/exposure/events/${id}/teams`,
    exposureEventStandings: (id: string) => `fanhub/org/exposure/events/${id}/standings`,
    exposureEventVenues: (id: string) => `fanhub/org/exposure/events/${id}/venues`,
    // Players for a team. The :teamId is the FanHubTeam id (e.g. team-uuid-001).
    // Note: this lives under exposure/teams/:teamId, NOT under events/:id.
    exposureTeamPlayers: (teamId: string) => `fanhub/org/exposure/teams/${teamId}/players`,
    // Fundraising campaigns — a campaign belongs to one of the school's teams (teamId).
    createCampaign: "fanhub/org/campaigns",
    // The org's teams, grouped by sport department. teams[].id is the schoolTeamId the roster calls take.
    orgDepartments: "fanhub/org/departments",
    // A team's staff (coaches): GET ?schoolTeamId= lists them, POST adds one.
    rosterStaff: "fanhub/org/roster/staff",
    // A team's roster, read-only (players with their parents): GET ?schoolTeamId=. The coach adds them in the app.
    rosterPlayers: "fanhub/org/roster/players",
    // Setup Wizard — wire these when backend is ready
    saveSchedule: "setup/schedule",
    saveActivations: "setup/activations",
    publishHub: "setup/publish",
    connectPlatform: (platform: string) => `setup/connect/${platform}`,
  },
};
