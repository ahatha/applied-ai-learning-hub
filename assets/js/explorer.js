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
        quarterLabel: semesterQuarterLabel(periodNodes),
        weeksLabel: semester.weeksLabel || "",
        ectsTotal: semesterEcts,
        journeyStatus: semester.journeyStatus,
        scheduleConfidence: semester.scheduleConfidence,
        children: periodNodes
      });
    });

    Object.keys(years).forEach(function (key) {
      var yearNode = years[key];
      var semesterNodes = yearNode.children || [];
      yearNode.ectsTotal = semesterNodes.reduce(function (sum, semester) {
        return sum + (Number(semester.ectsTotal) || 0);
      }, 0);
      yearNode.quarterLabel = rangeLabelFromList(
        semesterNodes.map(function (semester) {
          return semester.quarterLabel;
        })
      );
      yearNode.weeksLabel = rangeLabelFromList(
        semesterNodes.map(function (semester) {
          return semester.weeksLabel;
        })
      );
      yearNode.startDateLabel = semesterNodes.length
        ? semesterNodes[0].startDateLabel || ""
        : "";
      yearNode.endDateLabel = semesterNodes.length
        ? semesterNodes[semesterNodes.length - 1].endDateLabel || ""
        : "";
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

  function semesterQuarterLabel(periodNodes) {
    return rangeLabelFromList(
      (periodNodes || []).map(function (period) {
        return period.quarterLabel;
      })
    );
  }

  function periodBadgesHtml(options) {
    options = options || {};
    return D().scheduleMetaBadgeGroup({
      quarterLabel: options.quarterLabel,
      weeksLabel: options.weeksLabel,
      startDateLabel: options.startDateLabel,
      endDateLabel: options.endDateLabel,
      trailing: [ectsBadgeHtml(options.ectsTotal)]
    });
  }

  function semesterBadgesHtml(node) {
    return periodBadgesHtml({
      quarterLabel: node.quarterLabel,
      weeksLabel: node.weeksLabel,
      startDateLabel: node.startDateLabel,
      endDateLabel: node.endDateLabel,
      ectsTotal: node.ectsTotal
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
      '" rel="noopener noreferrer" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> LTU schedule / TimeEdit</a>' +
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
          weeksLabel: periodNode.weeksLabel,
          startDateLabel: periodNode.startDateLabel,
          endDateLabel: periodNode.endDateLabel
        };
      }
    )
      .replace(/badge--level">Bachelor's/g, 'badge--level badge--level-bachelors">Bachelor\'s')
      .replace(/badge--level">Master's/g, 'badge--level badge--level-masters">Master\'s');
  }

  function sectionHtml(node) {
    var label = node.name;
    var extraClass = "";
    var headingLevel =
      node.type === "year" ? "2" : node.type === "semester" ? "3" : "4";

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

    var headingBadge =
      node.type === "year"
        ? '<span class="explorer-heading-badge"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i>' +
          D().metaBadge("year", node.yearOfStudy) +
          "</span>"
        : node.type === "semester"
          ? '<span class="explorer-heading-badge"><i class="fa-solid ' +
            (/spring/i.test(label) ? "fa-seedling" : "fa-leaf") +
            '" aria-hidden="true"></i>' +
            D().metaBadge("semester", label) +
            "</span>"
          : node.type === "period"
            ? '<span class="explorer-heading-badge"><i class="fa-solid fa-book-open" aria-hidden="true"></i>' +
              D().metaBadge("studyPeriod", label) +
              "</span>"
            : '<span class="explorer-branch" aria-hidden="true"></span><span class="explorer-block__label">' +
              D().escapeHtml(label) +
              "</span>";

    var headingMeta =
      node.type === "year" || node.type === "semester"
        ? semesterBadgesHtml(node)
        : node.type === "period"
          ? periodBadgesHtml({
              quarterLabel: node.quarterLabel,
              weeksLabel: node.weeksLabel,
              startDateLabel: node.startDateLabel,
              endDateLabel: node.endDateLabel,
              ectsTotal: node.ectsTotal
            })
          : "";

    return (
      '<section class="explorer-block explorer-block--' +
      D().escapeHtml(node.type) +
      extraClass +
      '">' +
      "<h" +
      headingLevel +
      ' class="explorer-block__heading">' +
      headingBadge +
      headingMeta +
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

  function renderExplorer() {
    var host = document.getElementById("programme-explorer");
    var tabsHost = document.getElementById("programme-year-tabs");
    if (!host || !state.tree) {
      return;
    }

    var years = state.tree.children || [];
    if (!years.length) {
      if (tabsHost) {
        setHtml(tabsHost, "");
      }
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
    if (tabsHost) {
      setHtml(tabsHost, yearTabsHtml(years));
    }
    setHtml(
      host,
      '<div class="explorer-structure">' +
        (tabsHost ? "" : yearTabsHtml(years)) +
        '<div class="explorer-tab-panel" role="tabpanel" id="year-panel-' +
        D().escapeHtml(state.activeYear) +
        '" aria-labelledby="year-tab-' +
        D().escapeHtml(state.activeYear) +
        '">' +
        (activeYear ? sectionHtml(activeYear) : "") +
        "</div></div>"
    );
  }

  function bindEvents() {
    var explorer = document.getElementById("programme-explorer");
    var tabsHost = document.getElementById("programme-year-tabs");
    if (!explorer) {
      return;
    }

    var clickRoot = tabsHost || explorer;
    clickRoot.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      var tab = target.closest("[data-year-tab]");
      if (tab) {
        event.preventDefault();
        state.activeYear = tab.getAttribute("data-year-tab");
        renderExplorer();
        var active = clickRoot.querySelector('[data-year-tab="' + state.activeYear + '"]');
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
