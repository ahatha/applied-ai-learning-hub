/**
 * "Programme journey" home section — Gantt-style timeline from semesters.json.
 * Each year uses a fixed Jul→Jun grid with 12 equal month columns.
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  function toDate(iso) {
    return iso ? new Date(iso + "T00:00:00") : null;
  }

  function formatLongDate(iso) {
    return D().formatLongDate(iso);
  }

  function periodLabel(periodKey) {
    return periodKey === "3-4" ? "Study periods 3–4" : "Study period " + periodKey;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function sortedPeriodKeys(details) {
    return Object.keys(details || {}).sort(function (a, b) {
      return toDate(details[a].startDate) - toDate(details[b].startDate);
    });
  }

  function yearsFromSemesters(semesters) {
    var years = {};
    (semesters || []).forEach(function (semester) {
      var y = String(semester.yearOfStudy);
      if (!years[y]) {
        years[y] = { yearOfStudy: semester.yearOfStudy, semesters: [] };
      }
      years[y].semesters.push(semester);
    });
    return Object.keys(years)
      .sort()
      .map(function (key) {
        return years[key];
      });
  }

  /** Fixed Jul→Jun academic window with 12 equal month columns. */
  function academicYearGrid(year) {
    var first = year.semesters[0] && toDate(year.semesters[0].startDate);
    if (!first) {
      return null;
    }
    // Include July before autumn start so "today" is visible before August.
    var startYear = first.getMonth() >= 6 ? first.getFullYear() : first.getFullYear() - 1;
    var gridStart = new Date(startYear, 6, 1);
    var months = [];
    for (var i = 0; i < 12; i++) {
      months.push(new Date(startYear, 6 + i, 1));
    }
    return { start: gridStart, months: months };
  }

  function monthProgress(date, gridStart, atEnd) {
    if (!date || !gridStart) {
      return 0;
    }
    var monthsFromStart =
      (date.getFullYear() - gridStart.getFullYear()) * 12 +
      (date.getMonth() - gridStart.getMonth());
    var daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    var dayFrac = atEnd
      ? date.getDate() / daysInMonth
      : (date.getDate() - 1) / daysInMonth;
    return clamp((monthsFromStart + dayFrac) / 12, 0, 1);
  }

  function barStyle(startIso, endIso, gridStart) {
    var start = toDate(startIso);
    var end = toDate(endIso);
    if (!start || !end || !gridStart) {
      return "";
    }
    var left = monthProgress(start, gridStart, false) * 100;
    var right = monthProgress(end, gridStart, true) * 100;
    var width = Math.max(right - left, 100 / 12 / 4);
    return "left:" + left.toFixed(3) + "%;width:" + width.toFixed(3) + "%;";
  }

  function nestedBarStyle(startIso, endIso, parentStartIso, parentEndIso, gridStart) {
    var parentLeft = monthProgress(toDate(parentStartIso), gridStart, false);
    var parentRight = monthProgress(toDate(parentEndIso), gridStart, true);
    var childLeft = monthProgress(toDate(startIso), gridStart, false);
    var childRight = monthProgress(toDate(endIso), gridStart, true);
    var parentWidth = Math.max(parentRight - parentLeft, 0.001);
    var left = clamp(((childLeft - parentLeft) / parentWidth) * 100, 0, 100);
    var width = clamp(((childRight - childLeft) / parentWidth) * 100, 0.8, 100 - left);
    return "left:" + left.toFixed(3) + "%;width:" + width.toFixed(3) + "%;";
  }

  function monthLabel(date) {
    return date.toLocaleDateString("en-GB", { month: "short" });
  }

  function yearLabel(date) {
    return String(date.getFullYear());
  }

  function tooltipText(title, startIso, endIso, quarterLabel, weeksLabel) {
    var parts = [title];
    if (quarterLabel) parts.push(quarterLabel);
    if (weeksLabel) parts.push(weeksLabel);
    parts.push(formatLongDate(startIso) + " – " + formatLongDate(endIso));
    return parts.join(" · ");
  }

  function barHtml(options) {
    var className = "gantt__bar " + (options.mod || "");
    if (options.highlight) className += " is-highlight";
    var style = options.nested
      ? nestedBarStyle(
          options.startDate,
          options.endDate,
          options.parentStartDate,
          options.parentEndDate,
          options.gridStart
        )
      : barStyle(options.startDate, options.endDate, options.gridStart);
    return (
      '<span class="' +
      className +
      '" style="' +
      style +
      '" title="' +
      D().escapeHtml(options.title || "") +
      '"><span class="gantt__bar-label">' +
      D().escapeHtml(options.label || "") +
      "</span></span>"
    );
  }

  function axisHtml(months) {
    return (
      '<div class="gantt__axis" aria-hidden="true">' +
      (months || [])
        .map(function (month, index) {
          var showYear = index === 0 || month.getMonth() === 0;
          return (
            '<span class="gantt__col">' +
            '<span class="gantt__tick-month">' +
            D().escapeHtml(monthLabel(month)) +
            "</span>" +
            (showYear
              ? '<span class="gantt__tick-year">' +
                D().escapeHtml(yearLabel(month)) +
                "</span>"
              : "") +
            "</span>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function todayMarkerHtml(today, gridStart) {
    var gridEnd = new Date(gridStart.getFullYear() + 1, 6, 1);
    if (today < gridStart || today >= gridEnd) {
      return "";
    }
    var pct = monthProgress(today, gridStart, false) * 100;
    var iso =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    return (
      '<div class="gantt__today" style="--today-pct: ' +
      pct.toFixed(3) +
      ';" title="Today — ' +
      D().escapeHtml(formatLongDate(iso)) +
      '" aria-hidden="true"></div>'
    );
  }

  function rowHtml(labelHtml, laneHtml, rowClass) {
    return (
      '<div class="gantt__row' +
      (rowClass ? " " + rowClass : "") +
      '">' +
      '<div class="gantt__label">' +
      labelHtml +
      "</div>" +
      '<div class="gantt__lane">' +
      laneHtml +
      "</div>" +
      "</div>"
    );
  }

  function isHighlighted(highlightSegment, semester, kind, periodKey) {
    if (!highlightSegment || !highlightSegment.semester) return false;
    if (highlightSegment.semester.id !== semester.id) return false;
    if (kind && highlightSegment.kind !== kind) return false;
    if (periodKey != null && highlightSegment.periodKey !== periodKey) return false;
    return true;
  }

  function ganttYearHtml(year, highlightSegment, today) {
    var grid = academicYearGrid(year);
    if (!grid) {
      return "";
    }

    var yearStart = year.semesters[0] && year.semesters[0].startDate;
    var yearEnd =
      year.semesters.length && year.semesters[year.semesters.length - 1].endDate;
    var yearHighlight = year.semesters.some(function (semester) {
      return (
        highlightSegment &&
        highlightSegment.semester &&
        highlightSegment.semester.id === semester.id
      );
    });

    var yearRowHtml = rowHtml(
      D().metaBadge("year", year.yearOfStudy),
      barHtml({
        mod: "gantt__bar--year",
        label: "Year " + year.yearOfStudy,
        title: tooltipText("Year " + year.yearOfStudy, yearStart, yearEnd, "", ""),
        startDate: yearStart,
        endDate: yearEnd,
        gridStart: grid.start,
        highlight: yearHighlight
      }),
      "gantt__row--year"
    );

    function periodRowHtml(semester, key, info) {
      var teachHighlight = isHighlighted(highlightSegment, semester, "teaching", key);
      var examHighlight = isHighlighted(highlightSegment, semester, "exam", key);
      var laneHtml =
        barHtml({
          mod: "gantt__bar--period",
          label: info.quarterLabel || periodLabel(key),
          title: tooltipText(
            periodLabel(key),
            info.startDate,
            info.endDate,
            info.quarterLabel,
            info.weeksLabel
          ),
          startDate: info.startDate,
          endDate: info.endDate,
          gridStart: grid.start,
          highlight: teachHighlight
        }) +
        (info.exam
          ? barHtml({
              mod: "gantt__bar--exam",
              label: "Exam",
              title: tooltipText(
                info.exam.label || "Examination week",
                info.exam.startDate,
                info.exam.endDate,
                "",
                ""
              ),
              startDate: info.exam.startDate,
              endDate: info.exam.endDate,
              gridStart: grid.start,
              highlight: examHighlight
            })
          : "");

      return rowHtml(
        D().metaBadge("studyPeriod", periodLabel(key)),
        laneHtml,
        "gantt__row--period"
      );
    }

    var semesterSectionsHtml = (year.semesters || [])
      .map(function (semester) {
        var seasonMod = /spring/i.test(semester.label || "")
          ? "gantt__bar--spring"
          : "gantt__bar--autumn";
        var semesterRowHtml = rowHtml(
          D().metaBadge("semester", semester.label),
          barHtml({
            mod: "gantt__bar--semester " + seasonMod,
            label: semester.label,
            title: tooltipText(
              semester.label,
              semester.startDate,
              semester.endDate,
              "",
              semester.weeksLabel
            ),
            startDate: semester.startDate,
            endDate: semester.endDate,
            gridStart: grid.start,
            highlight: isHighlighted(highlightSegment, semester)
          }),
          "gantt__row--semester"
        );

        var details = semester.periodDetails || {};
        var periodRowsHtml = sortedPeriodKeys(details)
          .map(function (key) {
            return periodRowHtml(semester, key, details[key]);
          })
          .join("");

        return semesterRowHtml + periodRowsHtml;
      })
      .join("");

    return (
      '<section class="gantt-panel">' +
      '<h3 class="gantt-panel__title">Year ' +
      D().escapeHtml(String(year.yearOfStudy)) +
      "</h3>" +
      '<div class="gantt" role="img" aria-label="Year ' +
      D().escapeHtml(String(year.yearOfStudy)) +
      ' schedule as a Gantt timeline">' +
      '<div class="gantt__corner" aria-hidden="true"></div>' +
      axisHtml(grid.months) +
      '<div class="gantt__rows">' +
      yearRowHtml +
      semesterSectionsHtml +
      "</div>" +
      todayMarkerHtml(today, grid.start) +
      "</div>" +
      "</section>"
    );
  }

  function yearTabsHtml(years, activeYear) {
    return (
      '<div class="explorer-tabs" role="tablist" aria-label="Programme year">' +
      years
        .map(function (year) {
          var y = String(year.yearOfStudy);
          var active = y === activeYear;
          return (
            '<button type="button" class="explorer-tab' +
            (active ? " is-active" : "") +
            '" role="tab" id="timeline-year-tab-' +
            D().escapeHtml(y) +
            '" aria-selected="' +
            (active ? "true" : "false") +
            '" aria-controls="timeline-year-panel-' +
            D().escapeHtml(y) +
            '" data-timeline-year-tab="' +
            D().escapeHtml(y) +
            '">Year ' +
            D().escapeHtml(y) +
            (active ? ' <span class="sr-only">(selected)</span>' : "") +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  var state = {
    semesters: [],
    highlightSegment: null,
    today: null,
    activeYear: null
  };

  function render() {
    var timelineHost = document.getElementById("programme-timeline-strip");
    var tabsHost = document.getElementById("programme-timeline-tabs");
    if (!timelineHost) {
      return;
    }

    var years = yearsFromSemesters(state.semesters);
    if (!years.length) {
      if (tabsHost) {
        tabsHost.innerHTML = "";
      }
      timelineHost.innerHTML =
        '<div class="empty-state"><p>Programme schedule unavailable.</p></div>';
      return;
    }

    if (
      !years.some(function (year) {
        return String(year.yearOfStudy) === state.activeYear;
      })
    ) {
      state.activeYear = String(years[0].yearOfStudy);
    }

    var activeYear = years.find(function (year) {
      return String(year.yearOfStudy) === state.activeYear;
    });

    if (tabsHost) {
      tabsHost.innerHTML = yearTabsHtml(years, state.activeYear);
    }
    timelineHost.innerHTML =
      (tabsHost ? "" : yearTabsHtml(years, state.activeYear)) +
      '<div class="explorer-tab-panel" role="tabpanel" id="timeline-year-panel-' +
      D().escapeHtml(state.activeYear) +
      '" aria-labelledby="timeline-year-tab-' +
      D().escapeHtml(state.activeYear) +
      '">' +
      (activeYear
        ? ganttYearHtml(activeYear, state.highlightSegment, state.today)
        : "") +
      "</div>";
  }

  function bindEvents() {
    var timelineHost = document.getElementById("programme-timeline-strip");
    var tabsHost = document.getElementById("programme-timeline-tabs");
    if (!timelineHost) {
      return;
    }

    var clickRoot = tabsHost || timelineHost;
    clickRoot.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      var tab = target.closest("[data-timeline-year-tab]");
      if (tab) {
        event.preventDefault();
        state.activeYear = tab.getAttribute("data-timeline-year-tab");
        render();
        var active = clickRoot.querySelector(
          '[data-timeline-year-tab="' + state.activeYear + '"]'
        );
        if (active) {
          active.focus();
        }
      }
    });
  }

  function buildSegments(semesters) {
    var segments = [];
    (semesters || []).forEach(function (semester) {
      var details = semester.periodDetails || {};
      sortedPeriodKeys(details).forEach(function (key) {
        var info = details[key];
        segments.push({
          kind: "teaching",
          semester: semester,
          periodKey: key,
          startDate: info.startDate,
          endDate: info.endDate
        });
        if (info.exam) {
          segments.push({
            kind: "exam",
            semester: semester,
            periodKey: key,
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

  async function init() {
    var timelineHost = document.getElementById("programme-timeline-strip");
    if (!timelineHost || !window.AailhData) {
      return;
    }

    var semestersData = await D().loadJson("data/semesters.json");
    var semesters = (semestersData && semestersData.semesters) || [];
    if (!semesters.length) {
      timelineHost.innerHTML =
        '<div class="empty-state"><p>Programme schedule unavailable.</p></div>';
      return;
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var status = locateStatus(buildSegments(semesters), today);

    state.semesters = semesters;
    state.highlightSegment = status && status.segment;
    state.today = today;
    state.activeYear =
      (state.highlightSegment &&
        state.highlightSegment.semester &&
        String(state.highlightSegment.semester.yearOfStudy)) ||
      null;

    render();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
