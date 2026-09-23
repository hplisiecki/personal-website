# Hubert Plisiecki - personal website

Bilingual static website at https://hubertplisiecki.com, hosted on GitHub Pages.

## Editing

- `site/index.html`: English content.
- `site/pl.html`: Polish content.
- `site/style.css`: layout and typography.
- `site/space.js`: scroll-driven word animation.
- `site/language.js`: language preference.
- `site/favicon.svg`: editable source for the existing “hp” favicon; `site/favicon.png` (96×96) and `site/favicon.ico` (16, 32, 48, and 64px) are its exported assets, linked from both pages.

The website requires no build step or external runtime dependencies. Word editing documents, draft handoff, local checks and preview logs are kept outside version control.

## Preview

From this directory, run `python -m http.server 8000 --bind 0.0.0.0 --directory site`.
Open http://localhost:8000, or use the computer's LAN address on another device with an appropriate firewall rule.

## Publishing

Push to `main` to deploy automatically through `.github/workflows/pages.yml`. Only `site/` is uploaded as the Pages artifact. GitHub repository Settings > Pages must use GitHub Actions as the source and `hubertplisiecki.com` as the custom domain.

## Domain

In OVHcloud's DNS zone, the root domain uses these four A records:

- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

The `www` CNAME target is `hplisiecki.github.io.`. Replace conflicting website records while preserving mail records. Once DNS has propagated and GitHub issues a certificate, enable Enforce HTTPS under Settings > Pages.

When changing domains, also update the canonical and alternate URLs in both HTML pages, `site/CNAME`, `site/robots.txt`, and `site/sitemap.xml`.
