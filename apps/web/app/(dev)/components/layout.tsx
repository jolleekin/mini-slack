"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const components = [
  { name: "Button", href: "/components/button" },
  { name: "Input", href: "/components/input" },
  { name: "Label", href: "/components/label" },
  { name: "Spinner", href: "/components/spinner" },
];

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="border-gray-a6 bg-gray-a2 w-64 border-r p-6">
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
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl space-y-10 p-8">{children}</div>
      </main>
    </div>
  );
}
