# Nine-screen concept rebuild: review status

## Delivered and verified

The UI implementation, nine independent browser-rendered PNGs, gallery, source-hash manifest, Penpot import manifest and executable browser tests are committed. No image-gen was used for this rebuild.

Verified implementation and image commit: `13b748d79ec259d4d3eebdd7ceaf2d6327c64ba4`.

Completed execution: https://github.com/liush2yuxjtu/business-world-agent-diaper/actions/runs/35320327217

- Typecheck, workspace contracts and Next production build: PASS.
- Original authenticated UI / registered-agent shared-workspace browser suite: 40 checks PASS.
- Contextual journeys and layout/copy checks at 1440, 768, 390 and 320 pixels: 90 checks PASS.
- Browser errors and unexpected console errors: none in those suites.
- Durable database integrity: `ok`.
- Exactly nine unique concept PNGs, one per actual business screen, with hashes verified in `public/business-world/concepts/manifest.json`.

The concepts contain clearly labelled manual design-review inputs, not actual sales or platform observations.

## Remaining issues found during visual review

Passing the executed suites does not mean every visual interaction was covered.

1. **Mobile active-navigation visibility.** The 390px direct-link screenshot for Product Analysis shows the navigation strip at its left edge, leaving the current Product tab outside the visible strip. The page itself is correctly selected. Add automatic horizontal reveal of the active tab and a mandatory bounding-box visibility assertion at 390px and 320px for all nine routes.
2. **Saved-scenario form context.** Selecting a historical scenario displays its result but does not populate the new-scenario form with that scenario's parameters. Prefill the chosen parameters, and explicitly display that a new run uses the current source baseline, which may differ from the historical result baseline. Do not rewrite historical scenario or report evidence.
3. **Narrow-screen headline wrapping.** The Product title wraps its final character onto a short final line at 390px. Balance the title wrapping and recheck 320px and 390px screenshots.

A follow-up script write for these refinements was blocked before it reached the repository. Its changes are not part of the delivered commit, and no second regression run is claimed. The workflow was restored to its previously runnable form so that it does not refer to a missing script. Do not treat local, uncommitted proposed fixes as verified delivery.

## Review boundaries

PR #17 remains DRAFT and is stacked on #14. No merge to main or production promotion was performed. The preview is for review, not a certification of cloud storage, provider ingestion, a live language-model turn or standalone `eve build` success.

No remote Penpot document was edited. `docs/concept-rebuild/penpot-import.json` describes the PNG import mapping only.
