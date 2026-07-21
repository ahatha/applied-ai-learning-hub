/**
 * "Programme journey" home section — a current-status card plus a two-year
 * timeline strip. Built only from semesters.json. Independent from
 * explorer.js and main.js so the existing Programme explorer and hero
 * summary are untouched.
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  function toDate(iso) {
    return iso ? new Date(iso + "T00:00:00") : null;
  }

  function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function formatLongDate(iso) {
    return D().formatLongDate(iso);
  }

  function dateRangeBadgesHtml(startIso, endIso) {
    return D().dateRangeMetaBadges(startIso, endIso);
  }

  function periodLabel(periodKey) {
    return periodKey === "3-4" ? "Study periods 3–4" : "Study period " + periodKey;
  }

  /**
   * Flatten every semester's teaching periods + exam windows into one
   * chronologically sorted list, so "today" can be located within it.
   */
  function buildSegments(semesters) {
    var segments = [];
    (semesters || []).forEach(function (semester) {
      var details = semester.periodDetails || {};
      var keys = Object.keys(details).sort(function (a, b) {
        return toDate(details[a].startDate) - toDate(details[b].startDate);
      });
      keys.forEach(function (key) {
        var info = details[key];
        segments.push({
          kind: "teaching",
          semester: semester,
          periodKey: key,
          quarterLabel: info.quarterLabel,
          weeksLabel: info.weeksLabel,
          startDate: info.startDate,
          endDate: info.endDate
        });
        if (info.exam) {
          segments.push({
            kind: "exam",
            semester: semester,
            periodKey: key,
            label: info.exam.label,
            startDate: info.exam.startDate,
            endDate: info.exam.endDate
          });
        }
      });
    });
    segments.sort(function (a, b) {
      return toDate(a.startDate) - toDate(b.startDate);
    });
    return segments;
  }

  function locateStatus(segments, today) {
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      var start = toDate(seg.startDate);
      var end = toDate(seg.endDate);
      if (today >= start && today <= end) {
        return { state: "current", segment: seg };
      }
      if (today < start) {
        return { state: "before", segment: seg, index: i };
      }
    }
    return { state: "after", segment: segments[segments.length - 1] || null };
  }

  function segmentHeadline(seg) {
    if (seg.kind === "exam") {
      return (seg.label || "Examination week") + " — " + seg.semester.label;
    }
    return periodLabel(seg.periodKey) + " (" + (seg.quarterLabel || "") + ") — " + seg.semester.label;
  }

  function statusCardHtml(status, today) {
    var seg = status && status.segment;
    if (!seg) {
      return '<div class="empty-state"><p>Programme schedule unavailable.</p></div>';
    }

    var headline;
    var detail;
    var badges = D().metaBadgeGroup([
      D().metaBadge("week", seg.weeksLabel),
      dateRangeBadgesHtml(seg.startDate, seg.endDate)
    ]);

    if (status.state === "current") {
      var daysLeft = daysBetween(today, toDate(seg.endDate));
      headline = seg.kind === "exam" ? "Examination week is underway" : "You're in " + periodLabel(seg.periodKey);
      detail =
        segmentHeadline(seg) +
        (daysLeft > 0
          ? ". " + daysLeft + " day" + (daysLeft === 1 ? "" : "s") + " left."
          : ". Wraps up today.");
    } else if (status.state === "before" && status.index === 0) {
      var daysToStart = daysBetween(today, toDate(seg.startDate));
      headline = "Programme starts in " + daysToStart + " day" + (daysToStart === 1 ? "" : "s");
      detail =
        periodLabel(seg.periodKey) +
        (seg.quarterLabel ? " (" + seg.quarterLabel + ")" : "") +
        " opens the programme.";
    } else if (status.state === "before") {
      headline = "On a break between study periods";
      detail = "Next up: " + segmentHeadline(seg) + ".";
    } else {
      headline = "Programme complete";
      detail = "All study periods finished as of " + formatLongDate(seg.endDate) + ".";
      badges = "";
    }

    return (
      '<p class="journey-status__kicker">Where you are</p>' +
      '<h3 class="journey-status__headline">' + D().escapeHtml(headline) + "</h3>" +
      '<p class="journey-status__detail">' + D().escapeHtml(detail) + "</p>" +
      (badges ? '<div class="journey-status__meta">' + badges + "</div>" : "")
    );
  }

  function yearsFromSemesters(semesters) {
    var years = {};
    (semesters || []).forEach(function (semester) {
      var y = String(semester.yearOfStudy);
      if (!years[y]) {
        years[y] = { yearOfStudy: semester.yearOfStudy, academicYear: semester.academicYear, semesters: [] };
      }
      years[y].semesters.push(semester);
    });
    return Object.keys(years)
      .sort()
      .map(function (key) {
        return years[key];
      });
  }

  function timelineSemesterHtml(semester, highlightSegment) {
    var start = toDate(semester.startDate);
    var end = toDate(semester.endDate);
    var totalDays = Math.max(daysBetween(start, end), 1);
    var details = semester.periodDetails || {};
    var keys = Object.keys(details).sort(function (a, b) {
      return toDate(details[a].startDate) - toDate(details[b].startDate);
    });
    var isSemesterHighlight = !!(highlightSegment && highlightSegment.semester.id === semester.id);

    var segmentsHtml = keys
      .map(function (key) {
        var info = details[key];
        var pDays = Math.max(daysBetween(toDate(info.startDate), toDate(info.endDate)), 1);
        var isPeriodHighlight =
          isSemesterHighlight && highlightSegment.kind === "teaching" && highlightSegment.periodKey === key;
        var periodTitle = info.quarterLabel || periodLabel(key);
        var periodTooltip =
          periodTitle +
          "\nStart: " +
          formatLongDate(info.startDate) +
          "\nEnd: " +
          formatLongDate(info.endDate);
        var periodAria =
          periodTitle +
          ". Start: " +
          formatLongDate(info.startDate) +
          ". End: " +
          formatLongDate(info.endDate);

        var html =
          '<span class="prog-timeline__period' +
          (isPeriodHighlight ? " is-highlight" : "") +
          '" style="flex-grow: ' +
          pDays +
          '" tabindex="0" data-tooltip="' +
          D().escapeHtml(periodTooltip) +
          '" aria-label="' +
          D().escapeHtml(periodAria) +
          '">' +
          '<span class="prog-timeline__period-label">' +
          D().escapeHtml(info.quarterLabel || periodLabel(key)) +
          "</span></span>";

        if (info.exam) {
          var eDays = Math.max(daysBetween(toDate(info.exam.startDate), toDate(info.exam.endDate)), 1);
          var isExamHighlight =
            isSemesterHighlight && highlightSegment.kind === "exam" && highlightSegment.periodKey === key;
          var examTitle = info.exam.label || "Examination week";
          var examTooltip =
            examTitle +
            "\nStart: " +
            formatLongDate(info.exam.startDate) +
            "\nEnd: " +
            formatLongDate(info.exam.endDate);
          var examAria =
            examTitle +
            ". Start: " +
            formatLongDate(info.exam.startDate) +
            ". End: " +
            formatLongDate(info.exam.endDate);
          html +=
            '<span class="prog-timeline__exam' +
            (isExamHighlight ? " is-highlight" : "") +
            '" style="flex-grow: ' +
            eDays +
            '" tabindex="0" data-tooltip="' +
            D().escapeHtml(examTooltip) +
            '" aria-label="' +
            D().escapeHtml(examAria) +
            '"></span>';
        }
        return html;
      })
      .join("");

    return (
      '<div class="prog-timeline__semester' +
      (isSemesterHighlight ? " is-highlight" : "") +
      '" style="flex-grow: ' +
      totalDays +
      '">' +
      '<span class="prog-timeline__semester-label">' + D().escapeHtml(semester.label) + "</span>" +
      '<span class="prog-timeline__periods">' + segmentsHtml + "</span>" +
      '<span class="prog-timeline__semester-dates">' +
      D().escapeHtml(formatLongDate(semester.startDate) + " – " + formatLongDate(semester.endDate)) +
      "</span>" +
      "</div>"
    );
  }

  function timelineHtml(semesters, highlightSegment) {
    var years = yearsFromSemesters(semesters);
    if (!years.length) {
      return '<div class="empty-state"><p>Programme schedule unavailable.</p></div>';
    }
    return years
      .map(function (year) {
        return (
          '<div class="prog-timeline__year">' +
          '<div class="prog-timeline__year-label">' +
          D().metaBadgeGroup([
            D().metaBadge("year", year.yearOfStudy),
            year.academicYear
              ? '<span class="prog-timeline__ay">' +
                D().escapeHtml(year.academicYear) +
                "</span>"
              : ""
          ]) +
          "</div>" +
          '<div class="prog-timeline__row">' +
          year.semesters
            .map(function (semester) {
              return timelineSemesterHtml(semester, highlightSegment);
            })
            .join("") +
          "</div></div>"
        );
      })
      .join("");
  }

  async function init() {
    var statusHost = document.getElementById("programme-status");
    var timelineHost = document.getElementById("programme-timeline-strip");
    if (!statusHost && !timelineHost) {
      return;
    }
    if (!window.AailhData) {
      return;
    }

    var semestersData = await D().loadJson("data/semesters.json");
    var semesters = (semestersData && semestersData.semesters) || [];
    if (!semesters.length) {
      var emptyHtml = '<div class="empty-state"><p>Programme schedule unavailable.</p></div>';
      if (statusHost) statusHost.innerHTML = emptyHtml;
      if (timelineHost) timelineHost.innerHTML = emptyHtml;
      return;
    }

    var today = new Date();
    var segments = buildSegments(semesters);
    var status = locateStatus(segments, today);

    if (statusHost) {
      statusHost.innerHTML = statusCardHtml(status, today);
    }
    if (timelineHost) {
      timelineHost.innerHTML = timelineHtml(semesters, status && status.segment);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
