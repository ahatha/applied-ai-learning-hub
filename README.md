# Applied AI Programme Hub

A personal programme explorer and course-support hub for the Master Programme in Applied Artificial Intelligence at Luleå University of Technology (2026–2028).

> This is a personal learning hub and is **not** an official website of Luleå University of Technology.

## Live site

- Project Pages: `https://ahatha.github.io/applied-ai-learning-hub/`

Paths are relative so the same files work under `/applied-ai-learning-hub/`.

## Purpose

1. Show the LTU Master Programme in Applied AI structure
2. Let visitors select a course
3. Open the course hub (preparation, materials, notes, projects, reflections)

## Public pages

| Path | Role |
|------|------|
| `index.html` | Compact programme summary + explorer |
| `courses/course.html?code=…` | Shared course hub |
| `404.html` | Not found |
| `projects/applied-ai-learning-hub.html` | Evidence case study (linked from course hubs) |

## Features

- Vanilla HTML, CSS, and JavaScript (no React, TypeScript, Tailwind, npm, bundling, or D3)
- JSON-driven explorer from `programme.json`, `semesters.json`, `courses.json`, and `sources.json`
- Light / dark theme with system preference and manual override
- Full-width Year → Semester → Study period → Course explorer
- Selected-course details below the explorer (shared desktop/mobile)
- Initial focus on Autumn 2026 / Study Period 1 (D0036E selected)

## Canonical data

```text
assets/data/
├── programme.json
├── semesters.json
├── courses.json
├── sources.json
├── preparation.json
├── course-resources.json
├── course-details.json
└── projects.json
```

`course-details.json` holds enriched syllabus/literature scaffolds for all 18 courses. Course hubs (`courses/course.html`) load those arrays and render aim, contents, realization, entry requirements, examination modules, literature, and listed contacts (including email/phone when present). Empty tags are intentional placeholders to fill from official syllabus and literature PDFs.

Architecture notes and data file roles belong in this README — not on the public homepage.

## Local usage

```powershell
# From the repository root (Python example)
python -m http.server 8080
# Then open http://localhost:8080/
```

## Privacy and integrity

See `PRIVACY_CHECKLIST.md` and `ACADEMIC_INTEGRITY.md` (repository docs; not linked from the public footer).

Public course contacts use only name, role, and public LTU profile URL — never email or phone.

## License

See `LICENSE`.
