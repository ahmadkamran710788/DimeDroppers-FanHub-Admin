import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, ChevronRight, Handshake } from "lucide-react";
import { routes } from "@/utils/routes";

interface AccountChoice {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}

const CHOICES: AccountChoice[] = [
  {
    href: routes.ui.organizationSignUp,
    icon: <Building2 className="size-6" strokeWidth={1.75} />,
    title: "Sign up as an organization",
    description:
      "For schools, clubs and tournament organizers. Launch your fan hub, run your games and events, and raise money from sponsors.",
  },
  {
    href: routes.ui.sponsorSignUp,
    icon: <Handshake className="size-6" strokeWidth={1.75} />,
    title: "Sign up as a sponsor",
    description:
      "For brands and local businesses. Find teams and events near your stores, sponsor them, and fund their needs.",
  },
];

// The sign-up entry point (from "Create one" on the sign-in page): pick an organization or a sponsor
// account, then that account's own sign-up form opens.
export default function SignUpChoice() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-black text-[32px] uppercase leading-none text-white">
          Create account
        </h1>
        <p className="text-sm text-white/70">Choose how you&apos;ll use Dime Fan Hub.</p>
      </div>

      <div className="flex flex-col gap-3">
        {CHOICES.map((choice) => (
          // A whole clickable card that opens a sign-up form, not an action button.
          <Link
            key={choice.href}
            href={choice.href}
            className="group flex items-center gap-4 rounded-[8px] border border-white/15 bg-white/5 p-4 transition-colors duration-200 hover:border-steel-blue hover:bg-white/10 focus-visible:outline-none focus-visible:border-steel-blue"
          >
            <span className="flex size-12 flex-none items-center justify-center rounded-[8px] bg-white/10 text-white">
              {choice.icon}
            </span>
            <span className="flex min-w-0 flex-auto flex-col gap-1">
              <span className="text-base font-semibold text-white">{choice.title}</span>
              <span className="text-[13px] leading-[1.45] text-white/70">{choice.description}</span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-5 flex-none text-white/50 transition-colors duration-200 group-hover:text-white"
            />
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-white/70">
        Already have an account?{" "}
        <Link href={routes.ui.signIn} className="font-medium text-steel-blue hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
