# GitHub Pages publishing — manual branch only

## Canonical rule

This repository MUST NOT publish GitHub Pages through GitHub Actions.

The canonical publishing model is:

```text
visual concept assets
→ static HTML gallery
→ direct commit to gh-pages
→ GitHub Pages serves gh-pages / root
```

## What is published

The visual artifact gallery publishes only image-generated concept design artifacts.

Included:
- Business World Overview
- Daily Diaper Concept
- Newborn Diaper Concept
- Night Diaper Concept

Excluded:
- runtime screenshots
- `docs/snapshots/*`
- PR Lens diagrams
- Eve/template branding assets
- test evidence screenshots

## Source files

Canonical concept images live in:

```text
public/business-world/images/
```

The authoring copy of the gallery lives at:

```text
docs/business-world-flows/artifact-gallery.html
```

The published copy lives on the `gh-pages` branch as:

```text
/index.html
```

## Publishing procedure

1. Update the visual concept assets on `main`.
2. Update `docs/business-world-flows/artifact-gallery.html` on `main`.
3. Copy the complete gallery HTML to `gh-pages:/index.html`.
4. Commit directly to `gh-pages`.
5. Do not create, restore, or run a Pages deployment workflow.
6. Verify the public page in a real browser after GitHub Pages serves the branch.

## Repository setting

GitHub Pages must be configured once in repository settings:

```text
Settings
→ Pages
→ Build and deployment
→ Source: Deploy from a branch
→ Branch: gh-pages
→ Folder: / (root)
→ Save
```

This repository setting is intentionally separate from GitHub Actions.

## Prohibited

Do not use:

- `actions/configure-pages`
- `actions/upload-pages-artifact`
- `actions/deploy-pages`
- a custom Pages workflow
- GitHub Actions as a substitute for direct `gh-pages` publishing

If a future task asks to update the gallery, preserve this manual branch publishing model.
