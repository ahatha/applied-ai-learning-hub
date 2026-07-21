/**
 * Shared footer year and light homepage programme summary refresh from JSON.
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  function factRow(label, value) {
    if (value == null || value === "") {
      return "";
    }
    return (
      "<tr><th scope=\"row\">" +
      D().escapeHtml(label) +
      "</th><td>" +
      D().escapeHtml(String(value)) +
      "</td></tr>"
    );
  }

  function factRowHtml(label, html) {
    if (!html) {
      return "";
    }
    return (
      "<tr><th scope=\"row\">" +
      D().escapeHtml(label) +
      "</th><td>" +
      html +
      "</td></tr>"
    );
  }

  function pct(part, total) {
    if (!total) return 0;
    return Math.round((Number(part) / Number(total)) * 1000) / 10;
  }

  function subjectSegmentClass(id) {
    var map = {
      "computer-science-and-engineering": "is-cse",
      selective: "is-selective",
      "computer-science": "is-cs",
      entrepreneurship: "is-entrepreneurship"
    };
    return map[id] || "is-other";
  }

  function scopePieHtml(totals) {
    var compulsory = Number(totals.compulsoryEcts) || 0;
    var elective = Number(totals.electiveRequirementEcts) || 0;
    var thesis = Number(totals.thesisEcts) || 0;
    var total = Number(totals.degreeEcts) || compulsory + elective + thesis;
    if (!total) return "";

    var cPct = pct(compulsory, total);
    var ePct = pct(elective, total);
    var tPct = pct(thesis, total);

    return (
      '<p class="home-hero__pie-kicker">Degree scope</p>' +
      '<div class="home-hero__pie-visual">' +
      '<div class="home-hero__pie-chart" style="--compulsory: ' +
      cPct +
      "; --elective: " +
      ePct +
      "; --thesis: " +
      tPct +
      ';" role="img" aria-label="' +
      D().escapeHtml(
        total +
          " ECTS: " +
          compulsory +
          " compulsory, " +
          elective +
          " elective, " +
          thesis +
          " thesis"
      ) +
      '"></div>' +
      '<p class="home-hero__pie-total"><strong>' +
      D().escapeHtml(String(total)) +
      "</strong> ECTS</p>" +
      "</div>" +
      '<ul class="home-hero__pie-legend">' +
      '<li><span class="home-hero__pie-swatch is-compulsory" aria-hidden="true"></span> ' +
      D().escapeHtml(String(compulsory)) +
      " compulsory</li>" +
      '<li><span class="home-hero__pie-swatch is-elective" aria-hidden="true"></span> ' +
      D().escapeHtml(String(elective)) +
      " elective</li>" +
      '<li><span class="home-hero__pie-swatch is-thesis" aria-hidden="true"></span> ' +
      D().escapeHtml(String(thesis)) +
      " thesis</li>" +
      "</ul>"
    );
  }

  function programmeOverviewHtml(programme) {
    var segments = (programme.subjectSegments || []).filter(function (seg) {
      return seg && seg.countsTowardDegree !== false;
    });
    if (!segments.length) {
      return "";
    }

    var total =
      Number(programme.totals && programme.totals.degreeEcts) ||
      segments.reduce(function (sum, seg) {
        return sum + (Number(seg.ects) || 0);
      }, 0);

    var rows = segments
      .map(function (seg) {
        var ects = Number(seg.ects) || 0;
        var label = seg.label || seg.id || "Segment";
        return (
          '<div class="home-hero__stack-seg ' +
          subjectSegmentClass(seg.id) +
          '" style="flex-grow: ' +
          ects +
          '">' +
          '<span class="home-hero__stack-label">' +
          D().escapeHtml(label) +
          "</span>" +
          '<strong class="home-hero__stack-ects">' +
          D().escapeHtml(String(ects)) +
          " cr</strong>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<p class="home-hero__pie-kicker">Programme overview</p>' +
      '<div class="home-hero__stack" role="img" aria-label="' +
      D().escapeHtml(total + " ECTS by subject area") +
      '">' +
      rows +
      "</div>" +
      '<p class="home-hero__stack-total"><strong>' +
      D().escapeHtml(String(total)) +
      "</strong> ECTS degree total</p>"
    );
  }

  async function refreshProgrammeSummary() {
    var composition = document.getElementById("programme-composition");
    var pieHost = document.getElementById("programme-scope-pie");
    var overviewHost = document.getElementById("programme-overview");
    if (!composition && !pieHost && !overviewHost) {
      return;
    }
    if (!window.AailhData) {
      return;
    }

    var programme = await D().loadJson("data/programme.json");
    if (!programme) {
      return;
    }

    var delivery = programme.delivery || {};
    var totals = programme.totals || {};
    var degree = programme.degree || {};

    var startDateValue = "";
    if (programme.startDate) {
      startDateValue = D().metaBadgeGroup([
        D().metaBadge("date", D().formatLongDate(programme.startDate)),
        D().metaBadge("week", programme.startWeekLabel)
      ]);
    }

    var endDateValue = "";
    if (programme.endDate) {
      endDateValue = D().metaBadgeGroup([
        D().metaBadge("date", D().formatLongDate(programme.endDate)),
        D().metaBadge("week", programme.endWeekLabel)
      ]);
    }

    var degreeHtml = "";
    if (degree.name && degree.major) {
      degreeHtml =
        '<span class="home-hero__degree-line">' +
        D().escapeHtml(degree.name) +
        "</span>" +
        '<span class="home-hero__degree-line">' +
        D().escapeHtml(degree.major) +
        "</span>";
    } else if (degree.name || degree.major) {
      degreeHtml = D().escapeHtml(degree.name || degree.major);
    }

    if (composition) {
      composition.innerHTML =
        '<p class="home-hero__pie-kicker">Programme details</p>' +
        '<table class="course-facts-table"><tbody>' +
        factRow("Intake", programme.intakeLabel || programme.enrollmentSemester) +
        factRow("Programme code", programme.programmeCode) +
        factRowHtml("Start date", startDateValue) +
        factRowHtml("End date", endDateValue) +
        factRow("Language", delivery.language) +
        factRowHtml("Degree", degreeHtml) +
        "</tbody></table>";
    }

    if (pieHost) {
      pieHost.innerHTML = scopePieHtml(totals);
    }

    if (overviewHost) {
      overviewHost.innerHTML = programmeOverviewHtml(programme);
    }
  }

  document.addEventListener("DOMContentLoaded", refreshProgrammeSummary);
})();
