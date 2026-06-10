# Step 1 — Organization Details

**Route**: `/setup-wizard/organization-details`
**File**: `app/(setup)/setup-wizard/organization-details/page.tsx`

## Purpose

Collect organization identity, contact info, and optional brand settings to configure the Fan Hub.

## Fields

### Organization & Team Info
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| organizationName | text | ✅ | required |
| teamName | text | ✅ | required |
| level | select | ✅ | required; options: High School, Middle School, College, Youth, Professional |
| sport | select | ✅ | required; options: Basketball, Football, Soccer, Baseball, Volleyball, etc. |
| location | text | ✅ | required |
| conference | text | ✅ | required |
| primaryAudience | select | ✅ | required; options: Students/Parents/Families, Students Only, General Public, Alumni |
| description | textarea | ✅ | required, max 250 chars |

### Contact Information
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| contactName | text | ✅ | required |
| phone | tel | ✅ | required |
| email | email | ✅ | required, valid email |
| website | url | ✅ | required, valid URL |

### Brand Basics (optional)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| primaryColor | color picker | ❌ | hex value; affects preview gradient |
| secondaryColor | color picker | ❌ | hex value |
| accentColor | color picker | ❌ | hex value |
| logo | file upload | ❌ | PNG/JPG/SVG, min 512×512, max 2MB |

## UI State

- **✅ Done**: Form renders, all fields controlled, Yup validation on Next click, live preview updates with org name/color/sport/location
- **⏳ Remaining**: Real logo upload (currently local File object only), persist form data to context/session for Step 4 review

## API Integration

```ts
// On "Next" click (after validation passes):
const { success } = await apiCall({
  endpoint: routes.api.saveOrganizationDetails,  // "setup/organization-details"
  method: "POST",
  data: {
    organizationName,
    teamName,
    level,
    sport,
    location,
    conference,
    primaryAudience,
    description,
    contactName,
    phone,
    email,
    website,
    primaryColor,
    secondaryColor,
    accentColor,
    // logo: FormData upload (needs multipart/form-data)
  },
  showSuccessToast: false,
});
if (success) router.push(routes.ui.setupWizard.importSchedule);
```

## Payload Type

```ts
type OrganizationDetailsPayload = {
  organizationName: string;
  teamName: string;
  level: string;
  sport: string;
  location: string;
  conference: string;
  primaryAudience: string;
  description: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string; // returned by upload endpoint
};
```

## Notes

- Logo upload likely needs a separate upload endpoint returning a URL before the main save
- primaryColor drives the preview card gradient — keep real-time preview working after API wiring
