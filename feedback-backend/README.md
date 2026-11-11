# Retired backend source

This source is archived for reference only. The current website uses Supabase and the independent admin/ dashboard. Nothing in this folder is loaded by the active website. Any historical records in the previous deployed backend remain preserved separately.

# Econova Labs feedback backend

This is a source mirror of the backend deployed through the existing Sites project in .openai/hosting.json. GitHub Pages does not execute this code.

Install development tools with npm ci. Generate new schema migrations with npm run db:generate, build with npm run build, then run npm test. The generated dist/server/index.js is a dependency-free Cloudflare Worker module. Database migrations are packaged by Sites and applied before publishing.

Authentication uses identity headers supplied and protected by Sites dispatch. The only allowed dashboard email is checked server-side. Never deploy directly to an unprotected Worker endpoint or trust arbitrary client-provided identity headers.

Tests use a temporary in-memory SQLite database and do not add sample responses to production. There are no seeded submissions, credentials or production data in this source.