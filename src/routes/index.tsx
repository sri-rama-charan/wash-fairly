import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { setUser, getUser } from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WashingMachine, Sparkles, Clock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SudsUp — Hostel Washing Machine Booking" },
      {
        name: "description",
        content:
          "Book hostel washing machine slots in seconds. See real-time availability, avoid conflicts, and never wait in line.",
      },
      { property: "og:title", content: "SudsUp — Hostel Washing Machine Booking" },
      {
        property: "og:description",
        content: "Real-time hostel laundry slot booking. Fair, simple, conflict-free.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (getUser()) navigate({ to: "/dashboard" });
  }, [navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const n = name.trim();
    const r = room.trim();
    if (!n || n.length < 2) return setError("Please enter your name.");
    if (!r) return setError("Please enter your room number.");
    setUser({ name: n, room: r });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-auto max-w-6xl px-4 py-10 md:py-16">
      <div className="grid gap-12 md:grid-cols-2 md:gap-8 items-center">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Built for hostel life
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05]">
            Laundry day,
            <br />
            <span className="text-primary">without the chaos.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-md">
            Three machines. Hundreds of students. One simple way to share them fairly. Reserve a slot in seconds and skip the queue.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            <Stat icon={<WashingMachine className="h-4 w-4" />} label="3 machines" />
            <Stat icon={<Clock className="h-4 w-4" />} label="Hourly slots" />
            <Stat icon={<ShieldCheck className="h-4 w-4" />} label="No double booking" />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft">
          <h2 className="font-display text-2xl font-semibold">Quick sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Just your name and room number — that's it.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                placeholder="e.g. Aarav Singh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room">Room number</Label>
              <Input
                id="room"
                placeholder="e.g. B-204"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full h-11 text-base">
              Continue to booking →
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Your info stays on this device. No account needed.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-3 py-3 text-center">
      <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}
