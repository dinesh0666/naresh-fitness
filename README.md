# Naresh Fitness

The official website for **Naresh Fitness** — Naresh Kumar, a certified fitness expert, Pilates instructor and Men's Physique athlete (Mr. India 2K19) coaching clients online worldwide and in person in Chennai, India.

🔗 **Live site:** https://dinesh0666.github.io/naresh-fitness/

## About this project

A fast, accessible, mobile-first landing page built with plain HTML, CSS and JavaScript — no build step, no framework, no tracking scripts. It's designed to load instantly on a phone over mobile data, which is how most of Naresh's audience will find him.

**Sections:** Hero &middot; Trust stats &middot; About the coach &middot; Coaching method &middot; Services &middot; Real client transformations &middot; Training gallery &middot; Reviews &middot; FAQ &middot; Contact (WhatsApp-first).

## Tech stack

- Semantic HTML5 + modern CSS (custom properties, Grid/Flexbox, `clamp()` fluid type)
- Vanilla JavaScript (mobile nav, scroll-reveal, animated counters, lightbox gallery, FAQ accordion via native `<details>`, WhatsApp-linked contact form)
- WebP images with JPEG fallback via `<picture>`, `loading="lazy"`, and sizing attributes to avoid layout shift
- `schema.org` structured data (`ExerciseGym`) for search engines
- No external JS dependencies — only Google Fonts (Bebas Neue + Inter)

## Project structure

```
.
├── index.html
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── img/               # optimized JPEG + WebP photos, favicons, OG image
├── .github/workflows/deploy.yml   # GitHub Actions → GitHub Pages
├── robots.txt
├── sitemap.xml
└── favicon.ico
```

## Local development

No build tools required. Just serve the folder locally, for example:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deployment

This repo deploys automatically to **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`. In the repository settings, **Settings → Pages → Build and deployment → Source** should be set to **GitHub Actions** (already configured for this repo).

## Updating content later

- **Contact details / social links:** search `index.html` for the phone number, email and Instagram/YouTube links (they appear in the header, hero, services CTA, contact section and footer).
- **Photos:** replace files in `assets/img/` (keep the same filenames, or update the `src`/`srcset` in `index.html`) — provide both a `.jpg` and a `.webp` for best performance.
- **Reviews/testimonials:** edit the `<section class="reviews">` block once real named testimonials are available.
- **Pricing:** there is intentionally no fixed pricing table — the site routes everyone to a WhatsApp "custom quote" conversation. Add a pricing section later if desired.

## Credits

Real photos, bio details and credentials sourced from Naresh Fitness's own public YouTube channel, Instagram (@nareshfitness) and JustDial business listing, used with the family's permission to build this site.
