import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { getScenarioExperiment, listScenarioExperiments, runScenarioExperiment } from '@/lib/business-world/real-service';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (id !== null) {
      const run = await getScenarioExperiment(z.string().uuid().parse(id));
      if (!run) return Response.json({ error: '情景记录不存在。' }, { status: 404 });
      return Response.json(run, { headers: { 'Cache-Control': 'no-store' } });
    }
    return Response.json({ runs: await listScenarioExperiments() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Scenario history failed' }, { status: error instanceof ZodError ? 400 : 503 });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: 'Cross-origin writes are not allowed' }, { status: 403 });
  }
  try {
    return Response.json(await runScenarioExperiment(await request.json()), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Scenario run failed' }, { status: error instanceof ZodError ? 400 : 503 });
  }
}
