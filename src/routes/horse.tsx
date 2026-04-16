import { createFileRoute } from "@tanstack/react-router";
import { HorsePage } from "@/components/horse/HorsePage";

export const Route = createFileRoute("/horse")({
  component: HorsePage,
  validateSearch: (search: Record<string, unknown>) => ({
    selected: (search.selected as string) || undefined,
  }),
});
