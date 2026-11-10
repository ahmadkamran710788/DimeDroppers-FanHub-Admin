import Link from "next/link";
import type { ReactNode } from "react";
import { Briefcase, Building2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import AuthCard, { AUTH_LINK } from "@/components/auth/auth-card";

interface AccountChoice {
  href: string;
  icon: ReactNode;
  // The icon's circle and the call to action's colour.
  circle: string;
  ctaColor: string;
  title: string;
  description: string;
  cta: string;
}

const CHOICES: AccountChoice[] = [
  {
    href: routes.ui.organizationSignUp,
    icon: <Building2 className="size-6" strokeWidth={1.7} aria-hidden />,
    circle: "bg-[#4338ca]",
    ctaColor: "text-[#8ea2ff]",
    title: "I’m an organization",
    description:
      "Tournaments, schools, club teams and leagues. Build your Fan Hub, find sponsors and fund your needs.",
    cta: "Sign up as an organization →",
  },
  {
    href: routes.ui.sponsorSignUp,
    icon: <Briefcase className="size-6" strokeWidth={1.7} aria-hidden />,
    circle: "bg-[#be185d]",
    ctaColor: "text-[#f9a8d4]",
    title: "I’m a sponsor",
    description: "Brands and local businesses. Find organizations, activate sponsorship packages and fund needs.",
    cta: "Sign up as a sponsor →",
  },
];

// The sign-up entry point (from "Create one" on the sign-in page): pick an organization or a sponsor
// account, then that account's own sign-up opens.
export default function SignUpChoice() {
  return (
    <AuthCard size="lg" aria-labelledby="choose-title" className="gap-[26px]">
      <div className="flex flex-col gap-2">
        <h1 id="choose-title" className="font-display font-black text-[40px] uppercase leading-none text-white">
          Create an account
        </h1>
        <p className="text-[#a1a1aa]">How will you use Dime Fan Hub?</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        {CHOICES.map((choice) => (
          // A whole clickable card that opens a sign-up, not an action button.
          <Link
            key={choice.href}
            href={choice.href}
            className="flex flex-col items-start gap-[14px] rounded-[12px] border border-[#262b35] bg-[#0f131b] p-6 text-left text-white transition-colors hover:border-[#6b8afd] hover:bg-[#121827] focus-visible:outline-none focus-visible:border-[#6b8afd]"
          >
            <span className={cn("size-[52px] rounded-full flex items-center justify-center", choice.circle)}>
              {choice.icon}
            </span>
            <span className="font-display font-black text-[28px] leading-none">{choice.title}</span>
            <span className="text-[#a1a1aa] leading-[1.5]">{choice.description}</span>
            <span className={cn("mt-auto font-semibold", choice.ctaColor)}>{choice.cta}</span>
          </Link>
        ))}
      </div>

      <p className="text-center text-[#d4d4d8]">
        Already have an account?{" "}
        <Link href={routes.ui.signIn} className={AUTH_LINK}>
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
