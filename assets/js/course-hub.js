/**
 * Shared course hub renderer: courses/course.html?code=D0036E
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  function setHtml(el, html) {
    if (el) {
      el.innerHTML = html;
    }
  }

  function zone(label, className, body) {
    return (
      '<section class="content-zone ' +
      className +
      '"><p class="zone-label"><span class="sr-only">Content origin: </span>' +
      D().escapeHtml(label) +
      "</p>" +
      body +
      "</section>"
    );
  }

  function emptyPersonal(message) {
    return '<div class="empty-state"><p>' + D().escapeHtml(message) + "</p></div>";
  }

  /**
   * @returns {string}
   */
  function getCourseCode() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("code") || params.get("id") || "").trim().toUpperCase();
  }

  async function renderCourseHub() {
    var host = document.getElementById("course-hub");
    if (!host) {
      return;
    }

    var code = getCourseCode();
    if (!code) {
      setHtml(
        host,
        '<div class="empty-state"><p>Select a course from the <a href="../index.html">programme explorer</a>. Example: <code>course.html?code=D0036E</code>.</p></div>'
      );
      return;
    }

    var coursesData = await D().loadJson("data/courses.json");
    var courses = coursesData && coursesData.courses ? coursesData.courses : [];
    var course = courses.find(function (item) {
      return String(item.code).toUpperCase() === code || String(item.id).toUpperCase() === code;
    });

    if (!course) {
      setHtml(
        host,
        '<div class="empty-state"><p>Course “' +
          D().escapeHtml(code) +
          '” was not found. Return to the <a href="../index.html">programme explorer</a>.</p></div>'
      );
      return;
    }

    document.title = course.code + " · " + course.title + " | Applied AI Learning Hub";

    var prepData = await D().loadJson("data/preparation.json");
    var prepItems = ((prepData && prepData.items) || []).filter(function (item) {
      return item.courseId === course.id;
    });

    var resourceData = await D().loadJson("data/course-resources.json");
    var resources = ((resourceData && resourceData.resources) || []).filter(function (item) {
      return Array.isArray(item.courseIds) && item.courseIds.indexOf(course.id) !== -1;
    });

    var projectsData = await D().loadJson("data/projects.json");
    var relatedIds = course.relatedProjectIds || [];
    var projects = ((projectsData && projectsData.projects) || []).filter(function (project) {
      return relatedIds.indexOf(project.id) !== -1;
    });

    var sourcesData = await D().loadJson("data/sources.json");
    var source =
      sourcesData && sourcesData.sources
        ? sourcesData.sources.find(function (s) {
            return s.id === "ltu-syllabus-2026-2027";
          })
        : null;

    var periodLabel =
      course.studyPeriod == null ? "—" : "Study period " + course.studyPeriod;

    var courseUrl = course.officialCourseUrl || "";
    var officialCourseLink = courseUrl
      ? '<p><a class="btn btn--secondary" href="' +
        D().escapeHtml(courseUrl) +
        '" rel="noopener noreferrer" target="_blank">View official LTU course page</a></p>'
      : "<p>Official LTU course page: to be added after verification.</p>";

    var syllabusLink =
      course.officialSyllabusUrl
        ? '<p><a class="btn btn--ghost" href="' +
          D().escapeHtml(course.officialSyllabusUrl) +
          '" rel="noopener noreferrer" target="_blank">View official syllabus</a></p>'
        : "";

    var offering = course.offeringDetails || null;
    var offeringHtml = "";
    if (offering) {
      offeringHtml =
        "<h3>Offering details</h3><dl class=\"meta-list meta-list--flush\">" +
        (offering.instanceLabel
          ? "<div><dt>Instance</dt><dd>" + D().escapeHtml(offering.instanceLabel) + "</dd></div>"
          : "") +
        (offering.season
          ? "<div><dt>Season</dt><dd>" + D().escapeHtml(offering.season) + "</dd></div>"
          : "") +
        (offering.weeks
          ? "<div><dt>Weeks</dt><dd>" + D().escapeHtml(offering.weeks) + "</dd></div>"
          : "") +
        (offering.studyPace
          ? "<div><dt>Study pace</dt><dd>" + D().escapeHtml(offering.studyPace) + "</dd></div>"
          : "") +
        "</dl>" +
        (offering.notes ? "<p>" + D().escapeHtml(offering.notes) + "</p>" : "") +
        "<p><em>Offering-instance information for a specific period, not a permanent course property.</em></p>";
    }

    var contacts = Array.isArray(course.publicContacts) ? course.publicContacts : [];
    var contactsHtml = contacts.length
      ? "<h3>Listed course contacts</h3>" +
        '<p class="callout">Course contacts may change. Verify through the current official LTU course page.</p>' +
        "<ul>" +
        contacts
          .map(function (contact) {
            return (
              "<li><a href=\"" +
              D().escapeHtml(contact.profileUrl) +
              '" rel="noopener noreferrer" target="_blank">' +
              D().escapeHtml(contact.name) +
              "</a> · " +
              D().escapeHtml(contact.role || "Listed course contact") +
              "</li>"
            );
          })
          .join("") +
        "</ul>"
      : "<p>No public profile contacts listed for this course yet.</p>";

    var officialFacts =
      '<dl class="meta-list">' +
      "<div><dt>Course code</dt><dd>" +
      D().escapeHtml(course.code) +
      "</dd></div>" +
      "<div><dt>Title</dt><dd>" +
      D().escapeHtml(course.title) +
      "</dd></div>" +
      "<div><dt>ECTS</dt><dd>" +
      D().escapeHtml(String(course.ects)) +
      "</dd></div>" +
      "<div><dt>Level</dt><dd>" +
      D().escapeHtml(course.level) +
      "</dd></div>" +
      "<div><dt>Role</dt><dd>" +
      D().escapeHtml(D().formatStatus(course.role)) +
      "</dd></div>" +
      (course.role === "elective-option"
        ? "<div><dt>Selection</dt><dd>" +
          D().escapeHtml(D().formatStatus(course.selectionStatus || "not-selected")) +
          "</dd></div>"
        : "") +
      (course.role === "optional-non-degree"
        ? "<div><dt>Degree</dt><dd>Outside the 120 ECTS total</dd></div>"
        : "") +
      "</dl>" +
      "<p>" +
      D().escapeHtml(course.summary || "") +
      "</p>" +
      offeringHtml;

    var scheduleHtml =
      '<dl class="meta-list">' +
      "<div><dt>Academic year</dt><dd>" +
      D().escapeHtml(course.academicYear || "—") +
      "</dd></div>" +
      "<div><dt>Period</dt><dd>" +
      D().escapeHtml(periodLabel) +
      "</dd></div>" +
      "<div><dt>My status</dt><dd>" +
      D().statusBadge(course.myStatus) +
      "</dd></div>" +
      "<div><dt>Schedule confidence</dt><dd>" +
      D().statusBadge(course.scheduleConfidence) +
      "</dd></div>" +
      "<div><dt>Source status</dt><dd>" +
      D().escapeHtml(D().formatStatus(course.verificationStatus)) +
      "</dd></div>" +
      "</dl>";

    var prepHtml;
    if (prepItems.length === 0) {
      prepHtml = emptyPersonal("No personal preparation checklist has been added for this course yet.");
    } else {
      prepHtml =
        '<p class="callout">' +
        D().escapeHtml(
          (prepData && prepData.disclaimer) ||
            "My preparation topics — not an official LTU prerequisite list."
        ) +
        '</p><ul class="roadmap-items">' +
        prepItems
          .sort(function (a, b) {
            return (a.order || 0) - (b.order || 0);
          })
          .map(function (item) {
            return (
              "<li><span>" +
              D().escapeHtml(item.title) +
              "</span>" +
              D().statusBadge(item.status) +
              "</li>"
            );
          })
          .join("") +
        "</ul>";
    }

    var resourcesHtml;
    if (resources.length === 0) {
      resourcesHtml = emptyPersonal("No course-linked resources have been added yet.");
    } else {
      resourcesHtml =
        '<div class="card-grid">' +
        resources
          .map(function (resource) {
            var link = resource.url
              ? '<a href="' +
                D().escapeHtml(resource.url) +
                '" rel="noopener noreferrer" target="_blank">Open resource</a>'
              : "<span>Link to be verified</span>";
            return (
              '<article class="card"><div class="card__meta">' +
              D().statusBadge(String(resource.status || "").toLowerCase().replace(/\s+/g, "-")) +
              '<span class="badge">' +
              D().escapeHtml(resource.recommendedStage || "") +
              "</span></div><h3>" +
              D().escapeHtml(resource.title) +
              "</h3><p>" +
              D().escapeHtml(resource.description || "") +
              "</p><p>" +
              D().escapeHtml(resource.whyUseful || "") +
              '</p><div class="card__actions">' +
              link +
              "</div></article>"
            );
          })
          .join("") +
        "</div>";
    }

    var projectsHtml;
    if (projects.length === 0) {
      projectsHtml = emptyPersonal(
        "No linked public projects yet. Evidence will appear here when available."
      );
    } else {
      projectsHtml =
        '<div class="card-grid">' +
        projects
          .map(function (project) {
            var href = project.caseStudyUrl
              ? D().resolvePageLink(project.caseStudyUrl)
              : D().resolvePageLink("index.html");
            return (
              '<article class="card"><div class="card__meta">' +
              D().statusBadge(project.status) +
              "</div><h3>" +
              D().escapeHtml(project.title) +
              "</h3><p>" +
              D().escapeHtml(project.summary || "") +
              '</p><div class="card__actions"><a href="' +
              D().escapeHtml(href) +
              '">View evidence</a></div></article>'
            );
          })
          .join("") +
        "</div>";
    }

    var sourceHtml = source
      ? "<ul><li><strong>" +
        D().escapeHtml(source.sourceTitle) +
        "</strong> · " +
        D().escapeHtml(source.sourceReference) +
        " · Decision " +
        D().escapeHtml(source.sourceDate) +
        " · Verified " +
        D().escapeHtml(source.verifiedDate) +
        "</li></ul>"
      : "<p>Official source metadata unavailable.</p>";

    setHtml(
      host,
      '<nav aria-label="Breadcrumb"><ol class="breadcrumb">' +
        '<li><a href="../index.html">Home</a></li>' +
        '<li aria-current="page">' +
        D().escapeHtml(course.code) +
        "</li></ol></nav>" +
        '<header class="page-header"><p class="eyebrow">Course hub</p><h1>' +
        D().escapeHtml(course.title) +
        '</h1><p class="lead">' +
        D().escapeHtml(course.code) +
        " · " +
        D().escapeHtml(String(course.ects)) +
        ' ECTS</p><div class="card__meta">' +
        D().statusBadge(course.myStatus) +
        D().statusBadge(course.scheduleConfidence) +
        '<span class="badge">' +
        D().escapeHtml(D().formatStatus(course.role)) +
        "</span></div></header>" +
        zone("Official LTU information", "content-zone--official", "<h2>Official LTU facts</h2>" + officialFacts) +
        zone("Official LTU information", "content-zone--official", "<h2>Schedule and status</h2>" + scheduleHtml) +
        zone("My preparation plan", "content-zone--prep", "<h2>My preparation</h2>" + prepHtml) +
        zone(
          "Public external resource",
          "content-zone--resources",
          "<h2>Course-specific materials and support</h2>" + resourcesHtml
        ) +
        zone(
          "My personal note",
          "content-zone--notes",
          "<h2>My learning notes</h2>" +
            emptyPersonal("No public learning notes published for this course yet.")
        ) +
        zone(
          "My personal note",
          "content-zone--notes",
          "<h2>Public-safe exercises</h2>" +
            emptyPersonal("No public-safe exercises published for this course yet.")
        ) +
        zone(
          "Project evidence",
          "content-zone--projects",
          "<h2>Projects and evidence</h2>" + projectsHtml
        ) +
        zone(
          "My reflection",
          "content-zone--reflections",
          "<h2>Reflections</h2>" + emptyPersonal("No reflections published yet.")
        ) +
        zone(
          "Official LTU information",
          "content-zone--official",
          "<h2>Official links and public profiles</h2>" +
            officialCourseLink +
            syllabusLink +
            contactsHtml +
            sourceHtml +
            '<div class="callout callout--warning"><p>This page contains personal learning organisation and does not reproduce restricted course materials. Official details should be verified through university sources.</p></div>'
        ) +
        "<p><em>Last updated: " +
        D().escapeHtml(course.lastUpdated || "—") +
        "</em></p>"
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCourseHub();
  });
})();
