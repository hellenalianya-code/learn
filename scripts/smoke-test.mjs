// Smoke test: opens each page in Chromium, exercises the main flows and fails on any page error.
// Pages run in demo mode (window.LR_DEMO) so the test never signs in to the real Supabase project.
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
  await p.addInitScript(() => { window.LR_DEMO = true; });
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
    check((await p.locator('#module-cards .tile').count()) >= 5, 'portal: subjects are listed');
    await p.click('#subj-maths');
    check((await p.locator('#module-cards .tile').count()) === 6, 'portal: grades 1-6 are listed');
    await p.click('#grade-maths-4');
    check((await p.locator('.lesson-row').count()) >= 1, 'portal: lessons for the grade are listed');
    await p.locator('.lesson-row .acts .btn').first().click();
    check(await p.isVisible('#screen'), 'portal: classroom screen opens');
    await p.click('#sc-next');
    check((await p.textContent('#sc-stage')).length > 0, 'portal: slides advance');
    await p.click('#sc-close');
    await p.click('#tab-grades');
    check((await p.locator('#grade-rows .gb-card').count()) > 0, 'portal: gradebook lists each girl with her grades');
    await p.locator('#grade-rows .gb-toggle').first().click();
    check((await p.locator('#grade-rows .gb-detail:not([hidden]) .gb-sec').count()) === 4, 'portal: opening a girl shows her 4 subjects');
    await p.click('#gb-p-maths');
    const first = p.locator('#grade-rows input.score').first();
    await first.fill('91');
    check((await p.locator('#grade-rows .gb-tscore').first().textContent()).includes('EE'), 'portal: a score of 91 shows level EE');
    await p.click('#tab-exams');
    check((await p.locator('#ex-list .ex-card').count()) > 0, 'portal: an end-of-term exam for each grade and subject');
    await p.locator('#ex-list .ex-card .ex-acts .btn').first().click();
    check(await p.isVisible('#ex') && (await p.locator('#ex .ex-pk').count()) > 0, 'portal: sitting an exam on the tablet starts with picking the girl');
    await p.click('#ex-close');
    check(errors.length === 0, `portal: no script errors ${errors.join(' | ')}`);
    await p.close();
  }
  // Admin page (sample data in demo mode)
  {
    const { p, errors } = await page('/admin/');
    await p.fill('#u', 'ci@example.org'); await p.fill('#p', 'x');
    await p.click('#login-form button[type=submit]');
    await p.waitForSelector('#users tbody tr');
    check((await p.locator('#users tbody tr').count()) > 0, 'admin: accounts table renders');
    check((await p.locator('#chart svg').count()) === 1, 'admin: sign-ins chart renders');
    check(errors.length === 0, `admin: no script errors ${errors.join(' | ')}`);
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
