export const routes = {
  ui: {
    indexRoute: "/",
    userDetails: (id: string | number) => `users/${id}`,
    setupWizard: {
      hubDetails: "/setup-wizard/hub-details",
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
    // Setup Wizard — wire these when backend is ready
    saveSchedule: "setup/schedule",
    saveActivations: "setup/activations",
    publishHub: "setup/publish",
    connectPlatform: (platform: string) => `setup/connect/${platform}`,
  },
};
