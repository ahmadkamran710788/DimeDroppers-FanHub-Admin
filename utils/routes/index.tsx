export const routes = {
  ui: {
    indexRoute: "/",
    userDetails: (id: string | number) => `users/${id}`,
    setupWizard: {
      organizationDetails: "/setup-wizard/organization-details",
      importSchedule: "/setup-wizard/import-schedule",
      chooseActivations: "/setup-wizard/choose-activations",
      reviewPublish: "/setup-wizard/review-publish",
    },
  },

  api: {
    getArea: "areas",
    editArea: (id: string | number) => `areas/${id}`,
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
    // Setup Wizard — wire these when backend is ready
    saveSchedule: "setup/schedule",
    saveActivations: "setup/activations",
    publishHub: "setup/publish",
    connectPlatform: (platform: string) => `setup/connect/${platform}`,
  },
};
