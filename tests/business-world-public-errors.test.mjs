import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { BaselineUnavailableError, SourceReadOnlyError, crossOriginResponse, errorResponse, publicErrorMessage, publicMessages } from '../lib/business-world/public-errors.ts';

test('unexpected storage errors cannot disclose implementation details', async () => {
  const response = errorResponse(new Error('database credentials=private-value SQL SELECT'), 'SAVE_FAILED');
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: 'SAVE_FAILED', error: publicMessages.SAVE_FAILED });
});

test('invalid scenario and state data remain actionable without schema payloads', async () => {
  const invalid = z.number().max(200).safeParse(201).error;
  const scenario = errorResponse(invalid, 'SCENARIO_FAILED', 'INVALID_INPUT');
  assert.equal(scenario.status, 400);
  assert.equal((await scenario.json()).error, publicMessages.INVALID_INPUT);
  const state = errorResponse(invalid, 'SAVE_FAILED', 'INVALID_STATE');
  assert.equal((await state.json()).error, publicMessages.INVALID_STATE);
});

test('invalid JSON and unavailable baseline have distinct safe errors', async () => {
  const malformed = errorResponse(new SyntaxError('internal parser detail'), 'SAVE_FAILED', 'INVALID_STATE');
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).code, 'INVALID_JSON');
  const missing = errorResponse(new BaselineUnavailableError(), 'SCENARIO_FAILED');
  assert.equal(missing.status, 409);
  assert.equal((await missing.json()).code, 'BASELINE_UNAVAILABLE');
});

test('origin checks reject malformed, foreign and protocol-mismatched origins', () => {
  for (const origin of ['null', 'not a URL', 'https://foreign.example', 'http://app.example']) {
    assert.equal(crossOriginResponse(new Request('https://app.example/api', { headers: { origin } })).status, 403);
  }
  assert.equal(crossOriginResponse(new Request('https://app.example/api', { headers: { origin: 'https://app.example' } })), null);
  assert.equal(crossOriginResponse(new Request('https://app.example/api')), null);
});

test('client presentation accepts only known codes, never raw messages', () => {
  for (const body of [null, { error: 'private detail' }, { code: '__proto__' }, { code: 'constructor' }]) {
    assert.equal(publicErrorMessage(body, 'READ_FAILED'), publicMessages.READ_FAILED);
  }
  assert.equal(publicErrorMessage({ code: 'INVALID_INPUT', error: 'private detail' }, 'READ_FAILED'), publicMessages.INVALID_INPUT);
});

 test('read-only source failure is actionable and does not disclose backend policy details', async () => {
  const response = errorResponse(new SourceReadOnlyError('private policy detail'), 'SAVE_FAILED');
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { code: 'SOURCE_READ_ONLY', error: publicMessages.SOURCE_READ_ONLY });
});
