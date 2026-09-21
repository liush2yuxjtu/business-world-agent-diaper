export function chatErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (/credit card|billing|insufficient.credit|payment.required/i.test(message)) return '模型服务暂不可用，项目服务账户需要处理计费配置。请保留问题，配置恢复后再试。';
  if (/unauthorized|forbidden|authentication|\b401\b|\b403\b/i.test(message)) return '当前对话服务未能确认访问权限，请检查登录状态或联系项目管理员。';
  if (/rate.limit|too many requests|\b429\b/i.test(message)) return '对话请求较多，请稍后再试。';
  return '本次回答未能完成，请保留问题后重试。如涉及保存或其他操作，请先核对实际记录。';
}
