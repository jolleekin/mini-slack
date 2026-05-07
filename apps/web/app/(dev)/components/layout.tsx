"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const components = [
  { name: "Spinner", href: "/components/spinner" },
];

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-a6 bg-gray-a2 p-6">
        <div className="mb-8">
          <h1 className="text-lg font-semibold">UI Components</h1>
          <p className="text-gray-a11 mt-1 text-xs">
            Dev-only component showcase
          </p>
        </div>

        <nav className="space-y-1">
          {components.map((component) => {
            const isActive = pathname === component.href;
            return (
              <Link
                key={component.href}
                href={component.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-accent-9 text-accent-contrast font-medium"
                    : "text-gray-12 hover:bg-gray-a3"
                }`}
              >
                {component.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
