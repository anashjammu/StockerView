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
    <section className={cn("min-w-0 rounded-xl border border-white/[0.10] bg-white/[0.055] shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur", className)}>
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <h2 className="text-sm font-semibold text-terminal-text">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
