# Business World Agent workbench design

## Product scope
Nine actual screens: overview, persona, world, content, live, growth, product, experiment, report. Do not add global market discovery, investing, social communities, project-management modules or other unrelated features from earlier concept boards.

## Visual language
Use the existing blue-and-white direction with a quiet pale-blue sidebar, one blue primary action per hero, legible dark-blue text, spacious 12–18px cards, and system Chinese fonts. CSS geometry is decorative only. No image-generation service is used. The original product records, source status and capability boundaries determine the visible facts.

## Layout
The shared shell contains navigation, search and source controls. Each screen has a distinct page title, primary task, contextual journey bar and domain-specific actions. Overview shows only recorded metrics and counts of real saved work. Persona asks for evidence instead of inventing a population. World keeps the interactive graph and inspector. Experiments and reports use side-by-side working layouts on large screens and a single column on smaller screens.

## Responsive and accessibility contracts
Verify 1440, 768, 390 and 320px widths. Small screens use a horizontally scrollable labelled navigation bar rather than unexplained icons. Tables and the graph scroll inside bounded regions, never by overflowing the page. Preserve visible focus, dialog labels, Escape, keyboard search and reduced motion. Preserve all nine deep links.

## Evidence and semantics
Blank is not zero; unavailable is not empty; manual is not verified; a template is not an observed population; a scenario is not a calibrated forecast; a saved draft is not a sent email or deployed campaign. Do not display invented channel connections, trend lines or deltas.

## Design and verification references
- Reviewed: https://github.com/VoltAgent/awesome-claude-design. Reuse the token/layout/rationale structure, not an unrelated brand clone.
- Reviewed: https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md. Use native Python Playwright, real browser DOM, HTTP serving, explicit waits and executable evidence.
- Existing `design-system/` tokens remain the reference; workbench presentation overrides live in `public/business-world/src/ui-workbench.css`.

## Acceptance
Nine separate PNGs; actual connected user journeys; no image-gen; no mocked business responses; original authenticated persistence/error regressions retained; source-hash-bound evidence; final human review before merge.
