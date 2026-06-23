import { AppSidebar } from "@/components/layout/app-sidebar";
import { listServers } from "@/server/services/server.service";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  const servers = await listServers();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar servers={servers} />
      <main className="ml-64 min-h-screen p-6">{children}</main>
    </div>
  );
}
