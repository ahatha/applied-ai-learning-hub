/**
 * JSON data loading helpers with graceful failure.
 */
(function () {
  "use strict";

  /**
   * Resolve an assets-relative path using html[data-asset-base].
   * Root pages: data-asset-base="assets/"
   * Nested pages: data-asset-base="../assets/"
   * @param {string} relativePath path under assets/, e.g. "data/courses.json"
   * @returns {string}
   */
  function assetUrl(relativePath) {
    var base = document.documentElement.getAttribute("data-asset-base") || "assets/";
    if (!base.endsWith("/")) {
      base += "/";
    }
    return base + relativePath.replace(/^\//, "");
  }

  /**
   * @param {string} relativePath
   * @returns {Promise<any|null>}
   */
  async function loadJson(relativePath) {
    var url = assetUrl(relativePath);
    try {
      var response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) {
        console.warn("Failed to load", url, response.status);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.warn("Could not load JSON from", url, error);
      return null;
    }
  }

  /**
   * Escape text for safe HTML insertion.
   * @param {unknown} value
   * @returns {string}
   */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * @param {string} href
   * @returns {string}
   */
  function resolvePageLink(href) {
    if (!href) {
      return "";
    }
    if (/^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("#")) {
      return href;
    }
    var depth = document.documentElement.getAttribute("data-path-depth") || "0";
    if (depth === "1") {
      return "../" + href.replace(/^\.\.\//, "");
    }
    return href;
  }

  /**
   * Format status labels for display.
   * @param {string} status
   * @returns {string}
   */
  function formatStatus(status) {
    if (!status) {
      return "";
    }
    return String(status)
      .split("-")
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  /**
   * Build a status badge element HTML.
   * @param {string} status
   * @returns {string}
   */
  function statusBadge(status) {
    var label = formatStatus(status);
    var safeClass = String(status || "planned").toLowerCase().replace(/\s+/g, "-");
    return (
      '<span class="badge badge--' +
      escapeHtml(safeClass) +
      '" title="Status: ' +
      escapeHtml(label) +
      '"><span class="sr-only">Status: </span>' +
      escapeHtml(label) +
      "</span>"
    );
  }

  /**
   * @param {string[]} tags
   * @returns {string}
   */
  function tagList(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return "";
    }
    return (
      '<ul class="tag-list">' +
      tags
        .map(function (tag) {
          return "<li>" + escapeHtml(tag) + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  /**
   * Compact LTU person contact / ID card (not for book authors).
   * @param {object} person
   * @param {{ label?: string, className?: string }} [options]
   * @returns {string}
   */
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
    options = options || {};
    if (!person || !person.name) {
      return "";
    }

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

    var nameInner = escapeHtml(name);
    if (profileUrl) {
      nameInner =
        '<a class="contact-card__name-link" href="' +
        escapeHtml(profileUrl) +
        '" rel="noopener noreferrer" target="_blank">' +
        nameInner +
        "</a>";
    }

    var metaParts = [];
    if (email) {
      metaParts.push(
        '<a class="contact-card__meta-item" href="mailto:' +
          escapeHtml(email) +
          '"><i class="fa-solid fa-envelope" aria-hidden="true"></i><span>' +
          escapeHtml(email) +
          "</span></a>"
      );
    }
    if (phone) {
      metaParts.push(
        '<a class="contact-card__meta-item" href="tel:' +
          escapeHtml(phone.replace(/\s+/g, "")) +
          '"><i class="fa-solid fa-phone" aria-hidden="true"></i><span>' +
          escapeHtml(phone) +
          "</span></a>"
      );
    }
    if (profileUrl) {
      metaParts.push(
        '<a class="contact-card__meta-item" href="' +
          escapeHtml(profileUrl) +
          '" rel="noopener noreferrer" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>LTU profile</span></a>'
      );
    }
    if (date) {
      metaParts.push(
        '<span class="contact-card__meta-item contact-card__meta-item--muted"><i class="fa-solid fa-calendar-day" aria-hidden="true"></i><time datetime="' +
          escapeHtml(date) +
          '">' +
          escapeHtml(date) +
          "</time></span>"
      );
    }

    var photoHtml =
      '<div class="contact-card__photo' +
      (photoUrl ? "" : " is-fallback") +
      '" aria-hidden="true">' +
      (photoUrl
        ? '<img class="contact-card__photo-img" src="' +
          escapeHtml(photoUrl) +
          '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;var p=this.parentElement;this.remove();if(p)p.classList.add(\'is-fallback\');" />'
        : "") +
      '<span class="contact-card__initials">' +
      escapeHtml(initials) +
      "</span></div>";

    return (
      '<article class="contact-card contact-card--id' +
      extraClass +
      '">' +
      '<header class="contact-card__band">' +
      '<span class="contact-card__org">LTU</span>' +
      (label
        ? '<span class="contact-card__label">' + escapeHtml(label) + "</span>"
        : '<span class="contact-card__label">Examiner</span>') +
      "</header>" +
      '<div class="contact-card__body">' +
      photoHtml +
      '<div class="contact-card__identity">' +
      '<p class="contact-card__name">' +
      nameInner +
      "</p>" +
      (role ? '<p class="contact-card__role">' + escapeHtml(role) + "</p>" : "") +
      "</div>" +
      "</div>" +
      (metaParts.length
        ? '<div class="contact-card__meta">' + metaParts.join("") + "</div>"
        : "") +
      '<footer class="contact-card__strip" aria-hidden="true"></footer>' +
      "</article>"
    );
  }

  /**
   * @param {object[]} people
   * @param {{ label?: string }} [options]
   * @returns {string}
   */
  function contactCardGridHtml(people, options) {
    var list = (people || []).filter(function (p) {
      return p && p.name;
    });
    if (!list.length) {
      return "";
    }
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

  /**
   * Parse syllabus "by" strings into { name, role }.
   * @param {string} by
   * @returns {{ name: string, role: string }}
   */
  function parsePersonByline(by) {
    by = String(by || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!by) {
      return { name: "", role: "" };
    }

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
      var words = left.split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        return { name: left, role: right };
      }
    }

    return { name: by, role: "" };
  }

  /**
   * Build a contact card from lastRevised / syllabusEstablished meta.
   * @param {object|string} entry
   * @param {string} label
   * @returns {string}
   */
  function attributionContactCardHtml(entry, label) {
    if (!entry) {
      return "";
    }
    var by = typeof entry === "string" ? entry : entry.by || "";
    var date = typeof entry === "string" ? "" : entry.date || "";
    var parsed = parsePersonByline(by);
    if (!parsed.name) {
      return "";
    }
    return contactCardHtml(
      {
        name: parsed.name,
        role: (typeof entry === "object" && entry.role) || parsed.role,
        date: date,
        email: typeof entry === "object" ? entry.email || "" : "",
        phone: typeof entry === "object" ? entry.phone || "" : "",
        profileUrl: typeof entry === "object" ? entry.profileUrl || "" : "",
        photoUrl: typeof entry === "object" ? entry.photoUrl || "" : ""
      },
      { label: label, className: "contact-card--attribution" }
    );
  }

  /**
   * Shared course hub URL (JSON-driven page).
   * @param {string} code
   * @returns {string}
   */
  function courseHubUrl(code) {
    return resolvePageLink("courses/course.html?code=" + encodeURIComponent(code));
  }

  /**
   * Index courses by id/code.
   * @param {object[]} courses
   * @returns {Record<string, object>}
   */
  function indexById(courses) {
    var map = {};
    (courses || []).forEach(function (course) {
      map[course.id] = course;
      if (course.code) {
        map[course.code] = course;
      }
    });
    return map;
  }

  window.AailhData = {
    assetUrl: assetUrl,
    loadJson: loadJson,
    escapeHtml: escapeHtml,
    resolvePageLink: resolvePageLink,
    formatStatus: formatStatus,
    statusBadge: statusBadge,
    tagList: tagList,
    contactCardHtml: contactCardHtml,
    contactCardGridHtml: contactCardGridHtml,
    parsePersonByline: parsePersonByline,
    attributionContactCardHtml: attributionContactCardHtml,
    courseHubUrl: courseHubUrl,
    indexById: indexById
  };
  // Alias used by some pages / older references
  window.DataLoader = window.AailhData;
})();
