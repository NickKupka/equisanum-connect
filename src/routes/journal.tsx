import { createFileRoute } from "@tanstack/react-router";
import { JournalPage } from "@/components/journal/JournalPage";

type JournalSearch = {
  tab?: string;
  add?: boolean;
  calendar?: boolean;
};

export const Route = createFileRoute("/journal")({
  component: JournalPage,
  validateSearch: (search: Record<string, unknown>): JournalSearch => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
    add: search.add === true || search.add === "true" ? true : undefined,
    calendar: search.calendar === true || search.calendar === "true" ? true : undefined,
  }),
});
