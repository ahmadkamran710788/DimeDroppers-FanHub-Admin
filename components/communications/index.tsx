import { MessagesSquare } from "lucide-react";
import ComingSoonPage from "@/components/common/coming-soon-page";

export default function CommunicationsPage() {
  return (
    <ComingSoonPage
      title="Communications"
      description="Reach your players, parents, staff and followers from one place."
      icon={<MessagesSquare className="size-8" strokeWidth={1.5} />}
    />
  );
}
