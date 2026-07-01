import { cn } from "@/lib/utils";

export function Panel({
  title,
  action,
  children,
  className
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-terminal-line/70 bg-terminal-panel shadow-[0_8px_22px_rgba(15,23,42,0.08)]", className)}>
      <div className="flex items-center justify-between border-b border-terminal-line/60 px-5 py-3.5">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-terminal-text">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
