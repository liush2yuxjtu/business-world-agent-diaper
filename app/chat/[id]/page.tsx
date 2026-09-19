import { Suspense } from "react";
import { AgentChatRouteSync } from "@/app/_components/agent-chat-route-sync";
import { SessionChatPage } from "@/app/_components/session-chat-page";
import { getChatForUser } from "@/lib/db/queries";
import { getServerViewer } from "@/lib/session";
import { getSetupStatus } from "@/lib/setup";

export default async function ChatSessionPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SessionChatPage chatId={id}>
      <Suspense fallback={null}>
        <ExistingChat chatId={id} />
      </Suspense>
    </SessionChatPage>
  );
}

async function ExistingChat({ chatId }: { readonly chatId: string }) {
  const setupStatus = await getSetupStatus();
  const viewer = await getServerViewer(setupStatus);

  if (!viewer || setupStatus.storageMode !== "database" || !setupStatus.databaseReady) {
    return <AgentChatRouteSync activeChat={null} chatId={chatId} />;
  }

  const activeChat = await getChatForUser(chatId, viewer.id);
  return <AgentChatRouteSync activeChat={activeChat} chatId={chatId} />;
}
