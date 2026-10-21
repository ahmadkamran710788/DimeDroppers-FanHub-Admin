"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/loader";
import { useSetup } from "@/context/setup";
import { getResumeStep, isSetupComplete } from "@/utils/fanhub/get-resume-step";
import { routes } from "@/utils/routes";

interface SetupGuardProps {
  // "complete": the admin panel, only once setup is done (else back to the setup form).
  // "incomplete": the setup form, only until it is done (else on to the Profile).
  require: "complete" | "incomplete";
  children: ReactNode;
}

// Keeps a new organisation on the setup form until it has saved it, even when the URL is changed
// by hand, and keeps a set-up one out of the form. Renders only a loader until the saved school has
// loaded, so the wrong screen never flashes. Needs a SetupProvider above it.
export default function SetupGuard({ require, children }: SetupGuardProps) {
  const router = useRouter();
  const { savedSchool, isLoading } = useSetup();
  const complete = isSetupComplete(savedSchool);
  const allowed = require === "complete" ? complete : !complete;

  useEffect(() => {
    if (isLoading || allowed) return;
    router.replace(require === "complete" ? getResumeStep() : routes.ui.profile);
  }, [isLoading, allowed, require, router]);

  if (isLoading || !allowed) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader />
      </div>
    );
  }
  return children;
}
