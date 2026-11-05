// Captures the screenshots and GIFs shown in the README (docs/images/).
// Needs ffmpeg on the PATH for the GIFs.
import { chromium } from 'playwright';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { serve } from './serve.mjs';

const root = new URL('..', import.meta.url).pathname;
const out = `${root}docs/images`;
const tmp = `${root}.capture-tmp`;
await mkdir(out, { recursive: true });
const server = await serve(root, 4174);
const browser = await chromium.launch();

async function open(path, viewport = { width: 1280, height: 800 }) {
  const p = await browser.newPage({ viewport, deviceScaleFactor: 1, colorScheme: 'light' });
  await p.goto(server.url + path, { waitUntil: 'networkidle' });
  return p;
}
async function signIn(p) {
  await p.fill('#u', 'user1'); await p.fill('#p', '1234');
  await p.click('#login-form button[type=submit]');
  await p.waitForSelector('#app:not([hidden])');
}
const still = async (p, name, opts = {}) => { await p.waitForTimeout(450); await p.screenshot({ path: `${out}/${name}.png`, ...opts }); console.log(`saved ${name}.png`); };

// A GIF recorder: each step() grabs a frame and holds it for `hold` seconds.
function recorder(name) {
  const frames = [];
  return {
    async step(p, hold = 1.2) { await p.waitForTimeout(350); const f = `${tmp}/${name}-${String(frames.length).padStart(3, '0')}.png`; await p.screenshot({ path: f }); frames.push([f, hold]); },
    async save(width = 960) {
      const list = frames.map(([f, d]) => `file '${f}'\nduration ${d}`).join('\n') + `\nfile '${frames.at(-1)[0]}'\n`;
      await writeFile(`${tmp}/${name}.txt`, list);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/${name}.txt`,
        '-vf', `fps=10,scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`,
        '-loop', '0', `${out}/${name}.gif`]);
      console.log(`saved ${name}.gif`);
    },
  };
}

await rm(tmp, { recursive: true, force: true });
await mkdir(tmp, { recursive: true });
try {
  // ---- Still screenshots ----
  let p = await open('/teacher-portal/');
  await still(p, 'portal-login');
  await signIn(p);
  await still(p, 'portal-class');
  await p.click('#tab-modules'); await still(p, 'portal-modules');
  await p.click('#tab-grades'); await still(p, 'portal-gradebook');
  await p.click('#tab-questions'); await still(p, 'portal-questions');
  await p.click('#tab-modules');
  await p.locator('.lesson-row .acts .btn').nth(1).click(); // "The solar radio"
  await p.click('#sc-next'); await still(p, 'classroom-screen');
  await p.close();

  p = await open('/teacher-portal/', { width: 390, height: 844 });
  await signIn(p); await still(p, 'portal-mobile');
  await p.close();

  p = await open('/dashboard/', { width: 1280, height: 900 });
  await still(p, 'dashboard');
  await still(p, 'dashboard-full', { fullPage: true });
  await p.close();

  // ---- GIF: sign in and present a lesson on the classroom screen ----
  p = await open('/teacher-portal/');
  const g1 = recorder('demo-present-lesson');
  await g1.step(p, 1.2);
  await p.type('#u', 'user1', { delay: 60 }); await g1.step(p, 0.5);
  await p.type('#p', '1234', { delay: 60 }); await g1.step(p, 0.6);
  await p.click('#login-form button[type=submit]'); await g1.step(p, 1.8);
  await p.click('#tab-modules'); await g1.step(p, 1.6);
  await p.locator('.lesson-row .acts .btn').nth(1).click(); await g1.step(p, 1.8);
  for (let i = 0; i < 3; i++) { await p.click('#sc-next'); await g1.step(p, 1.8); }
  await p.click('#sc-next'); await g1.step(p, 1.6); // question slide
  const reveal = p.locator('#sc-stage .btn');
  if (await reveal.count()) { await reveal.click(); await g1.step(p, 2.4); }
  await g1.save();
  await p.close();

  // ---- GIF: grading and girls' wellbeing attendance ----
  p = await open('/teacher-portal/');
  await signIn(p);
  const g2 = recorder('demo-gradebook');
  await p.click('#tab-grades'); await g2.step(p, 1.4);
  const score = p.locator('#grade-rows input.score').nth(4);
  await score.fill(''); await score.type('88', { delay: 120 }); await g2.step(p, 1.6);
  await p.selectOption('#g-module', 'men'); await g2.step(p, 1.6);
  await p.locator('#grade-rows input.tick').nth(4).click(); await g2.step(p, 1.4);
  await p.selectOption('#g-module', 'repro'); await g2.step(p, 2);
  await p.click('#tab-class'); await g2.step(p, 2.2);
  await g2.save();
  await p.close();
} finally {
  await browser.close();
  server.close();
  await rm(tmp, { recursive: true, force: true });
}
