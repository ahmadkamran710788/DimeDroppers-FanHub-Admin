import SponsorDetails from "@/components/sponsor/profile/sponsor-details";
import SponsorLocations from "@/components/sponsor/profile/sponsor-locations";

// How organizations see the sponsor: the details from sign-up and the locations their search
// starts from.
export default function SponsorProfile() {
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

      <div className="flex flex-col gap-6">
        <SponsorDetails />
        <SponsorLocations />
      </div>
    </div>
  );
}
