import { redirect } from "next/navigation";
import { routes } from "@/utils/routes";

// The root route has no content of its own. Authenticated users go to the setup
// wizard; the proxy guard bounces unauthenticated users to sign-in.
export default function Home() {
  redirect(routes.ui.setupWizard.organizationDetails);
}
