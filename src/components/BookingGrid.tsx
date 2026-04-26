import { useMemo, useState } from "react";
import {
  MACHINES,
  HOURS,
  slotKey,
  formatHour,
  formatDateLabel,
  isPastSlot,
  useLiveBookings,
  useCurrentUser,
  addBooking,
  type Booking,
} from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, WashingMachine, Check } from "lucide-react";
import { toast } from "sonner";

type SlotStatus = "available" | "booked-by-me" | "booked" | "past";

function getSlotStatus(
  bookings: Booking[],
  machineId: number,
  date: Date,
  hour: number,
  userRoom: string | undefined,
): { status: SlotStatus; booking?: Booking } {
  if (isPastSlot(date, hour)) return { status: "past" };
  const key = slotKey(date, hour);
  const booking = bookings.find((b) => b.machineId === machineId && b.slot === key);
  if (!booking) return { status: "available" };
  if (userRoom && booking.user.room === userRoom) return { status: "booked-by-me", booking };
  return { status: "booked", booking };
}

const machineAccent = {
  primary: "from-primary/15 to-primary/5 border-primary/30 text-primary",
  accent: "from-accent/15 to-accent/5 border-accent/30 text-accent",
  success: "from-success/15 to-success/5 border-success/30 text-success",
} as const;

export function BookingGrid() {
  const user = useCurrentUser();
  const bookings = useLiveBookings();
  const [dayOffset, setDayOffset] = useState(0);
  const [pending, setPending] = useState<{ machineId: number; hour: number } | null>(null);

  const currentDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const handleConfirm = () => {
    if (!pending || !user) return;
    const key = slotKey(currentDate, pending.hour);
    const result = addBooking(pending.machineId, key, user);
    if (result.ok) {
      toast.success("Booked!", {
        description: `${MACHINES.find((m) => m.id === pending.machineId)?.name} at ${formatHour(pending.hour)}`,
      });
    } else {
      toast.error("Couldn't book", { description: result.message });
    }
    setPending(null);
  };

  const pendingMachine = pending ? MACHINES.find((m) => m.id === pending.machineId) : null;

  return (
    <div className="space-y-6">
      {/* Day navigator */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDayOffset((d) => Math.max(0, d - 1))}
          disabled={dayOffset === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {dayOffset === 0 ? "Today" : dayOffset === 1 ? "Tomorrow" : "Upcoming"}
          </p>
          <p className="font-display text-lg font-semibold">{formatDateLabel(currentDate)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDayOffset((d) => Math.min(6, d + 1))}
          disabled={dayOffset === 6}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <LegendDot className="bg-success" label="Available" />
        <LegendDot className="bg-primary" label="Your booking" />
        <LegendDot className="bg-destructive/70" label="Booked" />
        <LegendDot className="bg-muted-foreground/40" label="Past" />
      </div>

      {/* Machines */}
      <div className="grid gap-5 md:grid-cols-3">
        {MACHINES.map((machine) => (
          <div
            key={machine.id}
            className={`rounded-2xl border bg-gradient-to-br ${machineAccent[machine.color]} p-4`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/60 backdrop-blur">
                  <WashingMachine className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">{machine.name}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Hourly slots
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {HOURS.map((hour) => {
                const { status } = getSlotStatus(
                  bookings,
                  machine.id,
                  currentDate,
                  hour,
                  user?.room,
                );
                return (
                  <SlotButton
                    key={hour}
                    hour={hour}
                    status={status}
                    onClick={() => setPending({ machineId: machine.id, hour })}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your booking</DialogTitle>
            <DialogDescription>
              You're about to reserve this slot. Please be on time and considerate of others.
            </DialogDescription>
          </DialogHeader>
          {pending && pendingMachine && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1.5">
              <Row label="Machine" value={pendingMachine.name} />
              <Row label="Date" value={formatDateLabel(currentDate)} />
              <Row label="Time" value={`${formatHour(pending.hour)} – ${formatHour(pending.hour + 1)}`} />
              <Row label="Booked by" value={user ? `${user.name} (Room ${user.room})` : "—"} />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              <Check className="h-4 w-4" /> Confirm booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function SlotButton({
  hour,
  status,
  onClick,
}: {
  hour: number;
  status: SlotStatus;
  onClick: () => void;
}) {
  const base =
    "h-12 rounded-lg text-xs font-medium transition-all border flex flex-col items-center justify-center leading-tight";
  if (status === "past") {
    return (
      <button disabled className={`${base} border-transparent bg-muted/40 text-muted-foreground/60 cursor-not-allowed`}>
        {formatHour(hour)}
        <span className="text-[9px] uppercase tracking-wider opacity-70">past</span>
      </button>
    );
  }
  if (status === "booked") {
    return (
      <button disabled className={`${base} border-destructive/20 bg-destructive/10 text-destructive/80 cursor-not-allowed`}>
        {formatHour(hour)}
        <span className="text-[9px] uppercase tracking-wider">booked</span>
      </button>
    );
  }
  if (status === "booked-by-me") {
    return (
      <button disabled className={`${base} border-primary/40 bg-primary text-primary-foreground shadow-soft cursor-default`}>
        {formatHour(hour)}
        <span className="text-[9px] uppercase tracking-wider">yours</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`${base} border-success/30 bg-success/10 text-success hover:bg-success hover:text-success-foreground hover:shadow-soft hover:scale-[1.02] active:scale-95`}
    >
      {formatHour(hour)}
      <span className="text-[9px] uppercase tracking-wider opacity-80">free</span>
    </button>
  );
}
