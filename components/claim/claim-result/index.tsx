import Link from "next/link";
import { Check, X } from "lucide-react";

import AuthCard from "@/components/auth/auth-card";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";

interface ClaimResultProps {
  status: "success" | "failure";
}

const CONTENT = {
  success: {
    title: "You're all set",
    message: "Your request has been submitted. We'll email you the next steps to finish claiming your hub.",
    ctaLabel: "Go to sign in",
    ctaHref: routes.ui.signIn,
    secondaryLabel: "Submit another",
    secondaryHref: routes.ui.fanhubClaim,
  },
  failure: {
    title: "Something went wrong",
    message: "We couldn't submit your request. Please check your details and try again.",
    ctaLabel: "Try again",
    ctaHref: routes.ui.fanhubClaim,
    secondaryLabel: "Back to sign in",
    secondaryHref: routes.ui.signIn,
  },
} as const;

// Shared success / failure screen for the claim flow. Both pages render this with a different status.
export default function ClaimResult({ status }: ClaimResultProps) {
  const isSuccess = status === "success";
  const content = CONTENT[status];

  return (
    <AuthCard size="sm" aria-labelledby="claim-result-title" className="items-center text-center">
      <div
        className={cn(
          "flex items-center justify-center size-20 rounded-full",
          isSuccess ? "bg-success/15 text-success" : "bg-error/15 text-error"
        )}
      >
        {isSuccess ? (
          <Check className="size-10" strokeWidth={2.5} />
        ) : (
          <X className="size-10" strokeWidth={2.5} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h1 id="claim-result-title" className="font-display font-black text-[36px] uppercase leading-none text-white">
          {content.title}
        </h1>
        <p className="text-[#a1a1aa]">{content.message}</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Link
          href={content.ctaHref}
          className="flex h-[50px] w-full items-center justify-center rounded-[10px] text-[17px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--gradient-cta)" }}
        >
          {content.ctaLabel}
        </Link>
        <Link
          href={content.secondaryHref}
          className="flex h-[50px] w-full items-center justify-center rounded-[10px] border border-[#638BFE]/80 text-[17px] font-medium text-white transition-colors hover:bg-white/5"
        >
          {content.secondaryLabel}
        </Link>
      </div>
    </AuthCard>
  );
}
