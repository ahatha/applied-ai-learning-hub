# Deployment guide

## Path rules (important)

Use **relative** asset paths so the site works in both modes:

- User site root: `https://ahatha.github.io/`
- Project site subpath: `https://ahatha.github.io/applied-ai-learning-hub/`

Prefer:

```html
<link rel="stylesheet" href="assets/css/main.css">
```

Avoid hardcoded root paths:

```html
<link rel="stylesheet" href="/assets/css/main.css">
```

Nested pages should use `../assets/...`.  
JSON loading uses `html[data-asset-base]`.

## Option A — Project site (`applied-ai-learning-hub`)

1. Push this repository to `https://github.com/ahatha/applied-ai-learning-hub`.
2. In GitHub: **Settings → Pages**.
3. Set source to **Deploy from a branch**.
4. Choose `main` (or `gh-pages`) and folder `/ (root)`.
5. Save and wait for the site to publish.
6. Expected URL: `https://ahatha.github.io/applied-ai-learning-hub/`

## Option B — User site (`ahatha.github.io`)

1. Copy or publish the site contents into the `ahatha.github.io` repository root.
2. Enable Pages on that repository.
3. Expected URL: `https://ahatha.github.io/`

If both repositories exist, decide intentionally which one is canonical to avoid duplicated/outdated content.

## Local verification before deploy

```powershell
Set-Location e:\Projects\applied-ai-learning-hub
python -m http.server 8080
```

Check:

- Home programme explorer (`/`)
- Academic calendar (`/academic-calendar.html`) — both year tabs
- Course hubs (`/courses/course.html?code=D0036E`, `D7062E`)
- 404 page
- Theme toggle persistence
- Relative links from nested course pages
- Mobile layout (no horizontal scrolling)

## Custom domain readiness

1. Choose a domain later.
2. Copy `CNAME.example` to `CNAME` and put the domain on the first line.
3. In your DNS provider, add the records GitHub documents for Pages custom domains.
4. In GitHub Pages settings, add the custom domain and enable **Enforce HTTPS** after the certificate provisions.

Do not commit a real `CNAME` until the domain is purchased and DNS is ready.

## 404 page

GitHub Pages serves `404.html` for unknown project-site paths when present at the site root.
