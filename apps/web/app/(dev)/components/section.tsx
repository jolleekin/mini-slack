/**
 * Shared page header for component showcase pages.
 */
export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description && (
        <p className="text-gray-a11 mt-1 text-sm">{description}</p>
      )}
    </div>
  );
}

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
    <section className="border-gray-a6 grid grid-cols-1 gap-x-8 gap-y-4 border-t pt-6 md:grid-cols-[180px_1fr]">
      <div className="md:sticky top-6 self-start">
        <h2 className="text-gray-12 text-base font-semibold text-pretty">{title}</h2>
      </div>
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
