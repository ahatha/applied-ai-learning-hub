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
      '<section class="content-zone content-zone--course ' +
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

  function chip(label, value, tone) {
    return (
      '<div class="fact-chip fact-chip--' +
      D().escapeHtml(tone || "neutral") +
      '"><span class="fact-chip__label">' +
      D().escapeHtml(label) +
      '</span><span class="fact-chip__value">' +
      value +
      "</span></div>"
    );
  }

  function plainChip(label, text, tone) {
    return chip(label, D().escapeHtml(text || "—"), tone);
  }

  function actionLink(href, label, kind) {
    if (!href) {
      return "";
    }
    return (
      '<a class="action-chip action-chip--' +
      D().escapeHtml(kind || "ghost") +
      '" href="' +
      D().escapeHtml(href) +
      '" rel="noopener noreferrer" target="_blank">' +
      D().escapeHtml(label) +
      "</a>"
    );
  }

  function sectionHead(kicker, title) {
    return (
      '<header class="course-section-head"><p class="course-section-head__kicker">' +
      D().escapeHtml(kicker) +
      "</p><h2>" +
      D().escapeHtml(title) +
      "</h2></header>"
    );
  }

  function subHead(title) {
    return '<h3 class="course-subhead">' + D().escapeHtml(title) + "</h3>";
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

    var detailsData = await D().loadJson("data/course-details.json");
    var details =
      detailsData && detailsData.courses ? detailsData.courses[course.code] || null : null;

    var sourcesData = await D().loadJson("data/sources.json");
    var source =
      sourcesData && sourcesData.sources
        ? sourcesData.sources.find(function (s) {
            return s.id === "ltu-syllabus-2026-2027";
          })
        : null;

    var periodLabel =
      course.studyPeriod == null ? "—" : "Study period " + course.studyPeriod;

    var meta = (details && details.meta) || {};
    var syl = (details && details.syllabus) || {};
    var exam = (details && details.examination) || {};
    var lit = details && Array.isArray(details.literature) ? details.literature : [];
    var detailContact = (details && details.contact) || null;

    var courseUrl = course.officialCourseUrl || meta.syllabusPageUrl || "";
    var syllabusPageUrl = course.officialSyllabusUrl || meta.syllabusPageUrl || "";
    var pdfSyllabusUrl = course.pdfSyllabusUrl || meta.pdfSyllabusUrl || "";
    var pdfLiteratureUrl = course.pdfLiteratureUrl || meta.pdfLiteratureUrl || "";

    var subject = course.subject || meta.subject || "";
    var subjectGroup = course.subjectGroup || meta.subjectGroup || "";
    var mainFieldOfStudy = course.mainFieldOfStudy || meta.mainFieldOfStudy || "";
    var gradeScale = course.gradeScale || meta.gradeScale || "";
    var selection = course.selection || meta.selection || "";
    var offeredBy = course.offeredBy || meta.offeredBy || "";
    var aimText = syl.aim || course.syllabusAim || "";
    var detailsStatus =
      meta.verificationStatus || course.detailsVerificationStatus || "awaiting";

    var offering = course.offeringDetails || null;
    var offeringHtml = "";
    if (offering) {
      offeringHtml =
        '<div class="course-block">' +
        subHead("Offering details") +
        '<div class="fact-chip-grid">' +
        (offering.instanceLabel ? plainChip("Instance", offering.instanceLabel, "teal") : "") +
        (offering.season ? plainChip("Season", offering.season, "neutral") : "") +
        (offering.weeks ? plainChip("Weeks", offering.weeks, "neutral") : "") +
        (offering.studyPace ? plainChip("Study pace", offering.studyPace, "warm") : "") +
        "</div>" +
        (offering.notes ? "<p>" + D().escapeHtml(offering.notes) + "</p>" : "") +
        '<p class="muted"><em>Offering-instance information for a specific period, not a permanent course property.</em></p>' +
        "</div>";
    }

    var contacts = Array.isArray(course.publicContacts) ? course.publicContacts.slice() : [];
    if (detailContact && detailContact.name) {
      var existing = contacts.find(function (c) {
        return c.name === detailContact.name;
      });
      if (existing) {
        if (!existing.role && detailContact.role) {
          existing.role = detailContact.role;
        }
        if (!existing.profileUrl && detailContact.profileUrl) {
          existing.profileUrl = detailContact.profileUrl;
        }
        if (!existing.phone && detailContact.phone) {
          existing.phone = detailContact.phone;
        }
        if (!existing.email && detailContact.email) {
          existing.email = detailContact.email;
        }
      } else {
        contacts.push({
          name: detailContact.name,
          role: detailContact.role || "Listed course contact",
          profileUrl: detailContact.profileUrl || "",
          phone: detailContact.phone || "",
          email: detailContact.email || ""
        });
      }
    }

    var contactsHtml = contacts.length
      ? '<div class="contact-card-grid">' +
        contacts
          .map(function (contact) {
            var name = D().escapeHtml(contact.name);
            var role = D().escapeHtml(contact.role || "Listed course contact");
            var body =
              '<p class="contact-card__role"><span class="badge badge--role">' +
              role +
              "</span></p><h3>" +
              name +
              "</h3>";
            if (contact.email) {
              body +=
                '<p class="contact-card__line"><span class="fact-chip__label">Email</span> <a href="mailto:' +
                D().escapeHtml(contact.email) +
                '">' +
                D().escapeHtml(contact.email) +
                "</a></p>";
            }
            if (contact.phone) {
              body +=
                '<p class="contact-card__line"><span class="fact-chip__label">Phone</span> <a href="tel:' +
                D().escapeHtml(String(contact.phone).replace(/\s+/g, "")) +
                '">' +
                D().escapeHtml(contact.phone) +
                "</a></p>";
            }
            if (contact.profileUrl) {
              body +=
                '<a class="action-chip action-chip--ghost" href="' +
                D().escapeHtml(contact.profileUrl) +
                '" rel="noopener noreferrer" target="_blank">Public profile</a>';
            }
            return '<article class="contact-card">' + body + "</article>";
          })
          .join("") +
        "</div>"
      : "<p>No course contacts listed for this course yet.</p>";

    var actionsHtml =
      '<div class="action-chip-row">' +
      actionLink(courseUrl, "LTU course page", "primary") +
      actionLink(syllabusPageUrl, "Official syllabus", "secondary") +
      actionLink(pdfSyllabusUrl, "Syllabus PDF", "pdf") +
      actionLink(pdfLiteratureUrl, "Literature PDF", "pdf") +
      "</div>";

    var heroBadges =
      '<div class="course-hero__badges">' +
      '<span class="badge badge--ects">' +
      D().escapeHtml(String(course.ects)) +
      " ECTS</span>" +
      '<span class="badge badge--level">' +
      D().escapeHtml(course.level || "Level") +
      "</span>" +
      '<span class="badge badge--' +
      D().escapeHtml(String(course.role || "role").toLowerCase().replace(/\s+/g, "-")) +
      '">' +
      D().escapeHtml(D().formatStatus(course.role)) +
      "</span>" +
      (course.role === "elective-option"
        ? '<span class="badge">' +
          D().escapeHtml(D().formatStatus(course.selectionStatus || "not-selected")) +
          "</span>"
        : "") +
      (course.role === "optional-non-degree"
        ? '<span class="badge badge--warning">Outside 120 ECTS</span>'
        : "") +
      '<span class="personal-status"><span class="personal-status__label">My status</span>' +
      D().statusBadge(course.myStatus) +
      "</span>" +
      D().statusBadge(course.scheduleConfidence) +
      "</div>";

    var officialFacts =
      sectionHead("Catalogue", "Official LTU facts") +
      '<div class="fact-chip-grid">' +
      plainChip("Course code", course.code, "teal") +
      plainChip("ECTS", String(course.ects), "teal") +
      plainChip("Level", course.level || "—", "neutral") +
      plainChip("Subject", subject || "— empty tag", subject ? "teal" : "empty") +
      plainChip(
        "Subject group (SCB)",
        subjectGroup || "— empty tag",
        subjectGroup ? "neutral" : "empty"
      ) +
      plainChip(
        "Main field of study",
        mainFieldOfStudy || "— empty tag",
        mainFieldOfStudy ? "neutral" : "empty"
      ) +
      plainChip("Grade scale", gradeScale || "— empty tag", gradeScale ? "warm" : "empty") +
      plainChip("Selection", selection || "— empty tag", selection ? "warm" : "empty") +
      plainChip("Course offered by", offeredBy || "— empty tag", offeredBy ? "teal" : "empty") +
      plainChip("Programme role", D().formatStatus(course.role), "teal") +
      "</div>" +
      (course.summary
        ? '<p class="course-summary">' + D().escapeHtml(course.summary) + "</p>"
        : "") +
      offeringHtml;

    var scheduleHtml =
      sectionHead("Timing", "Schedule and status") +
      '<div class="fact-chip-grid">' +
      plainChip("Academic year", course.academicYear || "—", "teal") +
      plainChip("Period", periodLabel, "warm") +
      chip("My status", D().statusBadge(course.myStatus), "neutral") +
      chip("Schedule confidence", D().statusBadge(course.scheduleConfidence), "neutral") +
      plainChip("Source status", D().formatStatus(course.verificationStatus), "neutral") +
      "</div>";

    function emptyTag(label) {
      return (
        '<div class="empty-tag"><span class="badge badge--empty">Empty</span><p>' +
        D().escapeHtml(label) +
        " — fill from syllabus/literature PDF</p></div>"
      );
    }

    var syllabusDetailsHtml;
    if (!details) {
      syllabusDetailsHtml =
        sectionHead("Syllabus", "Syllabus and literature details") +
        emptyPersonal("No enriched course-details entry yet for this course.");
    } else {
      var contentsHtml =
        Array.isArray(syl.contents) && syl.contents.length
          ? '<ol class="detail-list detail-list--rich">' +
            syl.contents
              .map(function (item, index) {
                return (
                  "<li><span class=\"detail-list__index\">" +
                  (index + 1) +
                  "</span><span>" +
                  D().escapeHtml(item) +
                  "</span></li>"
                );
              })
              .join("") +
            "</ol>"
          : emptyTag("Contents");

      var entryItems = [];
      if (Array.isArray(syl.entryRequirements)) {
        entryItems = syl.entryRequirements;
      } else if (typeof syl.entryRequirements === "string" && syl.entryRequirements.trim()) {
        entryItems = [syl.entryRequirements.trim()];
      }

      var entryRequirementsHtml =
        entryItems.length
          ? '<ol class="detail-list detail-list--rich">' +
            entryItems
              .map(function (item, index) {
                return (
                  "<li><span class=\"detail-list__index\">" +
                  (index + 1) +
                  "</span><span>" +
                  D().escapeHtml(item) +
                  "</span></li>"
                );
              })
              .join("") +
            "</ol>"
          : emptyTag("Entry requirements");

      var modulesHtml =
        Array.isArray(exam.modules) && exam.modules.length
          ? '<div class="exam-module-grid">' +
            exam.modules
              .map(function (mod) {
                var typeClass =
                  String(mod.type || "")
                    .toLowerCase()
                    .indexOf("mandatory") !== -1
                    ? "badge--mandatory"
                    : "badge--module";
                return (
                  '<article class="exam-module-card">' +
                  '<div class="exam-module-card__top">' +
                  '<span class="badge badge--module-code">' +
                  D().escapeHtml(mod.code || "—") +
                  "</span>" +
                  '<span class="badge ' +
                  typeClass +
                  '">' +
                  D().escapeHtml(mod.type || "Module") +
                  "</span></div>" +
                  "<h4>" +
                  D().escapeHtml(mod.name || "Module") +
                  "</h4>" +
                  '<div class="exam-module-card__meta">' +
                  '<span class="badge badge--ects">' +
                  D().escapeHtml(String(mod.credits != null ? mod.credits : "—")) +
                  " cr</span>" +
                  '<span class="badge badge--grade">' +
                  D().escapeHtml(mod.gradeScale || "—") +
                  "</span>" +
                  (mod.fromPeriod
                    ? '<span class="badge badge--module">From ' +
                      D().escapeHtml(mod.fromPeriod) +
                      "</span>"
                    : "") +
                  "</div></article>"
                );
              })
              .join("") +
            "</div>"
          : emptyTag("Examination modules");

      var litHtml =
        lit.length === 0
          ? emptyTag("Literature")
          : '<div class="literature-grid">' +
            lit
              .map(function (book) {
                return (
                  '<article class="literature-card">' +
                  '<p class="literature-card__category"><span class="badge badge--literature">' +
                  D().escapeHtml(book.category || "Literature") +
                  "</span></p>" +
                  "<h4>" +
                  (book.title
                    ? D().escapeHtml(book.title)
                    : "<em>title — empty tag</em>") +
                  "</h4>" +
                  '<p class="literature-card__byline">' +
                  (book.author
                    ? D().escapeHtml(book.author)
                    : "<em>author — empty</em>") +
                  "</p>" +
                  '<p class="muted">' +
                  (book.publisher
                    ? D().escapeHtml(book.publisher)
                    : "<em>publisher — empty</em>") +
                  "</p>" +
                  (book.isbn
                    ? '<p class="literature-card__isbn"><span class="badge badge--isbn">ISBN</span> ' +
                      D().escapeHtml(book.isbn) +
                      "</p>"
                    : '<p class="muted"><em>isbn — empty tag</em></p>') +
                  (book.notes
                    ? '<p class="literature-card__notes">' + D().escapeHtml(book.notes) + "</p>"
                    : "") +
                  (book.url
                    ? '<a class="action-chip action-chip--ghost" href="' +
                      D().escapeHtml(book.url) +
                      '" rel="noopener noreferrer" target="_blank">Open link</a>'
                    : "") +
                  "</article>"
                );
              })
              .join("") +
            "</div>";

      syllabusDetailsHtml =
        sectionHead("Syllabus", "Syllabus and literature details") +
        '<p class="callout callout--compact">Verify against official LTU syllabus and literature PDFs before relying on this content.</p>' +
        '<div class="fact-chip-grid fact-chip-grid--tight">' +
        chip("Details status", D().statusBadge(detailsStatus), "neutral") +
        "</div>" +
        '<div class="course-block">' +
        subHead("Course aim") +
        (aimText ? "<p>" + D().escapeHtml(aimText) + "</p>" : emptyTag("Aim")) +
        "</div>" +
        '<div class="course-block">' +
        subHead("Syllabus contents") +
        contentsHtml +
        "</div>" +
        '<div class="course-block">' +
        subHead("Realization") +
        (syl.realization ? "<p>" + D().escapeHtml(syl.realization) + "</p>" : emptyTag("Realization")) +
        "</div>" +
        '<div class="course-block">' +
        subHead("Entry requirements") +
        entryRequirementsHtml +
        "</div>" +
        '<div class="course-block">' +
        subHead("Examination") +
        (exam.description
          ? "<p>" + D().escapeHtml(exam.description) + "</p>"
          : emptyTag("Examination description")) +
        subHead("Examination modules") +
        modulesHtml +
        "</div>" +
        '<div class="course-block">' +
        subHead("Literature") +
        litHtml +
        "</div>" +
        (details.fillNotes
          ? '<p class="muted course-fill-notes">' + D().escapeHtml(details.fillNotes) + "</p>"
          : "");
    }

    var sourceHtml = source
      ? '<div class="source-card"><p class="source-card__label">Primary source</p><p><strong>' +
        D().escapeHtml(source.sourceTitle) +
        "</strong></p><p class=\"muted\">" +
        D().escapeHtml(source.sourceReference) +
        " · Decision " +
        D().escapeHtml(source.sourceDate) +
        " · Verified " +
        D().escapeHtml(source.verifiedDate) +
        "</p></div>"
      : "<p>Official source metadata unavailable.</p>";

    var linksHtml =
      sectionHead("Links", "Official links and public profiles") +
      actionsHtml +
      subHead("Listed course contacts") +
      '<p class="callout callout--compact">Course contacts may change. Verify through the current official LTU course page.</p>' +
      contactsHtml +
      subHead("Source") +
      sourceHtml +
      '<div class="callout callout--warning"><p>This page paraphrases public LTU course information and does not reproduce restricted course materials. Official details should be verified through university sources.</p></div>';

    setHtml(
      host,
      '<div class="course-hub">' +
        '<nav aria-label="Breadcrumb"><ol class="breadcrumb">' +
        '<li><a href="../index.html">Home</a></li>' +
        '<li aria-current="page">' +
        D().escapeHtml(course.code) +
        "</li></ol></nav>" +
        '<header class="course-hero">' +
        '<p class="course-hero__eyebrow">Official course hub</p>' +
        '<p class="course-hero__code"><span class="course-code-chip">' +
        D().escapeHtml(course.code) +
        "</span></p>" +
        "<h1>" +
        D().escapeHtml(course.title) +
        "</h1>" +
        heroBadges +
        (course.summary
          ? '<p class="course-hero__lead">' + D().escapeHtml(course.summary) + "</p>"
          : "") +
        actionsHtml +
        "</header>" +
        zone("Official LTU information", "content-zone--official", officialFacts) +
        zone(
          "Official LTU information",
          "content-zone--official content-zone--syllabus",
          syllabusDetailsHtml
        ) +
        zone("Official LTU information", "content-zone--official content-zone--schedule", scheduleHtml) +
        zone("Official LTU information", "content-zone--official content-zone--links", linksHtml) +
        '<p class="course-updated"><em>Last updated: ' +
        D().escapeHtml(course.lastUpdated || "—") +
        "</em></p></div>"
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCourseHub();
  });
})();
