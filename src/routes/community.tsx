import { createFileRoute } from "@tanstack/react-router";
import { CommunityPage } from "@/components/community/CommunityPage";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
});
