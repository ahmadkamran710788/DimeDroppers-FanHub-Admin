import { routes } from "@/utils/routes";

// Single source of truth for the Setup Wizard steps — used by the page StepIndicator and
// the Sidebar progress list. Schedule import lives on the Schedule page, not the wizard.
export const WIZARD_STEPS = [
  { number: 1, label: "Organization Details", href: routes.ui.setupWizard.organizationDetails },
  { number: 2, label: "Choose Activations", href: routes.ui.setupWizard.chooseActivations },
  { number: 3, label: "Review & Publish", href: routes.ui.setupWizard.reviewPublish },
] as const;

export type WizardStepNumber = (typeof WIZARD_STEPS)[number]["number"];

// Step number for a wizard URL; defaults to step 1.
export function wizardStepFromUrl(url: string): WizardStepNumber {
  return WIZARD_STEPS.find((s) => url.includes(s.href))?.number ?? 1;
}
