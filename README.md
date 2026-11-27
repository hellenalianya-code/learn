# LearnReach

[![CI/CD](https://github.com/hellenalianya-code/learn/actions/workflows/ci.yml/badge.svg)](https://github.com/hellenalianya-code/learn/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/live%20demo-GitHub%20Pages-136f63)](https://hellenalianya-code.github.io/learn/)
[![License: MIT](https://img.shields.io/badge/license-MIT-e9a23b)](LICENSE)

**Offline-first, audio-visual learning and wellbeing platform** by Vivanet Solutions Ltd.

LearnReach brings lessons and essential health information to adolescent girls in underserved and marginalised communities. It works offline or with limited connectivity and runs on solar-powered audio-visual equipment: TVs, projectors, radios and power banks.

## Live links

| Page | Link | For |
| --- | --- | --- |
| **Teacher portal** | [hellenalianya-code.github.io/learn/teacher-portal](https://hellenalianya-code.github.io/learn/teacher-portal/) | Teachers register with their email, sign in and run club sessions |
| **Admin** | [hellenalianya-code.github.io/learn/admin](https://hellenalianya-code.github.io/learn/admin/) | Admins see who has registered and who is signing in |
| Programme dashboard | [hellenalianya-code.github.io/learn/dashboard](https://hellenalianya-code.github.io/learn/dashboard/) | Staff and partners |
| Home | [hellenalianya-code.github.io/learn](https://hellenalianya-code.github.io/learn/) | Landing page |

![Presenting a lesson on the classroom screen](docs/images/demo-present-lesson.gif)

> **Prototype.** All learners, scores and figures are sample data.

## Showcase

### Teacher portal

A teacher runs a girls' club session: she takes the register, presents a lesson on the classroom TV or projector, asks the class questions and follows each girl's progress term by term.

| My class | Students |
| --- | --- |
| ![My class: stat tiles and analytics for the teacher](docs/images/portal-class.png) | ![Students tab: club members with level and attendance bar](docs/images/portal-students.png) |
| **Modules** | **Gradebook** |
| ![Modules by subject and grade, with Present to class and Listen buttons](docs/images/portal-modules.png) | ![Gradebook with scores and levels](docs/images/portal-gradebook.png) |

**Classroom screen with pictures and scenes.** Every lesson becomes narrated, full-screen slides for a TV or projector, set in a scene girls know that changes with the grade: savanna with acacias and a giraffe (Grades 1–2), a village with manyattas, goats and maize (3–4), sunset with a solar-powered school, radio mast and camel (5–6), and a dawn with flowers for Life Skills. The class quiz and picture activities use the same scenes. Grade 1–2 Maths, Science and English lessons have drawn pictures on every slide that pop in one by one, so young learners can follow even before they read well. Lessons are starting to get a cover slide that says what the class will learn. Questions come at the end, and the answer stays hidden until the teacher reveals it.

| Lesson cover | Counting at the market |
| --- | --- |
| ![Cover of "Our five senses": a girl with see, hear, smell, taste and touch around her](docs/images/lesson-cover.png) | ![Adding at the market: 12 tomatoes and 9 tomatoes make 21](docs/images/lesson-picture.png) |

**Each girl's profile.** Tap a name to see her profile: about her, how she gets to school, home situation, and a report card per term with class questions, CATs and (later) exams. **Her journey** shows one circle per class at school: passed grades with a tick and stars, her current grade, and the next one locked. Tap a grade to open its subjects; tap a term to open that report card.

| Profile | Progress over time |
| --- | --- |
| ![Pupil profile with class at school and current term](docs/images/pupil-profile.png) | ![Learning now and a line chart of her score each term](docs/images/pupil-progress.png) |

<p align="center"><img src="docs/images/pupil-journey.png" alt="Her journey: Grade 2 and 3 passed with stars, Grade 4 now, Grade 5 locked" width="720"></p>

**Gradebook.** One card per girl. Closed, it shows her score, stars and CBC level (EE, ME, AE, BE) in every subject, her overall score and the change since last term. Open, each subject shows her score term by term (tap a term to see it), that term's class questions, CATs, exam and teacher score, and every class-quiz question she got right or wrong with the correct answer. Pick a subject, term or grade, or search by name. **Downloads:** a PDF report card or the data (CSV) for any girl, class and term (for example Grade 3 Term 1), all her terms in one CSV, or the whole class for a term. Life Skills records attendance only, and reproductive health is limited to girls aged 15 and over.

![A girl's gradebook card opened: subjects term by term and her quiz answers](docs/images/gradebook-open.png)

![Opening a girl, entering a teacher score and marking Life Skills attendance](docs/images/demo-gradebook.gif)

**Modules as a journey.** Inside each grade, the term's syllabus is a winding path in that grade's scene: lessons as stepping stones (taught, next, not yet, with each lesson's buttons and how the class did in the quiz), CAT 1 and CAT 2 as milestones with the girls' marks, and the end-of-term exam at the finish line. Tap a mark to see the paper behind it. Life Skills topics follow the same path to "Topic complete".

![Maths Grade 4: the term's journey](docs/images/module-journey.png)

**End-of-term exams.** The Exams tab has one exam for each grade and subject, made from the lessons taught that term (with revision from the grade's other lessons if the term was short). Girls sit it on the tablet one at a time, where it is marked automatically and no right or wrong is shown to them, or on a printed paper (PDF with an answer key) that the teacher marks in question by question. The mark goes to her report card as the end-of-term exam, and the Gradebook can open the exam to show every answer.

![Exams tab: an exam for each grade and subject, with who has sat it](docs/images/portal-exams.png)

<p align="center"><img src="docs/images/portal-mobile.png" alt="Teacher portal on a phone" width="300"></p>

### Programme dashboard

Milestones, learners and sessions, pilot sites, the content library, module completion and budget, in one page.

![Programme dashboard](docs/images/dashboard.png)

## Key features

- **Five subjects, Grades 1–6:** Maths, English, Kiswahili and Science (graded), plus Life Skills (not graded). Each girl's class at school decides her lessons in every subject (Grade 7 and above use Grade 6 lessons).
- **Audio-visual lessons:** present any lesson as narrated slides; reading lessons have a Listen button for radio or speaker use. Every lesson is in English and Kiswahili.
- **Lesson pictures:** original drawings on all slides of the Grade 1–2 Maths, Science and English lessons (shapes, counting, the senses, plants, animals, letters), with Kiswahili labels. They work offline.
- **Step-by-step picture activities:** for example "How to wear a pad" and one Maths activity per grade.
- **Teachers add lessons:** a "＋ Add a lesson" button on every syllabus journey in Modules (and in the session planner) adds a lesson at the right place: slides, quiz questions and a video or audio, uploaded or as a YouTube, Google Drive or Vimeo link that plays inside LearnReach. It is in her syllabus at once and shared with other teachers unless she unticks it; no approval, but the admin is notified on the Admin page and can hide a lesson.
- **Sessions:** start class, take the register (present, late, absent), present, then a short class quiz on the shared device.
- **End-of-term exams:** one per grade and subject from the lessons taught that term; sat on the tablet (auto-marked) or on a printed paper the teacher marks in; feeds the report card. Catch-up lists show who missed which lesson.
- **Students and profiles:** club list with level and attendance bar; profiles saved online (Supabase) with guardian consent before sensitive details; report card per term (class questions, CATs, exams later); Close term saves every girl's report; past paper reports can be added.
- **Teacher analytics:** attendance by week, subject results, girls who need attention, questions to reteach, girls at each grade.
- **Girls' wellbeing:** menstrual health, mental wellbeing, personal safety and reproductive health (15+), never graded.
- **Accounts:** teachers register and sign in (Supabase); admins see sign-ins and the lessons teachers added on the Admin page.
- **Works offline:** the portal opens without internet and uploads changes when the connection comes back.

## Project structure

| Path | What it is |
| --- | --- |
| `teacher-portal/` | The teacher portal (single HTML file); `voice/` holds the recorded narration |
| `admin/` | Admin page: registered teachers and sign-ins, live from Supabase |
| `dashboard/` | The programme dashboard; `data/` holds its sample CSVs |
| `supabase/` | Database setup script (`schema.sql`) and setup guide (`SETUP.md`) |
| `supabase-config.js` | Supabase project address and public key, shared by the portal and admin page |
| `index.html` | Landing page for the live demo |
| `scripts/` | Smoke test, media capture, narration recording (`voice-build.mjs`) and a small static server |
| `docs/images/` | Screenshots and GIFs, regenerated by CI |
| `.github/workflows/` | CI/CD pipelines |

## Run it locally

Open `teacher-portal/index.html` or `dashboard/index.html` in a browser. The portal needs no server or internet. For the dashboard to work fully offline, run `npm install && npm run vendor` once to place `d3.min.js` next to it; otherwise it loads d3 from a CDN.

To run the checks:

```bash
npm install
npx playwright install chromium
npm run vendor
npm test        # smoke test
npm run capture # regenerate docs/images (needs ffmpeg)
```

## CI/CD

| Workflow | When | What it does |
| --- | --- | --- |
| `ci.yml` | Every push and pull request | Runs the smoke test in Chromium: sign-in, classroom screen, gradebook, questions, dashboard charts and the CSV data. On `main` it then builds the site and deploys it to GitHub Pages. |
| `media.yml` | When the portal, dashboard or capture script changes | Re-captures the screenshots and GIFs in `docs/images` and commits them. |

## Recorded narration

Lessons, questions and activities are narrated with recorded voices made by [ElevenLabs](https://elevenlabs.io) (model `eleven_v4`, English and Kiswahili). The recordings are MP3 files in `teacher-portal/voice/`, made once and served with the site; the portal plays a recording when there is one and the device's own voice otherwise. Each MP3 is kept on the tablet after it first plays, so narration also works offline.

To record or re-record:

1. Add the ElevenLabs API key as the repository secret `ELEVENLABS_API_KEY` (Settings → Secrets and variables → Actions). It is never put in the page.
2. Optional: save the voice IDs as repository variables `VOICE_EN` and `VOICE_SW`.
3. Run **Actions → Record narration (ElevenLabs) → Run workflow**. Tick *dry run* first to see how many characters will be sent. Each run sends at most *max characters* (default 20,000) to protect your credits; run again to continue. Only new or changed lines are sent, and the site redeploys with the recordings. *Modules* records one module first (for example `kis` for Kiswahili), and *tuning* adjusts the voice (for example `speed=0.9,stability=0.6`); changing the voice or its tuning re-records.

**Recording a real voice.** A person can read the lines in her own voice on [`teacher-portal/record.html`](https://hellenalianya-code.github.io/learn/teacher-portal/record.html) (Kiswahili module first by default). She writes her name, ticks the consent statement, records line by line on a phone or laptop, and downloads a zip. `node scripts/voice-import.mjs <zip>` cleans up each take (silence trimmed, loudness evened out), saves it as MP3 and marks it as hers, so a machine voice never replaces it.

## Design decisions

- **Audio-visual first.** Lessons are designed to be watched and heard together on shared solar-powered screens and radios.
- **Wellbeing is not graded.** Girls' answers in wellbeing sessions are never stored; only attendance is recorded.
- **Age-appropriate content.** Reproductive health is limited to girls aged 15 and over.
- **Offline first.** Pupils and profiles save on the device straight away and upload to Supabase when online. Sessions, attendance, quiz results and questions are still kept in the teacher's browser for now.
- **No photos of children.** Real girls are shown by their initials; only the sample girls have drawn avatars.
- **Pictures that work anywhere.** Lesson pictures are drawn in code (SVG), so they need no downloads and look sharp on any screen.

## Known limitations

- Teacher sign-in uses Supabase (see [`supabase/SETUP.md`](supabase/SETUP.md)). The test account `user1` / `1234` only works in demo mode, when `supabase-config.js` holds placeholders.
- Video and audio lessons need their media files added by the teacher; until then the slides and narration carry the lesson.
- For now every signed-in teacher sees all pupils; linking pupils to their teacher comes next.
- Narration uses recorded ElevenLabs voices where they have been made (see [Recorded narration](#recorded-narration)); other lines, and questions a teacher adds herself, use the device's own voice, and many devices have no Kiswahili voice.

## Roadmap

- Cover slides for every lesson, and pictures for Grades 3–6, Kiswahili and Life Skills
- Exams on the report card
- Link pupils to teachers; move sessions, attendance and quiz results to Supabase
- Learner PINs (teacher accounts are done, with Supabase)
- Media library upload and offline caching
- Recorded narration in Turkana and Somali (English and Kiswahili are recorded with ElevenLabs)
- AI-assisted multilingual information access

## Open source

LearnReach is developed in the open so schools, NGOs and development organisations can adopt, customise and improve it. Released under the [MIT licence](LICENSE).
