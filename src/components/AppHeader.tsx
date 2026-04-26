import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useCurrentUser, setUser } from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { LogOut, WashingMachine } from "lucide-react";

export function AppHeader() {
  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/my-bookings", label: "My Bookings" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-transform group-hover:rotate-6">
            <WashingMachine className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-bold">SudsUp</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Hostel Laundry
            </p>
          </div>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">Room {user.room}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setUser(null);
                  navigate({ to: "/" });
                }}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link
              to="/"
              className="text-sm font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {user && (
        <nav className="md:hidden flex items-center justify-center gap-1 px-4 pb-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 text-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
