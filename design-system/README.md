# Business World Agent Design System

This folder codifies the visual language already present in the canonical Business World Agent runtime.

## Source of truth

- `app/globals.css`
- `app/_components/business-world-restored.tsx`
- verified Business World runtime surfaces and flow screenshots
- product truth rules from `docs/mock-to-real-contract.md`

## Files

- `tokens.css` — CSS custom properties plus reusable primitives.
- `tokens.json` — machine-readable token inventory.
- `webflow-map.json` — explicit Webflow Variables / Styles / Components mapping.

## Principle

The design system standardizes presentation only. It must not turn unknown business data into fabricated metrics. Product truth and provenance remain separate from visual styling.

## Webflow

The mapping is ready, but the current Webflow connector exposes no sites. When a Webflow site becomes accessible, create the variable collections first, then global classes, then components/variants.
