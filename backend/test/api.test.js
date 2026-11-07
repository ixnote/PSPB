import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/server.js';

const server = http.createServer(app);
const base = await new Promise((resolve, reject) => {
  server.listen(0, () => {
    const port = server.address().port;
    resolve(`http://127.0.0.1:${port}`);
  });
  server.on('error', reject);
});

test.after(() => server.close());

test('GET /api/health returns status and db', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'ok');
  assert.ok(['ok', 'pending', 'error'].includes(body.db));
});

test('GET /api/conflict/lgas returns 17 LGAs (public)', async () => {
  const res = await fetch(`${base}/api/conflict/lgas`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
  assert.strictEqual(body.length, 17);
  assert.ok(body.includes('Bassa') && body.includes('Jos North'));
});

test('POST /api/auth/login with bad creds returns 4xx or 5xx', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong' }),
  });
  assert.ok(res.status >= 400, `expected 4xx or 5xx, got ${res.status}`);
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) assert.ok(body.error);
});

test('GET /api/kms/documents without auth returns 401', async () => {
  const res = await fetch(`${base}/api/kms/documents`);
  assert.strictEqual(res.status, 401);
});

test('POST /api/applications accepts volunteer submission', async () => {
  const form = new FormData();
  form.append('type', 'volunteer');
  form.append('name', 'Test Volunteer');
  form.append('email', 'volunteer@test.org');
  form.append('area_of_interest', 'Community outreach');
  form.append('motivation', 'Want to contribute.');
  const res = await fetch(`${base}/api/applications`, {
    method: 'POST',
    body: form,
  });
  assert.strictEqual(res.status, 201, `expected 201, got ${res.status}`);
  const body = await res.json();
  assert.strictEqual(body.type, 'volunteer');
  assert.ok(body.message);
});

test('POST /api/applications rejects missing required fields', async () => {
  const form = new FormData();
  form.append('type', 'volunteer');
  const res = await fetch(`${base}/api/applications`, {
    method: 'POST',
    body: form,
  });
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.ok(body.error);
});

test('GET /api/website/galleries returns array', async () => {
  const res = await fetch(`${base}/api/website/galleries`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
});

test('GET /api/website/repository returns array', async () => {
  const res = await fetch(`${base}/api/website/repository`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
});

test('GET /api/website/news returns array', async () => {
  const res = await fetch(`${base}/api/website/news`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
});
