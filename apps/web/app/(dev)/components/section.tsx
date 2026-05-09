/**
 * Shared Section wrapper for component showcase pages.
 */
export function Section({
  title,
  layout = "inline",
  children,
}: {
  title: string;
  /** "inline" — flex-wrap row (default); "stack" — flex column */
  layout?: "inline" | "stack";
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-gray-a11 text-xs font-semibold tracking-widest uppercase">
        {title}
      </h2>
      <div
        className={
          layout === "stack"
            ? "flex flex-col gap-4"
            : "flex flex-wrap items-center gap-3"
        }
      >
        {children}
      </div>
    </section>
  );
}
