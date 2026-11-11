# Econova Labs — Project VERDANT

A responsive, standalone website based on the supplied Project VERDANT final report. No build, installation, server, API keys or login required. The website files live at the root of this new repository.

## Public address

Public GitHub Pages address (verified with HTTP 200 after deployment):

https://econovalabs.github.io/econovalabs/

This standalone repository is https://github.com/econovalabs/econovalabs. If a custom domain or a different Pages source is configured, use the URL reported by GitHub Pages and regenerate the QR code before printing.

## Direct feedback and private dashboard

Visitors submit their name, email, 1–5 star rating and suggestions/details directly on the website. All fields and consent are required. Successful submissions receive a reference number. If saving fails, entries stay on screen.

The database backend is hosted separately from GitHub Pages, which cannot execute server code. Its public base URL is configured in config.js. No passwords, tokens or database credentials are stored in this repository. Responses are stored in a hosted Cloudflare D1 database, not in GitHub commits or browser storage.

Dashboard: https://econova-verdant-smartgrow.rainy-lark-5600.chatgpt.site/admin

Use Sign in with ChatGPT and the account associated with sherin122491@gmail.com. Other accounts and anonymous visitors cannot read feedback or export it. The dashboard shows names, emails, comments, average rating, rating distribution, search, rating filters, pagination and CSV export (up to the latest 10,000 matching responses). Visitor-supplied names and emails are not verified.

A source mirror and database migrations are in feedback-backend/. That code is deployed separately through the existing Sites hosting project, not automatically by GitHub Pages. Sites supplies trusted sign-in identity headers; do not deploy the Worker elsewhere without an equivalent verified authentication boundary. Never add submitted personal data to this public repository.

The QR still opens the website. website-qr.svg is scalable for printing, and website-qr.png can be shared directly.

## Publish with GitHub Pages

In repository Settings → Pages, choose **Deploy from a branch**, select `main`, and select `/ (root)`. This repository contains the website at its root. The original portfolio repository is untouched.

For a local preview, run `python -m http.server 8080` from this repository and visit `http://localhost:8080/`.

## Content and assets

Product specifications and features are presented as proposals. Readings in the interactive panel are illustrative, not live telemetry. No unverified prices, testimonials, survey results or performance figures are used. The greenhouse SVG is an original concept illustration, not a photograph of a manufactured product. Fonts load from Google Fonts with local font fallbacks; all essential website assets and JavaScript are local.
