import { isDatabaseConfigured, isDatabaseSchemaReady } from "@/lib/db/client";


export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  const coreSchemaReady = databaseConfigured ? await isDatabaseSchemaReady() : false;
  return Response.json({
    ok: true,
    app: "business-world-agent-diaper",
    runtime: "vercel-eve-template-derived",
    persistence: { provider: "neon-postgres", configured: databaseConfigured, coreSchemaReady },
  });
}
