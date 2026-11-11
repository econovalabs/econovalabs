# Econova Labs — Project VERDANT

A responsive, standalone website based on the supplied Project VERDANT final report. No build, installation, server, API keys or login required. The website files live at the root of this new repository.

## Public address

Public GitHub Pages address (verified with HTTP 200 after deployment):

https://econovalabs.github.io/econovalabs/

This standalone repository is https://github.com/econovalabs/econovalabs. If a custom domain or a different Pages source is configured, use the URL reported by GitHub Pages and regenerate the QR code before printing.

## Direct feedback and private dashboard

Visitors submit name, email, a 1–5 star rating and suggestions/details directly on the website. All fields and consent are required. Submissions receive a reference number. Failed submissions keep the entered details, and retry IDs prevent duplicate writes.

Dashboard: https://econovalabs.github.io/econovalabs/admin/

Sign in directly with the Supabase user ccodesdev@gmail.com and the password you chose privately in Supabase. No ChatGPT sign-in or ChatGPT-hosted backend is used by the current website.

The dashboard includes names, email addresses, comments, average rating, rating distribution, search, rating filters, pagination and CSV export of up to 10,000 matching entries. Visitor names and email addresses are self-reported, not verified. Sign-out clears the private inbox and ends the browser-tab session.

Supabase stores feedback and manages sign-in. Its URL and publishable key in config.js are public application settings. Never put a secret/service-role key or password in this repository. Database row-level security pins the administrator by immutable user ID. Anonymous clients can submit through the validated RPC but cannot read responses or insert directly into the table. Other signed-in users cannot read or export feedback.

The Supabase setup is in supabase/setup.sql. Create and confirm the administrator in Authentication > Users before running it. Rerunning setup preserves feedback and updates administrator membership to the configured user. Public user registration is not provided by this website.

The bundled official Supabase client is committed, so the site requires no build to serve. To rebuild it, run npm install and npm run build from the supabase folder. Its MIT license is in supabase-client.LICENSE.

The feedback-backend folder contains retired source from the previous hosting system. It is not loaded or used by the current website. The previous live backend and any historical responses have been retained separately; historical responses are not automatically copied into the new Supabase database.

The QR code still points to the public website. website-qr.svg is scalable for printing, and website-qr.png is easy to share.

## Publish with GitHub Pages

In repository Settings → Pages, choose **Deploy from a branch**, select `main`, and select `/ (root)`. This repository contains the website at its root. The original portfolio repository is untouched.

For a local preview, run `python -m http.server 8080` from this repository and visit `http://localhost:8080/`.

## Content and assets

Product specifications and features are presented as proposals. Readings in the interactive panel are illustrative, not live telemetry. No unverified prices, testimonials, survey results or performance figures are used. The greenhouse SVG is an original concept illustration, not a photograph of a manufactured product. Fonts load from Google Fonts with local font fallbacks; all essential website assets and JavaScript are local.
