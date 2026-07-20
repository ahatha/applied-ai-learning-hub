/**
 * Home-page programme facts and shared footer year.
 * Programme hierarchy lives in explorer.js (JSON-driven only).
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

  function formatDisplayDate(iso) {
    if (!iso) {
      return "";
    }
    var parts = String(iso).split("-");
    if (parts.length !== 3) {
      return iso;
    }
    var months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    var month = months[Number(parts[1]) - 1] || parts[1];
    return Number(parts[2]) + " " + month + " " + parts[0];
  }

  async function renderHomeProgramme() {
    var factsHost = document.getElementById("programme-facts");
    var upcomingHost = document.getElementById("upcoming-semester");
    if (!factsHost && !upcomingHost) {
      return;
    }

    var programme = await D().loadJson("data/programme.json");
    var semestersData = await D().loadJson("data/semesters.json");
    var coursesData = await D().loadJson("data/courses.json");
    if (!programme) {
      return;
    }

    var delivery = programme.delivery || {};
    var dates = document.getElementById("programme-dates");
    if (dates) {
      dates.textContent =
        formatDisplayDate(programme.startDate) +
        " – " +
        formatDisplayDate(programme.endDate) +
        " · " +
        programme.totals.degreeEcts +
        " ECTS · Distance, full-time, daytime · " +
        (delivery.language || "English");
    }

    if (factsHost) {
      setHtml(
        factsHost,
        '<div class="fact-strip__item"><strong>' +
          D().escapeHtml(String(programme.totals.degreeEcts)) +
          "</strong><span>ECTS</span></div>" +
          '<div class="fact-strip__item"><strong>Distance</strong><span>' +
          D().escapeHtml(delivery.studyPace || "100%") +
          "</span></div>" +
          '<div class="fact-strip__item"><strong>' +
          D().escapeHtml(delivery.instructionalTime || "Daytime") +
          "</strong><span>Instruction</span></div>" +
          '<div class="fact-strip__item"><strong>' +
          D().escapeHtml(delivery.language || "English") +
          "</strong><span>Language</span></div>"
      );
    }

    var composition = document.getElementById("programme-composition");
    if (composition && programme.totals) {
      setHtml(
        composition,
        '<div class="fact-strip__item"><strong>' +
          D().escapeHtml(String(programme.totals.compulsoryEcts)) +
          "</strong><span>ECTS compulsory</span></div>" +
          '<div class="fact-strip__item"><strong>' +
          D().escapeHtml(String(programme.totals.electiveRequirementEcts)) +
          "</strong><span>ECTS electives</span></div>" +
          '<div class="fact-strip__item"><strong>' +
          D().escapeHtml(String(programme.totals.thesisEcts)) +
          "</strong><span>ECTS thesis</span></div>" +
          '<div class="fact-strip__item"><strong>' +
          D().escapeHtml(String(programme.totals.degreeEcts)) +
          "</strong><span>ECTS total</span></div>"
      );
    }

    var distanceHost = document.getElementById("distance-study");
    if (distanceHost && programme.distanceStudy) {
      var ds = programme.distanceStudy;
      var paragraphs = (ds.paragraphs || [])
        .map(function (p) {
          return "<p>" + D().escapeHtml(p) + "</p>";
        })
        .join("");
      setHtml(
        distanceHost,
        "<h2 id=\"distance-title\" class=\"section-title\">" +
          D().escapeHtml(ds.title || "Distance study") +
          "</h2>" +
          paragraphs +
          (ds.caveat ? "<p><em>" + D().escapeHtml(ds.caveat) + "</em></p>" : "")
      );
    }

    var linksHost = document.getElementById("official-links");
    if (linksHost && Array.isArray(programme.officialLinks)) {
      setHtml(
        linksHost,
        programme.officialLinks
          .map(function (link) {
            return (
              "<li><a href=\"" +
              D().escapeHtml(link.url) +
              '" rel="noopener noreferrer" target="_blank">' +
              D().escapeHtml(link.label) +
              "</a></li>"
            );
          })
          .join("")
      );
    }

    if (!upcomingHost || !semestersData || !coursesData) {
      return;
    }

    var homeId = (semestersData.meta && semestersData.meta.homepageSemesterId) || "autumn-2026";
    var semester = (semestersData.semesters || []).find(function (item) {
      return item.id === homeId;
    });
    var coursesById = D().indexById(coursesData.courses || []);
    if (!semester) {
      setHtml(upcomingHost, '<div class="empty-state"><p>Upcoming semester data unavailable.</p></div>');
      return;
    }

    var focusIds = (semester.periodMap && semester.periodMap["1"]) || [];
    var courseList = focusIds
      .map(function (id) {
        var course = coursesById[id];
        if (!course) {
          return "";
        }
        return (
          "<li><a href=\"" +
          D().escapeHtml(D().courseHubUrl(course.code)) +
          '"><strong>' +
          D().escapeHtml(course.code) +
          "</strong> — " +
          D().escapeHtml(course.title) +
          "</a></li>"
        );
      })
      .join("");

    setHtml(
      upcomingHost,
      "<p><strong>" +
        D().escapeHtml(semester.label) +
        "</strong></p>" +
        '<div class="card__meta">' +
        D().statusBadge(semester.journeyStatus) +
        D().statusBadge(semester.scheduleConfidence) +
        "</div>" +
        "<p>Year " +
        D().escapeHtml(String(semester.yearOfStudy)) +
        " schedule confidence: " +
        D().escapeHtml(D().formatStatus(semester.scheduleConfidence)) +
        "</p>" +
        "<ul>" +
        courseList +
        "</ul>"
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var yearEl = document.getElementById("footer-year");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
    renderHomeProgramme();
  });
})();
