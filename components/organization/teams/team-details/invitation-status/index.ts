// Where a staff member's, player's or parent's Fan Hub invitation stands (roster API).
export type InvitationStatus = "NONE" | "INVITED" | "ACTIVE" | "DECLINED" | "REVOKED";

// Shown in the Status column.
export const INVITATION_LABEL: Record<InvitationStatus, string> = {
  NONE: "Not Invited",
  INVITED: "Invited",
  ACTIVE: "Active",
  DECLINED: "Declined",
  REVOKED: "Withdrawn",
};

// Status pill color for a label from INVITATION_LABEL.
export const invitationColor = (label: string) =>
  label === "Active" ? "bg-success" : label === "Invited" ? "bg-steel-blue" : "bg-white/30";
