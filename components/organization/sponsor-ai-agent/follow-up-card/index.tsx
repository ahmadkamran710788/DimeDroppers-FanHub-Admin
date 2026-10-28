"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Mail, Paperclip, Pencil, X } from "lucide-react";
import Button from "@/components/common/button";
import StatusPill from "@/components/common/status-pill";
import Textarea from "@/components/common/textarea";
import PackageCard from "@/components/sponsor/find-organizations/package-card";
import { SAMPLE_PACKAGES, STATUS_STYLE, type AgentSponsor } from "@/components/organization/sponsor-ai-agent/data";
import { useSponsorAgent } from "@/context/sponsor-agent";
import { routes } from "@/utils/routes";
import { cn } from "@/utils/cn";

// The square outlined look of the Edit and Reject icon buttons.
const ICON_BUTTON = "size-12 rounded-[8px] border border-white/20 bg-white/5 hover:bg-white/10";

interface FollowUpCardProps {
  sponsor: AgentSponsor;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}

// One drafted follow-up email: who it's to, the message, its actions and the packages it carries.
export default function FollowUpCard({ sponsor, editing, onEditingChange }: FollowUpCardProps) {
  const router = useRouter();
  const { event, statusOf, setStatus, bodyOf, setBody } = useSponsorAgent();
  const status = statusOf(sponsor.id);
  const style = STATUS_STYLE[status];

  function approve() {
    setStatus(sponsor.id, "sent");
    onEditingChange(false);
  }

  return (
    <article
      aria-label={`Follow-up to ${sponsor.business}`}
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
            <span className="text-white/70">{`→ ${sponsor.business}`}</span>
            <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-white/70">
              {`${sponsor.category} · ${sponsor.miles} mi`}
            </span>
          </div>
          <p className="text-sm text-white/60">{`To: ${sponsor.contact}, ${sponsor.role} · ${sponsor.email}`}</p>
          <h4 className="text-lg font-semibold">{`Sponsor the ${event.name} (${event.dates})`}</h4>
          {editing ? (
            <Textarea
              label="Edit message"
              name={`follow-up-${sponsor.id}`}
              value={bodyOf(sponsor)}
              onChange={(e) => setBody(sponsor.id, e.target.value)}
              rows={12}
              maxLength={4000}
              fieldVariant="dark"
              showCounter={false}
              labelClassName="text-sm font-normal text-white/70"
              fieldClassName="text-sm font-normal leading-[1.55] resize-y"
            />
          ) : (
            <p className="text-sm leading-[1.55] text-white/85 whitespace-pre-line">{bodyOf(sponsor)}</p>
          )}
        </div>

        <div className="flex gap-2 items-start md:justify-end shrink-0">
          {status === "draft" && (
            <>
              <Button
                variant="secondary"
                label="Approve"
                icon={<Check className="size-5" strokeWidth={2.4} />}
                onClick={approve}
                className="min-w-0 px-5 font-semibold"
              />
              <Button
                size="icon"
                icon={editing ? <Check className="size-5" strokeWidth={2.2} /> : <Pencil className="size-5" strokeWidth={1.8} />}
                aria-label={editing ? "Done editing" : "Edit message"}
                onClick={() => onEditingChange(!editing)}
                className={cn(ICON_BUTTON, "text-white")}
              />
              <Button
                size="icon"
                icon={<X className="size-5" strokeWidth={2} />}
                aria-label="Reject message"
                onClick={() => setStatus(sponsor.id, "rejected")}
                className={cn(ICON_BUTTON, "text-error")}
              />
            </>
          )}
          {status === "rejected" && <Button label="Restore draft" onClick={() => setStatus(sponsor.id, "draft")} />}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="flex items-center gap-2 text-xs font-bold tracking-[1.2px] text-white/60">
          <Paperclip className="size-3.5" aria-hidden="true" />
          SPONSORSHIP PACKAGES IN THIS MESSAGE
        </span>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SAMPLE_PACKAGES.map((p) => (
            <PackageCard key={p.tier} pkg={p} recommended={p.tier === sponsor.tier} slotLimit={4} />
          ))}
        </div>
      </div>

      {status === "sent" && (
        <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-success/40 bg-[#1d3a1e]/60 px-4 py-3 text-sm text-[#a3e3a5]">
          <span className="flex-1 min-w-[220px]">Sent. The thread moved to Sponsor Messages, where the agent handles the replies.</span>
          <Button
            size="sm"
            variant="outline"
            label="Open in Sponsor Messages"
            icon={<ArrowRight className="size-4" />}
            iconPosition="end"
            onClick={() => router.push(routes.ui.sponsorMessagesThread(sponsor.id))}
            className="h-10 px-4 text-sm border-success/60 text-[#a3e3a5] hover:bg-success/10"
          />
        </div>
      )}
    </article>
  );
}
