import { Outlet } from "@tanstack/react-router";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <AppHeader />
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
