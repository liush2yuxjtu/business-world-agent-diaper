# Business World Agent: shared roadshow assets

## Intent and delivered behavior

The World Model connects personas, the World Agent, commercial entities, industry events, scenario thumbnails and diaper products. The product, landing page and PowerPoint use the same code-generated SVG collection. No image generation is used.

The implementation stays on `feat/roadshow-assets-pipeline-20260920-v2` and updates PR #26. The real Product Demo defines the supported operations. Poteto is a development workflow and is absent from the product and presentation.

| Surface | Delivered behavior |
| --- | --- |
| `/world` and `/?screen=world` | Search/select 16 personas, inspect 10 entities and 8 events, choose 8 scenario templates, run and reopen saved scenarios |
| `/landing` | Interactive product hero, actual scenario runner, recorded browser demo and PPT download |
| `/roadshow` | Five-part business narrative from the shared catalog and a working scenario runner |
| `/roadshow-assets` | Category-filtered inventory of 70 SVG masters, ZIP and PPT downloads |
| `business-world-roadshow.pptx` | Five 16:9 slides, editable titles/copy, shared SVG artwork and one actual browser screenshot |

## Sources and truth boundaries

`lib/roadshow/catalog.json` owns the persona/entity/event/scenario mappings and slide copy. `scripts/build-roadshow-assets.mjs` generates the SVGs and manifest. Wide masters are 3840 × 2160; square illustrations are 2160 × 2160. Every asset includes a title and a viewBox.

Runtime data comes from the existing `/api/business-world/state` service and Supabase synthetic dataset. Four persona templates map to database persona IDs; the other twelve explicitly remain templates. Regions have no invented population or performance metrics. The inventory reminder checks the current `stockDays <= 7` value; the other seven industry events are labeled hypothetical templates.

The existing scenario service applies one percentage multiplier to baseline ROI and conversion rate. It is a directional linear demonstration, not an AI forecast or a dedicated pricing/inventory optimizer. All eight thumbnails map to existing supported levers. The UI discloses this limitation.

The shared scenario client validates responses. “Saved” appears only after POST succeeds and GET by the returned UUID reads that record back. The URL retains `?run=UUID`; reloading and scenario history retrieve stored data. Failed requests cannot produce a success state. The workflow does not execute ads, orders, prices or inventory changes.

Product references: `app/page.tsx`, `app/_components/business-world-screens.tsx`, the existing business-world service and `docs/design-handoff/ui.md` / `ui.html`.

## Asset collection

| Group | Count |
| --- | ---: |
| Consumer and business portraits | 16 |
| Commercial entities | 10 |
| Industry events | 8 |
| Scenario thumbnails | 8 |
| Diaper sizes and product attributes | 10 |
| Feedback states | 5 |
| World Agent states, globe and world compositions | 13 |
| **Total SVG masters** | **70** |

The old five standalone mock assets are superseded by this manifest. Metrics are rendered from runtime data in the app, not baked into decorative art.

## Reproduce

```sh
pnpm install --frozen-lockfile
pnpm roadshow:assets
pnpm typecheck
pnpm build
pnpm start --port 3139
```

The asset build uses only Node and Python standard libraries. The ZIP includes all manifest-listed masters, catalog, manifest and font/license files. It excludes the PPT and recording, which have separate downloads.

For browser verification, install Python Playwright and Chrome, then run:

```sh
python3 scripts/verify-roadshow.py --base-url http://localhost:3139 --output docs/verification/roadshow-local
```

This is a real acceptance run: it writes one synthetic scenario to the configured demo database, reads that exact record back and verifies persistence after reload. It also tests invalid inputs, offline failure, unknown IDs and cross-origin rejection. Existing nine product screens and five mobile surfaces are checked. A failed assertion exits nonzero and retains evidence.

For PPT generation, use the Codex presentation runtime with `@oai/artifact-tool` and its presentation skill. Install `public/roadshow-assets/fonts/WorldSansSC-Regular.ttf` in the rendering environment. Supply a passing browser report and a JPEG of its `scenario-saved.png` screenshot in the evidence directory. The committed JPEG and report are the actual local production-mode run from 2026-09-21.

```sh
export BWA_PRESENTATION_SKILL=/path/to/presentations-skill
export BWA_EVIDENCE_DIR="$PWD/docs/verification/roadshow-local"
export BWA_PPT_OUTPUT="$PWD/public/roadshow-assets/business-world-roadshow-new.pptx"
pnpm roadshow:ppt
```

Use a fresh final output path for each validation run. The builder exports previews and checks package integrity, slide geometry, heading fit, fonts and re-import. Titles and explanatory copy remain native PowerPoint text. SVGs preserve their original aspect ratios. All five rendered slides were visually reviewed; native desktop PowerPoint was not opened.

`World Sans SC` is a renamed subset of Noto Sans SC, distributed under the included SIL Open Font License. Install the supplied font for consistent native slide text. Web SVGs also provide Chinese system font fallbacks.

## Acceptance evidence

`docs/verification/roadshow-local/report.json` records 15 passing checks in a production-mode Next.js server, with zero browser page errors. Its persisted scenario UUID is `8e257e5c-7fa3-4b7b-91f0-2607e106d987`; the 10% ad-efficiency hypothesis changes demo ROI from 4.32 to 4.75 and conversion from 3.24% to 3.56%.

`scenario-saved.jpg` is the real readback screenshot used on slide 4. `public/roadshow-assets/world-model-demo.webm` records a separate supply-chain/inventory discussion and successful persistence after reload. The recording is a short workflow excerpt, not a claim of new backend capabilities.

The production build externalizes `zod` on the server to resolve a bundled module initialization error with the pinned dependency versions; request/response validation stays enabled and the dependency lockfile is unchanged.

The PR description records the deployed Preview URL, tested commit and remote acceptance result. Production promotion remains separate from this preview delivery.
