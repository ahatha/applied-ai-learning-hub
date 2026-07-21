/**
 * Full-width programme explorer — built only from programme.json, semesters.json,
 * and courses.json. Year tabs; course rows link to course hubs.
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  var state = {
    programme: null,
    semesters: [],
    semestersMeta: null,
    coursesById: {},
    tree: null,
    homepageSemesterId: "autumn-2026",
    activeYear: "1"
  };

  function setHtml(el, html) {
    if (el) {
      el.innerHTML = html;
    }
  }

  function roleClass(role) {
    var map = {
      compulsory: "role-compulsory",
      "elective-option": "role-elective",
      "optional-non-degree": "role-optional",
      thesis: "role-thesis"
    };
    return map[role] || "role-other";
  }

  function periodLabel(periodKey) {
    return periodKey === "3-4" ? "Study periods 3–4" : "Study period " + periodKey;
  }

  function formatYearMonthDay(isoDate) {
    return D().formatLongDate(isoDate);
  }

  function semesterDateLabels(semester) {
    return {
      startLabel: formatYearMonthDay(semester.startDate),
      endLabel: formatYearMonthDay(semester.endDate)
    };
  }

  function dateRangeBadgesHtml(startLabel, endLabel) {
    return D().dateRangeMetaBadges(startLabel, endLabel);
  }

  function periodMeta(semester, periodKey) {
    var details =
      (semester.periodDetails && semester.periodDetails[periodKey]) || null;
    if (!details) {
      return {
        startDateLabel: "",
        endDateLabel: "",
        quarterLabel: "",
        weeksLabel: "",
        exam: null
      };
    }
    return {
      startDateLabel: formatYearMonthDay(details.startDate),
      endDateLabel: formatYearMonthDay(details.endDate),
      quarterLabel: details.quarterLabel || "",
      weeksLabel: details.weeksLabel || "",
      exam: details.exam || null
    };
  }

  function courseEcts(course) {
    var value = Number(course && course.ects);
    return isNaN(value) ? 0 : value;
  }

  function neededEctsFromCourseNodes(nodes) {
    var total = 0;
    var electiveSlotEcts = 0;
    (nodes || []).forEach(function (node) {
      var course = node && node.course;
      if (!course) {
        return;
      }
      // Elective options: each is 7.5 ECTS; degree requires some (15 ECTS total),
      // not every listed option. Count one elective slot when options are offered.
      if (course.role === "elective-option") {
        if (!electiveSlotEcts) {
          electiveSlotEcts = courseEcts(course) || 7.5;
        }
        return;
      }
      if (course.role === "optional-non-degree" || course.countTowardDegree === false) {
        return;
      }
      total += courseEcts(course);
    });
    return total + electiveSlotEcts;
  }

  function ectsBadgeHtml(ects) {
    return D().metaBadge("ects", ects);
  }

  function courseNode(course, semester, periodKey) {
    return {
      id: "course-" + course.code,
      type: "course",
      course: course,
      semesterId: semester.id,
      semesterLabel: semester.label,
      periodKey: periodKey,
      periodName: periodLabel(periodKey)
    };
  }

  function buildTree(programme, semesters, coursesById) {
    var years = {};
    (semesters || []).forEach(function (semester) {
      var y = String(semester.yearOfStudy);
      if (!years[y]) {
        years[y] = {
          id: "year-" + y,
          type: "year",
          name: "Year " + y,
          yearOfStudy: semester.yearOfStudy,
          scheduleConfidence: semester.scheduleConfidence,
          children: []
        };
      }
      var yearNode = years[y];
      if (semester.scheduleConfidence === "confirmed") {
        yearNode.scheduleConfidence = "confirmed";
      }

      var periodNodes = [];
      var periodMap = semester.periodMap || {};
      Object.keys(periodMap).forEach(function (periodKey) {
        var children = [];
        (periodMap[periodKey] || []).forEach(function (id) {
          var course = coursesById[id];
          if (course) {
            children.push(courseNode(course, semester, periodKey));
          }
        });
        if (periodKey === "1" && semester.optionalCourseIds) {
          semester.optionalCourseIds.forEach(function (id) {
            var course = coursesById[id];
            if (course) {
              children.push(courseNode(course, semester, periodKey));
            }
          });
        }
        var electiveIds =
          (semester.electivePeriodMap && semester.electivePeriodMap[periodKey]) || [];
        electiveIds.forEach(function (id) {
          var course = coursesById[id];
          if (course) {
            children.push(courseNode(course, semester, periodKey));
          }
        });
        var meta = periodMeta(semester, periodKey);
        periodNodes.push({
          id: semester.id + "-period-" + periodKey,
          type: "period",
          name: periodLabel(periodKey),
          periodKey: periodKey,
          startDateLabel: meta.startDateLabel,
          endDateLabel: meta.endDateLabel,
          quarterLabel: meta.quarterLabel,
          weeksLabel: meta.weeksLabel,
          ectsTotal: neededEctsFromCourseNodes(children),
          exam: meta.exam,
          scheduleConfidence: semester.scheduleConfidence,
          children: children
        });
      });

      var dates = semesterDateLabels(semester);
      var semesterEcts = periodNodes.reduce(function (sum, period) {
        return sum + (Number(period.ectsTotal) || 0);
      }, 0);
      yearNode.children.push({
        id: semester.id,
        type: "semester",
        name: semester.label,
        startDateLabel: dates.startLabel,
        endDateLabel: dates.endLabel,
        ectsTotal: semesterEcts,
        journeyStatus: semester.journeyStatus,
        scheduleConfidence: semester.scheduleConfidence,
        children: periodNodes
      });
    });

    return {
      id: "programme-root",
      type: "root",
      name: (programme && programme.programmeName) || "Programme",
      children: Object.keys(years)
        .sort()
        .map(function (key) {
          return years[key];
        })
    };
  }

  function periodBadgesHtml(options) {
    options = options || {};
    return D().metaBadgeGroup([
      D().metaBadge("quarter", options.quarterLabel),
      D().metaBadge("week", options.weeksLabel),
      options.startDateLabel && options.endDateLabel
        ? dateRangeBadgesHtml(options.startDateLabel, options.endDateLabel)
        : "",
      ectsBadgeHtml(options.ectsTotal)
    ]);
  }

  function semesterBadgesHtml(node) {
    return D().metaBadgeGroup([
      node.startDateLabel && node.endDateLabel
        ? dateRangeBadgesHtml(node.startDateLabel, node.endDateLabel)
        : "",
      ectsBadgeHtml(node.ectsTotal)
    ]);
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
      '<aside class="exam-card">' +
      '<div class="exam-card__top">' +
      D().metaBadge("exam", "Exam") +
      "<strong>" +
      D().escapeHtml(exam.label || "Examination week") +
      "</strong>" +
      dateRangeBadgesHtml(
        formatYearMonthDay(exam.startDate),
        formatYearMonthDay(exam.endDate)
      ) +
      "</div>" +
      (exam.note
        ? '<p class="exam-card__note">' + D().escapeHtml(exam.note) + "</p>"
        : "") +
      '<a class="exam-card__link" href="' +
      D().escapeHtml(scheduleUrl) +
      '" rel="noopener noreferrer" target="_blank">LTU schedule / TimeEdit</a>' +
      "</aside>"
    );
  }

  function periodCoursesHtml(periodNode) {
    return D().courseBrowserCardStacksHtml(
      periodNode.children || [],
      function (node) {
        return node.course;
      },
      function () {
        return {
          quarterLabel: periodNode.quarterLabel,
          weeksLabel: periodNode.weeksLabel
        };
      }
    );
  }

  function sectionHtml(node) {
    var label = node.name;
    var extraClass = "";
    var headingLevel = node.type === "semester" ? "3" : "4";

    if (node.type === "semester" && node.id === state.homepageSemesterId) {
      extraClass = " is-upcoming-semester";
    }

    var body;
    if (node.type === "period") {
      body = periodCoursesHtml(node) + examCardHtml(node.exam);
    } else {
      body = (node.children || [])
        .map(function (child) {
          return sectionHtml(child);
        })
        .join("");
    }

    return (
      '<section class="explorer-block explorer-block--' +
      D().escapeHtml(node.type) +
      extraClass +
      '">' +
      "<h" +
      headingLevel +
      ' class="explorer-block__heading">' +
      (node.type === "period" || node.type === "semester"
        ? ""
        : '<span class="explorer-branch" aria-hidden="true"></span>') +
      (node.type === "semester"
        ? D().metaBadge("semester", label)
        : node.type === "period"
          ? D().metaBadge("studyPeriod", label)
          : '<span class="explorer-block__label">' +
            D().escapeHtml(label) +
            "</span>") +
      (node.type === "semester" ? semesterBadgesHtml(node) : "") +
      (node.type === "period"
        ? periodBadgesHtml({
            quarterLabel: node.quarterLabel,
            weeksLabel: node.weeksLabel,
            startDateLabel: node.startDateLabel,
            endDateLabel: node.endDateLabel,
            ectsTotal: node.ectsTotal
          })
        : "") +
      "</h" +
      headingLevel +
      ">" +
      '<div class="explorer-block__panel">' +
      body +
      "</div></section>"
    );
  }

  function yearTabsHtml(years) {
    return (
      '<div class="explorer-tabs" role="tablist" aria-label="Programme year">' +
      years
        .map(function (year) {
          var y = String(year.yearOfStudy);
          var active = y === state.activeYear;
          return (
            '<button type="button" class="explorer-tab' +
            (active ? " is-active" : "") +
            '" role="tab" id="year-tab-' +
            D().escapeHtml(y) +
            '" aria-selected="' +
            (active ? "true" : "false") +
            '" aria-controls="year-panel-' +
            D().escapeHtml(y) +
            '" data-year-tab="' +
            D().escapeHtml(y) +
            '">' +
            D().metaBadge("year", y) +
            (active ? ' <span class="sr-only">(selected)</span>' : "") +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderExplorer() {
    var host = document.getElementById("programme-explorer");
    if (!host || !state.tree) {
      return;
    }

    var years = state.tree.children || [];
    if (!years.length) {
      setHtml(host, '<div class="empty-state"><p>No programme years found.</p></div>');
      return;
    }

    if (!years.some(function (year) {
      return String(year.yearOfStudy) === state.activeYear;
    })) {
      state.activeYear = String(years[0].yearOfStudy);
    }

    var activeYear = years.find(function (year) {
      return String(year.yearOfStudy) === state.activeYear;
    });

    host.setAttribute("aria-busy", "false");
    setHtml(
      host,
      '<div class="explorer-structure">' +
        yearTabsHtml(years) +
        '<div class="explorer-tab-panel" role="tabpanel" id="year-panel-' +
        D().escapeHtml(state.activeYear) +
        '" aria-labelledby="year-tab-' +
        D().escapeHtml(state.activeYear) +
        '">' +
        ((activeYear && activeYear.children) || [])
          .map(function (semester) {
            return sectionHtml(semester);
          })
          .join("") +
        "</div></div>"
    );
  }

  function bindEvents() {
    var explorer = document.getElementById("programme-explorer");
    if (!explorer) {
      return;
    }

    explorer.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      var tab = target.closest("[data-year-tab]");
      if (tab) {
        event.preventDefault();
        state.activeYear = tab.getAttribute("data-year-tab");
        renderExplorer();
        var active = explorer.querySelector('[data-year-tab="' + state.activeYear + '"]');
        if (active) {
          active.focus();
        }
      }
    });
  }

  async function initExplorer() {
    var host = document.getElementById("programme-explorer");
    if (!host) {
      return;
    }

    var programme = await D().loadJson("data/programme.json");
    var semestersData = await D().loadJson("data/semesters.json");
    var coursesData = await D().loadJson("data/courses.json");

    if (!programme || !semestersData || !coursesData) {
      setHtml(
        host,
        '<div class="empty-state"><p>Programme explorer could not load canonical JSON data.</p></div>'
      );
      return;
    }

    state.programme = programme;
    state.semesters = semestersData.semesters || [];
    state.semestersMeta = semestersData.meta || null;
    state.coursesById = D().indexById(coursesData.courses || []);
    state.homepageSemesterId =
      (semestersData.meta && semestersData.meta.homepageSemesterId) || "autumn-2026";
    state.activeYear = "1";

    state.tree = buildTree(programme, state.semesters, state.coursesById);
    bindEvents();
    renderExplorer();
  }

  document.addEventListener("DOMContentLoaded", initExplorer);
})();
