# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo purpose

`devidles.com/test/` — a Korean-first **multi-test psychology portal**.
The `/test/` root is a hub listing all available tests; each test
lives in its own subdirectory under `/test/`. Migrated from the legacy
`test.devidles.com` subdomain to a path under the apex
`devidles.com` portal (sibling sites: `/plant`, `/slime`, `/wave`).

Currently launched:
- 🌿 **식물 MBTI** at `/test/plant-mbti/` — 12 questions → 16 plants

Planned (placeholders on hub):
- 💻 개발자 유형 (`/test/dev-mbti/`)
- 🌵 다육이 영혼 (`/test/succulent-soul/`)
- 🎨 색깔 심리 (`/test/color-mind/`)
- 🐾 동물 성격 (`/test/animal-type/`)

## Hosting and deploy

- Cloudflare Workers Static Assets (NOT Pages — same pattern as
  `idle-plant` and other devidles repos).
- Path-based route `devidles.com/test/*` registered in
  `wrangler.{toml,jsonc}` — intercepts the apex portal's catch-all by
  route specificity. `worker.js` strips the `/test` prefix and
  forwards to `env.ASSETS.fetch`; policy paths (`/test/about`, etc.)
  301-redirect to the apex.
- **Deploy is not automatic from `git push`.** Run `wrangler deploy`
  (or whatever the user has configured) after committing.

## Directory layout

```
test-devidles/
├── index.html              ← Portal hub (lists all tests, FAQ, about)
├── style.css               ← Shared by hub + all tests + policy pages
├── plant-mbti/             ← First test (식물 MBTI)
│   └── index.html          ← Single-file test (questions+results+JS)
├── about/   contact/       ← Common policy pages (portal-wide)
├── privacy/ terms/         ← KISA-standard, applies to entire site
├── og.png   og.svg         ← (TODO: regenerate for portal)
├── robots.txt
├── sitemap.xml
└── CLAUDE.md
```

When adding a new test (e.g., `/test/dev-mbti/`):

1. Create directory `dev-mbti/`
2. Copy `plant-mbti/index.html` as scaffold
3. Replace QUESTIONS array (12 items, 3 per E/I/N/S/T/F/J/P)
4. Replace RESULTS dict (16 MBTI keys)
5. Update head meta tags (canonical = `https://devidles.com/test/dev-mbti/`, og:url, title)
6. Update header `.page-title-strip` text and emoji
7. Update share URLs (`/test/dev-mbti/#${mbti}`)
8. Update AdFit DAN unit IDs (e.g., `DAN-DEV-MBTI-TOP/MID`)
9. Add card to root `index.html` test grid (move from coming-soon to available)
10. Add entry to `sitemap.xml`

## Single-file test convention

Each test's `index.html` contains:
- Inline meta tags + AdFit SDK link in `<head>`
- Link to `../style.css` (one shared stylesheet)
- 3 `<section class="screen">` blocks: intro, quiz, result
- Inline `<script>` IIFE with QUESTIONS, RESULTS, state, render, share

No build step, no `package.json`. Vanilla JS only.

## Hub (root) `index.html`

Lists tests in `<section class="test-grid">` using `.test-card`
elements:

- `.test-card.available` — clickable, hover lifts
- `.test-card.coming-soon` — dimmed, no link

Includes hero, FAQ (`<details>`), about strip, cross-promo to
`plant.devidles.com`, AdFit slots, schema.org JSON-LD CollectionPage.

## Ads

Display ads only — Kakao AdFit. Each location gets a unique DAN unit:

- Hub root: `DAN-PORTAL-TOP`, `DAN-PORTAL-MID`
- Per-test: `DAN-PLANT-MBTI-TOP`, `DAN-PLANT-MBTI-MID` (etc.)

Replace placeholder DAN IDs with real units issued for
`devidles.com/test/` (or per-test paths) from the Kakao AdFit
dashboard. Do not reuse sibling sites' units — one unit per
domain/page combination is the safe convention. Path-prefix migration
doesn't change this: AdFit treats unique DAN per slot.

**No rewarded ads** — same policy as the sibling sites. Result reveal
is unconditional.

## URL / SEO maintenance

Canonical / og:url = `https://devidles.com/test/` (hub) and
`https://devidles.com/test/<test>/` (per-test). The legacy
`test.devidles.com` subdomain has been retired.

When the deploy URL changes (or new tests added), update **all of
these in one pass**:

- Root `index.html` head: canonical, og:url, og:image, twitter:image
- Each test `<test>/index.html` head: same set
- `sitemap.xml`
- `robots.txt`
- Internal anchors (footer, hub test grid links, cross-promo)
- Policy pages now live at the apex (`devidles-landing` repo). Do not
  maintain copies under `/test`.

Verify with: `grep -rln "test.devidles.com" --include="*.html"
--include="*.xml" --include="*.txt"` — count should be zero.

## Privacy / Terms architecture

**One policy covers the entire `devidles.com` domain** (all current
and future tests, plus sibling sites like `/plant`, `/wave`, `/slime`).
Policy pages now live at the apex in the `devidles-landing` repo —
this repo's `worker.js` 301-redirects `/test/about`, `/test/privacy`,
etc. to the root.

Privacy mentions answers are memory-only; terms 제7조 has the MBTI®
non-affiliation disclaimer that applies to ALL tests on the site. Do
not split into per-test policies — that's regulatory bloat.

When adding a new test:
- If it has unique data handling (e.g., uploads images, calls an API),
  add a paragraph to the apex privacy page (in `devidles-landing`)
  under the relevant section.
- Otherwise: do nothing — existing policy already covers it.

## Korean conventional commits

Same convention as the sibling `idle-plant` repo:

- `기능:` new feature (often: a new test)
- `개선:` enhancement
- `수정:` bug fix
- `리팩터:` refactor
- `밸런스:` content tuning (questions, result text)
- `보안:` policy / privacy / disclaimer
- `잡일:` chores
- `문서:` docs

Body in Korean. End with the standard `Co-Authored-By: Claude`
trailer.

## MBTI® disclaimer (legal)

`terms/index.html` 제7조 explicitly states:

- All tests on this site are entertainment-only, NOT the official
  MBTI® assessment.
- The site has no affiliation with The Myers & Briggs Foundation.
- Results have no medical / psychological / career-counseling validity.

This applies to ALL tests under this domain. When adding a new test,
the disclaimer in terms 제7조 already covers it — no need to duplicate.

## Cross-promo

Every test's result screen ends with a CTA card linking to
`https://devidles.com/plant/` (Idle Plant Evolution). The portal hub
also has a cross-promo section. Keep these links live and visible —
they are the primary funnel from the test portal back to the sister
game site for ad-revenue cross-monetization.

Cross-promo links use the path form, not the legacy subdomain.

## Things to avoid

- Splitting into per-test repos — keep one repo, one path mount, one
  shared policy at the apex.
- Re-introducing the legacy `test.devidles.com` subdomain URL — the
  canonical form is `devidles.com/test/`.
- Adding `package.json` / build tooling — single-file vanilla JS is
  the convention.
- Adding rewarded-ad gating to result reveal — policy decision: result
  is always free.
- Saving test answers to localStorage / cookies / server — privacy
  policy explicitly states answers are memory-only. Don't break this.
- Reusing AdFit DAN IDs across pages or with sibling devidles sites.
- Removing the MBTI® non-affiliation disclaimer from the apex terms
  page (it covers this repo too).
- Importing third-party trackers (Google Analytics, etc.) without
  updating the apex privacy page.
- Maintaining policy pages here — they live at the apex
  (`devidles-landing`); child workers should 301-redirect.
