import { BotMessageSquare } from "lucide-react";
import ComingSoonPage from "@/components/common/coming-soon-page";

export default function FanHubAiPage() {
  return (
    <ComingSoonPage
      title="FanHub AI"
      description="AI tools that help you run your organization and engage your fans."
      icon={<BotMessageSquare className="size-8" strokeWidth={1.5} />}
    />
  );
}
