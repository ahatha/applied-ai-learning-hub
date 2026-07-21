/**
 * Shared course hub renderer: courses/course.html?code=D0036E
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  function normalizeIsbnDigits(value) {
    return String(value || "").replace(/[^0-9Xx]/g, "");
  }

  /** Cover from explicit URL, else Open Library ISBN cover (internet). */
  function literatureCoverUrl(book) {
    if (!book) return "";
    if (book.coverUrl) return String(book.coverUrl).trim();
    var isbn = normalizeIsbnDigits(book.isbn || book.literatureId || "");
    if (isbn.length === 10 || isbn.length === 13) {
      return "https://covers.openlibrary.org/b/isbn/" + encodeURIComponent(isbn) + "-L.jpg?default=false";
    }
    return "";
  }

  function literatureBookCardHtml(book, options) {
    options = options || {};
    var esc = D().escapeHtml.bind(D());
    var detailHref = book.literatureId
      ? D().resolvePageLink("literature/" + encodeURIComponent(book.literatureId) + ".html")
      : "";
    var href = detailHref || book.url || "";
    var cover = literatureCoverUrl(book);
    var title = book.title || "Untitled";
    var tag = href ? "a" : "article";
    var linkAttrs = href
      ? ' href="' +
        esc(href) +
        '"' +
        (detailHref
          ? ""
          : ' rel="noopener noreferrer" target="_blank"') +
        ' class="literature-book literature-book--link"'
      : ' class="literature-book"';
    var coverInner = cover
      ? '<img class="literature-book__cover" src="' +
        esc(cover) +
        '" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;var w=this.parentElement;this.remove();if(w)w.classList.add(\'is-fallback\');" />'
      : "";
    var categoryCaption =
      options.showCategory && book.category
        ? '<p class="literature-book__caption">' + esc(book.category) + "</p>"
        : "";
    return (
      "<" +
      tag +
      linkAttrs +
      ">" +
      categoryCaption +
      '<div class="literature-book__cover-wrap' +
      (cover ? "" : " is-fallback") +
      '">' +
      coverInner +
      '<div class="literature-book__fallback" aria-hidden="true"><i class="fa-solid fa-book"></i></div>' +
      "</div>" +
      '<div class="literature-book__meta">' +
      "<h4>" +
      esc(title) +
      "</h4>" +
      (book.author
        ? '<p class="literature-book__byline">' + esc(book.author) + "</p>"
        : "") +
      (book.isbn
        ? '<p class="literature-book__isbn">' + esc(book.isbn) + "</p>"
        : "") +
      "</div>" +
      "</" +
      tag +
      ">"
    );
  }

  /** Keep syllabus order; merge consecutive books that share a category. */
  function groupLiteratureByCategory(lit) {
    var groups = [];
    (lit || []).forEach(function (book) {
      var category = String(book.category || "").trim();
      var last = groups[groups.length - 1];
      if (last && last.category === category) {
        last.books.push(book);
      } else {
        groups.push({ category: category, books: [book] });
      }
    });
    return groups;
  }

  function literatureGridItemsHtml(books, showCategory) {
    return books
      .map(function (book) {
        return (
          '<div class="literature-book-grid__item" role="listitem">' +
          literatureBookCardHtml(book, { showCategory: !!showCategory }) +
          "</div>"
        );
      })
      .join("");
  }

  function literatureGroupsHtml(lit) {
    var esc = D().escapeHtml.bind(D());
    var parts = [];
    var pendingSingles = [];

    function flushSingles() {
      if (!pendingSingles.length) return;
      parts.push(
        '<div class="literature-book-group literature-book-group--flow">' +
          '<div class="literature-book-grid" role="list">' +
          literatureGridItemsHtml(pendingSingles, true) +
          "</div></div>"
      );
      pendingSingles = [];
    }

    groupLiteratureByCategory(lit).forEach(function (group) {
      var isSharedChoice = group.books.length > 1 && group.category;
      if (isSharedChoice) {
        flushSingles();
        parts.push(
          '<div class="literature-book-group literature-book-group--multi">' +
            '<p class="literature-book-group__label">' +
            esc(group.category) +
            "</p>" +
            '<div class="literature-book-grid" role="list">' +
            literatureGridItemsHtml(group.books, false) +
            "</div></div>"
        );
      } else {
        group.books.forEach(function (book) {
          pendingSingles.push(book);
        });
      }
    });
    flushSingles();

    return '<div class="literature-book-groups">' + parts.join("") + "</div>";
  }

  /** Vertical literature cards for the course-hub right rail. */
  function literatureRailHtml(lit) {
    var esc = D().escapeHtml.bind(D());
    var body;
    if (!lit || !lit.length) {
      body =
        '<div class="empty-state"><p>No literature listed for this course yet.</p></div>';
    } else {
      var parts = [];
      groupLiteratureByCategory(lit).forEach(function (group) {
        var isSharedChoice = group.books.length > 1 && group.category;
        if (isSharedChoice) {
          parts.push(
            '<div class="course-lit-rail__group">' +
              '<p class="course-lit-rail__group-label">' +
              esc(group.category) +
              "</p>" +
              group.books
                .map(function (book) {
                  return (
                    '<div class="course-lit-rail__item" role="listitem">' +
                    literatureBookCardHtml(book, { showCategory: false }) +
                    "</div>"
                  );
                })
                .join("") +
              "</div>"
          );
        } else {
          group.books.forEach(function (book) {
            parts.push(
              '<div class="course-lit-rail__item" role="listitem">' +
                literatureBookCardHtml(book, { showCategory: true }) +
                "</div>"
            );
          });
        }
      });
      body =
        '<div class="course-lit-rail__list" role="list">' + parts.join("") + "</div>";
    }

    return (
      '<aside id="literature" class="course-lit-rail" aria-label="Course literature">' +
      '<div class="course-lit-rail__head">' +
      '<p class="course-lit-rail__eyebrow"><i class="fa-solid fa-book" aria-hidden="true"></i> Literature</p>' +
      "<h2>Course books</h2>" +
      "</div>" +
      body +
      "</aside>"
    );
  }

  /** Compact LTU person card (local copy so course hub works even if data-loader cache is stale). */
  function contactInitials(name) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function contactCardHtml(person, options) {
    if (D() && typeof D().contactCardHtml === "function") {
      return D().contactCardHtml(person, options);
    }
    options = options || {};
    if (!person || !person.name) return "";
    var esc = D()
      ? D().escapeHtml.bind(D())
      : function (v) {
          return String(v == null ? "" : v)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        };
    var name = String(person.name || "").trim();
    var role = String(person.role || "").trim();
    role = role
      .replace(/\s*[\/|]\s*Examiner\b/gi, "")
      .replace(/,\s*Examiner\b/gi, "")
      .replace(/\bExaminer\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s,\/|-]+|[\s,\/|-]+$/g, "")
      .trim();
    var email = String(person.email || "").trim();
    var phone = String(person.phone || "").trim();
    var profileUrl = String(person.profileUrl || "").trim();
    var photoUrl = String(person.photoUrl || person.imageUrl || "").trim();
    if (/dummy\.svg|bakgrundsbild/i.test(photoUrl)) photoUrl = "";
    var date = String(person.date || "").trim();
    var label = String(options.label || "").trim();
    var extraClass = options.className ? " " + options.className : "";
    var initials = contactInitials(name);
    var nameInner = esc(name);
    if (profileUrl) {
      nameInner =
        '<a class="contact-card__name-link" href="' +
        esc(profileUrl) +
        '" rel="noopener noreferrer" target="_blank">' +
        nameInner +
        "</a>";
    }
    var metaParts = [];
    if (email) {
      metaParts.push(
        '<a class="contact-card__meta-item" href="mailto:' +
          esc(email) +
          '"><i class="fa-solid fa-envelope" aria-hidden="true"></i><span>' +
          esc(email) +
          "</span></a>"
      );
    }
    if (phone) {
      metaParts.push(
        '<a class="contact-card__meta-item" href="tel:' +
          esc(phone.replace(/\s+/g, "")) +
          '"><i class="fa-solid fa-phone" aria-hidden="true"></i><span>' +
          esc(phone) +
          "</span></a>"
      );
    }
    if (profileUrl) {
      metaParts.push(
        '<a class="contact-card__meta-item" href="' +
          esc(profileUrl) +
          '" rel="noopener noreferrer" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>LTU profile</span></a>'
      );
    }
    if (date) {
      metaParts.push(
        '<span class="contact-card__meta-item contact-card__meta-item--muted"><i class="fa-solid fa-calendar-day" aria-hidden="true"></i><time datetime="' +
          esc(date) +
          '">' +
          esc(date) +
          "</time></span>"
      );
    }
    var photoHtml =
      '<div class="contact-card__photo' +
      (photoUrl ? "" : " is-fallback") +
      '" aria-hidden="true">' +
      (photoUrl
        ? '<img class="contact-card__photo-img" src="' +
          esc(photoUrl) +
          '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;var p=this.parentElement;this.remove();if(p)p.classList.add(\'is-fallback\');" />'
        : "") +
      '<span class="contact-card__initials">' +
      esc(initials) +
      "</span></div>";
    return (
      '<article class="contact-card contact-card--id' +
      extraClass +
      '">' +
      '<header class="contact-card__band">' +
      '<span class="contact-card__org">LTU</span>' +
      (label
        ? '<span class="contact-card__label">' + esc(label) + "</span>"
        : '<span class="contact-card__label">Examiner</span>') +
      "</header>" +
      '<div class="contact-card__body">' +
      photoHtml +
      '<div class="contact-card__identity">' +
      '<p class="contact-card__name">' +
      nameInner +
      "</p>" +
      (role ? '<p class="contact-card__role">' + esc(role) + "</p>" : "") +
      "</div>" +
      "</div>" +
      (metaParts.length ? '<div class="contact-card__meta">' + metaParts.join("") + "</div>" : "") +
      '<footer class="contact-card__strip" aria-hidden="true"></footer>' +
      "</article>"
    );
  }

  function contactCardGridHtml(people, options) {
    if (D() && typeof D().contactCardGridHtml === "function") {
      return D().contactCardGridHtml(people, options);
    }
    var list = (people || []).filter(function (p) {
      return p && p.name;
    });
    if (!list.length) return "";
    return (
      '<div class="contact-card-grid">' +
      list
        .map(function (person) {
          return contactCardHtml(person, options);
        })
        .join("") +
      "</div>"
    );
  }

  function parsePersonByline(by) {
    if (D() && typeof D().parsePersonByline === "function") {
      return D().parsePersonByline(by);
    }
    by = String(by || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!by) return { name: "", role: "" };
    var titled = by.match(
      /^(Director of Undergraduate Studies|Head of|Dean of|Professor)\s+(.+)$/i
    );
    if (titled) {
      var rest = titled[2];
      var comma = rest.indexOf(",");
      if (comma > 0) {
        return {
          name: rest.slice(0, comma).trim(),
          role: (titled[1] + ", " + rest.slice(comma + 1).trim()).replace(/^,\s*/, "")
        };
      }
      return { name: rest.trim(), role: titled[1] };
    }
    var idx = by.indexOf(",");
    if (idx > 0) {
      var left = by.slice(0, idx).trim();
      var right = by.slice(idx + 1).trim();
      if (left.split(/\s+/).length >= 2 && left.split(/\s+/).length <= 5) {
        return { name: left, role: right };
      }
    }
    return { name: by, role: "" };
  }

  function setHtml(el, html) {
    if (el) {
      el.innerHTML = html;
    }
  }

  function zone(id, label, className, body) {
    return (
      '<section id="' +
      D().escapeHtml(id) +
      '" class="content-zone content-zone--course ' +
      className +
      '" aria-label="' +
      D().escapeHtml(label) +
      '">' +
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
    var icons = {
      primary: "fa-solid fa-arrow-up-right-from-square",
      secondary: "fa-solid fa-book-open",
      pdf: "fa-solid fa-file-pdf",
      ghost: "fa-solid fa-link"
    };
    var icon = icons[kind] || icons.ghost;
    return (
      '<a class="action-chip action-chip--' +
      D().escapeHtml(kind || "ghost") +
      '" href="' +
      D().escapeHtml(href) +
      '" rel="noopener noreferrer" target="_blank">' +
      '<i class="' +
      icon +
      '" aria-hidden="true"></i>' +
      D().escapeHtml(label) +
      "</a>"
    );
  }

  function sectionHead(kicker, title, iconClass) {
    var icon = iconClass
      ? '<span class="course-section-head__icon" aria-hidden="true"><i class="' +
        D().escapeHtml(iconClass) +
        '"></i></span>'
      : "";
    return (
      '<header class="course-section-head">' +
      icon +
      '<div><p class="course-section-head__kicker">' +
      D().escapeHtml(kicker) +
      "</p><h2>" +
      D().escapeHtml(title) +
      "</h2></div></header>"
    );
  }

  function quickNavHtml() {
    var items = [
      ["syllabus", "fa-solid fa-book-open-reader", "Syllabus"],
      ["examination", "fa-solid fa-clipboard-check", "Examination"],
      ["literature", "fa-solid fa-book", "Literature"],
      ["links", "fa-solid fa-address-card", "Contacts"]
    ];
    /* Literature targets the right rail (#literature), not a middle section. */
    return (
      '<nav class="course-quick-nav" aria-label="Course hub sections">' +
      items
        .map(function (item) {
          return (
            '<a href="#' +
            item[0] +
            '"><i class="' +
            item[1] +
            '" aria-hidden="true"></i> ' +
            item[2] +
            "</a>"
          );
        })
        .join("") +
      "</nav>"
    );
  }

  function subHead(title) {
    return '<h3 class="course-subhead">' + D().escapeHtml(title) + "</h3>";
  }

  function syllabusAttributionHtml(meta, knownContacts) {
    var lastRevised = meta && meta.lastRevised ? meta.lastRevised : null;
    var established = meta && meta.syllabusEstablished ? meta.syllabusEstablished : null;
    if (!lastRevised && !established) {
      return "";
    }

    function cardFromEntry(entry, label) {
      if (!entry) return "";
      var by = typeof entry === "string" ? entry : entry.by || "";
      var date = typeof entry === "string" ? "" : entry.date || "";
      var parsed = parsePersonByline(by);
      if (!parsed.name) return "";
      var person = {
        name: parsed.name,
        role: (typeof entry === "object" && entry.role) || "",
        date: date,
        email: typeof entry === "object" ? entry.email || "" : "",
        phone: typeof entry === "object" ? entry.phone || "" : "",
        profileUrl: typeof entry === "object" ? entry.profileUrl || "" : "",
        photoUrl: typeof entry === "object" ? entry.photoUrl || "" : ""
      };
      var needle = parsed.name.toLowerCase();
      (knownContacts || []).some(function (c) {
        if (!c || !c.name) return false;
        if (String(c.name).toLowerCase() !== needle) return false;
        if (!person.email && c.email) person.email = c.email;
        if (!person.phone && c.phone) person.phone = c.phone;
        if (!person.profileUrl && c.profileUrl) person.profileUrl = c.profileUrl;
        if (!person.photoUrl && c.photoUrl) person.photoUrl = c.photoUrl;
        if (!person.role && c.role) person.role = c.role;
        return true;
      });
      if (!person.role && parsed.role) person.role = parsed.role;
      return contactCardHtml(person, {
        label: label,
        className: "contact-card--attribution"
      });
    }

    var cards =
      cardFromEntry(lastRevised, "Last revised") +
      cardFromEntry(established, "Syllabus established");

    if (!cards) {
      return "";
    }

    return (
      '<div class="contact-card-grid contact-card-grid--attribution" aria-label="Syllabus revision">' +
      cards +
      "</div>"
    );
  }

  function periodSortKey(period) {
    var match = String(period == null ? "" : period).match(/^(\d+)/);
    return match ? Number(match[1]) : 99;
  }

  function periodNavLabel(period) {
    var value = String(period == null ? "" : period).trim();
    if (!value || value === "?") return "Unscheduled";
    if (value === "3-4") return "Study periods 3–4";
    if (/^\d+$/.test(value)) return "Study period " + value;
    return "Study periods " + value.replace(/-/g, "–");
  }

  function roleNavClass(role) {
    var map = {
      compulsory: "is-compulsory",
      "elective-option": "is-elective",
      "optional-non-degree": "is-optional",
      thesis: "is-thesis"
    };
    return map[role] || "is-other";
  }

  /**
   * Left programme menu: Year → Study period → courses.
   * @param {object[]} courses
   * @param {string} activeCode
   * @returns {string}
   */
  function courseSideNavHtml(courses, activeCode) {
    activeCode = String(activeCode || "").toUpperCase();
    var grouped = {};
    (courses || [])
      .slice()
      .sort(function (a, b) {
        return (Number(a.order) || 0) - (Number(b.order) || 0);
      })
      .forEach(function (course) {
        var year = String(course.yearOfStudy != null ? course.yearOfStudy : "?");
        var period = String(course.studyPeriod != null ? course.studyPeriod : "?");
        if (!grouped[year]) grouped[year] = {};
        if (!grouped[year][period]) grouped[year][period] = [];
        grouped[year][period].push(course);
      });

    var yearKeys = Object.keys(grouped).sort(function (a, b) {
      return periodSortKey(a) - periodSortKey(b);
    });

    if (!yearKeys.length) {
      return "";
    }

    var yearsHtml = yearKeys
      .map(function (year) {
        var periods = grouped[year];
        var periodKeys = Object.keys(periods).sort(function (a, b) {
          return periodSortKey(a) - periodSortKey(b);
        });
        var yearHasActive = periodKeys.some(function (period) {
          return periods[period].some(function (course) {
            return String(course.code || "").toUpperCase() === activeCode;
          });
        });
        var yearOpen = yearHasActive || (!activeCode && year === yearKeys[0]);

        var periodsHtml = periodKeys
          .map(function (period) {
            var list = periods[period];
            var periodHasActive = list.some(function (course) {
              return String(course.code || "").toUpperCase() === activeCode;
            });
            var periodOpen =
              periodHasActive || (!activeCode && yearOpen && period === periodKeys[0]);
            var items = list
              .map(function (course) {
                var code = String(course.code || "").toUpperCase();
                var isActive = !!activeCode && code === activeCode;
                var href = D().courseHubUrl(course.code || course.id);
                return (
                  '<li><a class="course-side-nav__link ' +
                  roleNavClass(course.role) +
                  (isActive ? " is-active" : "") +
                  '" href="' +
                  D().escapeHtml(href) +
                  '"' +
                  (isActive ? ' aria-current="page"' : "") +
                  ">" +
                  '<span class="course-side-nav__code">' +
                  D().escapeHtml(code) +
                  "</span>" +
                  '<span class="course-side-nav__title">' +
                  D().escapeHtml(course.title || "Untitled") +
                  "</span>" +
                  '<span class="course-side-nav__meta">' +
                  D().escapeHtml(String(course.ects != null ? course.ects : "—")) +
                  " ECTS</span>" +
                  "</a></li>"
                );
              })
              .join("");

            return (
              '<details class="course-side-nav__period"' +
              (periodOpen ? " open" : "") +
              ">" +
              "<summary>" +
              D().escapeHtml(periodNavLabel(period)) +
              ' <span class="course-side-nav__count">' +
              list.length +
              "</span></summary>" +
              '<ul class="course-side-nav__list">' +
              items +
              "</ul></details>"
            );
          })
          .join("");

        return (
          '<details class="course-side-nav__year"' +
          (yearOpen ? " open" : "") +
          ">" +
          "<summary>Year " +
          D().escapeHtml(year) +
          "</summary>" +
          periodsHtml +
          "</details>"
        );
      })
      .join("");

    return (
      '<aside id="course-side-nav" class="course-side-nav" aria-label="Programme courses">' +
      '<div class="course-side-nav__head">' +
      '<button type="button" class="course-side-nav__close" data-course-nav-close aria-label="Close course menu">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
      "</button>" +
      '<p class="course-side-nav__eyebrow">Programme</p>' +
      "<h2>Courses</h2>" +
      '<p class="course-side-nav__hint">Browse by year and study period</p>' +
      '<a class="course-side-nav__home" href="../index.html"><i class="fa-solid fa-sitemap" aria-hidden="true"></i> Programme explorer</a>' +
      "</div>" +
      '<nav class="course-side-nav__tree" aria-label="Course list">' +
      yearsHtml +
      "</nav>" +
      "</aside>"
    );
  }

  function bindCourseSideNav(root) {
    if (!root) return;
    var layout = root.querySelector(".course-hub-layout");
    var openBtn = root.querySelector("[data-course-nav-open]");
    var closeBtn = root.querySelector("[data-course-nav-close]");
    var backdrop = root.querySelector("[data-course-nav-backdrop]");
    if (!layout) return;

    function setOpen(open) {
      layout.classList.toggle("is-nav-open", open);
      if (openBtn) openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    if (openBtn) {
      openBtn.addEventListener("click", function () {
        setOpen(true);
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setOpen(false);
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setOpen(false);
      });
    }
    document.addEventListener("keydown", function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    });
  }

  function courseHubLayoutHtml(courses, activeCode, mainHtml, litRailHtml) {
    var nav = courseSideNavHtml(courses, activeCode);
    var rail = litRailHtml || "";
    if (!nav && !rail) {
      return mainHtml;
    }
    var layoutClass =
      "course-hub-layout" + (rail ? " course-hub-layout--with-lit" : "");
    return (
      '<div class="' +
      layoutClass +
      '">' +
      '<div class="course-side-nav__toolbar">' +
      '<button type="button" class="course-side-nav__open" data-course-nav-open aria-controls="course-side-nav" aria-expanded="false">' +
      '<i class="fa-solid fa-bars" aria-hidden="true"></i> Courses' +
      "</button>" +
      "</div>" +
      '<button type="button" class="course-side-nav__backdrop" data-course-nav-backdrop aria-label="Close course menu"></button>' +
      (nav || "") +
      '<div class="course-hub-layout__main">' +
      mainHtml +
      "</div>" +
      rail +
      "</div>"
    );
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
    var coursesData = await D().loadJson("data/courses.json");
    var courses = coursesData && coursesData.courses ? coursesData.courses : [];

    function paint(mainHtml, activeCode, litRailHtml) {
      host.classList.add("container--course-hub");
      setHtml(
        host,
        courseHubLayoutHtml(courses, activeCode || "", mainHtml, litRailHtml || "")
      );
      bindCourseSideNav(host);
    }

    if (!code) {
      paint(
        '<div class="course-hub"><div class="empty-state"><p>Select a course from the left menu. Example: <code>course.html?code=D0036E</code>.</p></div></div>',
        ""
      );
      return;
    }

    var course = courses.find(function (item) {
      return String(item.code).toUpperCase() === code || String(item.id).toUpperCase() === code;
    });

    if (!course) {
      paint(
        '<div class="course-hub"><div class="empty-state"><p>Course “' +
          D().escapeHtml(code) +
          '” was not found. Choose another course from the left menu or return to the <a href="../index.html">programme explorer</a>.</p></div></div>',
        ""
      );
      return;
    }

    document.title = course.code + " · " + course.title + " | Applied AI Learning Hub";

    var detailsData = await D().loadJson("data/course-details.json");
    var details =
      detailsData && detailsData.courses ? detailsData.courses[course.code] || null : null;

    var periodBadgeHtml =
      course.studyPeriod == null
        ? "—"
        : D().metaBadge("studyPeriod", course.studyPeriod);

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
        if (!existing.photoUrl && detailContact.photoUrl) {
          existing.photoUrl = detailContact.photoUrl;
        }
      } else {
        contacts.push({
          name: detailContact.name,
          role: detailContact.role || "Listed course contact",
          profileUrl: detailContact.profileUrl || "",
          phone: detailContact.phone || "",
          email: detailContact.email || "",
          photoUrl: detailContact.photoUrl || ""
        });
      }
    }

    var examinersHtml = contacts.length ? contactCardGridHtml(contacts) : "";
    var attributionHtml = syllabusAttributionHtml(meta, contacts);
    var contactsHtml =
      examinersHtml || attributionHtml
        ? '<div class="contact-section-stacks">' +
          examinersHtml +
          attributionHtml +
          "</div>"
        : "<p>No course contacts listed for this course yet.</p>";

    var actionsHtml =
      '<div class="action-chip-row">' +
      actionLink(courseUrl, "LTU course page", "primary") +
      actionLink(syllabusPageUrl, "Official syllabus", "secondary") +
      actionLink(pdfSyllabusUrl, "Syllabus PDF", "pdf") +
      actionLink(pdfLiteratureUrl, "Literature PDF", "pdf") +
      "</div>";

    var levelBadge = D().metaBadge("level", course.level || "Level");
    if (/bachelor/i.test(String(course.level || ""))) {
      levelBadge = levelBadge.replace('badge--level"', 'badge--level badge--level-bachelors"');
    } else if (/master/i.test(String(course.level || ""))) {
      levelBadge = levelBadge.replace('badge--level"', 'badge--level badge--level-masters"');
    }

    var heroBadges =
      '<div class="course-hero__badges">' +
      levelBadge +
      '<span class="badge badge--' +
      D().escapeHtml(String(course.role || "role").toLowerCase().replace(/\s+/g, "-")) +
      '">' +
      D().escapeHtml(D().formatStatus(course.role)) +
      "</span>" +
      (course.role === "optional-non-degree"
        ? '<span class="badge badge--warning">Outside 120 ECTS</span>'
        : "") +
      "</div>";

    function factRow(label, value) {
      return (
        "<tr><th scope=\"row\">" +
        D().escapeHtml(label) +
        "</th><td>" +
        D().escapeHtml(value) +
        "</td></tr>"
      );
    }

    function factRowHtml(label, html) {
      return (
        "<tr><th scope=\"row\">" +
        D().escapeHtml(label) +
        "</th><td>" +
        html +
        "</td></tr>"
      );
    }

    var heroFactsHtml =
      '<div class="course-hero__facts" aria-label="Course facts">' +
      '<table class="course-facts-table">' +
      "<tbody>" +
      factRow("Academic year", course.academicYear || "—") +
      factRowHtml("Period", periodBadgeHtml) +
      factRowHtml(
        "Programme segment",
        course.subjectSegment
          ? D().metaBadge("segment", course.subjectSegment)
          : "—"
      ) +
      factRow("Subject", subject || "—") +
      factRow("Subject group (SCB)", subjectGroup || "—") +
      factRow("Main field of study", mainFieldOfStudy || "—") +
      factRow("Grade scale", gradeScale || "—") +
      factRow("Selection", selection || "—") +
      factRow("Course offered by", offeredBy || "—") +
      "</tbody></table>" +
      offeringHtml +
      "</div>";

    function emptyTag(label) {
      return (
        '<div class="empty-tag"><span class="badge badge--empty">Empty</span><p>' +
        D().escapeHtml(label) +
        " — fill from syllabus/literature PDF</p></div>"
      );
    }

    function bulletListHtml(items) {
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

    function structuredBlockHtml(block, emptyLabel) {
      if (!block) return emptyTag(emptyLabel);
      if (typeof block === "string") {
        return block.trim()
          ? "<p>" + D().escapeHtml(block.trim()) + "</p>"
          : emptyTag(emptyLabel);
      }
      if (Array.isArray(block)) {
        return block.length ? bulletListHtml(block) : emptyTag(emptyLabel);
      }

      var html = "";
      if (block.intro) {
        html += '<p class="syllabus-block__intro">' + D().escapeHtml(block.intro) + "</p>";
      }
      if (Array.isArray(block.sections) && block.sections.length) {
        html += block.sections
          .map(function (section) {
            var part = '<div class="syllabus-block__section">';
            if (section.heading) {
              part +=
                '<h4 class="syllabus-block__heading">' +
                D().escapeHtml(section.heading) +
                "</h4>";
            }
            if (section.intro) {
              part +=
                '<p class="syllabus-block__intro">' +
                D().escapeHtml(section.intro) +
                "</p>";
            }
            part += bulletListHtml(section.items || []);
            part += "</div>";
            return part;
          })
          .join("");
      } else {
        html += bulletListHtml(block.items || []);
      }

      return html || emptyTag(emptyLabel);
    }

    var syllabusDetailsHtml;
    var examinationBodyHtml;
    if (!details) {
      syllabusDetailsHtml =
        sectionHead("Syllabus", "Syllabus details", "fa-solid fa-book-open-reader") +
        emptyPersonal("No enriched course-details entry yet for this course.");
      examinationBodyHtml = emptyTag("Examination modules");
    } else {
      var modulesHtml;
      if (Array.isArray(exam.modules) && exam.modules.length) {
        var creditTotal = exam.modules.reduce(function (sum, mod) {
          var n = Number(mod.credits);
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0);
        var creditTotalLabel = Number.isInteger(creditTotal)
          ? String(creditTotal)
          : String(Math.round(creditTotal * 10) / 10);

        modulesHtml =
          '<div class="exam-table-wrap">' +
          '<table class="exam-modules-table">' +
          "<thead><tr>" +
          "<th scope=\"col\">Code</th>" +
          "<th scope=\"col\">Module</th>" +
          "<th scope=\"col\">Credits</th>" +
          "<th scope=\"col\">Grade scale</th>" +
          "<th scope=\"col\">Type</th>" +
          "<th scope=\"col\">From</th>" +
          "</tr></thead><tbody>" +
          exam.modules
            .map(function (mod) {
              return (
                "<tr>" +
                "<td>" +
                D().escapeHtml(mod.code || "—") +
                "</td>" +
                "<td>" +
                D().escapeHtml(mod.name || "Module") +
                "</td>" +
                "<td>" +
                D().escapeHtml(String(mod.credits != null ? mod.credits : "—")) +
                "</td>" +
                "<td>" +
                D().escapeHtml(mod.gradeScale || "—") +
                "</td>" +
                "<td>" +
                D().escapeHtml(mod.type || "—") +
                "</td>" +
                "<td>" +
                D().escapeHtml(mod.fromPeriod || "—") +
                "</td>" +
                "</tr>"
              );
            })
            .join("") +
          "</tbody>" +
          "<tfoot><tr>" +
          '<th scope="row" colspan="2">Total credits</th>' +
          "<td>" +
          D().escapeHtml(creditTotalLabel) +
          "</td>" +
          '<td colspan="3"></td>' +
          "</tr></tfoot>" +
          "</table></div>";
      } else {
        modulesHtml = emptyTag("Examination modules");
      }

      examinationBodyHtml = modulesHtml;

      syllabusDetailsHtml =
        sectionHead("Syllabus", "Syllabus details", "fa-solid fa-book-open-reader") +
        '<div class="course-block">' +
        subHead("Entry requirements") +
        structuredBlockHtml(syl.entryRequirements, "Entry requirements") +
        "</div>" +
        '<div class="course-block">' +
        subHead("Course Aim") +
        structuredBlockHtml(syl.aim || course.syllabusAim, "Course Aim") +
        "</div>" +
        '<div class="course-block">' +
        subHead("Contents") +
        structuredBlockHtml(syl.contents, "Contents") +
        "</div>" +
        '<div class="course-block">' +
        subHead("Realization") +
        structuredBlockHtml(syl.realization, "Realization") +
        "</div>";
    }

    var examinationHtml =
      sectionHead("Examination", "Examination modules", "fa-solid fa-clipboard-check") +
      examinationBodyHtml;

    var linksHtml =
      sectionHead("Contacts", "Course contacts", "fa-solid fa-address-card") + contactsHtml;

    var mainHtml =
      '<div class="course-hub">' +
      '<nav aria-label="Breadcrumb"><ol class="breadcrumb">' +
      '<li><a href="../index.html">Home</a></li>' +
      '<li aria-current="page">' +
      D().escapeHtml(course.code) +
      "</li></ol></nav>" +
      '<header class="course-hero">' +
      D().metaBadge("ects", course.ects) +
      '<span class="course-code-chip">' +
      D().escapeHtml(course.code) +
      "</span>" +
      "<h1>" +
      D().escapeHtml(course.title) +
      "</h1>" +
      heroBadges +
      (course.summary
        ? '<p class="course-hero__lead">' + D().escapeHtml(course.summary) + "</p>"
        : "") +
      heroFactsHtml +
      actionsHtml +
      "</header>" +
      quickNavHtml() +
      zone(
        "syllabus",
        "Syllabus",
        "content-zone--official content-zone--syllabus",
        syllabusDetailsHtml
      ) +
      zone(
        "examination",
        "Examination",
        "content-zone--official content-zone--examination",
        examinationHtml
      ) +
      zone("links", "Contacts", "content-zone--official content-zone--links", linksHtml) +
      '<p class="course-updated"><em>Last updated: ' +
      D().escapeHtml(course.lastUpdated || "—") +
      "</em></p></div>";

    paint(mainHtml, course.code, literatureRailHtml(lit));
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCourseHub();
  });
})();
