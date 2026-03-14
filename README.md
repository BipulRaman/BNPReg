# BNPReg

Registration analytics dashboard for Samagam 2026, built with React, TypeScript, and Vite.

## Overview

This project visualizes registration data with charts, summaries, and a searchable table.
It is configured for static hosting with a custom domain.

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Recharts
- Papa Parse

## Local Development

1. Install dependencies:

	npm install

2. Start dev server:

	npm run dev

3. Open:

	http://localhost:3000

## Build

Create production output in dist:

	npm run build

Preview production build locally:

	npm run preview

## Deployment Notes

- Hosting target is static output from dist.
- Vite base path must stay set to root (/).
- Custom domain is managed by public/CNAME.
- Keep public/favicon.ico and ensure favicon reference is /favicon.ico.

## Project Structure

- src/App.tsx: Main UI and dashboard screens
- src/analytics.ts: Aggregation helpers and chart data preparation
- src/useCSVData.ts: CSV data fetch and parsing hook
- src/types.ts: Shared TypeScript interfaces
- public/CNAME: Custom domain mapping
- public/favicon.ico: Site favicon
- vite.config.ts: Vite configuration

## Security and Access

- Do not document or publish any authentication or gatekeeping logic details.
- Keep any access-control implementation internal to the application code.

## Troubleshooting

- If build fails with missing tools, run npm install first.
- If static assets fail to load in production, verify vite.config.ts uses root base path.
- If custom domain is not applied, confirm public/CNAME is present and copied to dist/CNAME.
