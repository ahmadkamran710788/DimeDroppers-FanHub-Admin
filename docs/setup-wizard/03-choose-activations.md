# Step 3 — Choose Activations

**Route**: `/setup-wizard/choose-activations`
**File**: `app/(setup)/setup-wizard/choose-activations/page.tsx`

## Purpose

Let the admin choose which fan experience features (activations) to enable in their Fan Hub. Activations are grouped into 3 categories.

## Activation Catalogue

### Game Day (4 activations)
| ID | Title | Recommended |
|----|-------|-------------|
| buy-tickets | Buy Tickets | ✅ |
| watch-game | Watch Game | ✅ |
| partner-offers | Partner Offers | ❌ |
| highlights-stats | Highlights & Stats | ✅ |

### Support (5 activations)
| ID | Title | Recommended |
|----|-------|-------------|
| support-team | Support a Team | ✅ |
| shout-out-wall | Shout Out Wall | ✅ |
| team-stores | Team Stores | ❌ |
| record-game | Record Game | ✅ |
| score-game | Score Game | ✅ |

### Engage (6 activations)
| ID | Title | Recommended |
|----|-------|-------------|
| predict | Predict | ✅ |
| vote | Vote | ✅ |
| arcade | Arcade | ❌ |
| challenges-quests | Challenges & Quests | ✅ |
| fan-wall | Fan Wall | ✅ |
| chat | Chat | ✅ |

## UI State

- **✅ Done**: Select/deselect individual activations; Select All / Clear All per category; live counter; summary card with total count
- **⏳ Remaining**: Pre-select recommended activations on first visit; persist selections to context/session for Step 4

## API Integration

```ts
// On "Apply" (advance to Step 4):
await apiCall({
  endpoint: routes.api.saveActivations,  // "setup/activations"
  method: "POST",
  data: {
    activationIds: Array.from(selected), // string[]
  },
});
```

## Payload Type

```ts
type ActivationsPayload = {
  activationIds: string[]; // e.g. ["buy-tickets", "watch-game", "predict", ...]
};
```

## Notes

- The activation catalogue (IDs and metadata) should eventually come from a GET endpoint so new activations can be added without a frontend deploy
- Each activation may have a `requiresPlan` or `isPremium` flag from the backend — add a locked/upgrade UI state for those
