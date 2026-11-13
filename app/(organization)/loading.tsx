import Loader from "@/components/common/loader";

// Shown in the page area (the sidebar and header stay) while a page loads. Without it, a page that reads
// searchParams (Sponsor Messages, Sponsor AI Agent, …) isn't prefetched, so a sidebar click showed nothing
// until the server answered.
export default function Loading() {
  return <Loader />;
}
