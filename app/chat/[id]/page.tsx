import { SessionChatPage } from "@/app/_components/session-chat-page";

export default async function ChatPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  const { id: chatId } = await params;

  return <SessionChatPage chatId={chatId}>{null}</SessionChatPage>;
}
