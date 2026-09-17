import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

export default async function AuthErrorPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground">
      <Suspense fallback={<AuthErrorCard message={getAuthErrorMessage()} />}>
        <AuthErrorContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AuthErrorContent({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = getParam(params.error);
  const errorDescription = getParam(params.error_description);
  const message = getAuthErrorMessage(error, errorDescription);

  return <AuthErrorCard error={error} message={message} />;
}

function AuthErrorCard({
  error,
  message,
}: {
  readonly error?: string;
  readonly message: ReturnType<typeof getAuthErrorMessage>;
}) {
  return (
    <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-destructive">
          <AlertCircleIcon className="size-4" />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Business World Agent · 认证配置</p>
          <h1 className="text-2xl font-semibold tracking-normal">{message.title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{message.body}</p>
          {error ? (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button asChild className="h-8 rounded-md px-3 text-sm">
          <Link href="/">
            <ArrowLeftIcon className="size-4" />
            返回 Business World Agent
          </Link>
        </Button>
      </div>
    </div>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAuthErrorMessage(error?: string, description?: string) {
  if (error === "email_not_found") {
    return {
      title: "Vercel email scope 未启用",
      body: "请在 Vercel App 中启用 email scope 并保存，然后重新登录。Better Auth 需要 Vercel 返回当前用户的邮箱地址。",
    };
  }

  if (error === "invalid_scope") {
    return {
      title: "Vercel OAuth scopes 配置不完整",
      body: "请在 Vercel App 设置中启用 openid、email 和 profile scopes，然后重新登录。",
    };
  }

  if (error === "database_not_configured") {
    return {
      title: "Neon 数据库尚未连接",
      body: "请把 Neon Postgres 连接到当前 Vercel 项目，确认 DATABASE_URL 可用，再执行数据库迁移。",
    };
  }

  if (error === "database_migrations_missing") {
    return {
      title: "数据库迁移尚未执行",
      body: "请执行生产数据库迁移，创建 Better Auth 与会话所需的数据表，然后重新登录。",
    };
  }

  if (error === "auth_env_missing") {
    return {
      title: "认证环境变量缺失",
      body: "请配置 BETTER_AUTH_SECRET、NEXT_PUBLIC_VERCEL_APP_CLIENT_ID 与 VERCEL_APP_CLIENT_SECRET，然后重新部署。",
    };
  }

  if (description?.toLowerCase().includes("callback")) {
    return {
      title: "Callback URL 未被允许",
      body: "请在 Vercel App 中加入当前部署实际使用的 /api/auth/callback/vercel 完整回调地址。",
    };
  }

  if (
    description?.toLowerCase().includes("relation") ||
    description?.toLowerCase().includes("table") ||
    description?.toLowerCase().includes("database")
  ) {
    return {
      title: "数据库迁移可能缺失",
      body: "请检查生产数据库迁移状态并补齐 Better Auth 与会话表，然后重试登录。",
    };
  }

  return {
    title: "登录未完成",
    body: "请检查 Vercel App callback、OAuth scopes、Better Auth secret 与数据库迁移配置。",
  };
}
