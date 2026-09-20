# Business World Agent Roadshow / PPT Asset Pipeline

## Purpose

This branch is the dedicated source for roadshow-grade presentation assets. The output is not a collection of screenshots. It is a reusable visual system shared by:

- `/landing`
- `/roadshow`
- future PPT generation
- future sales/demo exports

## Source concepts

The five supplied concept frames define the visual direction:

1. Product hero: Business World Agent as an interactive business operating surface.
2. System explanation: business event → behavior prototype → simulation → action.
3. Real operation demo: ask a question, choose a scenario, run, receive feedback.
4. Usage/value: roles, scenarios, Potato Mode, measurable business value.
5. Cursor-like landing pattern: product UI is the hero, with pseudo-interaction before the user enters the app.

## Product Demo source of truth

The roadshow surfaces should borrow structure from the repository's actual product demo and handoff:

- `app/page.tsx`
- `app/_components/business-world-screens.tsx`
- `docs/design-handoff/ui.html`
- `docs/design-handoff/ui.md`

The important patterns to preserve are:

- persistent Business World shell
- event stream
- persona / behavior evidence
- scenario experiment controls
- AI recommendation output
- explicit database persistence feedback
- Observed / Inferred / Simulated truth boundaries

## Asset rules

- No image-generation.
- Vector-first. Master artboard: 3840 × 2160.
- Use SVG for hero / diagram / illustrative UI assets.
- Avoid baking body copy into raster images.
- PPT and Web must consume the same asset source.
- Never use a generated slide screenshot as the master asset.
- Product metrics shown in roadshow visuals are demo/simulated unless backed by runtime evidence.

## Current assets

| Asset | Purpose |
|---|---|
| `globe-grid.svg` | roadshow background / hero atmosphere |
| `product-console.svg` | pseudo-interactive product hero |
| `event-to-action.svg` | business event → behavior → simulation → action |
| `potato-loop.svg` | Potato Mode / 25-minute workflow |
| `value-bars.svg` | value/closing slide |

## Composition pipeline

```
concept frames
  ↓
vector primitives / reusable assets
  ↓
/roadshow-assets workbench
  ↓
/landing + /roadshow screens
  ↓
PPT generator reads the same SVG assets
  ↓
render QA at 1920×1080 and 3840×2160
```

## PPT generator contract

A future generator should:

1. create 16:9 slides,
2. use the SVGs from `public/roadshow-assets`,
3. keep titles / captions as editable PowerPoint text,
4. use screenshots only for real runtime evidence,
5. render to PNG/PDF and visually verify every slide before delivery.

## Next implementation slice

- replace the current CSS-only roadshow decorations with these shared SVG assets,
- align `/landing` pseudo-interaction more closely with the actual Product Demo shell,
- add a code-driven PPT build script that consumes this manifest.
