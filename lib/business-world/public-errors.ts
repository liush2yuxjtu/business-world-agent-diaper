import { ZodError } from 'zod';

export const publicMessages = {
  INVALID_INPUT: '请检查填写内容。实验假设需要 3–1000 个字，变化幅度需要在 -80% 到 200% 之间。',
  INVALID_STATE: '请检查来源名称、时间和各项数值；比例应在 0–100% 之间，数量不能为负数。',
  INVALID_JSON: '提交内容无法读取，请刷新页面后重新填写。',
  CROSS_ORIGIN: '请在当前应用页面内提交此操作。',
  BASELINE_UNAVAILABLE: '尚无可用的经营基线，请先读取数据再运行实验。',
  READ_FAILED: '暂时无法读取经营数据，请稍后重试。',
  SAVE_FAILED: '未能确认保存成功，请刷新数据核对后再试。',
  SCENARIO_FAILED: '未能确认实验已保存，请稍后核对场景记录。',
  INVALID_RECORD: '情景记录链接无效，请从历史记录重新选择。',
  RECORD_NOT_FOUND: '未找到这条情景记录，请刷新历史记录后重试。',
  HISTORY_FAILED: '暂时无法读取场景记录，请稍后重试。',
} as const;

export type PublicErrorCode = keyof typeof publicMessages;

export class BaselineUnavailableError extends Error {}

export function errorResponse(error: unknown, fallback: PublicErrorCode, validation?: PublicErrorCode) {
  const code = error instanceof BaselineUnavailableError ? 'BASELINE_UNAVAILABLE'
    : error instanceof ZodError && validation ? validation
    : error instanceof SyntaxError && validation ? 'INVALID_JSON'
    : fallback;
  const status = code === 'INVALID_INPUT' || code === 'INVALID_STATE' || code === 'INVALID_JSON' ? 400
    : code === 'BASELINE_UNAVAILABLE' ? 409 : 503;
  return Response.json({ code, error: publicMessages[code] }, { status });
}

export function crossOriginResponse(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  try {
    if (new URL(origin).origin === new URL(request.url).origin) return null;
  } catch { /* Invalid origins follow the same refusal path. */ }
  return Response.json({ code: 'CROSS_ORIGIN', error: publicMessages.CROSS_ORIGIN }, { status: 403 });
}

export function publicErrorMessage(body: unknown, fallback: PublicErrorCode) {
  const code = body && typeof body === 'object' && 'code' in body ? body.code : null;
  return typeof code === 'string' && Object.hasOwn(publicMessages, code)
    ? publicMessages[code as PublicErrorCode] : publicMessages[fallback];
}
