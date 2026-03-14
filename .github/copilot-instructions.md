# Repository Instructions

## Deployment and Hosting Rules

- This project is deployed as a static Vite build and hosted using a custom domain.
- Production asset URLs must always resolve from root.

## Vite Configuration Requirements

- Keep `base` set to `/` in `vite.config.ts`.
- Do not change `base` to a subpath (for example `/BNPReg/`) because production runs on a custom domain.
- If you touch build configuration, verify that generated asset links in build output start with `/assets/...`.

## Custom Domain Requirements

- Custom domain is `sam5.bipul.in`.
- Domain mapping is managed through `public/CNAME`.
- Ensure `public/CNAME` is preserved and copied to deploy output (`dist/CNAME`) during deployment.
- Do not remove or rename `public/CNAME`.

## Favicon Requirements

- Favicon file must be served from `public/favicon.ico`.
- HTML must reference favicon as `/favicon.ico`.
- Do not point favicon to Vite defaults like `/vite.svg`.

## Build Output Expectations

- Build output should be placed in `dist/`.
- Output must include:
	- `index.html`
	- `assets/*` bundles
	- `CNAME`
	- `favicon.ico` (if copied/served from public)

## Change Scope Guidance

- Prefer minimal, focused changes.
- Avoid unrelated refactors when addressing domain, build, favicon, or deployment issues.
- Preserve existing app behavior and analytics logic unless explicitly requested.

## Quick Validation Checklist

- `vite.config.ts` has `base: '/'`.
- `index.html` includes `<link rel="icon" href="/favicon.ico" />`.
- `public/CNAME` exists and contains `sam5.bipul.in`.
- After build, `dist/index.html` references root-based assets.
