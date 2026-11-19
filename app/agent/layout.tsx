import { redirect } from "next/navigation";
import { AgentLiveNotifications } from "@/components/agent/agent-live-notifications";
import { AgentToastProvider } from "@/components/agent/agent-toast-provider";
import { AgentLayoutChrome } from "@/components/layout/agent-layout-chrome";
import { getProfile } from "@/lib/supabase/server";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "agent") {
    redirect("/");
  }

  return (
    <>
      <AgentToastProvider />
      <AgentLiveNotifications agentId={profile.id} />
      <AgentLayoutChrome>{children}</AgentLayoutChrome>
    </>
  );
}
