import { Suspense } from "react";
import { BusinessWorldEveChat } from "@/app/_components/business-world-eve-chat";
import { PasswordSignInForm } from "@/components/auth/password-sign-in-form";
import { SignInButton } from "@/components/auth/sign-in-button";
import { getServerViewer } from "@/lib/session";
import { getSetupStatus } from "@/lib/setup";

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ResolvedChatPage />
    </Suspense>
  );
}

async function ResolvedChatPage() {
  const setupStatus = await getSetupStatus();

  if (!setupStatus.appReady) {
    return (
      <ChatGate
        title="Eve chat is not configured"
        description={
          setupStatus.missing.length
            ? `Missing: ${setupStatus.missing.join(", ")}`
            : "Finish the Eve chat setup before sending messages."
        }
      />
    );
  }

  const viewer = await getServerViewer(setupStatus);

  if (!viewer) {
    if (setupStatus.authMode === "password") {
      return (
        <ChatGate
          title="Enter the Business World chat password"
          description="This uses the existing Eve password session and does not expose the configured password."
        >
          <PasswordSignInForm callbackPath="/chat" />
        </ChatGate>
      );
    }

    if (setupStatus.authMode === "vercel") {
      return (
        <ChatGate
          title="Sign in to Business World Agent"
          description="Use the existing Sign in with Vercel configuration for this project."
        >
          <SignInButton callbackPath="/chat" className="h-11 w-full">
            Continue with Vercel
          </SignInButton>
        </ChatGate>
      );
    }

    return (
      <ChatGate
        title="Authentication unavailable"
        description="The project is configured, but no supported browser identity is available."
      />
    );
  }

  return <BusinessWorldEveChat />;
}

function ChatGate({
  children,
  description,
  title,
}: {
  readonly children?: React.ReactNode;
  readonly description: string;
  readonly title: string;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f8fb] px-5 text-[#13213a]">
      <section className="w-full max-w-sm rounded-2xl border border-[#e3e8f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6fa8]">
          Business World · Eve
        </p>
        <h1 className="mt-3 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#68758b]">{description}</p>
        {children ? <div className="mt-5">{children}</div> : null}
        <a className="mt-5 inline-block text-sm font-medium text-[#315da8] hover:underline" href="/">
          Back to Business World
        </a>
      </section>
    </main>
  );
}

function ChatLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f8fb] text-sm text-[#68758b]">
      Loading Business World Agent…
    </main>
  );
}
