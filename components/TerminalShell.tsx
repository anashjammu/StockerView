import Link from "next/link";
import { Activity, Newspaper, Orbit } from "lucide-react";
import { footerResearchDisclaimer } from "@/lib/research-engine";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Market Dashboard", icon: Activity },
  { href: "/articles", label: "Articles", icon: Newspaper }
];

export function TerminalShell({
  active,
  title,
  subtitle,
  children
}: {
  active: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="terminal-grid min-h-screen px-3 py-4 text-terminal-text md:px-6 md:py-6">
      <div className="glass-panel mx-auto flex min-h-[calc(100vh-32px)] w-full min-w-0 max-w-[1440px] overflow-hidden rounded-[1.35rem] border border-terminal-line shadow-glow">
        <aside className="hidden w-64 shrink-0 border-r border-slate-900 bg-slate-950 text-white lg:block">
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/15 text-blue-300">
                <Orbit className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-white">StockerView</div>
                <div className="text-[11px] text-slate-400">Market research dashboard</div>
              </div>
            </div>
          </div>
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.href || (item.href === "/" && active === "/market-dashboard") || (item.href === "/articles" && active === "/live-market-feed");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition",
                    selected && "bg-white text-slate-950 shadow-sm",
                    !selected && "hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className={cn("h-4 w-4", selected && "text-terminal-cyan")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-terminal-line bg-terminal-panel">
            <div className="flex flex-col gap-3 px-6 py-6 md:px-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-terminal-text md:text-[2rem]">{title}</h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-terminal-muted">{subtitle}</p>
              </div>
            </div>
            <nav className="grid grid-cols-2 border-t border-terminal-line bg-terminal-panel lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const selected = active === item.href || (item.href === "/" && active === "/market-dashboard") || (item.href === "/articles" && active === "/live-market-feed");

                return (
                  <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 border-r border-terminal-line px-3 py-2.5 text-xs text-terminal-muted last:border-r-0",
                      selected && "bg-terminal-cyan/[0.10] text-terminal-text"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", selected && "text-terminal-cyan")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className="terminal-scrollbar min-w-0 flex-1 overflow-y-auto p-5 md:p-6">
            {children}
            <footer className="mt-6 rounded-xl border border-terminal-line bg-terminal-panel p-4 text-xs leading-5 text-terminal-muted">
              {footerResearchDisclaimer}
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
