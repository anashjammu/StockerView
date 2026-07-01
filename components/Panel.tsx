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
    <section className={cn("min-w-0 rounded-2xl border border-terminal-line bg-terminal-panel shadow-[0_8px_20px_rgba(15,23,42,0.04)]", className)}>
      <div className="flex items-center justify-between border-b border-terminal-line px-5 py-3.5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-terminal-text">{title}</h2>
        {action}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
