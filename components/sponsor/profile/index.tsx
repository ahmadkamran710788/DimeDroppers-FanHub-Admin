"use client";

import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { OUTLINE_BUTTON } from "@/components/sponsor/styles";
import AccountDetails from "@/components/sponsor/profile/account-details";
import SponsorDetails from "@/components/sponsor/profile/sponsor-details";
import SponsorLocations from "@/components/sponsor/profile/sponsor-locations";
import { useSponsorProfile } from "@/components/sponsor/profile/use-sponsor-profile";
import { PROFILE_CARD, SMALL_BUTTON } from "@/components/sponsor/profile/styles";

// How organizations see the sponsor: the account, the details from sign-up and the locations their search
// starts from.
export default function SponsorProfile() {
  const { profile, options, failed, lookupTimedOut, reload, setProfile } = useSponsorProfile();

  return (
    // Spacing and title sizes follow the admin pages, as on Brand Assets.
    <div className="flex flex-col gap-8">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          SPONSOR PROFILE
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">
          This is how organizations see you. Your locations decide which organizations show up first when you search.
        </p>
      </div>

      {profile ? (
        <div className="flex flex-col gap-6">
          <AccountDetails account={profile.account} onSaved={setProfile} />
          <SponsorDetails brand={profile.brand} options={options} onSaved={setProfile} />
          <SponsorLocations
            locations={profile.locations}
            lookup={profile.locationsFetch}
            lookupTimedOut={lookupTimedOut}
            onChange={setProfile}
            reload={reload}
          />
        </div>
      ) : failed ? (
        <div className={cn(PROFILE_CARD, "flex flex-col items-start gap-4")}>
          <p className="text-[15px] text-[#d4d4d4]">We couldn’t load your profile. Check your connection and try again.</p>
          <Button label="Try again" onClick={reload} className={cn(OUTLINE_BUTTON, SMALL_BUTTON, "font-semibold")} />
        </div>
      ) : (
        <Loader />
      )}
    </div>
  );
}
