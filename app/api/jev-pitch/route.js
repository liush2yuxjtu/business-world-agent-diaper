function choice(name, probabilities) {
  return {
    type: 'choice',
    choice: name,
    confidence: Math.max(...Object.values(probabilities)),
    probabilities
  };
}

export async function POST(request) {
  const started = Date.now();
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const state = typeof body.state === 'string' ? body.state.trim() : '';
  if (state.length < 8) {
    return Response.json({ error: 'state must contain at least 8 characters.' }, { status: 400 });
  }

  const text = state.toLowerCase();
  const unsafe = /ignore|override|drop table|drop the customer|delete|destructive/.test(text);
  const deployment = /vercel|deploy|build|error|missing/.test(text);
  const support = /customer|billing|charged|refund|human|person/.test(text);

  const tool = unsafe
    ? choice('ask_user', { ask_user: 0.72, inspect_config: 0.16, read_logs: 0.07, none: 0.05 })
    : deployment
      ? choice('read_logs', { read_logs: 0.74, inspect_config: 0.17, ask_user: 0.05, none: 0.04 })
      : support
        ? choice('specialist_agent', { specialist_agent: 0.69, ask_user: 0.19, inspect_config: 0.07, none: 0.05 })
        : choice('specialist_agent', { specialist_agent: 0.48, inspect_config: 0.25, ask_user: 0.17, none: 0.10 });

  const next = unsafe
    ? choice('stop', { stop: 0.82, ask_user: 0.13, continue: 0.03, retry: 0.02 })
    : support && /human|person/.test(text)
      ? choice('ask_user', { ask_user: 0.64, continue: 0.26, stop: 0.06, retry: 0.04 })
      : choice('continue', { continue: 0.72, ask_user: 0.12, retry: 0.10, stop: 0.06 });

  return Response.json({
    mode: 'demo',
    model: 'jev-demo-fixture',
    latencyMs: Date.now() - started,
    answers: {
      tool,
      next_action: next,
      risk: { type: 'score', score: unsafe ? 2.9 : support ? 1.45 : deployment ? 0.55 : 0.8, confidence: 0.86 },
      human_approval: { type: 'noul', noul: unsafe ? 0.98 : support && /human|person/.test(text) ? 0.84 : 0.16 },
      injection_signal: { type: 'noul', noul: /ignore|override|drop table|drop the customer/.test(text) ? 0.97 : 0.04 }
    },
    estimatedInputCostUsd: null,
    note: 'Deterministic demo fixture. No Jev API call was made in this mode.'
  }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
