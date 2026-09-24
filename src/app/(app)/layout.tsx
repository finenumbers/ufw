import { AppSidebar } from "@/components/layout/app-sidebar";
import { ReachabilityProvider } from "@/components/layout/reachability-provider";
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
    <ReachabilityProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar
          servers={servers.map((server) => ({
            id: server.id,
            name: server.name,
            host: server.host,
          }))}
        />
        <main className="ml-60 min-h-screen p-6">{children}</main>
      </div>
    </ReachabilityProvider>
  );
}
