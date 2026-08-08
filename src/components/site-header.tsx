import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/support", label: "Support" },
  { to: "/hr", label: "People & HR" },
  { to: "/finance", label: "Finance" },
  { to: "/admin", label: "Dashboard" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-display text-2xl leading-none tracking-tight">
          Hearth<span className="text-primary">.</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-5 text-sm sm:gap-7">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="underline-warm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
