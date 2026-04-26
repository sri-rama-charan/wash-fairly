import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  useCurrentUser,
  useLiveBookings,
  cancelBooking,
  MACHINES,
  parseSlot,
  formatHour,
  formatDateLabel,
  isPastSlot,
} from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { CalendarX, WashingMachine, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/my-bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — SudsUp" },
      { name: "description", content: "View and manage your washing machine bookings." },
    ],
  }),
  component: MyBookingsPage,
});

function MyBookingsPage() {
  const user = useCurrentUser();
  const all = useLiveBookings();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  const mine = useMemo(() => {
    if (!user) return [];
    return all
      .filter((b) => b.user.room === user.room && b.user.name === user.name)
      .map((b) => {
        const { date, hour } = parseSlot(b.slot);
        return { ...b, date, hour, past: isPastSlot(date, hour) };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime() || a.hour - b.hour);
  }, [all, user]);

  if (!user) return null;

  const upcoming = mine.filter((b) => !b.past);
  const past = mine.filter((b) => b.past);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your reserved washing machine slots.
        </p>
      </div>

      {mine.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          <Section title="Upcoming" count={upcoming.length}>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
            ) : (
              upcoming.map((b) => (
                <BookingCard
                  key={b.id}
                  machineName={MACHINES.find((m) => m.id === b.machineId)?.name ?? "Machine"}
                  dateLabel={formatDateLabel(b.date)}
                  timeLabel={`${formatHour(b.hour)} – ${formatHour(b.hour + 1)}`}
                  onCancel={() => {
                    cancelBooking(b.id);
                    toast.success("Booking cancelled");
                  }}
                />
              ))
            )}
          </Section>

          {past.length > 0 && (
            <Section title="Past" count={past.length}>
              {past.map((b) => (
                <BookingCard
                  key={b.id}
                  machineName={MACHINES.find((m) => m.id === b.machineId)?.name ?? "Machine"}
                  dateLabel={formatDateLabel(b.date)}
                  timeLabel={`${formatHour(b.hour)} – ${formatHour(b.hour + 1)}`}
                  past
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function BookingCard({
  machineName,
  dateLabel,
  timeLabel,
  onCancel,
  past,
}: {
  machineName: string;
  dateLabel: string;
  timeLabel: string;
  onCancel?: () => void;
  past?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors ${
        past
          ? "border-border/50 bg-muted/30 opacity-70"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            past ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          <WashingMachine className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{machineName}</p>
          <p className="text-xs text-muted-foreground">
            {dateLabel} · {timeLabel}
          </p>
        </div>
      </div>
      {onCancel && (
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Cancel</span>
        </Button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <CalendarX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold">No bookings yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Head to the dashboard to reserve your first slot.
      </p>
      <Button asChild className="mt-5">
        <Link to="/dashboard">Browse slots</Link>
      </Button>
    </div>
  );
}
