export const routes = {
  ui: {
    indexRoute: "/",
    profile: "/profile",
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    // Sponsor sign-up (UI only until the sponsor sign-up API is wired).
    sponsorSignUp: "/auth/sponsor-sign-up",
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
    inventory: "/inventory",
    teams: "/teams",
    addTeam: "/teams/add",
    teamDetails: (teamId: string) => `/teams/${teamId}`,
    // A tournament team (Exposure team of one event): players, parents, staff, followers, stats, schedule.
    tournamentTeam: (eventId: string, teamId: string) => `/teams/events/${eventId}/${teamId}`,
    buyTickets: "/buy-tickets",
    fundraising: "/fundraising",
    communications: "/communications",
    // The Communications chat under an "Inbox" title; ?chat= opens one conversation (the header
    // messages box links here).
    inbox: "/inbox",
    inboxChat: (conversationId: string) => `/inbox?chat=${conversationId}`,
    fanhubAi: "/fanhub-ai",
    commandCenter: "/command-center",
    // Tournament: one event's divisions, venues, standings and brackets (event picked at the top).
    divisions: "/divisions",
    venues: "/venues",
    standings: "/standings",
    brackets: "/brackets",
    engagement: "/engagement",
    createFundraisingCampaign: "/fundraising/create",
    editFundraisingCampaign: (id: string) => `/fundraising/${id}/edit`,
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
    // Beside /sponsors, not under it, so the Sponsors nav item doesn't light up on these too.
    sponsorAiAgent: "/sponsor-ai-agent",
    sponsorMessages: "/sponsor-messages",
    sponsorMessagesThread: (sponsorId: string) => `/sponsor-messages?thread=${sponsorId}`,
    userDetails: (id: string | number) => `users/${id}`,
    setupWizard: {
      // Every setup step starts with this; the organization layout leaves these pages full-screen.
      base: "/setup-wizard",
      organizationDetails: "/setup-wizard/organization-details",
    },
    // Sponsor role (app/(sponsor)). Sponsorships is where a sponsor lands after sign-in.
    sponsor: {
      fundableNeeds: "/sponsor/fundable-needs",
      // Campaign Planner (national accounts) and Find Organizations, as tabs; ?tab= picks one.
      sponsorships: "/sponsor/sponsorships",
      findOrganizations: "/sponsor/sponsorships?tab=find",
      brandAssets: "/sponsor/brand-assets",
      cart: "/sponsor/cart",
      mySponsorships: "/sponsor/my-sponsorships",
      profile: "/sponsor/profile",
    },
  },

  api: {
    // Command Center: GET the stat cards + Event Readiness, the live games strip (?limit=) and a game's recap.
    commandCenterOverview: "fanhub/org/command-center/overview",
    commandCenterLiveGames: "fanhub/org/command-center/live-games",
    commandCenterGameRecap: (scheduleEventId: string) => `fanhub/org/command-center/games/${scheduleEventId}/recap`,
    // Media → a school game's recap, insights and thread (docs ORG_GAME_RECAP_THREAD_FRONTEND).
    gameDetailRecap: (scheduleEventId: string) => `fanhub/org/game-detail/games/${scheduleEventId}/recap`,
    gameDetailInsights: (scheduleEventId: string) => `fanhub/org/game-detail/games/${scheduleEventId}/insights`,
    gameDetailThread: (scheduleEventId: string) => `fanhub/org/game-detail/games/${scheduleEventId}/thread`,
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
    // The signed-in organisation (GET, Bearer access token). Called straight from the browser
    // on load to restore the session after a refresh or in a new tab.
    authMe: "fanhub/org-auth/me",
    // FanHub — Step 1 "Create School" (multipart: form fields + logo).
    createSchool: "fanhub/schools",
    // FanHub — Step 1 "Update School" (when the user comes Back and re-submits an
    // already-created school).
    updateSchool: (schoolId: string) => `fanhub/schools/${schoolId}`,
    // FanHub — Setup Wizard rehydrate: the school plus its schedule events.
    getSchool: (schoolId: string, schedule = 5) => `fanhub/schools/${schoolId}?schedule=${schedule}`,
    // FanHub — Step 2 "Import Schedule": preview an ICS feed, then import it into the school.
    icsSportsEngine: "fanhub/ics/sportsengine",
    icsTeamSnap: "fanhub/ics/teamsnap",
    importIcs: (schoolId: string) => `fanhub/schools/${schoolId}/import-ics`,
    // FanHub — Step 2 "Upload schedule (pdf/jpg/png)": multipart form-data with the file.
    scrapeMaxpreps: (schoolId: string) => `fanhub/scrape/maxpreps/${schoolId}`,
    // FanHub — Step 3 "Choose Activations": PATCH the school's feature-link URLs.
    featureLinks: (schoolId: string) => `fanhub/schools/${schoolId}/feature-links`,
    // External Links → "Test Connection" (server-side reachability check).
    proxyCheckExternalLink: "/api/external-links/check",
    // FanHub org endpoints (fanhub/org/*). The browser calls these straight on the backend:
    // apiCall / backendFetch (utils/api-call) attach the Bearer access token. No Next route
    // in between — they work with the token alone, no x-fanhub-key.
    //
    // Schedule CRUD
    listSchedules: "fanhub/org/schedules",
    // GET: game rows only (no Practice / Travel / Other); `data[0].schedules` with home/away sides.
    listScheduleGames: "fanhub/org/schedules/games",
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
    // Tournament Teams page: a page of events, each with its divisions and their teams
    // (?page=&limit= up to 50, newest first; ?search= filters team names; ?eventId=, ?divisionId=).
    exposureEventsDivisionTeams: "fanhub/org/exposure/events/division-teams",
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
    // Tournament only: games filtered by ?eventId=&divisionId=&teamId=&status=&date=&search=&page=&limit= (teams by id).
    exposureSchedules: "fanhub/org/exposure/schedules",
    // Tournament only: one team's record, points, streak, standings row and game-by-game results.
    exposureTeamStats: (teamId: string) => `fanhub/org/exposure/teams/${teamId}/stats`,
    // Fundraising campaigns — a campaign belongs to one of the school's teams (teamId).
    // GET lists them (?status=&teamId=&search=&page=&limit=, plus per-status counts); POST creates one.
    campaigns: "fanhub/org/campaigns",
    // One campaign: GET reads it, PATCH edits it (or launches / ends / reopens it via status),
    // DELETE removes a draft for good and cancels anything else.
    campaign: (id: string) => `fanhub/org/campaigns/${id}`,
    // Organisation-wide fundraising totals (raised, donors, campaigns per status, last 30 days).
    campaignStats: "fanhub/org/campaigns/stats",
    // Every team of the org with its paid-donation totals (gross, net, count), teams that raised nothing included.
    donationsByTeam: "fanhub/org/donations/by-team",
    // A tournament event's donations: summary, games with campaigns, and paid donations (?page=&limit=).
    // A tournament event's teams for a team campaign (no game): GET ?search=&divisionId=, all at once.
    // A tournament event's teams, each with its campaigns and what they raised (?search=&divisionId=&status=&hasCampaigns=).
    tournamentTeamDonations: (eventId: string) => `fanhub/org/campaigns/tournament/events/${eventId}/team-donations`,
    // Create (POST) and edit (PATCH) a tournament team campaign.
    tournamentCampaigns: "fanhub/org/campaigns/tournament",
    tournamentCampaign: (id: string) => `fanhub/org/campaigns/tournament/${id}`,
    tournamentCampaignTeams: (eventId: string) => `fanhub/org/campaigns/tournament/events/${eventId}/teams`,
    eventDonations: (eventId: string) => `fanhub/org/donations/events/${eventId}`,
    // Engagement console (FANHUB_ORG_ENGAGEMENT_ADMIN.md): the five cards and the Campaign Types rows.
    engagementOverview: "fanhub/org/engagement/overview",
    // PATCH the switches on one type: PREDICTION, VOTING or CHALLENGE.
    engagementType: (type: string) => `fanhub/org/engagement/types/${type}`,
    // A tab's cards and the school's campaigns: GET ?search=&status=&page=&limit= (≤ 100).
    engagementPredictions: "fanhub/org/engagement/predictions",
    engagementVoting: "fanhub/org/engagement/voting",
    engagementChallenges: "fanhub/org/engagement/challenges",
    // PATCH one campaign's switches (multiplier, threshold, hide numbers) or its status.
    predictionCampaign: (id: string) => `fanhub/org/prediction-campaigns/${id}`,
    votingCampaign: (id: string) => `fanhub/org/voting-campaigns/${id}`,
    challenge: (id: string) => `fanhub/org/challenges/${id}`,
    // Buy Tickets (FANHUB_TICKETS_ADMIN.md). The four cards and every ticket campaign.
    ticketOverview: "fanhub/org/tickets/overview",
    // GET lists every campaign (`data` is the list; ?status=&scheduleEventId=); POST creates one:
    // title, ticket types and games (a game sells through one campaign).
    ticketCampaigns: "fanhub/org/tickets/campaigns",
    // PATCH edits the title, status or the whole ticket-type list; DELETE deactivates it.
    ticketCampaign: (id: string) => `fanhub/org/tickets/campaigns/${id}`,
    // POST { scheduleEventIds } attaches more games (already attached: skipped; in another active campaign: 409).
    ticketCampaignGames: (campaignId: string) => `fanhub/org/tickets/campaigns/${campaignId}/games`,
    // DELETE detaches a game from a campaign (409 once tickets were sold for it).
    ticketCampaignGame: (campaignId: string, scheduleEventId: string) =>
      `fanhub/org/tickets/campaigns/${campaignId}/games/${scheduleEventId}`,
    // Sales list, newest first: GET ?campaignId=&scheduleEventId=&status=&search=&page=&limit=.
    ticketOrders: "fanhub/org/tickets/orders",
    // One game's tickets sold vs scanned at the gate, per ticket type.
    ticketGameAttendance: (scheduleEventId: string) => `fanhub/org/tickets/games/${scheduleEventId}/attendance`,
    // The Schedules table: GET ?search=&status=all|on-sale|not-on-sale|ended&page=&limit=.
    ticketGames: "fanhub/org/tickets/games",
    // The org's teams, grouped by sport department. teams[].id is the schoolTeamId the roster calls take.
    orgDepartments: "fanhub/org/departments",
    // A sport (department): POST orgDepartments adds one { name }; PATCH renames it.
    orgDepartment: (departmentId: string) => `fanhub/org/departments/${departmentId}`,
    // POST adds a team { sport, name, level?, gender? } (an unknown sport is created with it).
    orgTeams: "fanhub/org/teams",
    // PATCH edits a team: any of name, level, gender, sport (moves it to that sport).
    orgTeam: (teamId: string) => `fanhub/org/teams/${teamId}`,
    // A team's staff (coaches): GET ?schoolTeamId= lists them, POST adds one.
    rosterStaff: "fanhub/org/roster/staff",
    // One staff entry: PATCH edits it, DELETE removes it from the staff list.
    rosterStaffMember: (staffId: string) => `fanhub/org/roster/staff/${staffId}`,
    // POST invites the fan with the entry's email (again after a decline/withdraw/expiry);
    // DELETE withdraws a pending invitation.
    rosterStaffInvite: (staffId: string) => `fanhub/org/roster/staff/${staffId}/invite`,
    // A team's roster, read-only (players with their parents): GET ?schoolTeamId=. The coach adds them in the app.
    rosterPlayers: "fanhub/org/roster/players",
    // Fans following a team, each tagged PLAYER / PARENT / STAFF / FAN: GET ?schoolTeamId=&page=&limit=.
    rosterFollowers: "fanhub/org/roster/followers",
    // Activations — the sponsor slots the org sells (FANHUB_ACTIVATIONS_FRONTEND.md).
    // GET: the slot list for the org's type (School vs Tournament list).
    activationCatalog: "fanhub/org/activations/catalog",
    // GET the inventory (404 = none yet), POST creates it, PUT saves the whole of it.
    activationInventory: "fanhub/org/activations",
    // A tournament has one inventory per event: GET/PUT the inventory with ?eventId=, and this lists the
    // events for the picker with each one's set-up status (FANHUB_ACTIVATIONS_EVENT_INVENTORIES_FRONTEND).
    activationEventInventory: (eventId: string) => `fanhub/org/activations?eventId=${encodeURIComponent(eventId)}`,
    activationEvents: "fanhub/org/activations/events",
    // Sponsor app (sponsor token): find organisations, their packages, and activate one
    // (FANHUB_SPONSOR_PACKAGES_FRONTEND.md, FANHUB_SPONSOR_APP_INTEGRATION.md).
    sponsorFilters: "fanhub/sponsor-packages/filters",
    sponsorOrganizations: "fanhub/sponsor-packages/organizations",
    sponsorOrgEvents: (schoolId: string) => `fanhub/sponsor-packages/organizations/${schoolId}/events`,
    sponsorOrgPackages: (schoolId: string) => `fanhub/sponsor-packages/organizations/${schoolId}/packages`,
    sponsorActivations: "fanhub/sponsor-packages/activations",
    sponsorActivationCancel: (id: string) => `fanhub/sponsor-packages/activations/${id}/cancel`,
    // The cart: price it now, then activate every item at once, all or nothing
    // (FANHUB_SPONSOR_CART_GENDER_PHYSICAL_ASSETS_FRONTEND.md).
    sponsorCartQuote: "fanhub/sponsor-packages/activations/quote",
    sponsorCartActivate: "fanhub/sponsor-packages/activations/batch",
    // The organisation's own view (organiser token): its packages as sponsors see them (?eventId= for a
    // tournament), its events, and who activated what.
    orgSponsorPackages: "fanhub/org/sponsor-packages/packages",
    orgSponsorEvents: "fanhub/org/sponsor-packages/events",
    orgSponsorActivations: "fanhub/org/sponsor-packages/activations",
    // Recognition & Fan Wall: fans' photobooth images and the wall the org builds from them
    // (FANHUB_ORG_PHOTOBOOTH_FAN_WALL_FRONTEND.md).
    photoboothJobs: "fanhub/org/photobooth/jobs",
    fanWall: "fanhub/org/fan-wall",
    fanWallItems: "fanhub/org/fan-wall/items",
    fanWallItem: (itemId: string) => `fanhub/org/fan-wall/items/${itemId}`,
    fanWallReorder: "fanhub/org/fan-wall/reorder",
    // Messages — the org chats with the people of its teams (FANHUB_ORG_CHAT_ADMIN.md).
    // Who can be messaged, per tab (players / parents / staff / followers): GET ?tab=&search=.
    orgChatTeamMembers: (schoolTeamId: string) => `fanhub/org/chat/teams/${schoolTeamId}/members`,
    // The org's conversations, newest activity first: GET ?schoolTeamId= (all teams without it).
    orgChatConversations: "fanhub/org/chat/conversations",
    // POST opens (or reuses) a direct chat with one fan of the team.
    orgChatDirect: "fanhub/org/chat/conversations/direct",
    // POST creates a group with a tab, everyone (ALL) or chosen fans (CUSTOM). Not idempotent.
    orgChatGroup: "fanhub/org/chat/conversations/group",
    orgChatConversation: (id: string) => `fanhub/org/chat/conversations/${id}`,
    // GET ?limit=&before= pages back (each page oldest first); POST sends as the org.
    orgChatMessages: (id: string) => `fanhub/org/chat/conversations/${id}/messages`,
    // POST marks the conversation read, so its unreadCount drops to 0.
    orgChatRead: (id: string) => `fanhub/org/chat/conversations/${id}/read`,
    // Setup Wizard — wire these when backend is ready
    saveSchedule: "setup/schedule",
    saveActivations: "setup/activations",
    publishHub: "setup/publish",
    connectPlatform: (platform: string) => `setup/connect/${platform}`,
  },
};
