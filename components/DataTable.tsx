import { cn } from "@/lib/utils";

type Align = "left" | "right";

export type Column<T> = {
  key: string;
  header: string;
  align?: Align;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="terminal-scrollbar w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-terminal-line bg-terminal-panel">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-terminal-line bg-terminal-panel2 text-xs text-terminal-muted">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn("whitespace-nowrap px-3 py-2.5 font-semibold", column.align === "right" ? "text-right" : "text-left")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-terminal-line/80 last:border-0 hover:bg-terminal-panel2/50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-3 py-2.5 align-top", column.align === "right" ? "text-right" : "text-left")}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
