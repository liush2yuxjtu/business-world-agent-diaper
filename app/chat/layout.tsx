import { Suspense, type ReactNode } from "react";
import { AgentChatBootstrapSync } from "@/app/_components/agent-chat-bootstrap-sync";
import { AgentChatShell } from "@/app/_components/agent-chat-shell";
import { listChatsPageByUser } from "@/lib/db/queries";
import { getServerViewer } from "@/lib/session";
import { getInitialSetupStatus, getSetupStatus } from "@/lib/setup";

export default function ChatLayout({ children }: { readonly children: ReactNode }) {
  return (
    <AgentChatShell
      initialChats={[]}
      initialNextCursor={null}
      setupStatus={getInitialSetupStatus()}
      viewer={null}
    >
      {children}
      <Suspense fallback={null}>
        <ResolvedChatBootstrap />
      </Suspense>
    </AgentChatShell>
  );
}

async function ResolvedChatBootstrap() {
  const setupStatus = await getSetupStatus();
  const viewer = await getServerViewer(setupStatus);
  let chats = [];
  let nextCursor: string | null = null;

  if (viewer && setupStatus.storageMode === "database" && setupStatus.databaseReady) {
    const page = await listChatsPageByUser(viewer.id);
    chats = [...page.items];
    nextCursor = page.nextCursor;
  }

  return (
    <AgentChatBootstrapSync
      chats={chats}
      nextCursor={nextCursor}
      setupStatus={setupStatus}
      viewer={viewer}
    />
  );
}
