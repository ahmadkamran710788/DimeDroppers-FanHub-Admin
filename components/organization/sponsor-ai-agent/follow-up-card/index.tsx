"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Mail, Paperclip, Pencil, X } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Input from "@/components/common/input";
import StatusPill from "@/components/common/status-pill";
import Textarea from "@/components/common/textarea";
import PackageCard from "@/components/sponsor/find-organizations/package-card";
import { STATUS_STYLE, THREAD_STYLE, toSponsorPackage } from "@/components/organization/sponsor-ai-agent/data";
import { draftEditSchema } from "@/components/organization/sponsor-ai-agent/schema";
import { routes } from "@/utils/routes";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import type { EditDraftBody, SponsorDraft } from "@/utils/types/sponsor-ai";

// The square outlined look of the Edit and Reject icon buttons.
const ICON_BUTTON = "size-12 rounded-[8px] border border-white/20 bg-white/5 hover:bg-white/10";
const CHIP = "rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-white/70";

interface FollowUpCardProps {
  draft: SponsorDraft;
  // Each resolves true when it went through.
  onEdit: (id: string, changes: EditDraftBody) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  // Sends the email to the business.
  onApprove: (id: string) => Promise<boolean>;
}

// One drafted follow-up email: the business and why it fits, who it's to, the message, its actions and
// the packages it carries. Only a draft still waiting for review can be edited or rejected.
export default function FollowUpCard({ draft, onEdit, onReject, onApprove }: FollowUpCardProps) {
  const router = useRouter();
  const { business, contact, message } = draft;
  // An approved draft shows where its thread is: sent, replied or stopped.
  const style = (draft.reviewStatus === "APPROVED" && THREAD_STYLE[draft.threadStatus]) || STATUS_STYLE[draft.reviewStatus];
  const pending = draft.reviewStatus === "PENDING";
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  const to = contact
    ? `To: ${[contact.name, contact.title].filter(Boolean).join(", ") || "Unknown contact"}${contact.email ? ` · ${contact.email}` : ""}`
    : "No contact found";

  function startEditing() {
    setSubject(message?.subject ?? "");
    setBody(message?.body ?? "");
    setErrors({});
    setEditing(true);
  }

  async function save() {
    if (!(await validateAndSetErrors(draftEditSchema, { subject, body }, setErrors))) return;
    // Only what changed is sent.
    const changes: EditDraftBody = {};
    if (subject.trim() !== (message?.subject ?? "")) changes.subject = subject.trim();
    if (body.trim() !== (message?.body ?? "")) changes.body = body.trim();
    if (!changes.subject && !changes.body) return setEditing(false);
    setSaving(true);
    const saved = await onEdit(draft.id, changes);
    setSaving(false);
    if (saved) setEditing(false);
  }

  return (
    <article
      aria-label={`Follow-up to ${business.name}`}
      className="rounded-[12px] border border-white/10 bg-black/30 p-4 lg:p-5 flex flex-col gap-5"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Mail className="size-4 text-white/60" aria-hidden="true" />
            <span className="font-medium">Email</span>
            <StatusPill
              label={style.label}
              color={style.color}
              className="h-auto px-2 py-1"
              textClassName={cn("text-xs font-bold whitespace-nowrap", style.text)}
            />
            {message?.humanEdited && (
              <StatusPill label="Edited" color="bg-white/10" className="h-auto px-2 py-1" textClassName="text-xs font-bold text-white/80" />
            )}
            <span className="text-white/70">{`→ ${business.name}`}</span>
            <span className={CHIP}>
              {[business.category, business.distanceMiles != null && `${business.distanceMiles} mi`].filter(Boolean).join(" · ")}
            </span>
            <StatusPill
              label={`Fit ${business.fitScore}`}
              color="bg-[#2a2148]"
              className="h-auto px-2 py-1"
              textClassName="text-xs font-bold text-[#d9ccff]"
            />
            {draft.event?.name && <span className={CHIP}>{draft.event.name}</span>}
          </div>
          <p className="text-sm text-white/60">{to}</p>
          {business.fitReasons.length > 0 && (
            <ul aria-label="Why it fits" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50 list-disc pl-4">
              {business.fitReasons.slice(0, 3).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
          {editing ? (
            <div className="flex flex-col gap-3 pt-1">
              <Input
                label="Subject"
                name={`follow-up-subject-${draft.id}`}
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: "" }));
                }}
                maxLength={90}
                variant="dark"
                error={errors.subject}
                labelClassName="text-sm font-normal text-white/70"
              />
              <Textarea
                label="Email"
                name={`follow-up-body-${draft.id}`}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (errors.body) setErrors((prev) => ({ ...prev, body: "" }));
                }}
                rows={12}
                maxLength={5000}
                fieldVariant="dark"
                error={errors.body}
                labelClassName="text-sm font-normal text-white/70"
                fieldClassName="text-sm font-normal leading-[1.55] resize-y"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" size="sm" label="Cancel" onClick={() => setEditing(false)} disabled={saving} className="h-10 px-4" />
                <Button
                  variant="cta"
                  size="sm"
                  label={saving ? "Saving…" : "Save changes"}
                  icon={<Check className="size-4" strokeWidth={2.4} />}
                  onClick={save}
                  disabled={saving}
                  className="h-10 px-4"
                />
              </div>
            </div>
          ) : (
            <>
              <h4 className="text-lg font-semibold">{message?.subject || "No subject"}</h4>
              <p className="text-sm leading-[1.55] text-white/85 whitespace-pre-line">{message?.body}</p>
            </>
          )}
        </div>

        {pending && (
          <div className="flex gap-2 items-start md:justify-end shrink-0">
            <Button
              variant="secondary"
              label="Approve"
              icon={<Check className="size-5" strokeWidth={2.4} />}
              onClick={() => setConfirmApprove(true)}
              disabled={saving || editing}
              className="min-w-0 px-5 font-semibold"
            />
            {!editing && (
              <Button
                size="icon"
                icon={<Pencil className="size-5" strokeWidth={1.8} />}
                aria-label="Edit message"
                onClick={startEditing}
                className={cn(ICON_BUTTON, "text-white")}
              />
            )}
            <Button
              size="icon"
              icon={<X className="size-5" strokeWidth={2} />}
              aria-label="Reject message"
              onClick={() => setConfirmReject(true)}
              disabled={saving}
              className={cn(ICON_BUTTON, "text-error")}
            />
          </div>
        )}
      </div>

      {draft.packages.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 text-xs font-bold tracking-[1.2px] text-white/60">
            <Paperclip className="size-3.5" aria-hidden="true" />
            SPONSORSHIP PACKAGES IN THIS MESSAGE
          </span>
          {draft.recommendation && <p className="text-xs text-white/60">{draft.recommendation.reason}</p>}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {draft.packages.map((p) => (
              <PackageCard key={p.tier} pkg={toSponsorPackage(p)} recommended={p.recommended} slotLimit={4} />
            ))}
          </div>
        </div>
      )}

      {draft.reviewStatus === "APPROVED" && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-[8px] border px-4 py-3 text-sm",
            draft.threadStatus === "STOPPED"
              ? "border-[#ffc999]/40 bg-[#3d2a12]/60 text-[#ffc999]"
              : "border-success/40 bg-[#1d3a1e]/60 text-[#a3e3a5]"
          )}
        >
          <span className="flex-1 min-w-[220px]">
            {draft.threadStatus === "STOPPED"
              ? "Stopped. No more emails go to this contact: they unsubscribed, the address bounced or it was reported as spam."
              : draft.threadStatus === "REPLIED"
                ? "The sponsor replied. The thread is in Sponsor Messages, where the agent handles the replies."
                : "Sent. The thread moved to Sponsor Messages, where the agent handles the replies."}
            {` Last activity ${new Date(draft.updatedAt).toLocaleString()}.`}
          </span>
          {draft.threadStatus !== "STOPPED" && (
            <Button
              size="sm"
              variant="outline"
              label="Open in Sponsor Messages"
              icon={<ArrowRight className="size-4" />}
              iconPosition="end"
              onClick={() => router.push(routes.ui.sponsorMessagesThread(draft.id))}
              className="h-10 px-4 text-sm border-success/60 text-[#a3e3a5] hover:bg-success/10"
            />
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        title="Send this email?"
        message={`This sends a real email to ${contact?.name ?? "the contact"} at ${business.name}${contact?.email ? ` (${contact.email})` : ""}. It can't be undone.`}
        confirmLabel="Send email"
        busyLabel="Sending…"
        onConfirm={() => onApprove(draft.id)}
      />

      <ConfirmModal
        isOpen={confirmReject}
        onClose={() => setConfirmReject(false)}
        title="Reject this draft?"
        message={`The email to ${business.name} won't be sent, and the agent won't suggest this business again.`}
        confirmLabel="Reject"
        busyLabel="Rejecting…"
        onConfirm={() => onReject(draft.id)}
        destructive
      />
    </article>
  );
}
