"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import WizardFooter from "@/components/common/wizard-footer";
import ImportScheduleContent from "@/components/schedule/import-schedule";
import { routes } from "@/utils/routes";

// Dashboard Schedule → Import Schedule, reached from the Schedule page. Adds a back
// link and a Save & Exit footer. Imports save as soon as they run, so Save & Exit
// just returns to the Schedule page.
export default function ImportSchedulePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex flex-col gap-4">
        <Link
          href={routes.ui.schedule}
          className="self-start flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Schedule
        </Link>
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
            Import Schedule
          </h2>
          <p className="text-base text-white/80">
            Bring in your games and events to power your Fan Hub.
          </p>
        </div>
      </div>

      <ImportScheduleContent />

      <WizardFooter onSaveExit={() => router.push(routes.ui.schedule)} />
    </div>
  );
}
