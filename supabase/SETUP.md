# Connecting LearnReach to Supabase

This update replaces the `user1` / `1234` test login with real teacher accounts in Supabase, and adds an **Admin** page that shows who has registered and who is signing in.

## What changed

| File | What it does |
|---|---|
| `teacher-portal/index.html` | Sign in / Register tabs (email + password), forgot-password link, sign-out. Shows the teacher's own name and club. English and Kiswahili. |
| `admin/index.html` | New admin page: registered accounts, sign-ins per day (30 days), recent sign-ins, search/filters, CSV download. Admins only. |
| `supabase-config.js` | Your Supabase project URL and anon key (shared by both pages). |
| `supabase/schema.sql` | Tables, security rules and functions to run once in Supabase. |

**Offline still works.** The first sign-in on a device needs internet. After that, the teacher's details stay on the device for 30 days, so the portal opens without internet (an "Offline" tag shows in the header). Each offline visit is queued and sent to Supabase when the device reconnects. Grades, attendance and quiz answers still stay on the device as before; nothing about the girls is sent to Supabase.

**Demo mode.** Until `supabase-config.js` holds real values, both pages run in demo mode: the portal accepts `user1` / `1234` and the admin page shows clearly labelled sample data.

## Setup (about 15 minutes)

1. **Create a project** at <https://supabase.com> → New project. Pick the region closest to Kenya (e.g. *Europe West* or *South Africa* if offered).
2. **Run the schema.** In the project: *SQL Editor* → *New query* → paste all of `supabase/schema.sql` → *Run*. It should finish with "Success. No rows returned".
3. **Set the website address** so email links come back to your site. *Authentication* → *URL Configuration*:
   - Site URL: `https://hellenalianya-code.github.io/learn/teacher-portal/`
   - Redirect URLs: add `https://hellenalianya-code.github.io/learn/**`
4. **Choose email confirmation.** *Authentication* → *Sign In / Providers* → *Email*:
   - **On (recommended):** teachers must click a link in their email before signing in.
   - **Off:** teachers are signed in immediately after registering (easier in the field, less protection against fake sign-ups).
   - Supabase's built-in email sender only allows a few emails per hour. Before the pilot grows, add your own SMTP under *Authentication* → *Emails* → *SMTP settings*.
5. **Paste your keys.** *Project Settings* → *API*. Copy the **Project URL** and the **anon / publishable** key into `supabase-config.js`. The anon key is meant to be public; never put the `service_role` key in any file.
6. **Deploy with CI.** In `.github/workflows/ci.yml`, change the build line to also copy the new files:
   ```
   cp -r index.html teacher-portal dashboard docs admin supabase-config.js _site/
   ```
7. **Keep the smoke test on demo mode.** The Playwright smoke test signs in with `user1` / `1234`. Once real keys are in, add this line where the test creates its browser context (before it opens the portal):
   ```js
   await context.addInitScript(() => { window.LR_DEMO = true; });
   ```
8. **Make yourself an admin.** Register in the teacher portal (and confirm the email if that is on). Then in the SQL Editor run:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.org';
   ```
   Open `https://hellenalianya-code.github.io/learn/admin/` and sign in. Admins also get an **Admin** button in the teacher portal header.

## What the admin page shows

- **Registered accounts**: name, email, phone, club or school, county, role, date registered, whether the email is confirmed, last sign-in, sign-ins in the last 30 days and in total.
- **Headline numbers**: total accounts, new in 30 days, different people signed in during the last 7 days, sign-ins in 30 days (and how many were offline), unconfirmed emails, never signed in.
- **Sign-ins per day** for the last 30 days, with markers on days when new accounts were registered.
- **Recent sign-ins**: who, when, which app, which device, and whether it was opened offline.

A "sign-in" is counted once each time a teacher opens the portal in a new browser session (page reloads are not counted again).

## Security notes

- Row-level security is on. Teachers can read only their own profile and sign-ins. Only accounts with `role = 'admin'` can see everyone.
- New accounts are always created as `teacher`. A teacher cannot change her own role; only you can, in the SQL Editor.
- To remove a teacher: *Authentication* → *Users* → delete. Her profile and sign-in history are deleted with her.
