"use client";

import { useEveAgent } from "eve/react";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AgentMessage } from "@/components/chat/message";
import { ChatComposer } from "@/components/chat/composer";

export function BusinessWorldEveChat() {
  const agent = useEveAgent({});
  const [draft, setDraft] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || isBusy) return;

    setClientError(null);
    setDraft("");

    try {
      await agent.send(message);
    } catch (error) {
      setDraft(message);
      setClientError(error instanceof Error ? error.message : "Failed to send message.");
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
            <div className="text-[11px] text-[#7b879a]">Vercel Eve · evidence first</div>
          </div>
        </header>

        {agent.data.messages.length === 0 ? (
          <section className="flex flex-1 flex-col items-center justify-center px-5 py-12">
            <div className="w-full max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6fa8]">
                Ask the operating world
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Read the world before changing it.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#68758b]">
                Ask about personas, content, live, ads, commerce, or run a direction-only scenario.
                The Agent separates persisted evidence, simulated data, and inference.
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
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6">
            {clientError ?? agent.error?.message}
          </div>
        ) : null}
      </div>
    </main>
  );
}
