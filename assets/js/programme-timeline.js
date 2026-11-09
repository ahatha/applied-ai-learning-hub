/**
 * "Programme journey" home section — premium Gantt-style timeline from semesters.json.
 * Detail panel shows schedule/exam facts; courses live in Programme explorer.
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

  function findSemester(id) {
    return (state.semesters || []).find(function (semester) {
      return semester.id === id;
    });
  }

  function rangeLabelFromList(labels) {
    var cleaned = (labels || [])
      .map(function (label) {
        return String(label || "").trim();
      })
      .filter(Boolean);
    if (!cleaned.length) {
      return "";
    }
    if (cleaned.length === 1) {
      return cleaned[0];
    }
    var startParts = cleaned[0].split(/\s*[–—-]\s*/);
    var endParts = cleaned[cleaned.length - 1].split(/\s*[–—-]\s*/);
    var start = startParts[0].trim();
    var end = endParts[endParts.length - 1].trim();
    if (!start || !end) {
      return cleaned[0];
    }
    if (start === end) {
      return start;
    }
    return start + "–" + end;
  }

  function semesterQuarterLabel(semester) {
    var details = semester.periodDetails || {};
    return rangeLabelFromList(
      sortedPeriodKeys(details).map(function (key) {
        return details[key].quarterLabel;
      })
    );
  }

  function periodMeta(semester, periodKey) {
    var details =
      (semester && semester.periodDetails && semester.periodDetails[periodKey]) || null;
    if (!details) {
      return {
        startDate: "",
        endDate: "",
        startDateLabel: "",
        endDateLabel: "",
        quarterLabel: "",
        weeksLabel: "",
        exam: null
      };
    }
    return {
      startDate: details.startDate,
      endDate: details.endDate,
      startDateLabel: formatLongDate(details.startDate),
      endDateLabel: formatLongDate(details.endDate),
      quarterLabel: details.quarterLabel || "",
      weeksLabel: details.weeksLabel || "",
      exam: details.exam || null
    };
  }

  /** Fixed Jul→Jun academic window with 12 equal month columns. */
  function academicYearGrid(year) {
    var first = year.semesters[0] && toDate(year.semesters[0].startDate);
    if (!first) {
      return null;
    }
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

  function monthLabel(date) {
    return date.toLocaleDateString("en-GB", { month: "short" });
  }

  function yearLabel(date) {
    return String(date.getFullYear());
  }

  function isoFromDate(date) {
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0")
    );
  }

  function progressState(startIso, endIso, today) {
    var start = toDate(startIso);
    var end = toDate(endIso);
    if (!start || !end || !today) {
      return "upcoming";
    }
    if (today > end) {
      return "past";
    }
    if (today >= start && today <= end) {
      return "current";
    }
    return "upcoming";
  }

  function scheduleBadgesHtml(options) {
    return D().scheduleMetaBadgeGroup({
      quarterLabel: options.quarterLabel,
      weeksLabel: options.weeksLabel,
      startDateLabel: options.startDateLabel,
      endDateLabel: options.endDateLabel
    });
  }

  function examCardHtml(exam) {
    if (!exam) {
      return "";
    }
    var scheduleUrl =
      (state.semestersMeta && state.semestersMeta.examScheduleUrl) ||
      (state.semestersMeta && state.semestersMeta.scheduleSource) ||
      "https://www.ltu.se/en/student-web/your-studies/schedule";

    return (
      '<aside class="exam-card journey-detail__exam">' +
      '<div class="exam-card__top">' +
      D().metaBadge("exam", "Exam") +
      "<strong>" +
      D().escapeHtml(exam.label || "Examination week") +
      "</strong>" +
      D().dateRangeMetaBadges(
        formatLongDate(exam.startDate),
        formatLongDate(exam.endDate)
      ) +
      "</div>" +
      (exam.note
        ? '<p class="exam-card__note">' + D().escapeHtml(exam.note) + "</p>"
        : "") +
      '<a class="exam-card__link" href="' +
      D().escapeHtml(scheduleUrl) +
      '" rel="noopener noreferrer" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> LTU schedule / TimeEdit</a>' +
      "</aside>"
    );
  }

  function resolveDetail(ref) {
    if (!ref) {
      return null;
    }
    var parts = String(ref).split("|");
    var type = parts[0];

    if (type === "year") {
      var yearOfStudy = parts[1];
      var year = yearsFromSemesters(state.semesters).find(function (item) {
        return String(item.yearOfStudy) === String(yearOfStudy);
      });
      if (!year || !year.semesters.length) {
        return null;
      }
      var startDate = year.semesters[0].startDate;
      var endDate = year.semesters[year.semesters.length - 1].endDate;
      var academicLabel = year.semesters[0].academicYear || "";
      return {
        kind: "Year",
        title: "Year " + year.yearOfStudy,
        subtitle: academicLabel,
        startDateLabel: formatLongDate(startDate),
        endDateLabel: formatLongDate(endDate),
        quarterLabel: rangeLabelFromList(
          year.semesters.map(function (semester) {
            return semesterQuarterLabel(semester);
          })
        ),
        weeksLabel: rangeLabelFromList(
          year.semesters.map(function (semester) {
            return semester.weeksLabel;
          })
        ),
        semester: null,
        exam: null,
        focus: "",
        includeExam: false
      };
    }

    if (type === "semester") {
      var semester = findSemester(parts[1]);
      if (!semester) {
        return null;
      }
      return {
        kind: /spring/i.test(semester.label || "") ? "Spring semester" : "Autumn semester",
        title: semester.label,
        subtitle: semester.academicYear || "",
        startDateLabel: formatLongDate(semester.startDate),
        endDateLabel: formatLongDate(semester.endDate),
        quarterLabel: semesterQuarterLabel(semester),
        weeksLabel: semester.weeksLabel || "",
        semester: semester,
        exam: null,
        focus: semester.personalFocus || "",
        includeExam: false
      };
    }

    if (type === "period" || type === "exam") {
      var periodSemester = findSemester(parts[1]);
      var periodKey = parts[2];
      if (!periodSemester || !periodKey) {
        return null;
      }
      var meta = periodMeta(periodSemester, periodKey);
      if (type === "exam") {
        if (!meta.exam) {
          return null;
        }
        return {
          kind: "Exam",
          title: meta.exam.label || "Examination week",
          subtitle: periodLabel(periodKey) + " · " + periodSemester.label,
          startDateLabel: formatLongDate(meta.exam.startDate),
          endDateLabel: formatLongDate(meta.exam.endDate),
          quarterLabel: meta.quarterLabel,
          weeksLabel: "",
          semester: periodSemester,
          exam: meta.exam,
          focus: "",
          includeExam: true
        };
      }
      return {
        kind: "Study period",
        title: periodLabel(periodKey),
        subtitle: periodSemester.label,
        startDateLabel: meta.startDateLabel,
        endDateLabel: meta.endDateLabel,
        quarterLabel: meta.quarterLabel,
        weeksLabel: meta.weeksLabel,
        semester: periodSemester,
        exam: meta.exam,
        focus: "",
        includeExam: true
      };
    }

    return null;
  }

  function detailBodyHtml(detail) {
    if (!detail) {
      return '<p class="journey-detail__empty">Details unavailable.</p>';
    }

    return (
      '<div class="journey-detail__schedule">' +
      scheduleBadgesHtml({
        quarterLabel: detail.quarterLabel,
        weeksLabel: detail.weeksLabel,
        startDateLabel: detail.startDateLabel,
        endDateLabel: detail.endDateLabel
      }) +
      "</div>" +
      (detail.focus
        ? '<p class="journey-detail__focus"><strong>Focus:</strong> ' +
          D().escapeHtml(detail.focus) +
          "</p>"
        : "") +
      (detail.includeExam && detail.exam ? examCardHtml(detail.exam) : "")
    );
  }

  function barHtml(options) {
    var progress = progressState(options.startDate, options.endDate, options.today);
    var className = "gantt__bar " + (options.mod || "") + " is-" + progress;
    if (options.highlight) {
      className += " is-highlight";
    }
    var style = barStyle(options.startDate, options.endDate, options.gridStart);
    var aria =
      (options.title || options.label || "") +
      ". " +
      formatLongDate(options.startDate) +
      " – " +
      formatLongDate(options.endDate) +
      (options.weeksLabel ? ". " + options.weeksLabel : "") +
      (options.highlight ? ". Current segment." : "");

    return (
      '<button type="button" class="' +
      className +
      '" style="' +
      style +
      '" data-detail-ref="' +
      D().escapeHtml(options.detailRef || "") +
      '" aria-label="' +
      D().escapeHtml(aria) +
      '">' +
      '<span class="gantt__bar-fill" aria-hidden="true"></span>' +
      '<span class="gantt__bar-label">' +
      D().escapeHtml(options.label || "") +
      "</span>" +
      "</button>"
    );
  }

  function gridLinesHtml() {
    var cols = [];
    for (var i = 0; i < 12; i++) {
      cols.push('<span class="gantt__grid-col" aria-hidden="true"></span>');
    }
    return '<div class="gantt__grid" aria-hidden="true">' + cols.join("") + "</div>";
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
    var iso = isoFromDate(today);
    return (
      '<div class="gantt__today" style="--today-pct: ' +
      pct.toFixed(3) +
      ';" title="Today — ' +
      D().escapeHtml(formatLongDate(iso)) +
      '" aria-hidden="true">' +
      '<span class="gantt__today-dot"></span>' +
      '<span class="gantt__today-label">Today</span>' +
      "</div>"
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
    if (!highlightSegment || !highlightSegment.semester) {
      return false;
    }
    if (highlightSegment.semester.id !== semester.id) {
      return false;
    }
    if (kind && highlightSegment.kind !== kind) {
      return false;
    }
    if (periodKey != null && highlightSegment.periodKey !== periodKey) {
      return false;
    }
    return true;
  }

  function statusBannerHtml(status, highlightSegment, today) {
    var title = "Programme schedule";
    var detail = "Browse years, semesters, study periods, and exams.";
    var tone = "idle";
    var icon = "fa-route";

    if (status && status.state === "current" && highlightSegment) {
      tone = "current";
      icon = highlightSegment.kind === "exam" ? "fa-clipboard-check" : "fa-location-crosshairs";
      title =
        highlightSegment.kind === "exam"
          ? "You are here — Examination week"
          : "You are here — " + periodLabel(highlightSegment.periodKey);
      detail =
        (highlightSegment.semester.label || "") +
        " · " +
        formatLongDate(highlightSegment.startDate) +
        " – " +
        formatLongDate(highlightSegment.endDate);
    } else if (status && status.state === "before" && highlightSegment) {
      tone = "upcoming";
      icon = "fa-hourglass-start";
      title = "Next up — " + periodLabel(highlightSegment.periodKey);
      detail =
        (highlightSegment.semester.label || "") +
        " starts " +
        formatLongDate(highlightSegment.startDate);
    } else if (status && status.state === "after") {
      tone = "complete";
      icon = "fa-flag-checkered";
      title = "Programme schedule complete";
      detail = "All listed teaching and exam segments have ended.";
    } else if (today) {
      detail = "Today · " + formatLongDate(isoFromDate(today));
    }

    return (
      '<div class="journey-status journey-status--' +
      tone +
      '" role="status">' +
      '<span class="journey-status__icon" aria-hidden="true"><i class="fa-solid ' +
      icon +
      '"></i></span>' +
      '<div class="journey-status__body">' +
      '<p class="journey-status__title">' +
      D().escapeHtml(title) +
      "</p>" +
      '<p class="journey-status__detail">' +
      D().escapeHtml(detail) +
      "</p>" +
      "</div>" +
      "</div>"
    );
  }

  function legendHtml() {
    var items = [
      { mod: "year", label: "Year" },
      { mod: "autumn", label: "Autumn" },
      { mod: "spring", label: "Spring" },
      { mod: "period", label: "Study period" },
      { mod: "exam", label: "Exam" }
    ];
    return (
      '<ul class="journey-legend" aria-label="Timeline colour key">' +
      items
        .map(function (item) {
          return (
            '<li class="journey-legend__item">' +
            '<span class="journey-legend__swatch journey-legend__swatch--' +
            item.mod +
            '" aria-hidden="true"></span>' +
            D().escapeHtml(item.label) +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function detailPanelHtml() {
    return (
      '<div class="journey-detail" id="journey-detail" hidden>' +
      '<div class="journey-detail__head">' +
      '<span class="journey-detail__kind" data-detail-kind></span>' +
      '<button type="button" class="journey-detail__close" data-detail-close aria-label="Close details">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
      "</button>" +
      "</div>" +
      '<p class="journey-detail__title" data-detail-title></p>' +
      '<p class="journey-detail__subtitle" data-detail-subtitle></p>' +
      '<div class="journey-detail__body" data-detail-body></div>' +
      "</div>"
    );
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
    var academicLabel =
      (year.semesters[0] && year.semesters[0].academicYear) ||
      "Year " + year.yearOfStudy;

    var yearRowHtml = rowHtml(
      D().metaBadge("year", year.yearOfStudy),
      barHtml({
        mod: "gantt__bar--year",
        label: "Year " + year.yearOfStudy,
        title: "Year " + year.yearOfStudy,
        startDate: yearStart,
        endDate: yearEnd,
        gridStart: grid.start,
        today: today,
        highlight: yearHighlight,
        detailRef: "year|" + year.yearOfStudy
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
          title: periodLabel(key),
          weeksLabel: info.weeksLabel,
          startDate: info.startDate,
          endDate: info.endDate,
          gridStart: grid.start,
          today: today,
          highlight: teachHighlight,
          detailRef: "period|" + semester.id + "|" + key
        }) +
        (info.exam
          ? barHtml({
              mod: "gantt__bar--exam",
              label: "Exam",
              title: info.exam.label || "Examination week",
              startDate: info.exam.startDate,
              endDate: info.exam.endDate,
              gridStart: grid.start,
              today: today,
              highlight: examHighlight,
              detailRef: "exam|" + semester.id + "|" + key
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
        var isSpring = /spring/i.test(semester.label || "");
        var seasonMod = isSpring ? "gantt__bar--spring" : "gantt__bar--autumn";
        var semesterRowHtml = rowHtml(
          D().metaBadge("semester", semester.label),
          barHtml({
            mod: "gantt__bar--semester " + seasonMod,
            label: semester.label,
            title: semester.label,
            weeksLabel: semester.weeksLabel,
            startDate: semester.startDate,
            endDate: semester.endDate,
            gridStart: grid.start,
            today: today,
            highlight: isHighlighted(highlightSegment, semester),
            detailRef: "semester|" + semester.id
          }),
          "gantt__row--semester"
        );

        var details = semester.periodDetails || {};
        var periodRowsHtml = sortedPeriodKeys(details)
          .map(function (key) {
            return periodRowHtml(semester, key, details[key]);
          })
          .join("");

        return (
          '<div class="gantt__group' +
          (isSpring ? " gantt__group--spring" : " gantt__group--autumn") +
          '">' +
          semesterRowHtml +
          periodRowsHtml +
          "</div>"
        );
      })
      .join("");

    return (
      '<section class="gantt-panel">' +
      '<div class="gantt-panel__head">' +
      '<div class="gantt-panel__titles">' +
      '<h3 class="gantt-panel__title">Year ' +
      D().escapeHtml(String(year.yearOfStudy)) +
      "</h3>" +
      '<p class="gantt-panel__subtitle">' +
      D().escapeHtml(academicLabel) +
      " · Jul–Jun academic grid</p>" +
      "</div>" +
      legendHtml() +
      "</div>" +
      '<div class="gantt-scroll">' +
      '<div class="gantt" role="img" aria-label="Year ' +
      D().escapeHtml(String(year.yearOfStudy)) +
      ' schedule as a Gantt timeline">' +
      '<div class="gantt__corner" aria-hidden="true">' +
      '<span class="gantt__corner-label">Track</span>' +
      "</div>" +
      axisHtml(grid.months) +
      '<div class="gantt__body">' +
      gridLinesHtml() +
      '<div class="gantt__rows">' +
      yearRowHtml +
      semesterSectionsHtml +
      "</div>" +
      todayMarkerHtml(today, grid.start) +
      "</div>" +
      "</div>" +
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
          var academic =
            (year.semesters[0] && year.semesters[0].academicYear) || "";
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
            '"><span class="explorer-tab__label">Year ' +
            D().escapeHtml(y) +
            "</span>" +
            (academic
              ? '<span class="explorer-tab__meta">' +
                D().escapeHtml(academic) +
                "</span>"
              : "") +
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
    semestersMeta: null,
    highlightSegment: null,
    status: null,
    today: null,
    activeYear: null
  };

  function clearDetail() {
    var panel = document.getElementById("journey-detail");
    if (!panel) {
      return;
    }
    panel.hidden = true;
    document.querySelectorAll(".gantt__bar.is-selected").forEach(function (el) {
      el.classList.remove("is-selected");
    });
  }

  function showDetail(bar) {
    var panel = document.getElementById("journey-detail");
    if (!panel || !bar) {
      return;
    }
    var ref = bar.getAttribute("data-detail-ref");
    var detail = resolveDetail(ref);
    if (!detail) {
      return;
    }

    document.querySelectorAll(".gantt__bar.is-selected").forEach(function (el) {
      el.classList.remove("is-selected");
    });
    bar.classList.add("is-selected");

    var kindEl = panel.querySelector("[data-detail-kind]");
    var titleEl = panel.querySelector("[data-detail-title]");
    var subtitleEl = panel.querySelector("[data-detail-subtitle]");
    var bodyEl = panel.querySelector("[data-detail-body]");

    if (kindEl) {
      kindEl.textContent = detail.kind || "Segment";
    }
    if (titleEl) {
      titleEl.textContent = detail.title || "";
    }
    if (subtitleEl) {
      subtitleEl.textContent = detail.subtitle || "";
      subtitleEl.hidden = !detail.subtitle;
    }
    if (bodyEl) {
      bodyEl.innerHTML = detailBodyHtml(detail);
    }

    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

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
      statusBannerHtml(state.status, state.highlightSegment, state.today) +
      detailPanelHtml() +
      (tabsHost ? "" : yearTabsHtml(years, state.activeYear)) +
      '<div class="explorer-tab-panel journey-panel" role="tabpanel" id="timeline-year-panel-' +
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
        clearDetail();
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

    timelineHost.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.closest("[data-detail-close]")) {
        event.preventDefault();
        clearDetail();
        return;
      }
      var bar = target.closest(".gantt__bar");
      if (bar) {
        event.preventDefault();
        if (bar.classList.contains("is-selected")) {
          clearDetail();
        } else {
          showDetail(bar);
        }
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        clearDetail();
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
    state.semestersMeta = (semestersData && semestersData.meta) || null;
    state.status = status;
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
