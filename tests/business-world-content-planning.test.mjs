import test from 'node:test';
import assert from 'node:assert/strict';
import { composeContentBrief, composeContentPlan, composePersonaTask, createDraftInput, editDraftInput } from '../lib/business-world/content-draft-model.ts';

const snapshot = { provenance: { sourceLabel: '合成选题', asOf: '2026-09-21T00:00:00Z' }, data: { meta: { dataMode: 'simulated' }, content: { topTopics: [{ title: '夜间防漏', persona: '夜间护理人群', potential: '待验证' }], scripts: [{ name: '问题引入', format: '讲解', durationSec: 10 }] } } };
test('persona task freezes evidence and never becomes a publication plan', () => {
  const source = structuredClone(snapshot);
  source.data.personas = [{ id: 'p1', title: '护理家庭', goal: '夜间安心', pain: '漏尿', trigger: '护理问题', content: '防漏讲解', conversionRate: 0, repeatRate: null }];
  const task = composePersonaTask(source, 'p1', 'task', 'now');
  source.data.personas[0].goal = '改变后的需求';
  assert.equal(task.personaEvidence.goal, '夜间安心');
  assert.match(task.body, /合成人群研究提案/);
  assert.match(task.body, /转化率 0/);
  assert.match(task.body, /未观测/);
  assert.match(task.body, /尚未执行/);
  assert.equal(task.kind, 'task');
  assert.throws(() => composePersonaTask(source, 'missing', 'task', 'now'));
  assert.throws(() => composeContentPlan(task, { id: 'plan', scheduledFor: '2026-09-25', channel: '频道' }, 'now'));
  assert.equal(createDraftInput.safeParse({kind:'task', personaId:'p1', body:'客户端伪造的依据'}).success, false);
});
test('editable brief preserves selected source and planned copy stays independent', () => {
  const source = structuredClone(snapshot);
  const brief = composeContentBrief(source, '夜间防漏', 'brief', '2026-09-21');
  source.data.content.topTopics[0].persona = '之后的数据';
  brief.body += '\n人工复核原稿'; brief.revision = 2;
  const plan = composeContentPlan(brief, { id: 'plan', scheduledFor: '2026-09-23', channel: '测试渠道' }, '2026-09-22');
  brief.body = '后续修改'; brief.source.persona = '修改后的原稿';
  assert.match(plan.body, /人工复核原稿/);
  assert.match(plan.body, /合成数据演示/);
  assert.equal(plan.source.persona, '夜间护理人群');
  assert.deepEqual(plan.basedOnBrief, { id: 'brief', revision: 2 });
  assert.equal(plan.kind, 'plan'); assert.equal(plan.revision, 1);
  assert.throws(() => composeContentPlan(plan, { id: 'next', scheduledFor: '2026-09-24', channel: '频道' }, 'now'));
});
test('missing topics, impossible calendar dates and unbounded content are rejected', () => {
  assert.throws(() => composeContentBrief(snapshot, '不存在', 'brief', 'now'));
  const plan = { kind: 'plan', briefId: '00000000-0000-4000-8000-000000000001', revision: 1, scheduledFor: '2026-09-23', channel: '频道' };
  assert.ok(createDraftInput.safeParse(plan).success);
  for (const scheduledFor of ['2026-02-30', '2026-13-01', '2026-9-1']) assert.equal(createDraftInput.safeParse({ ...plan, scheduledFor }).success, false);
  assert.equal(editDraftInput.safeParse({ id: plan.briefId, revision: 1, title: '标题', body: '字'.repeat(12001) }).success, false);
});
