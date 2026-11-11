import { Check } from "lucide-react";
import { routes } from "@/utils/routes";
import AuthCard from "@/components/auth/auth-card";
import AuthShell from "@/components/auth/auth-shell";

interface DoneScreenProps {
  fullName: string;
  organizationName: string;
}

// After "Create organization account": the organisation is signed in and its Fan Hub is set up. Full page
// loads (not client navigation), so the organisation panel starts from the new session.
export default function DoneScreen({ fullName, organizationName }: DoneScreenProps) {
  const firstName = fullName.trim().split(/\s+/)[0] ?? "";

  return (
    <AuthShell>
      <AuthCard size="md" role="status" aria-labelledby="org-done-title">
        <span className="size-14 rounded-full bg-[#052e16] border border-[#14532d] flex items-center justify-center">
          <Check className="size-[26px] text-[#22c55e]" strokeWidth={2.6} aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 id="org-done-title" tabIndex={-1} className="font-display font-black uppercase text-[40px] leading-none outline-none">
            Account created
          </h1>
          <p className="text-[#a1a1aa] leading-[1.5] break-words">
            {firstName && `Welcome, ${firstName}. `}Your Fan Hub for {organizationName} is set up. Next, import your
            schedule and choose your activations.
          </p>
        </div>
        <a
          href={routes.ui.importSchedule}
          className="min-h-[50px] rounded-[10px] bg-[image:var(--gradient-cta)] text-white text-[17px] font-medium flex items-center justify-center px-6"
        >
          Import your schedule →
        </a>
        <a href={routes.ui.profile} className="self-center text-[#8b9bff] font-medium underline underline-offset-[3px] hover:text-[#b4c0ff]">
          Go to your profile
        </a>
      </AuthCard>
    </AuthShell>
  );
}
