# Step 4 — Review & Publish

**Route**: `/setup-wizard/review-publish`
**File**: `app/(setup)/setup-wizard/review-publish/page.tsx`

## Purpose

Show a summary of all wizard steps (Hub Details, Schedule, Activations) for the admin to review before publishing the Fan Hub. Includes a live preview mockup of what fans will see.

## Configuration Summary

Three collapsible review rows, each showing:
- Section icon + name
- Value summary (currently static demo text)
- Green "Complete" badge
- "Edit" link back to the respective step

| Section | Edit Links To |
|---------|--------------|
| Hub Details | `/setup-wizard/hub-details` |
| Schedule | `/setup-wizard/import-schedule` |
| Activations | `/setup-wizard/choose-activations` |

## Fan Hub Preview

A phone-style mockup showing static demo content (team header, game cards, activation buttons, tab bar). 

**⏳ Remaining**: Populate preview from actual Step 1 data (org name, color, sport, location) once cross-step state persistence is implemented.

## Publish

Currently calls `toast.success()` stub. 

```ts
// On "Publish" click:
const { success } = await apiCall({
  endpoint: routes.api.publishHub,  // "setup/publish"
  method: "POST",
  data: {
    // Could pass hubId or rely on session to know which hub to publish
  },
  showSuccessToast: true,
  successMessage: "Your Fan Hub has been published!",
});
if (success) router.push(routes.ui.indexRoute); // or a success/dashboard page
```

## UI States to Handle

- **Loading**: disable Publish button + show spinner during API call
- **Success**: redirect to dashboard or show a "Published!" confirmation screen
- **Error**: toast error + stay on page
- **Incomplete**: if backend returns that a previous step is incomplete, highlight it and block publish

## Summary Data Integration

The review rows currently show static strings. When integrating:
1. Store wizard state in React Context or a lightweight store (e.g. Zustand) across all 4 steps
2. Pull real values into the review rows from that context
3. Pass the full payload to the publish endpoint in one shot, or rely on backend to merge the saved step data

## Payload Type

```ts
type PublishPayload = {
  hubId?: string; // if a draft was created on Step 1 save
};

// Or, if publishing atomically:
type FullWizardPayload = HubDetailsPayload & {
  schedule: SchedulePayload;
  activations: ActivationsPayload;
};
```
