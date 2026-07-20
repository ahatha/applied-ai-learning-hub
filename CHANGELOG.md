# Changelog

All notable changes to this project are documented in this file.

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
