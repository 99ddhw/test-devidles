# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo purpose

`test.devidles.com` — a Korean-first **multi-test psychology portal**.
The root is a hub listing all available tests; each test lives in its
own subdirectory. Part of the `devidles.com` portal alongside
`plant.devidles.com` (Idle Plant Evolution game).

Currently launched:
- 🌿 **식물 MBTI** at `/plant-mbti/` — 12 questions → 16 plants

Planned (placeholders on hub):
- 💻 개발자 유형 (`/dev-mbti/`)
- 🌵 다육이 영혼 (`/succulent-soul/`)
- 🎨 색깔 심리 (`/color-mind/`)
- 🐾 동물 성격 (`/animal-type/`)

## Hosting and deploy

- Cloudflare Workers Static Assets (NOT Pages — same pattern as
  `idle-plant`).
- Custom domain `test.devidles.com` via Cloudflare Registrar
  (`devidles.com` already owned, just add subdomain in Custom Domains).
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

When adding a new test (e.g., `/dev-mbti/`):

1. Create directory `dev-mbti/`
2. Copy `plant-mbti/index.html` as scaffold
3. Replace QUESTIONS array (12 items, 3 per E/I/N/S/T/F/J/P)
4. Replace RESULTS dict (16 MBTI keys)
5. Update head meta tags (canonical, og:url, title)
6. Update header `.page-title-strip` text and emoji
7. Update share URLs (`/dev-mbti/#${mbti}`)
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
`test.devidles.com` from the Kakao AdFit dashboard. Do not reuse
`plant.devidles.com` units — that violates AdFit policy (one unit per
domain/page combination is the safe convention).

**No rewarded ads** — same policy as the sibling sites. Result reveal
is unconditional.

## URL / SEO maintenance

When the deploy URL changes (or new tests added), update **all of
these in one pass**:

- Root `index.html` head: canonical, og:url, og:image, twitter:image
- Each test `<test>/index.html` head: same set
- `about/`, `contact/`, `privacy/`, `terms/` head + content references
- `sitemap.xml`
- `robots.txt`
- Internal anchors (footer, hub test grid links, cross-promo)

Verify with: `grep -rln "<old-url>" --include="*.html"
--include="*.xml" --include="*.txt"` — count should be zero.

## Privacy / Terms architecture

**One policy covers the entire domain** (all current and future tests).
Privacy mentions answers are memory-only; terms 제7조 has the MBTI®
non-affiliation disclaimer that applies to ALL tests on the site. Do
not split into per-test policies — that's regulatory bloat.

When adding a new test:
- If it has unique data handling (e.g., uploads images, calls an API),
  add a paragraph to privacy under the relevant section.
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
`https://plant.devidles.com` (Idle Plant Evolution). The portal hub
also has a cross-promo section. Keep these links live and visible —
they are the primary funnel from the test portal back to the sister
game site for ad-revenue cross-monetization.

## Things to avoid

- Splitting into per-test repos — keep one repo, one domain, one
  shared policy.
- Adding `package.json` / build tooling — single-file vanilla JS is
  the convention.
- Adding rewarded-ad gating to result reveal — policy decision: result
  is always free.
- Saving test answers to localStorage / cookies / server — privacy
  policy explicitly states answers are memory-only. Don't break this.
- Reusing AdFit DAN IDs across pages or with the sibling
  `plant.devidles.com` site.
- Removing the MBTI® non-affiliation disclaimer in terms 제7조.
- Importing third-party trackers (Google Analytics, etc.) without
  updating `privacy/index.html`.
- Putting individual tests' privacy/terms in their own subdirectories
  — single domain-wide policy is the convention.
