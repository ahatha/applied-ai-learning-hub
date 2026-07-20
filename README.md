# Applied AI Learning Hub

A personal programme explorer and course-support hub for the Master Programme in Applied Artificial Intelligence at Luleå University of Technology (2026–2028).

> This is a personal learning portfolio and is **not** an official website of Luleå University of Technology.

## Live site

- Project Pages: `https://ahatha.github.io/applied-ai-learning-hub/`

Paths are relative so the same files work under `/applied-ai-learning-hub/`.

## Purpose

- Explore the programme hierarchy (year → semester → study period → course)
- Open shared course hubs with official LTU facts separated from personal preparation, notes, projects, and reflections
- Keep public evidence honest (no fabricated completions)

## Public pages

| Path | Role |
|------|------|
| `index.html` | Programme explorer hub |
| `courses/course.html?code=…` | Shared course hub |
| `404.html` | Not found |
| `projects/applied-ai-learning-hub.html` | Evidence case study (linked from course hubs) |

## Features

- Vanilla HTML, CSS, and JavaScript (no React, TypeScript, Tailwind, npm, bundling, or D3)
- JSON-driven explorer from `programme.json`, `semesters.json`, `courses.json`, and `sources.json`
- Light / dark theme with system preference and manual override
- Desktop hierarchy + details panel; mobile accordion (no horizontal pan/zoom)
- Keyboard selection (Tab, Enter/Space, Escape)

## Canonical data

```text
assets/data/
├── programme.json
├── semesters.json
├── courses.json
├── sources.json
├── preparation.json
├── course-resources.json
└── projects.json
```

## Local usage

```powershell
# From the repository root (Python example)
python -m http.server 8080
# Then open http://localhost:8080/
```

Or open `index.html` directly; some browsers restrict `fetch` on `file://`.

## Privacy and integrity

See `PRIVACY_CHECKLIST.md` and `ACADEMIC_INTEGRITY.md`.

Public course contacts use only name, role, and public LTU profile URL — never email or phone.

## License

See `LICENSE`.
