// Adds a person's own recordings (made on teacher-portal/record.html) to the narration in teacher-portal/voice/.
//
//   node scripts/voice-import.mjs <recordings.zip | folder>
//
// The zip from the recording page holds one audio file per line, named by the line's key (for example sw-f08346c1.webm),
// and speaker.json ({ name, consent, date }). Each file is cleaned up (silence trimmed, loudness evened out), saved as MP3
// and marked "human:<name>" in the manifest, so a machine voice never replaces it. Needs ffmpeg and unzip.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'teacher-portal', 'voice');
const MANIFEST = path.join(OUT, 'manifest.json');
const src = process.argv[2];
if (!src) { console.error('Usage: node scripts/voice-import.mjs <recordings.zip | folder>'); process.exit(1); }

let dir = src;
if (fs.statSync(src).isFile()) { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lr-voice-')); execFileSync('unzip', ['-q', '-o', src, '-d', dir]); }
const speaker = fs.existsSync(path.join(dir, 'speaker.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'speaker.json'), 'utf8')) : {};
if (!speaker.consent) { console.error('speaker.json does not record the speaker\'s consent. Ask her to tick the consent box on the recording page, then download again.'); process.exit(1); }
const who = String(speaker.name || 'speaker').replace(/[^\p{L}\p{N} .'-]/gu, '').trim() || 'speaker';

const lines = JSON.parse(fs.readFileSync(path.join(OUT, 'lines.json'), 'utf8')).lines;
const known = new Set(lines.map((l) => l.key));
const man = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { files: {}, made: {} };
man.made ||= {}; man.files ||= {};

let n = 0, skipped = 0;
for (const f of fs.readdirSync(dir).sort()) {
  const m = f.match(/^((?:en|sw)-[0-9a-f]{8})\.(webm|ogg|m4a|mp4|wav|mp3)$/);
  if (!m) continue;
  if (!known.has(m[1])) { console.log(`  skipped ${f}: that line is no longer in the portal`); skipped++; continue; }
  const out = path.join(OUT, m[1] + '.mp3');
  // trim silence at both ends, even out loudness, mono 44.1 kHz 64 kbps (a real voice deserves a little more than the machine one)
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(dir, f),
    '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.25,areverse,loudnorm=I=-18:TP=-2:LRA=11',
    '-ac', '1', '-ar', '44100', '-b:a', '64k', out]);
  man.files[m[1]] = m[1] + '.mp3'; man.made[m[1]] = 'human:' + who; n++;
}
fs.writeFileSync(MANIFEST, JSON.stringify(man) + '\n');
const people = {}; for (const v of Object.values(man.made)) if (String(v).startsWith('human:')) people[v.slice(6)] = (people[v.slice(6)] || 0) + 1;
console.log(`Imported ${n} recordings by ${who}${skipped ? `, skipped ${skipped}` : ''}. Recorded by people: ${Object.entries(people).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}.`);
