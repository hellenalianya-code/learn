// Records the portal's narration with ElevenLabs into teacher-portal/voice/.
// Run by .github/workflows/voice.yml. Only texts without a recording (or recorded with another voice/model) are sent,
// so re-running costs nothing for lines already recorded.
//
//   ELEVENLABS_API_KEY  the key (a GitHub secret; never put it in the page or in this repo)
//   VOICE_EN            ElevenLabs voice ID for English lines
//   VOICE_SW            voice ID for Kiswahili lines (defaults to VOICE_EN)
//   MODEL               default eleven_v4 (speaks English and Kiswahili)
//   FORMAT              default mp3_22050_32 (small files for low-bandwidth tablets)
//   MAX_CHARS           stop after sending this many characters in one run (default 20000), to protect credits
//   MODULES             record only these modules first, e.g. "kis" (Kiswahili) or "kis,lit"; blank = everything
//   TUNING              voice settings, e.g. "speed=0.9,stability=0.6,similarity=0.8,style=0.1" (blank = the voice's own)
//                       speed <1 is slower; stability 0–1 (higher = steadier); similarity 0–1; style 0–1. Changing it re-records.
//   DRY_RUN=1           only count what would be recorded; no key needed
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'teacher-portal', 'voice');
const MANIFEST = path.join(OUT, 'manifest.json');
const env = process.env;
const DRY = env.DRY_RUN === '1' || env.DRY_RUN === 'true';
const KEY = env.ELEVENLABS_API_KEY;
const VOICE = { en: (env.VOICE_EN || '').trim(), sw: (env.VOICE_SW || env.VOICE_EN || '').trim() };
const MODEL = (env.MODEL || 'eleven_v4').trim();
const FORMAT = (env.FORMAT || 'mp3_22050_32').trim();
const MAX = Number(env.MAX_CHARS || 20000);
const TUNE = {};
for (const part of (env.TUNING || '').split(',').map((x) => x.trim()).filter(Boolean)) {
  const [k, v] = part.split('=').map((x) => x.trim()); const n = Number(v);
  const name = { speed: 'speed', stability: 'stability', similarity: 'similarity_boost', style: 'style' }[k];
  if (!name || !isFinite(n)) { console.error(`TUNING: did not understand "${part}" (use speed, stability, similarity, style)`); process.exit(1); }
  TUNE[name] = n;
}
if (TUNE.speed !== undefined && (TUNE.speed < 0.7 || TUNE.speed > 1.2)) { console.error('TUNING: speed must be between 0.7 and 1.2'); process.exit(1); }
const ONLY = (env.MODULES || '').split(',').map((x) => x.trim()).filter(Boolean);

if (!DRY && !KEY) { console.error('ELEVENLABS_API_KEY is not set. Add it under Settings → Secrets and variables → Actions.'); process.exit(1); }
if (!DRY && !VOICE.en) { console.error('No voice ID. Set VOICE_EN (the Voice ID from the ElevenLabs Voice Library).'); process.exit(1); }

// 1. Every text the portal narrates, straight from the page (window.lrVoiceTexts), so this list never drifts from the app.
async function texts() {
  const b = await chromium.launch(); const ctx = await b.newContext();
  await ctx.addInitScript(() => { window.LR_DEMO = true; });
  await ctx.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.host !== 'lr.test') return r.abort();
    if (u.pathname.endsWith('supabase-config.js')) return r.fulfill({ contentType: 'text/javascript', body: "window.LR_SUPABASE={url:'https://YOUR-PROJECT-REF.supabase.co',anonKey:'x'};" });
    if (u.pathname.endsWith('/teacher-portal/')) return r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(ROOT, 'teacher-portal', 'index.html')) });
    return r.fulfill({ status: 404, body: '' });
  });
  const p = await ctx.newPage();
  await p.goto('http://lr.test/teacher-portal/'); await p.fill('#u', 'user1'); await p.fill('#p', '1234'); await p.click('#login-btn');
  await p.waitForFunction(() => typeof window.lrVoiceTexts === 'function');
  const list = await p.evaluate(() => window.lrVoiceTexts());
  await b.close(); return list;
}

async function record(item) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE[item.lang])}?output_format=${FORMAT}`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: item.text, model_id: MODEL, language_code: item.lang, ...(Object.keys(TUNE).length ? { voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true, ...TUNE } } : {}) }),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const msg = (await res.text()).slice(0, 300);
    if ((res.status === 429 || res.status >= 500) && attempt < 5) { await new Promise((r) => setTimeout(r, 2000 * attempt)); continue; }
    throw new Error(`ElevenLabs ${res.status}: ${msg}`);
  }
}

const list = await texts();
fs.mkdirSync(OUT, { recursive: true });
const old = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { files: {}, made: {} };
old.made ||= {};
const tuneSig = Object.keys(TUNE).sort().map((k) => k + '=' + TUNE[k]).join(',');
const sig = (lang) => `${VOICE[lang]}|${MODEL}|${FORMAT}` + (tuneSig ? '|' + tuneSig : '');
const have = (it) => old.files[it.key] && fs.existsSync(path.join(OUT, old.files[it.key])) && (DRY && !VOICE.en ? true : old.made[it.key] === sig(it.lang));
const todo = list.filter((it) => !have(it) && (!ONLY.length || (it.mods || []).some((m) => ONLY.includes(m))));
if (ONLY.length) console.log(`Only modules: ${ONLY.join(', ')}.`);
const total = list.reduce((a, it) => a + it.text.length, 0), todoChars = todo.reduce((a, it) => a + it.text.length, 0);
console.log(`${list.length} narrated texts (${total} characters). Already recorded: ${list.filter(have).length}. To record: ${todo.length} (${todoChars} characters).`);
if (DRY) { console.log('Dry run: nothing sent.'); process.exit(0); }

const files = {}, made = {};
// keep every recording still in use (an older voice keeps playing until its new recording is made)
for (const it of list) if (old.files[it.key] && fs.existsSync(path.join(OUT, old.files[it.key]))) { files[it.key] = old.files[it.key]; made[it.key] = old.made[it.key]; }
let sent = 0, n = 0, failed = 0, stopped = false;
const save = () => fs.writeFileSync(MANIFEST, JSON.stringify({ model: MODEL, format: FORMAT, voices: VOICE, tuning: TUNE, files, made }, null, 0) + '\n');
let i = 0;
async function worker() {
  while (i < todo.length) {
    const it = todo[i++];
    if (sent + it.text.length > MAX) { stopped = true; continue; }
    sent += it.text.length;
    try {
      const mp3 = await record(it); const f = it.key + '.mp3';
      fs.writeFileSync(path.join(OUT, f), mp3); files[it.key] = f; made[it.key] = sig(it.lang); n++;
      if (n % 25 === 0) { save(); console.log(`  ${n} recorded (${sent} characters)`); }
    } catch (e) {
      failed++; console.error(`  ✗ ${it.key}: ${e.message}`);
      if (/40[13]/.test(e.message)) { console.error('The key was refused: check the secret and that it has Text to Speech access.'); i = todo.length; }
      if (/quota|credits/i.test(e.message)) { console.error('Out of ElevenLabs credits.'); i = todo.length; }
      if (/ 402:|paid_plan_required|payment_required/.test(e.message)) { console.error('ElevenLabs needs a paid plan for this (see the message above).'); i = todo.length; }
    }
  }
}
await Promise.all([worker(), worker()]); // the free plan allows 2 requests at a time
save();
// recordings no longer used by the portal
const keep = new Set(Object.values(files)); let removed = 0;
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.mp3') && !keep.has(f)) { fs.unlinkSync(path.join(OUT, f)); removed++; }
const left = list.filter((it) => made[it.key] !== sig(it.lang)).length;
console.log(`Recorded ${n} (${sent} characters), ${failed} failed, ${removed} old files removed. ${left ? left + ' texts still to record' + (stopped ? ' (MAX_CHARS reached: run again to continue)' : '') + '.' : 'Every text has a recording.'}`);
if (failed && !n) process.exit(1);
