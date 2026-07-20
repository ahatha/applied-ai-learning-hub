# Changelog

All notable changes to this project are documented in this file.

## [0.3.5] — 2026-07-20

### Changed
- Synced TSX course enrichment into `courses.json` and `course-details.json`
- Course hub now renders full syllabus contents, examination modules, and literature arrays
- Official facts show subject/grade scale and PDF syllabus/literature links when available

## [0.3.4] — 2026-07-20

### Added
- `assets/data/course-details.json` with enriched syllabus/literature scaffolds for all 18 courses
- Course hub section “Syllabus and literature details” driven by `course-details.json`
- Matching `enriched` blocks for every course in the TSX reference draft

### Changed
- Empty tags left for PDF links, grade scale, realization, entry requirements, exam modules, and structured literature where not yet verified

## [0.3.3] — 2026-07-20

### Changed
- Removed personal preparation/materials/evidence previews from programme explorer details
- Course hub sections renamed to “My preparation plan” and “Suggested learning support”
- Personal statuses labelled “My status” so they are not read as official LTU statuses

## [0.3.2] — 2026-07-20

### Changed
- Programme explorer uses a full-width Year → Semester → Study period → Course layout
- Selected-course details move below the explorer (no desktop side panel)
- Course rows show full titles, ECTS, level, role, and status badges
- D0036E / D7062E details include compact preparation, materials, and evidence previews

## [0.3.1] — 2026-07-20


### Changed
- Homepage simplified to programme summary + explorer + compact footer
- Removed duplicate upcoming-semester, composition, official-links, and about-learner sections
- Distance study reduced to a compact disclosure; official programme link kept beside the summary
- Explorer opens Year 1 → Autumn 2026 → Study Period 1 and highlights D0036E / D7062E
- Header reduced to branding + theme toggle (navigation menu removed)

### Removed
- `navigation.js` and unused primary navigation markup

## [0.3.0] — 2026-07-20

### Added
- JSON-driven programme explorer on `index.html` (`assets/js/explorer.js`)
- Desktop hierarchy + details panel and mobile accordion explorer
- Consolidated public surface: home, shared course hubs, 404, and repository docs

### Changed
- Navigation simplified to Home + theme toggle
- Course hub sections reorganised with honest empty states
- Official course CTA label: “View official LTU course page”
- Sitemap and README updated for the consolidated site

### Removed
- Standalone portfolio pages (about, blog, contact, search, roadmap, projects catalogue, resources, programme, courses catalogue, templates, and legacy course HTML)
- Unused catalogue JSON and unused `filters.js` / `search.js`

## [0.2.1] — 2026-07-20

### Added
- Public programme delivery facts, official LTU programme/course links, and selected public staff profile links
- Distance-study, examination, and thesis-at-a-distance guidance on the Programme page
- Offering-instance details only where unambiguously associated with a course

### Changed
- Course hubs show Official LTU course page / Verify on LTU links and source badges
- Privacy and academic-integrity checklists cover admissions exports and course-contact rules

## [0.2.0] — 2026-07-20

### Added
- Programme, sources, and semester JSON for Autumn 2026 cohort (LTU-1670-2025)
- Full 18-item course catalogue with confirmed Year 1 and planned Year 2 schedules
- Shared JSON-driven course hub (`courses/course.html?code=…`)
- Preparation and course-linked resources for D0036E and D7062E only
- Homepage oriented to upcoming Autumn 2026 semester

### Changed
- Courses page organised by upcoming semester, compulsory, elective options, thesis, optional non-degree
- Programme page uses concise verified totals and source metadata

## [0.1.0] — 2026-07-20

### Added

- Initial multi-page Applied AI Learning Hub structure
- Shared CSS architecture and accessible navigation
- Light/dark theme with localStorage preference
- JSON data files for courses, projects, skills, timeline, roadmap, resources, blog, and learning areas
- Working courses and projects catalogue pages with filters
- Course detail page for Programming for Machine Learning
- Project case study for the learning hub website
- Introductory blog post: “Why I Am Building an Applied AI Learning Hub”

- Privacy checklist, academic integrity notice, and deployment documentation
- GitHub Pages path strategy using relative assets
