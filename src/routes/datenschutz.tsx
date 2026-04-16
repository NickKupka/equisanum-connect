import { createFileRoute } from "@tanstack/react-router";
import { DatenschutzPage } from "@/components/legal/DatenschutzPage";

export const Route = createFileRoute("/datenschutz")({
  component: DatenschutzPage,
});
