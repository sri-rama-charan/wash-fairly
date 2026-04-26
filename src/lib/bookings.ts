import { useEffect, useSyncExternalStore } from "react";

export type User = { name: string; room: string };
export type Booking = {
  id: string;
  machineId: number;
  slot: string; // ISO date+hour string e.g. "2025-04-26T14"
  user: User;
  createdAt: number;
};

const USER_KEY = "hwm.user";
const BOOKINGS_KEY = "hwm.bookings";
const EVT = "hwm:update";

export const MACHINES = [
  { id: 1, name: "Machine 01", color: "primary" as const },
  { id: 2, name: "Machine 02", color: "accent" as const },
  { id: 3, name: "Machine 03", color: "success" as const },
];

// Hours from 7am to 11pm
export const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

function emit() {
  window.dispatchEvent(new Event(EVT));
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getUser(): User | null {
  return read<User | null>(USER_KEY, null);
}

export function setUser(user: User | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  emit();
}

export function getBookings(): Booking[] {
  return read<Booking[]>(BOOKINGS_KEY, []);
}

function writeBookings(b: Booking[]) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(b));
  emit();
}

export function addBooking(machineId: number, slot: string, user: User): { ok: boolean; message?: string } {
  const all = getBookings();
  if (all.some((b) => b.machineId === machineId && b.slot === slot)) {
    return { ok: false, message: "This slot was just taken." };
  }
  // Prevent same user double-booking same hour across machines
  if (all.some((b) => b.slot === slot && b.user.room === user.room)) {
    return { ok: false, message: "You already have a booking at this hour." };
  }
  const booking: Booking = {
    id: crypto.randomUUID(),
    machineId,
    slot,
    user,
    createdAt: Date.now(),
  };
  writeBookings([...all, booking]);
  return { ok: true };
}

export function cancelBooking(id: string) {
  writeBookings(getBookings().filter((b) => b.id !== id));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useBookings(): Booking[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      // Return reference-stable serialization
      return localStorage.getItem(BOOKINGS_KEY) ?? "[]";
    },
    () => "[]",
  ) as unknown as Booking[] extends never ? never : Booking[] extends Booking[] ? Booking[] : never extends infer _ ? Booking[] : never extends infer _ ? Booking[] : Booking[] extends infer _ ? Booking[] : Booking[];
}

// Simpler hook returning parsed bookings reactively
export function useLiveBookings(): Booking[] {
  const snap = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(BOOKINGS_KEY) ?? "[]",
    () => "[]",
  );
  try {
    return JSON.parse(snap) as Booking[];
  } catch {
    return [];
  }
}

export function useCurrentUser(): User | null {
  const snap = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(USER_KEY) ?? "",
    () => "",
  );
  if (!snap) return null;
  try {
    return JSON.parse(snap) as User;
  } catch {
    return null;
  }
}

// Helpers for time formatting
export function slotKey(date: Date, hour: number) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}`;
}

export function parseSlot(slot: string): { date: Date; hour: number } {
  const [datePart, hourPart] = slot.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const hour = Number(hourPart);
  const date = new Date(y, m - 1, d, hour);
  return { date, hour };
}

export function formatHour(hour: number) {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${ampm}`;
}

export function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isPastSlot(date: Date, hour: number) {
  const now = new Date();
  const slotEnd = new Date(date);
  slotEnd.setHours(hour + 1, 0, 0, 0);
  return slotEnd.getTime() <= now.getTime();
}

// Auto-cleanup very old bookings (>14 days) on mount
export function useCleanupOldBookings() {
  useEffect(() => {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const all = getBookings();
    const fresh = all.filter((b) => b.createdAt >= cutoff);
    if (fresh.length !== all.length) writeBookings(fresh);
  }, []);
}
