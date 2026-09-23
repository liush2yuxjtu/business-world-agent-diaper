"use client";

import { useEveAgent } from "eve/react";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { chatErrorMessage } from '@/lib/business-world/chat-errors';
import { AgentMessage } from "@/components/chat/message";
import { ChatComposer } from "@/components/chat/composer";

export function BusinessWorldEveChat() {
  const agent = useEveAgent({});
  const [draft, setDraft] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState('');
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  useEffect(() => {
    if (agent.error && !isBusy) setDraft(current => current || lastSent);
  }, [agent.error, isBusy, lastSent]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || isBusy) return;

    setClientError(null);
    setLastSent(message);
    setDraft("");

    try {
      await agent.send(message);
    } catch (error) {
      setDraft(message);
      setClientError(chatErrorMessage(error));
    }
  };

  return (
    <main className="min-h-dvh bg-[#f6f8fb] text-[#13213a]">
      <div className="mx-auto flex min-h-dvh max-w-4xl flex-col border-x border-[#e3e8f0] bg-white">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e7ebf1] px-4 sm:px-6">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-[#52617a] hover:text-[#1d4ed8]"
            href="/"
          >
            <ArrowLeftIcon className="size-4" />
            Business World
          </Link>
          <div className="text-right">
            <div className="text-sm font-semibold">Business World Agent</div>
            <div className="text-[11px] text-[#7b879a]">eve · 先核对证据，再形成建议</div>
          </div>
        </header>

        {agent.data.messages.length === 0 ? (
          <section className="flex flex-1 flex-col items-center justify-center px-5 py-12">
            <div className="w-full max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6fa8]">
                询问经营世界
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                先理解现状，再决定行动。
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#68758b]">
                可以询问人群、内容、直播、投放与商品，或比较情景假设。
                回答应区分保存的证据、合成数据和推断；外部操作需要明确确认。
              </p>
              <div className="mt-8">
                <ChatComposer
                  disabled={isBusy}
                  isBusy={isBusy}
                  onChange={setDraft}
                  onStop={agent.stop}
                  onSubmit={send}
                  placeholder="例如：预算不增加，怎样提高小雨人群的成交？"
                  value={draft}
                />
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
                {agent.data.messages.map((message, index) => (
                  <AgentMessage
                    canRespond={!isBusy}
                    isStreaming={
                      agent.status === "streaming" && index === agent.data.messages.length - 1
                    }
                    key={message.id}
                    message={message}
                    onInputResponses={(responses) => agent.respond(responses)}
                  />
                ))}
              </div>
            </section>
            <div className="shrink-0 border-t border-[#edf0f4] bg-white px-4 py-4 sm:px-6">
              <div className="mx-auto w-full max-w-2xl">
                <ChatComposer
                  disabled={isBusy}
                  isBusy={isBusy}
                  onChange={setDraft}
                  onStop={agent.stop}
                  onSubmit={send}
                  placeholder="继续追问，或要求运行一个 Scenario…"
                  value={draft}
                />
              </div>
            </div>
          </>
        )}

        {clientError || agent.error ? (
          <div role="alert" className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6">
            {clientError ?? chatErrorMessage(agent.error)}
          </div>
        ) : null}
      </div>
    </main>
  );
}
