# LightX2V App Website

A bilingual, light/dark product website for the LightX2V Mac and Windows apps. The current two-platform, three-creation design was approved for publication on 2026-11-11. Production: https://light-ai.top/LightX2V-App-Website/.

## Preview and checks

Requires Node.js 22+ and Python 3. No package installation is needed.

```sh
npm run dev
```

Open http://127.0.0.1:4173/ . The server serves generated `dist/`, not the source directory. Re-run `npm run build` after source or media changes, then refresh.

```sh
npm run build
npm run check
npm test
npm run sync
```

`npm run check` checks both localized homepages and their compatibility aliases, static assets, project-relative links and the download URLs rendered into HTML. `npm test` exercises release selection, synchronization failure/recovery and publication media validation.

The two main pages are English `/` and Chinese `/zh/`, beneath the GitHub Pages project prefix. Downloads, system requirements and setup are included in each homepage at `#download`; installation questions are at `#faq`. The former `/download/` and `/zh/download/` routes redirect to the matching homepage, preserving query parameters and hashes when JavaScript is enabled; without JavaScript they fall back to `#download`. English is the initial default; an explicitly chosen Chinese preference is restored at the entry homepage. Shared templates and translations live in `src/`.

## Real product media

See [capture checklist](docs/capture-checklist.md) and [Windows capture prompts](docs/windows-capture-prompts.md).

`site-data/media.json` describes reviewed app screenshots and gallery images. Unavailable screenshots are honestly marked as pending in this preview. Raw captures, private logs and rejected trials belong in ignored `artifacts/`, never `assets/`. Only reviewed public derivatives go into `assets/`.

Every screenshot must show a dedicated public demo workspace with no previous personal creation history, usernames, local paths or ChatGPT directory names. Collapse the model-preparation area for capture so no model or environment path is visible. The right-side resolution, aspect-ratio and output-size controls may remain visible, including the 1K setting. Do not paint over, invent or mock an app interface.

The rejected 512-resolution architecture trial is not website material. The 1K capybara demo, made with the exact prompt `A capybara wearing a wizard hat, oil painting`, is complete and remains in the gallery. The separately authorized homepage demo is also complete: `A blue rose growing in the garden`, actually generated at 1K / 1:1 / 1024×1024 with prompt enhancement disabled. Its real app capture and derivatives have been reviewed. Both the blue rose and capybara now appear in the gallery, with the capybara entry unchanged. The homepage screenshot references `galleryId: blue-rose` for generation provenance; its capture/crop record stays with the screenshot. Both authorized demos are finished. Stop further generation: no retries, batches or performance tests.

The current Mac screenshots use the user's selected installed `/Applications/LightX2V.app`, version **0.1.0 (1)**, in English. Only the interface language was changed and the existing blue rose was displayed again; no image was regenerated. The installed executable is identified by SHA-256 `c537f5af12c3c52eb7bbddd7bc39b42e8f487ac2aa0cd8e73370ff0c55b2f8ca`. It has no verified matching Release package, so the screenshot records `sourceExecutableDigest` and does not inherit the old Stable package's `sourceReleaseDigest`. The owner approved using this capture in the current release; its official-package identity remains unverified and is not claimed otherwise.

Feature sections 02 and 03 now use independent reviewed detail cards from the same installed English build. Section 02 shows Standard/INT8 model choices and Apple M5/MPS local inference; section 03 shows the existing blue-rose prompt with Generate ready, plus 1K / 1:1 / 1024×1024 settings. `featureDetails.local` and `featureDetails.workflow` retain each raw JPEG's SHA-256, exact crops and review flags. The raw captures stay in ignored `artifacts/`; the four public PNGs remain separate cards, with missing approvals leaving the group blank. No generation was run: the demo workspace still has one generation, gallery originals are unchanged, and the temporary prompt was cleared after capture so Generate is disabled again.

The approved collection includes the user-supplied English Windows screenshot and piano-cat artwork, alongside the Mac capture, blue rose and capybara. `site-data/publication.json` records the owner’s approval of this exact media manifest and image hashes, including the known release-identity limitations. Publication still requires actual PNG screenshot dimensions of at least 1600px and privacy/public-use approval. Changes to approved media or its metadata require a new approval snapshot. The original strict six-category validation remains available when no current-collection approval is supplied.

## Download data and publishing

`site-data/releases.json` is the verified download snapshot. Both HTML and progressive enhancement consume that shared build data; visitors do not query the Releases API. The GitHub Stars badge is the sole live-data exception: it reads the public main-repository count when a page opens or returns to visibility, using one locale-independent compact format and retaining the built count if the request fails. Mac uses the explicit Stable asset. Windows prefers downloadable stable releases, falling back to a Preview when necessary.

The workflow checks official Releases every 15 minutes, off the hour. A release change triggers a build; unchanged releases do not trigger scheduled publication. Builds also seed the Stars fallback; the badge refreshes its count from GitHub in the browser. GitHub scheduling can be delayed, and public-repository schedules may be disabled after 60 days without repository activity.

Production publication requires all of:

1. The `main` branch.
2. The checked-in `site-data/publication.json` approval matching the current media and image bytes.
3. `node scripts/check.mjs --publish` passing.

Build and deployment remain separate. The verified download checkpoint is written back only after Pages deployment succeeds, so failed uploads or deployments can be retried by the next scheduled run. No App repository changes, cross-repository token, backend, analytics or online generation service is required.

The pre-redesign production commit is retained on `backup/pre-redesign-20261111` for rollback.
