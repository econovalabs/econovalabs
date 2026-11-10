# Econova Labs — Project VERDANT

A responsive, standalone website based on the supplied Project VERDANT final report. No build, installation, server, API keys or login required. The website files live at the root of this new repository.

## Public address

Public GitHub Pages address (verified with HTTP 200 after deployment):

https://vishnutef.github.io/econovalabs/

This standalone repository is https://github.com/Vishnutef/econovalabs. If a custom domain or a different Pages source is configured, use the URL reported by GitHub Pages and regenerate the QR code before printing.

## Add the feedback form later

1. Open `config.js`.
2. Paste your shareable Google Form link into `feedbackUrl`, keeping the quotes.
3. Commit and publish the change.

The feedback button opens the form in a new tab. Until configured, the page explains that the form is coming soon and collects no responses. The form should permit your intended visitors to respond and explain its data use. Never put passwords or access tokens in this repository.

The QR code points to the website itself, so adding the form later does not require changing the QR code. `website-qr.svg` is a scalable download for exhibition posters and printing. `website-qr.png` is an image you can share directly.

## Publish with GitHub Pages

In repository Settings → Pages, choose **Deploy from a branch**, select `main`, and select `/ (root)`. This repository contains the website at its root. The original portfolio repository is untouched.

For a local preview, run `python -m http.server 8080` from this repository and visit `http://localhost:8080/`.

## Content and assets

Product specifications and features are presented as proposals. Readings in the interactive panel are illustrative, not live telemetry. No unverified prices, testimonials, survey results or performance figures are used. The greenhouse SVG is an original concept illustration, not a photograph of a manufactured product. Fonts load from Google Fonts with local font fallbacks; all essential website assets and JavaScript are local.
