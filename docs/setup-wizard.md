# Setup Wizard — Integration Handoff

## Overview

The Setup Wizard is a 4-step onboarding flow for Fan Hub admins. It guides them through configuring their hub before going live.

| Step | Route | Purpose |
|------|-------|---------|
| 1 | `/setup-wizard/organization-details` | Org info, contact details, brand colors, logo |
| 2 | `/setup-wizard/import-schedule` | CSV upload, ICS calendar sync, API platform connections |
| 3 | `/setup-wizard/choose-activations` | Select fan experience features across 3 categories |
| 4 | `/setup-wizard/review-publish` | Review all settings, preview the hub, and publish |

## Architecture

```
app/(setup)/
  layout.tsx                  ← shared shell: Header + Sidebar (Server Component)
  setup-wizard/
    organization-details/page.tsx ← Step 1 (Client Component)
    import-schedule/page.tsx   ← Step 2 (Client Component)
    choose-activations/page.tsx ← Step 3 (Client Component)
    review-publish/page.tsx    ← Step 4 (Client Component)

components/
  layout/
    Header.tsx                 ← top bar (80px, glassmorphism)
    Sidebar.tsx                ← left nav (236px) with step badges
  common/
    Button.tsx                 ← variants: cta, primary, ghost, danger
    Input.tsx                  ← text input with optional leading icon
    Select.tsx                 ← styled native select with chevron
    Textarea.tsx               ← textarea with char count
    ColorPicker.tsx            ← hex input + color swatch
    FileUpload.tsx             ← drag-drop area (csv / image)
    Toggle.tsx                 ← pill toggle switch
    Modal.tsx                  ← overlay modal
    Badge.tsx                  ← status badges
    SectionCard.tsx            ← card wrapper with glass bg
    StepIndicator.tsx          ← horizontal 4-step progress bar

utils/
  routes/index.tsx             ← routes.ui.setupWizard.* + routes.api stubs
  validation/index.ts          ← validateForm / validateAndSetErrors (Yup)
  api-call/index.ts            ← client-side API wrapper (ready to wire)
  api-request/index.ts         ← server-side API wrapper (ready to wire)
```

## Status

| Area | Status | Notes |
|------|--------|-------|
| Design tokens & fonts | ✅ Done | globals.css + layout.tsx |
| Common components | ✅ Done | All 10 components built |
| Layout shell | ✅ Done | Header, Sidebar, route group |
| Step 1 — Organization Details UI | ✅ Done | Form + preview + Yup validation |
| Step 2 — Import Schedule UI | ✅ Done | CSV, ICS, API connections, modal |
| Step 3 — Choose Activations UI | ✅ Done | 15 activations across 3 categories |
| Step 4 — Review & Publish UI | ✅ Done | Summary cards + fan hub preview |
| API integration | ⏳ Remaining | See per-step docs below |
| Auth / session persistence | ⏳ Remaining | Step data needs to persist across navigation |
| File upload (real) | ⏳ Remaining | Currently local state only |
| Platform OAuth (ICS/API) | ⏳ Remaining | Modal is stubbed |

## Per-Step Integration Docs

- [Step 1 — Organization Details](./setup-wizard/01-organization-details.md)
- [Step 2 — Import Schedule](./setup-wizard/02-import-schedule.md)
- [Step 3 — Choose Activations](./setup-wizard/03-choose-activations.md)
- [Step 4 — Review & Publish](./setup-wizard/04-review-publish.md)

## API Route Stubs (utils/routes/index.tsx)

```ts
routes.api.saveOrganizationDetails  // POST  "setup/organization-details"
routes.api.saveSchedule         // POST  "setup/schedule"
routes.api.saveActivations      // POST  "setup/activations"
routes.api.publishHub           // POST  "setup/publish"
routes.api.connectPlatform(id)  // POST  "setup/connect/:platform"
```

## Design System

- **Background**: `#000000` (pure black)
- **Primary brand**: Steel Blue `#3B84C9`
- **CTA gradient**: `linear-gradient(225deg, rgba(255,52,191,1) 12%, rgba(99,139,254,1) 100%)`
- **Success**: `#65C162`
- **Error**: `#FF5257`
- **Fonts**: Inter (body), Sofia Sans Extra Condensed (headings/display)
- **Glassmorphism**: `backdrop-blur-[48px]` + semi-transparent backgrounds throughout
