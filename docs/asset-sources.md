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

## Canva photo audit — 2026-09-05

Reference: https://atomandjobwedding.my.canva.site/

The opening six-photo gallery follows the reference's row order: red formal portrait,
black outfits by the window, white standing portrait, black embrace, white bouquet,
and red embrace. Five matching shots are absent from the supplied 21-file selection;
`canva-*.webp` are web derivatives of those exact reference assets:

- `canva-black-window.webp`: `ea181aa882f3120903516515439638d6.jpg`
- `canva-white-standing.webp`: `a4195acf0391768fca62e6ba628d6a02.jpg`
- `canva-black-embrace.webp`: `180ed4330f3c0b34ea06859189195b12.jpg`
- `canva-white-bouquet.webp`: `f22a7e1c16254600b037728437ff9c16.jpg`
- `canva-red-embrace.webp`: `6850f29c1cd140fc4a8bd302a1ed2f37.jpg`

These source filenames are under the reference site's `/_assets/media/` path.
`white-camera.webp` and `white-kiss.webp` come from the supplied `IMG_5667.jpg`
and `IMG_5706.jpg`. The remaining used photos were already derivatives of the
supplied originals. `11.png` is a small alternate crop, not the full hero source;
the hero uses `92F3E60A.png` via `hero.webp`.

The later gallery now follows the reference photo sequence. It preserves full
image proportions instead of reproducing Canva's cropped overlapping collage.
The first six photos use equal 2:3 frames with proportional cover sizing. Other
foreground images use intrinsic height at every viewport; the RSVP image uses
contain sizing as a decorative background. No extra grayscale filter is applied.
