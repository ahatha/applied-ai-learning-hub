/**
 * Literature / book detail page.
 * URL: literature/<isbn-or-slug>.html
 * Data: assets/data/literature.json — fill template fields per book.
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  function qs(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function bookIdFromPath() {
    try {
      var parts = window.location.pathname.split("/").filter(Boolean);
      var file = parts[parts.length - 1] || "";
      var base = decodeURIComponent(file.replace(/\.html$/i, ""));
      if (!base || base.toLowerCase() === "book") return "";
      return base;
    } catch (e) {
      return "";
    }
  }

  function fromCourseCode() {
    try {
      var ref = document.referrer;
      if (!ref) return "";
      var u = new URL(ref);
      if (u.origin !== window.location.origin) return "";
      return u.searchParams.get("code") || "";
    } catch (e) {
      return "";
    }
  }

  function setHtml(el, html) {
    if (el) el.innerHTML = html;
  }

  function emptyNote(label) {
    return (
      '<p class="muted literature-empty">To fill: <strong>' +
      D().escapeHtml(label) +
      "</strong> — edit this book in <code>assets/data/literature.json</code>.</p>"
    );
  }

  function normalizeIsbnDigits(value) {
    return String(value || "").replace(/[^0-9Xx]/g, "");
  }

  function literatureCoverUrl(book) {
    if (!book) return "";
    if (book.coverUrl) return String(book.coverUrl).trim();
    var isbn = normalizeIsbnDigits(book.isbn || book.id || "");
    if (isbn.length === 10 || isbn.length === 13) {
      return "https://covers.openlibrary.org/b/isbn/" + encodeURIComponent(isbn) + "-L.jpg?default=false";
    }
    return "";
  }

  function coverHtml(book) {
    var cover = literatureCoverUrl(book);
    var esc = D().escapeHtml.bind(D());
    var img = cover
      ? '<img class="literature-book__cover" src="' +
        esc(cover) +
        '" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;var w=this.parentElement;this.remove();if(w)w.classList.add(\'is-fallback\');" />'
      : "";
    return (
      '<div class="literature-book__cover-wrap literature-hero__cover' +
      (cover ? "" : " is-fallback") +
      '">' +
      img +
      '<div class="literature-book__fallback" aria-hidden="true"><i class="fa-solid fa-book"></i></div>' +
      "</div>"
    );
  }

  function paragraphs(text) {
    if (!text || !String(text).trim()) return "";
    return String(text)
      .split(/\n\s*\n/)
      .map(function (p) {
        return "<p>" + D().escapeHtml(p.trim()) + "</p>";
      })
      .join("");
  }

  function bulletList(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return (
      '<ul class="detail-list syllabus-bullets">' +
      items
        .map(function (item) {
          return "<li>" + D().escapeHtml(item) + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function tocHtml(toc) {
    if (!Array.isArray(toc) || !toc.length) return "";
    return toc
      .map(function (section) {
        var heading = section.heading
          ? '<h4 class="book-toc__heading">' + D().escapeHtml(section.heading) + "</h4>"
          : "";
        var items = Array.isArray(section.items) ? section.items : [];
        return (
          '<div class="book-toc__section">' +
          heading +
          (items.length ? bulletList(items) : "") +
          "</div>"
        );
      })
      .join("");
  }

  function factRow(label, value) {
    if (value == null || value === "") return "";
    return (
      "<tr><th scope=\"row\">" +
      D().escapeHtml(label) +
      "</th><td>" +
      D().escapeHtml(String(value)) +
      "</td></tr>"
    );
  }

  function section(id, title, icon, bodyHtml) {
    if (!bodyHtml) return "";
    return (
      '<section class="book-section" id="' +
      D().escapeHtml(id) +
      '">' +
      '<header class="zone-header">' +
      '<h2 class="zone-header__title"><i class="' +
      (icon || "fa-solid fa-book") +
      '" aria-hidden="true"></i> ' +
      D().escapeHtml(title) +
      "</h2></header>" +
      '<div class="course-block">' +
      bodyHtml +
      "</div></section>"
    );
  }

  function hasItems(arr) {
    return Array.isArray(arr) && arr.length > 0;
  }

  async function main() {
    var host = document.getElementById("literature-book");
    if (!host || !D()) return;

    var pathId = bookIdFromPath();
    var queryId = qs("id");
    var catalog = await D().loadJson("data/literature.json");
    var aliases = (catalog && catalog.meta && catalog.meta.aliases) || {};

    if (!pathId && queryId) {
      window.location.replace((aliases[queryId] || queryId) + ".html");
      return;
    }

    var id = pathId;
    if (aliases[id] && aliases[id] !== id) {
      window.location.replace(aliases[id] + ".html");
      return;
    }

    var fromCourse = fromCourseCode();

    if (!id) {
      setHtml(
        host,
        '<div class="empty-state"><p>Open a book from a course literature table.</p>' +
          '<p><a href="../index.html">Back to programme explorer</a></p></div>'
      );
      return;
    }

    var book = catalog && catalog.books ? catalog.books[id] : null;
    if (!book) {
      setHtml(
        host,
        '<div class="empty-state"><p>No literature entry for <code>' +
          D().escapeHtml(id) +
          "</code>.</p>" +
          (fromCourse
            ? '<p><a href="../courses/course.html?code=' +
              encodeURIComponent(fromCourse) +
              '">Back to course</a></p>'
            : '<p><a href="../index.html">Back to programme explorer</a></p>') +
          "</div>"
      );
      return;
    }

    document.title = (book.title || id) + " | Literature | Applied AI Programme Hub";

    var backHref = fromCourse
      ? "../courses/course.html?code=" + encodeURIComponent(fromCourse)
      : "../index.html";
    var backLabel = fromCourse ? "Back to " + fromCourse : "Back to programme explorer";

    var authors = book.authorDisplay
      ? book.authorDisplay
      : hasItems(book.authors)
        ? book.authors.join(", ")
        : "";

    var identityRows =
      factRow("Authors", authors) +
      factRow("Publisher", book.publisher) +
      factRow("Year", book.year) +
      factRow("Edition", book.edition) +
      factRow("ISBN-13", book.isbn) +
      factRow("ISBN-10", book.isbn10) +
      factRow("Language", book.language) +
      factRow("Pages", book.pages) +
      factRow("Format", book.format) +
      factRow("ID", book.id || id);

    var identityTable = identityRows
      ? '<table class="course-facts-table book-identity-table"><tbody>' +
        identityRows +
        "</tbody></table>"
      : emptyNote("identity metadata");

    var links = Array.isArray(book.links) ? book.links.slice() : [];
    if (book.url && !links.some(function (l) { return l.url === book.url; })) {
      links.unshift({ label: "Publisher / source", url: book.url, kind: "publisher" });
    }

    var linksHtml = hasItems(links)
      ? '<ul class="book-link-list">' +
        links
          .map(function (link) {
            return (
              "<li>" +
              (link.kind
                ? '<span class="badge badge--literature">' + D().escapeHtml(link.kind) + "</span> "
                : "") +
              '<a href="' +
              D().escapeHtml(link.url) +
              '" rel="noopener noreferrer" target="_blank">' +
              D().escapeHtml(link.label || link.url) +
              "</a></li>"
            );
          })
          .join("") +
        "</ul>"
      : "";

    var editionsHtml = hasItems(book.editions)
      ? '<table class="exam-modules-table literature-table"><thead><tr>' +
        "<th>Edition</th><th>Year</th><th>ISBN</th><th>Notes</th></tr></thead><tbody>" +
        book.editions
          .map(function (ed) {
            return (
              "<tr><td>" +
              D().escapeHtml(ed.label || "—") +
              "</td><td>" +
              D().escapeHtml(ed.year != null ? String(ed.year) : "—") +
              "</td><td>" +
              D().escapeHtml(ed.isbn || "—") +
              "</td><td>" +
              D().escapeHtml(ed.notes || "—") +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table>"
      : "";

    var usedHtml = hasItems(book.usedIn)
      ? '<ul class="detail-list syllabus-bullets">' +
        book.usedIn
          .map(function (use) {
            return (
              "<li><a href=\"../courses/course.html?code=" +
              encodeURIComponent(use.courseCode || "") +
              '">' +
              D().escapeHtml(use.courseCode || "") +
              "</a> — " +
              D().escapeHtml(use.courseTitle || "") +
              (use.category
                ? ' <span class="muted">(' + D().escapeHtml(use.category) + ")</span>"
                : "") +
              "</li>"
            );
          })
          .join("") +
        "</ul>"
      : "";

    var sourcesHtml = hasItems(book.sources)
      ? '<ul class="book-link-list">' +
        book.sources
          .map(function (src) {
            return (
              "<li><a href=\"" +
              D().escapeHtml(src.url) +
              '" rel="noopener noreferrer" target="_blank">' +
              D().escapeHtml(src.label || src.url) +
              "</a></li>"
            );
          })
          .join("") +
        "</ul>"
      : "";

    var summaryHtml = paragraphs(book.summary) || "";
    var whyHtml = hasItems(book.whyRead) ? bulletList(book.whyRead) : "";
    var audienceHtml = hasItems(book.audience) ? bulletList(book.audience) : "";
    var prereqHtml = hasItems(book.prerequisites) ? bulletList(book.prerequisites) : "";
    var agendaHtml = hasItems(book.agenda) ? bulletList(book.agenda) : "";
    var topicsHtml = hasItems(book.topics) ? bulletList(book.topics) : "";
    var tocBody = tocHtml(book.tableOfContents);
    var howHtml = hasItems(book.howToUse) ? bulletList(book.howToUse) : "";
    var notesBody =
      (book.notes ? paragraphs(book.notes) : "") +
      (sourcesHtml
        ? '<h4 class="book-toc__heading">Sources used while filling</h4>' + sourcesHtml
        : "");

    var sections = [
      ["summary", "Summary", "fa-solid fa-align-left", summaryHtml],
      ["why-read", "Why read this book", "fa-solid fa-lightbulb", whyHtml],
      ["audience", "Audience", "fa-solid fa-user-graduate", audienceHtml],
      ["prerequisites", "Prerequisites", "fa-solid fa-clipboard-list", prereqHtml],
      ["agenda", "Learning agenda", "fa-solid fa-list-check", agendaHtml],
      ["topics", "Key topics", "fa-solid fa-tags", topicsHtml],
      ["toc", "Table of contents", "fa-solid fa-list-ol", tocBody],
      ["how-to-use", "How to use it", "fa-solid fa-route", howHtml],
      ["editions", "Editions", "fa-solid fa-layer-group", editionsHtml],
      ["links", "Links & resources", "fa-solid fa-link", linksHtml],
      ["courses", "Used in courses", "fa-solid fa-graduation-cap", usedHtml],
      ["notes", "Notes", "fa-solid fa-sticky-note", notesBody]
    ];

    var jumpLabels = {
      summary: "Summary",
      "why-read": "Why read",
      audience: "Audience",
      prerequisites: "Prerequisites",
      agenda: "Agenda",
      topics: "Topics",
      toc: "Contents",
      "how-to-use": "How to use",
      editions: "Editions",
      links: "Links",
      courses: "Courses",
      notes: "Notes"
    };

    var jump = sections
      .filter(function (item) {
        return !!item[3];
      })
      .map(function (item) {
        return (
          '<a class="book-jump__link" href="#' +
          item[0] +
          '">' +
          D().escapeHtml(jumpLabels[item[0]] || item[1]) +
          "</a>"
        );
      })
      .join("");

    var bodyHtml = sections
      .map(function (item) {
        return section(item[0], item[1], item[2], item[3]);
      })
      .join("");

    setHtml(
      host,
      '<div class="course-hub literature-hub">' +
        '<nav aria-label="Breadcrumb"><ol class="breadcrumb">' +
        '<li><a href="../index.html">Home</a></li>' +
        '<li><a href="' +
        backHref +
        '">' +
        D().escapeHtml(fromCourse || "Courses") +
        "</a></li>" +
        '<li aria-current="page">Literature</li>' +
        "</ol></nav>" +
        '<p class="literature-back"><a class="action-chip action-chip--ghost" href="' +
        backHref +
        '"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> ' +
        D().escapeHtml(backLabel) +
        "</a></p>" +
        '<header class="course-hero literature-hero">' +
        '<div class="literature-hero__layout">' +
        coverHtml(Object.assign({ id: id }, book)) +
        '<div class="literature-hero__text">' +
        '<p class="literature-hero__eyebrow"><i class="fa-solid fa-book-open" aria-hidden="true"></i> Literature</p>' +
        "<h1>" +
        D().escapeHtml(book.title || "Untitled") +
        "</h1>" +
        (book.subtitle
          ? '<p class="literature-hero__subtitle">' + D().escapeHtml(book.subtitle) + "</p>"
          : "") +
        (authors ? '<p class="literature-hero__authors">' + D().escapeHtml(authors) + "</p>" : "") +
        identityTable +
        "</div></div>" +
        "</header>" +
        (jump ? '<nav class="book-jump" aria-label="On this page">' + jump + "</nav>" : "") +
        '<div class="content-zone content-zone--official literature-body">' +
        bodyHtml +
        "</div></div>"
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
