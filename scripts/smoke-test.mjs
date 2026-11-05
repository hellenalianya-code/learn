// Smoke test: opens each page in Chromium, exercises the main flows and fails on any page error.
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { serve } from './serve.mjs';

const root = new URL('..', import.meta.url).pathname;
const server = await serve(root);
const browser = await chromium.launch();
const failures = [];
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures.push(msg); };

async function page(path) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(server.url + path, { waitUntil: 'networkidle' });
  return { p, errors };
}

try {
  // Teacher portal
  {
    const { p, errors } = await page('/teacher-portal/');
    await p.fill('#u', 'user1'); await p.fill('#p', 'wrong');
    await p.click('#login-form button[type=submit]');
    check((await p.textContent('#login-err')).length > 0, 'portal: wrong password shows an error');
    await p.fill('#p', '1234'); await p.click('#login-form button[type=submit]');
    check(await p.isVisible('#app'), 'portal: test account signs in');
    check((await p.locator('#class-rows tr').count()) > 0, 'portal: class list has learners');
    await p.click('#tab-modules');
    check((await p.locator('#module-cards .card').count()) >= 6, 'portal: modules are listed');
    await p.locator('.lesson-row .acts .btn').first().click();
    check(await p.isVisible('#screen'), 'portal: classroom screen opens');
    await p.click('#sc-next');
    check((await p.textContent('#sc-stage')).length > 0, 'portal: slides advance');
    await p.click('#sc-close');
    await p.click('#tab-grades');
    const first = p.locator('#grade-rows input.score').first();
    await first.fill('91');
    check((await p.locator('#grade-rows tr').first().textContent()).includes('EE'), 'portal: a score of 91 shows level EE');
    await p.click('#tab-questions');
    await p.fill('#q-text', 'CI check question?'); await p.fill('#qo0', 'Yes'); await p.fill('#qo1', 'No');
    await p.click('#q-form button[type=submit]');
    check((await p.textContent('#q-bank')).includes('CI check question?'), 'portal: a new question is saved');
    check(errors.length === 0, `portal: no script errors ${errors.join(' | ')}`);
    await p.close();
  }
  // Dashboard
  {
    const { p, errors } = await page('/dashboard/');
    await p.waitForTimeout(500);
    const kpi = (await p.textContent('[data-draw="k-learners"]')).trim();
    check(kpi !== '' && kpi !== '—', `dashboard: headline figure renders (${kpi})`);
    check((await p.locator('svg').count()) >= 5, 'dashboard: charts render');
    check((await p.locator('tbody tr').count()) >= 15, 'dashboard: tables render');
    check(errors.length === 0, `dashboard: no script errors ${errors.join(' | ')}`);
    await p.close();
  }
  // Data files
  for (const f of ['budget', 'content', 'milestones', 'modules', 'monthly', 'sites']) {
    const rows = (await readFile(`${root}dashboard/data/${f}.csv`, 'utf8')).trim().split('\n');
    const width = rows[0].split(',').length;
    check(rows.length > 1 && rows.every((r) => r.split(',').length >= width), `data: ${f}.csv has a header and complete rows`);
  }
} finally {
  await browser.close();
  server.close();
}

if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll checks passed');
