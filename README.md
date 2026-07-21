# Applied AI Programme Hub

A personal programme explorer and course-support hub for the Master Programme in Applied Artificial Intelligence at Luleå University of Technology (2026–2028).

> This is a personal learning hub and is **not** an official website of Luleå University of Technology.

## Live site

- Project Pages: `https://ahatha.github.io/applied-ai-learning-hub/`

Paths are relative so the same files work under `/applied-ai-learning-hub/`.

## Purpose

1. Show the LTU Master Programme in Applied AI structure
2. Explore years, semesters, study periods, and courses
3. Open each course hub for official LTU syllabus facts and links
4. View the official LTU academic calendar for 2026–2028

## Public pages

| Path | Role |
|------|------|
| `index.html` | Programme summary + explorer |
| `academic-calendar.html` | LTU academic year calendars 2026–2028 |
| `courses/course.html?code=…` | Shared JSON-driven course hub |
| `404.html` | Not found |

## Features

- Vanilla HTML, CSS, and JavaScript (no React, TypeScript, Tailwind, npm, bundling, or D3)
- JSON-driven explorer from `programme.json`, `semesters.json`, and `courses.json`
- Light / dark theme with system preference and manual override
- Year tabs → Semester → Study period → Course rows linking to course hubs
- Course hubs show official LTU facts, syllabus details, literature, schedule links, and listed contacts
- Academic calendar with study periods, exams, re-exams, reading days, and special days

## Canonical data

```text
assets/data/
├── programme.json
├── semesters.json
├── courses.json
├── course-details.json
├── sources.json
├── ltu-academic-calendar-2026-2027.json
└── ltu-academic-calendar-2027-2028.json
```

`course-details.json` holds syllabus/literature scaffolds for all 18 courses. Empty fields are intentional placeholders until verified from official sources.

## Local usage

```powershell
# From the repository root
python -m http.server 8080
# Then open http://localhost:8080/
```

Also open `http://localhost:8080/academic-calendar.html` (JSON calendars require a local server).

## Deployment

See `docs/DEPLOYMENT.md`.

## License

See `LICENSE`.
