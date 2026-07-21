/**
 * Course browser — facet filters (year, semester, study period, quarter,
 * subject segment, role) over courses.json, cross-referenced with
 * semesters.json for quarter/week labels. Matching courses render as cards
 * grouped by Year -> Semester -> Study period. Independent of explorer.js,
 * main.js and course-hub.js.
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  var SEGMENT_LABELS = {
    "computer-science-and-engineering": "Computer Science and Engineering",
    selective: "Selective courses",
    "computer-science": "Computer Science",
    entrepreneurship: "Entrepreneurship"
  };

  function studyPeriodLabel(sp) {
    return sp === "3-4" ? "Study periods 3–4" : "Study period " + sp;
  }

  function studyPeriodSortValue(sp) {
    return sp === "3-4" ? 3.5 : Number(sp);
  }

  function segmentLabel(id) {
    return SEGMENT_LABELS[id] || D().formatStatus(id) || "—";
  }

  /**
   * Attach chronological + display metadata (semester label/order,
   * quarter, weeks) to each course, drawn from semesters.json.
   */
  function buildEntries(courses, semesters) {
    var semesterLabelById = {};
    var semesterOrderById = {};
    var periodMetaByKey = {};

    (semesters || []).forEach(function (semester, index) {
      semesterLabelById[semester.id] = semester.label;
      semesterOrderById[semester.id] = index;
      var details = semester.periodDetails || {};
      Object.keys(details).forEach(function (key) {
        periodMetaByKey[semester.id + "|" + key] = details[key];
      });
    });

    return (courses || []).map(function (course) {
      var studyPeriod = String(course.studyPeriod);
      var meta = periodMetaByKey[course.semesterId + "|" + studyPeriod] || {};
      return {
        course: course,
        yearOfStudy: course.yearOfStudy,
        semesterId: course.semesterId,
        semesterLabel: semesterLabelById[course.semesterId] || course.semesterId || "",
        semesterOrder: semesterOrderById[course.semesterId] != null ? semesterOrderById[course.semesterId] : 999,
        studyPeriod: studyPeriod,
        quarterLabel: meta.quarterLabel || "",
        weeksLabel: meta.weeksLabel || "",
        segment: course.subjectSegment || "",
        role: course.role || ""
      };
    });
  }

  function entrySortComparator(a, b) {
    if (a.yearOfStudy !== b.yearOfStudy) return a.yearOfStudy - b.yearOfStudy;
    if (a.semesterOrder !== b.semesterOrder) return a.semesterOrder - b.semesterOrder;
    var spDiff = studyPeriodSortValue(a.studyPeriod) - studyPeriodSortValue(b.studyPeriod);
    if (spDiff !== 0) return spDiff;
    return (Number(a.course.order) || 0) - (Number(b.course.order) || 0);
  }

  function buildFacetDefinitions(semesterIdsInOrder, semesterLabelById) {
    return [
      {
        id: "year",
        label: "Year",
        order: ["1", "2"],
        getValue: function (e) { return String(e.yearOfStudy); },
        getLabel: function (v) { return "Year " + v; }
      },
      {
        id: "semester",
        label: "Semester",
        order: semesterIdsInOrder,
        getValue: function (e) { return e.semesterId; },
        getLabel: function (v) { return semesterLabelById[v] || v; }
      },
      {
        id: "studyPeriod",
        label: "Study period",
        order: ["1", "2", "3", "4", "3-4"],
        getValue: function (e) { return e.studyPeriod; },
        getLabel: studyPeriodLabel
      },
      {
        id: "quarter",
        label: "Quarter",
        order: ["Q1", "Q2", "Q3", "Q4", "Q3–Q4"],
        getValue: function (e) { return e.quarterLabel; },
        getLabel: function (v) { return v; }
      },
      {
        id: "segment",
        label: "Subject segment",
        order: [],
        getValue: function (e) { return e.segment; },
        getLabel: segmentLabel
      },
      {
        id: "role",
        label: "Role",
        order: ["compulsory", "elective-option", "optional-non-degree", "thesis"],
        getValue: function (e) { return e.role; },
        getLabel: function (v) { return D().formatStatus(v); }
      }
    ];
  }

  function buildFacetOptions(entries, facet) {
    var counts = {};
    entries.forEach(function (entry) {
      var value = facet.getValue(entry);
      if (value == null || value === "") return;
      counts[value] = (counts[value] || 0) + 1;
    });

    var values = Object.keys(counts);
    var order = facet.order || [];
    values.sort(function (a, b) {
      var ia = order.indexOf(a);
      var ib = order.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return facet.getLabel(a).localeCompare(facet.getLabel(b));
    });

    return values.map(function (value) {
      return { value: value, label: facet.getLabel(value), count: counts[value] };
    });
  }

  function facetsHtml(entries, facets) {
    return facets
      .map(function (facet) {
        var options = buildFacetOptions(entries, facet);
        if (!options.length) return "";
        return (
          '<fieldset class="browser-facet">' +
          "<legend>" + D().escapeHtml(facet.label) + "</legend>" +
          '<div class="browser-facet__options">' +
          options
            .map(function (opt) {
              return (
                '<label class="browser-facet__option">' +
                '<input type="checkbox" data-facet="' + D().escapeHtml(facet.id) + '" value="' + D().escapeHtml(opt.value) + '">' +
                "<span>" + D().escapeHtml(opt.label) + "</span>" +
                '<span class="browser-facet__count">' + opt.count + "</span>" +
                "</label>"
              );
            })
            .join("") +
          "</div></fieldset>"
        );
      })
      .join("");
  }

  function groupKey(entry) {
    return entry.yearOfStudy + "|" + entry.semesterId + "|" + entry.studyPeriod;
  }

  function renderResults(entries, matches) {
    var groupsHost = document.getElementById("browser-groups");
    var summaryHost = document.getElementById("browser-summary");
    if (!groupsHost) return;

    var filtered = entries.filter(matches);

    if (summaryHost) {
      summaryHost.innerHTML =
        "Showing <strong>" + filtered.length + "</strong> of " + entries.length + " courses.";
    }

    groupsHost.setAttribute("aria-busy", "false");

    if (!filtered.length) {
      groupsHost.innerHTML = '<div class="empty-state"><p>No courses match the selected filters.</p></div>';
      return;
    }

    var groups = [];
    var groupsByKey = {};
    filtered.forEach(function (entry) {
      var key = groupKey(entry);
      if (!groupsByKey[key]) {
        groupsByKey[key] = { entry: entry, items: [] };
        groups.push(groupsByKey[key]);
      }
      groupsByKey[key].items.push(entry);
    });

    groupsHost.innerHTML = groups
      .map(function (group) {
        var e = group.entry;
        return (
          '<div class="browser-group">' +
          '<h3 class="browser-group__heading">' +
          D().metaBadgeGroup([
            D().metaBadge("year", e.yearOfStudy),
            D().metaBadge("semester", e.semesterLabel),
            D().metaBadge("studyPeriod", e.studyPeriod),
            D().metaBadge("quarter", e.quarterLabel),
            D().metaBadge("week", e.weeksLabel)
          ]) +
          "</h3>" +
          D().courseBrowserCardStacksHtml(
            group.items,
            function (entry) {
              return entry.course;
            },
            function (entry) {
              return {
                quarterLabel: entry.quarterLabel,
                weeksLabel: entry.weeksLabel
              };
            }
          ) +
          "</div>"
        );
      })
      .join("");
  }

  async function init() {
    var facetsHost = document.getElementById("browser-facets");
    var groupsHost = document.getElementById("browser-groups");
    if (!facetsHost || !groupsHost) {
      return;
    }
    if (!window.AailhData) {
      return;
    }

    var coursesData = await D().loadJson("data/courses.json");
    var semestersData = await D().loadJson("data/semesters.json");
    var courses = (coursesData && coursesData.courses) || [];
    var semesters = (semestersData && semestersData.semesters) || [];

    if (!courses.length) {
      var emptyHtml = '<div class="empty-state"><p>Course catalogue unavailable.</p></div>';
      groupsHost.innerHTML = emptyHtml;
      groupsHost.setAttribute("aria-busy", "false");
      return;
    }

    var semesterLabelById = {};
    var semesterIdsInOrder = [];
    semesters.forEach(function (semester) {
      semesterLabelById[semester.id] = semester.label;
      semesterIdsInOrder.push(semester.id);
    });

    var entries = buildEntries(courses, semesters).sort(entrySortComparator);
    var facets = buildFacetDefinitions(semesterIdsInOrder, semesterLabelById);
    var selected = {};
    facets.forEach(function (facet) {
      selected[facet.id] = new Set();
    });

    function matches(entry) {
      return facets.every(function (facet) {
        var set = selected[facet.id];
        return set.size === 0 || set.has(facet.getValue(entry));
      });
    }

    function rerender() {
      renderResults(entries, matches);
    }

    facetsHost.innerHTML = facetsHtml(entries, facets);

    facetsHost.addEventListener("change", function (event) {
      var input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") {
        return;
      }
      var set = selected[input.getAttribute("data-facet")];
      if (!set) return;
      if (input.checked) {
        set.add(input.value);
      } else {
        set.delete(input.value);
      }
      rerender();
    });

    var clearBtn = document.getElementById("browser-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        facets.forEach(function (facet) {
          selected[facet.id].clear();
        });
        facetsHost.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
          input.checked = false;
        });
        rerender();
      });
    }

    rerender();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
