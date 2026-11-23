import type { SearchableSelectOption } from "@/components/common/searchable-select";

// Dummy organizations for the claim form's dropdown. Swap for a real API list when the backend is wired.
export const DUMMY_ORGANIZATIONS: SearchableSelectOption[] = [
  { value: "org-1", label: "Lincoln High School", hint: "Springfield, IL" },
  { value: "org-2", label: "Riverside Academy", hint: "Austin, TX" },
  { value: "org-3", label: "Westlake Prep", hint: "Seattle, WA" },
  { value: "org-4", label: "Greenwood Tigers", hint: "Denver, CO" },
  { value: "org-5", label: "Oakmont Eagles", hint: "Columbus, OH" },
  { value: "org-6", label: "Northside Panthers", hint: "Charlotte, NC" },
  { value: "org-7", label: "Bayview Sharks", hint: "San Diego, CA" },
  { value: "org-8", label: "Summit Ridge Wolves", hint: "Phoenix, AZ" },
  { value: "org-9", label: "Clearwater Dolphins", hint: "Tampa, FL" },
  { value: "org-10", label: "Maplewood Hawks", hint: "Portland, OR" },
  { value: "org-11", label: "Fairfield United", hint: "Hartford, CT" },
  { value: "org-12", label: "Grandview Bears", hint: "Kansas City, MO" },
];
