import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BookingGrid } from "@/components/BookingGrid";
import { useCurrentUser, useCleanupOldBookings, useLiveBookings, MACHINES } from "@/lib/bookings";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SudsUp" },
      { name: "description", content: "Pick a machine and time slot." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const bookings = useLiveBookings();
  useCleanupOldBookings();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysCount = bookings.filter((b) => b.slot.startsWith(today.toISOString().slice(0, 10))).length;
  const totalSlotsToday = MACHINES.length * 16;
  const occupancy = Math.round((todaysCount / totalSlotsToday) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hi {user.name.split(" ")[0]} 👋</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Pick a slot</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            Tap any green slot to reserve it. Red slots are already taken.
          </p>
        </div>
        <div className="flex gap-3">
          <MetricCard label="Today's bookings" value={String(todaysCount)} />
          <MetricCard label="Occupancy" value={`${occupancy}%`} />
        </div>
      </div>

      <BookingGrid />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 min-w-[120px]">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}
