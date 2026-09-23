import { Suspense, type ReactNode } from "react";
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
  if (process.env.VERCEL_ENV === "preview") {
    return <BusinessWorldEveChat />;
  }

  const setupStatus = await getSetupStatus();

  if (!setupStatus.appReady) {
    return (
      <ChatGate
        title="对话服务尚未准备好"
        description="项目管理员需要完成对话服务配置。经营工作区仍可继续使用。"
      />
    );
  }

  const viewer = await getServerViewer(setupStatus);

  if (!viewer) {
    if (setupStatus.authMode === "password") {
      return (
        <ChatGate
          title="输入经营工作区对话密码"
          description="使用现有对话密码登录。请只在此页面输入。"
        >
          <PasswordSignInForm callbackPath="/chat" />
        </ChatGate>
      );
    }

    if (setupStatus.authMode === "vercel") {
      return (
        <ChatGate
          title="登录经营工作区"
          description="请使用项目已有的登录方式继续。"
        >
          <SignInButton callbackPath="/chat" className="h-11 w-full">
            使用 Vercel 登录
          </SignInButton>
        </ChatGate>
      );
    }

    return (
      <ChatGate
        title="暂时无法确认登录状态"
        description="当前浏览器没有可用的登录身份，请重新打开登录入口。"
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
  readonly children?: ReactNode;
  readonly description: string;
  readonly title: string;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f8fb] px-5 text-[#13213a]">
      <section className="w-full max-w-sm rounded-2xl border border-[#e3e8f0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6fa8]">
          Business World · eve
        </p>
        <h1 className="mt-3 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#68758b]">{description}</p>
        {children ? <div className="mt-5">{children}</div> : null}
        <a className="mt-5 inline-block text-sm font-medium text-[#315da8] hover:underline" href="/">
          返回经营工作区
        </a>
      </section>
    </main>
  );
}

function ChatLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f8fb] text-sm text-[#68758b]">
      正在加载经营对话…
    </main>
  );
}
