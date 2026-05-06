export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sidebar will be added in Milestone 4
  return <div className="flex h-screen">{children}</div>;
}
