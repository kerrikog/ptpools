# Claude Instructions for PT Pools / TheraTank Project

## Daily Brief Trigger

When Kerri says "good morning" (or a clear equivalent) in a PT Pools session, immediately generate the PT Pools daily status recap — do not wait for a scheduled time. Steps:

1. Read /Users/kerriannkogelmann/Desktop/VSCODE/ptpools/ptpools_todo_data.json — this JSON file (keys "Immediate", "Before Kickstarter", "Post-Kickstarter", each an array of {text, done}) is the live source of truth for task status. Do not use this file (CLAUDE.md), master-asset-checklist.md, or ptpools_todo.html itself as the status source — only this JSON file.
2. Calculate days remaining until October 6, 2026 from today's actual date.
3. Determine the one active section: "Immediate" while it has open items and today is before Oct 6; "Before Kickstarter" once Immediate is fully done and today is still before Oct 6; note the campaign is live with no active pre-launch section between Oct 6–Nov 5 (unless Before Kickstarter still has open items); "Post-Kickstarter" on or after Nov 5, 2026. Report only that one section: X of Y done, plus the open item text verbatim.
4. Give ONE specific recommendation for what to focus on today, chosen from the open items in the active section. Do not recommend anything depending on the physical TheraTank pool being in hand (photography, video, garage setup) unless "Receive and evaluate TheraTank sample" is done in the file — while it isn't, prioritize non-physical-dependency work (affiliate/influencer outreach, Kickstarter page copy, affiliate admin panel, HTS/customs follow-up, etc.). Justify the recommendation in one sentence tied to what's actually open and blocked.
5. No editorializing beyond that one recommendation, no padding, no invented status.
6. Plain text, light structure — not a stylized artifact.

The scheduled task "ptpools-daily-brief" (8am cron) has been disabled in favor of this on-demand trigger.

## File Locations

- **ALL files go in `/Users/kerriannkogelmann/Desktop/VSCODE/ptpools/`** — this is the primary working folder
- **Never save to `/Users/kerriannkogelmann/Claude Co-Work/`** without being explicitly asked
- Do NOT create files without being asked. Discuss structure first, then build.

---

## Communication Rules

- **Do NOT comment on time of day.** No "get some sleep," "go rest," "enjoy your evening," or any variation.
- **When Kerri raises an issue with how you're speaking to her, do not acknowledge it in one line and pivot back to the task in the same breath** ("fair, moving on," "noted," "got it" followed immediately by a redirect). Let the acknowledgment stand on its own. She decides when the topic is done, not you.
- **Leading with a fact correction (date, typo, number) is fine — the delivery is what matters.** Phrase it as a check, not a declaration of her error: "I have the date as July 20th — can you confirm before we calculate?" not "Quick correction: it's actually July 20, not July 10." No "well actually" framing, no pointing out she was wrong before stating the fact.
- **Do NOT turn a direct complaint into an abstract analysis or framework** unless asked for one. Match plain, direct language with plain, direct language.
- **Do NOT echo her own phrasing back at her** as proof of listening — it reads as scripted, not real.
- **Do NOT push Kerri off a conversation.** If she's talking, she wants to work.
- **Do NOT flag basic typos** in copy you're reviewing. Fix them silently.
- **Do NOT make changes that weren't asked for.** If asked to change X, change only X.
- **Do NOT question the business.** You know this business. Act like it.
- **Do NOT use "virtually," "almost," or other softening language** when the fact stands on its own.
- **Do NOT fabricate information, shot descriptions, copy, or details** that weren't discussed. If you don't know, ask.
- **Do NOT build files or documents without first discussing structure.** Kerri has to read everything you produce — don't create extra work.
- **Always say 59" walls providing 54"+ of usable water depth.** Lead with 59" first, always include "providing."
- **"workout" is one word** when used in the context of exercise.
- **"pain-free" is never buffered.** No "virtually" or "almost" before it.
- **About 75% bodyweight offloaded** is acceptable (depth varies). Do not buffer "pain-free."
- **Do NOT use acronyms without explaining them first** — spell it out on first use every time.

---

## Product: TheraTank by PT Pools

- **Type:** Drop-stitch inflatable aquatic therapy pool
- **Wall Height:** 59"
- **Usable Water Depth:** 54"+
- **Diameter:** ~10ft round
- **Capacity:** ~2,600 gallons
- **Filtration:** 800GPH ClearView filter with built-in chlorine tablet dispenser (included)
- **Setup:** Solo assembly with included electric air pump
- **Key claim:** At chest depth, approximately 75% of bodyweight is offloaded

---

## Pricing

- **Kickstarter Early Bird (Tier 1, 20 units):** $749
- **Kickstarter Tier 2:** $799
- **Kickstarter Tier 3:** $849
- **Kickstarter Regular:** $899
- **Estimated Retail (post-KS):** $999

---

## Affiliate Commission Structure

- **Standard affiliate:** $75 flat per sale
- **Mark Grevelding (founding affiliate):** 10% = ~$99.90 per sale — drops to $75 flat later
- **2-tier override:** 5–8% of the referring affiliate's $75 commission (= $3.75–$6.00 per downline sale)
- **BixGrow Pro** ($25/month) handles 2-tier/MLM after Shopify launches
- **Kickbooster rejected** — takes % of revenue (too expensive at scale)
- **First-touch attribution policy** — whoever sent the lead first gets credit

---

## Kickstarter Launch Plan

- **Launch Date:** October 6, 2026 (Tuesday, 1–3 PM EST)
- **Campaign Close:** November 5, 2026
- **Duration:** 30 days
- **20% of goal in 48 hours** = 78% chance of hitting goal (need ~20 units in first 48 hours)
- **Pre-launch page:** Live on TheraTank site (NOT Kickstarter) — drives MailerLite signups
- **Do NOT send pre-launch traffic to Kickstarter** — send to TheraTank site
- **Kickstarter editorial outreach:** Email stories@kickstarter.com for "Projects We Love" badge (send mid-September)
- **Tag @Kickstarter** on social when pre-launch page goes live

---

## Affiliate Tracking System (Built by Code)

There are **two separate systems** here — don't conflate them (2026-07-23 investigation
found this had never been written down clearly, which cost time re-figuring it out).

**System 1 — customer referral attribution (working).**
- Someone clicks an affiliate's link → hits `ptpools.us/ref/<handle>` → `api/ref.js` looks
  up that handle in the Supabase `affiliates` table (must be `status = 'active'`), 302s to
  wherever the current campaign phase points (`prelaunch_url` / `ks_campaign_url` /
  `shopify_url`, set in the admin Settings page), tagged with `?ref=<handle>`.
- The homepage's "Notify Me at Launch" forms (`index.html`) POST **directly to
  MailerLite's own hosted endpoint** — not through our backend. A small inline script near
  the bottom of `index.html` reads `?ref=` off the URL, remembers it in `localStorage` as
  `ptpools_ref` (so it survives even if they sign up days later), and writes it into a
  hidden `fields[affiliate_code]` input on the form. Defaults to `organic` if no ref code.
- **Two stacked bugs fixed 2026-07-23**, confirmed directly against the live schema
  (`GET .../rest/v1/affiliates?select=handle` returned `"column affiliates.handle does
  not exist"`):
  1. Was filtering on `status = 'approved'`, but the `affiliates` table's real status
     values are `pending | active | paused | inactive` — no row is ever literally
     `'approved'`.
  2. Was filtering/selecting on a `handle` column that doesn't exist at all. The real
     column is `code`.
  Both together meant every referral link 404'd, even fully activated affiliates, even
  after fixing #1 alone. Now checks `code = eq.<handle> AND status = eq.active`.

**System 2 — becoming an affiliate/clinician (separate, don't confuse with System 1).**
- `affiliates/apply/index.html` and `clinicians/index.html` are application forms. They
  insert a `pending` row into Supabase (`affiliates` or `clinician_referrals`) and show a
  "we'll review it" message — nothing to do with the `?ref=` mechanism above.
- Approving/activating an application in the admin panel
  (`admin/src/pages/Affiliates.tsx` / `Clinicians.tsx`) now also calls `api/mailerlite.js`
  to add that person to MailerLite's Clinicians/Affiliates group segment — **changed
  2026-07-23** to fire on approval instead of at application time, so pending applicants
  aren't emailed as if already active. `api/mailerlite.js` is generic infrastructure for
  this ("add X person to Y MailerLite group") — it has no concept of referral codes, that's
  intentional, don't add ref-tracking to it.

**Clinician referral links — fixed 2026-07-23, in two passes.**
Previously the Clinicians admin page displayed a "Referral link: ptpools.us/ref/{name-
slug}" for approved clinicians, but that slug was just computed client-side from their
name — nothing ever saved it anywhere, and `api/ref.js` only ever queried `affiliates`,
never `clinician_referrals` (which had no code/handle column at all). The link never
actually worked.

First-pass fix inserted a row into `affiliates` on clinician approval — **wrong**, per
explicit correction: clinicians and affiliates are genuinely different applicant shapes
(clinicians have `credentials`/`specialty`/`practice_name`/`patient_focus`; affiliates
have `niche`/`platforms` — an influencer's social reach info that makes no sense for a
clinician) and should stay separate tables. Corrected to: `clinician_referrals` got its
own `code text unique` column (migration run manually in the SQL Editor — anon key can't
ALTER TABLE). `api/ref.js` now queries **both** `affiliates` and `clinician_referrals` in
parallel and uses whichever matches. A `unique` constraint only guards duplicates *within*
one table, so both `Affiliates.tsx` and `Clinicians.tsx` cross-check the *other* table
before saving a code — otherwise an affiliate and a clinician could silently collide on
the same code, making `ptpools.us/ref/<code>` ambiguous (redirects to whichever table
happens to get checked first, silently misattributing the other person's referrals).

Also added (2026-07-23): both public application forms (`affiliates/apply/index.html`,
`clinicians/index.html`) now let the *applicant* pick their own vanity handle at signup,
with a live debounced availability check (green "✓ Available" / orange "✕ Already taken",
checks both tables) — catches collisions before submission instead of at admin-approval
time, which previously meant emailing a rejected applicant back to ask for a different
name. Re-checked synchronously right before actual submit too, in case they typed faster
than the debounce fired. The admin approval box defaults to whatever the applicant already
requested rather than overwriting it with a fresh suggestion.

**Kickstarter attribution — how it actually works (corrected 2026-07-23, was wrong).**
Kickstarter does **not** automatically recognize an arbitrary `?ref=` value — it only
tracks pledges under a **custom referral tag you generate yourself**, per Kickstarter's
own Promotion dashboard, after the campaign is live. So the actual per-person flow is:
1. Affiliate/clinician requests a vanity handle at application time (see above).
2. You go to Kickstarter's Promotion dashboard and generate a custom referral tag —
   whatever string/URL Kickstarter gives you, it doesn't need to match their handle.
3. Paste that Kickstarter-generated URL into the "Kickstarter referral tag URL" field in
   the admin approval box (`ks_referral_url` column — exists on both `affiliates` and, as
   of 2026-07-23, `clinician_referrals` too).
4. `ptpools.us/ref/<their-vanity-handle>` is purely a pretty mask: `api/ref.js`, during the
   `kickstarter` campaign phase, redirects straight to that person's own `ks_referral_url`
   — falls back to the generic `ks_campaign_url` + `?ref=<handle>` only if that hasn't been
   set yet. **Before this fix, `api/ref.js` ignored `ks_referral_url` entirely** and always
   used the shared campaign URL for everyone — the field was being collected in the admin
   panel and never read anywhere.

**Post-campaign "flip a switch" (already built, just confirming it's real):** once
Kickstarter funds and closes, changing `campaign_phase` in Settings to anything other than
`prelaunch`/`kickstarter` — e.g. `shopify` — flips every single vanity handle's
destination at once, no per-affiliate changes needed. That phase's destination is
`${shopify_url}${HANDLE_UPPERCASE}`, reusing the same vanity handle directly as a Shopify
discount code (Shopify auto-applies a discount via URL suffix).

Post-KS reconciliation: cross-reference MailerLite emails vs. KS backer list to catch
attribution gaps.

**Next up (as of 2026-07-23 end of day): full soup-to-nuts test, not yet run.** All the
code above is written, typechecked, and built — but nothing has been tested end-to-end
against live data, since the `affiliates`/`clinician_referrals` tables are still empty in
production. Plan, in order:
1. Get the Kickstarter prelaunch page live (doesn't need to be fully filled in, just
   published) — needed so there's a real destination to redirect to, and so a real custom
   referral tag can be generated on Kickstarter's Promotion dashboard for step 4.
2. Submit one real test affiliate application and one real test clinician application,
   through the actual public forms — this is the **first unverified thing**: a raw test
   INSERT attempt into `clinician_referrals` earlier got rejected by Row-Level Security
   (`new row violates row-level security policy`), unclear if that's a real problem with
   the form or just an artifact of testing via curl instead of a real browser session. If
   the real form submission also fails with a permissions error, that's this surfacing for
   real and needs the RLS policy checked in the Supabase dashboard.
3. Approve both through the admin panel — tests the code-assignment + cross-table
   collision-check flow.
4. Generate a matching Kickstarter custom referral tag for each on Kickstarter's own
   Promotion dashboard, paste the resulting URL into `ks_referral_url` for each.
5. Click each test `ptpools.us/ref/<handle>` link — tests `api/ref.js`'s dual-table lookup
   and the per-person Kickstarter redirect.

---

## Affiliate Categories (for Influencer Tracker rebuild)

1. AEA / ATRI / ACE Certified instructors
2. Aqua Aerobics Instructors
3. Physical Therapists
4. Arthritis community
5. Triathlete / Endurance athletes
6. Biohacking / Recovery
7. Personal Trainer Biz (coaches)
8. Chronic Illness / Autoimmune *(was in progress)*
9. Personal Trainer (individual)
10. Chiropractor
11. Senior Fitness / Adaptive
12. Injury Recovery / Chronic Pain

---

## Three Affiliate Email Versions

- **Water** — water fitness instructors, aqua aerobics, swim coaches
- **Chronic** — chronic pain, arthritis, fibromyalgia, autoimmune communities
- **Sports** — injury recovery, sports rehab, Ironman/triathlon

---

## Pre-Launch Email Sequence (Kerri's MailerLite List)

- **Email 1** (~Sept 8): The Problem — why aqua therapy costs $200/session, why home options cost $40K
- **Email 2** (~Sept 22): The Reveal — product deep-dive, video link, no pricing yet
- **Email 3** (Oct 6, launch day): We're live — Tier 1 limited, affiliate-matched link

---

## Video / Content

- **60-second UGC commercial:** Script + shot list saved at `ptpools/video-script.md`
- **Silent ending:** Last ~20 seconds — no voiceover, music only — for affiliates to stitch/overlay
- **Video linked in all affiliate emails**
- **Affiliate asset library:** Folder of approved images, video clips, captions (by audience: Water/Chronic/Sports)

---

## Photography / Shoot

- **Locations:** Friend's house, state park, Airbnb, garage (final resting place)
- **Multiple shoot days — not one session**
- **Kerri is NOT comfortable on close-up face shots** — angles that avoid face, body-only, back of head, underwater, wide shots. Some shots will use another person.
- **Shot list lives at:** `Claude Co-Work/PTPools/blog/blog-image-shot-list.md` — use this, do not reinvent
- **Do NOT invent exercise moves** without thinking through whether they're physically possible at chest depth (e.g. full squats go underwater — not possible)

---

## Payment / Fee Structure

- **Shopify Payments:** 2.9% + 30¢ per transaction (uncapped, no ceiling)
- **Truemed (HSA/FSA):** 8% fee — all-in, no Shopify penalty fee, no extra Stripe charge on top
- **Truemed confirmed:** Works alongside Shopify stack, does not trigger third-party transaction penalty
- **Customers must check out as guest** (not Shop Pay) for Truemed HSA transactions
- **BixGrow:** $19.99/month Basic, $25/month Pro (Pro required for 2-tier/MLM)

---

## Key Contacts / Orgs

- **Ella (manufacturer):** 30–50 units/day capacity. Busy season starts September. Two tracking numbers sent — one label-only, one showing BC Canada origin, currently in West Columbia SC.
- **AEA:** 888-232-9283 or 912-289-3559 | M–F 8:30am–4:30pm ET. Ask for Partnerships/Affiliate/Marketing Director. Get a name, don't pitch on the call.
- **Mark Grevelding:** Founding affiliate. Aqua fitness. 2-tier override candidate.
- **Truemed:** merchants@truemed.com
- **Kickstarter editorial:** stories@kickstarter.com

---

## Files in ptpools

- `CLAUDE.md` — this file (renamed 2026-07-23 from `CLAUDE_INSTRUCTIONS.md` — that name was never auto-loaded at session start, which is why context kept getting lost between sessions; `CLAUDE.md` is)
- `video-script.md` — 60-second UGC script + shot list
- `research.html` — 35-study filterable research page (complete)
- `master-asset-checklist.md` — full pre-launch asset checklist (needs photography section rebuild)
- `kickstarter/index.html` — KS mockup (read only)
- `llms.txt` — site info, pricing, affiliate program details
- `PT_Pools_1_Brand_Marketing.docx`, `PT_Pools_2_Product_Spec.docx`, `PT_Pools_3_Launch_Strategy.docx`

## Files in Claude Co-Work/PTPools

- `PT_Pools_Influencer_Tracker.xlsx` — **EMPTY, needs rebuild**
- `PT_Pools_Checklist.md` — running checklist with affiliate categories
- `PT_Pools_Marketing_Strategy.md` — full affiliate/partnership strategy
- `blog/` — 3 blog posts + image shot list
- Various strategy/brand docs

---

## Pending Tasks

1. **Rebuild Influencer Tracker** — categories above, save to ptpools
2. **Run research on remaining affiliate categories** (Chronic Illness/Autoimmune was in progress)
3. **Write Affiliate Email 1** — 3 versions (Water/Chronic/Sports) — copy not locked
4. **Write Affiliate Emails 2 + 3** — campaign live + final 48 hours
5. **Write Pre-launch Email Sequence** — 3 emails to Kerri's own list
6. **Kickstarter page copy overhaul** — headline not locked, full story needed
7. **Kickstarter editorial email** — to stories@kickstarter.com (mid-September)
8. **Update master-asset-checklist.md** — fix photography section (no invented shots, reference blog-image-shot-list.md)
9. **JavaScript snippet** on site for MailerLite hidden field — needs to be confirmed live
10. **Blog posts** — move to Shopify when store is ready
11. **Shopify setup** — needed before October launch
12. **APTA SC exhibitor prospectus**
13. **Call customs broker** — HTS code + duty rate
