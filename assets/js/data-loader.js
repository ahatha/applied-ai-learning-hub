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
    courseHubUrl: courseHubUrl,
    indexById: indexById
  };
})();
