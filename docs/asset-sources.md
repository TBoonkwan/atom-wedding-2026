# Asset sources

The source artwork and retouched photographs were supplied by the couple in the shared Google Drive folder:

`https://drive.google.com/drive/folders/1GVFZR6KACLrX-o5DK0yNUywqmPfe52im`

Included in this project:

- `public/brand/names.png` — supplied name lockup
- `public/brand/monogram.png` — supplied NP monogram
- `public/brand/palette.png` — supplied color reference
- `public/gallery/photo-01.jpg` through `photo-08.jpg` — eight selected photographs from `Retouch.rar`, resized to a maximum dimension of 1800 px; Next.js serves AVIF/WebP variants where supported
- `private/payment-qr.png` — supplied payment QR, deliberately kept outside the public asset directory
- `public/canva-wedding/photos/*.webp` — metadata-free web derivatives of the wedding photographs and dress-code board supplied in the local intake folder `New folder`; photographs are capped at 1800 px on their longest edge, while text artwork retains its full dimensions
- `public/canva-wedding/fonts/perfecto-calligraphy.ttf` — supplied Perfecto Calligraphy font used for the couple's names
- `public/canva-wedding/fonts/klavika-light-italic.otf` and `klavika-medium-italic.otf` — supplied Klavika italic fonts used for headings and RSVP display type
- `public/canva-wedding/media/*` — Canva-exported venue, QR, background, and supporting artwork used to reproduce the reference invitation

The full-resolution intake copies remain outside `public/`; only optimized derivatives are served by the app. These assets are private wedding materials. Confirm photographer and artwork publication permission before making the production deployment public.

Font embedding rights are not established by possession of the files. The Perfecto file is labeled for personal use and Klavika carries Process Type Foundry copyright metadata. Before a public production deployment, obtain and retain licenses that explicitly permit web embedding/redistribution, then prefer licensed WOFF2 webfont files. If those rights are not available, replace the fonts with licensed alternatives.
