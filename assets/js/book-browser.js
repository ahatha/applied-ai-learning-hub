/**
 * Book browser — facet filters matching the course browser (year, semester,
 * study period, quarter, subject segment, role), joined via literature
 * usedIn → courses.json + semesters.json. Books are expanded per linked
 * course so chronological sort/grouping matches Browse courses.
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

  function uniqueStrings(values) {
    var seen = {};
    var out = [];
    (values || []).forEach(function (value) {
      var key = String(value || "").trim();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(key);
    });
    return out;
  }

  function normalizeIsbnDigits(value) {
    return String(value || "").replace(/[^0-9Xx]/g, "");
  }

  function literatureCoverUrl(book) {
    if (!book) return "";
    if (book.coverUrl) return String(book.coverUrl).trim();
    var isbn = normalizeIsbnDigits(book.isbn || book.id || "");
    if (isbn.length === 10 || isbn.length === 13) {
      return (
        "https://covers.openlibrary.org/b/isbn/" +
        encodeURIComponent(isbn) +
        "-L.jpg?default=false"
      );
    }
    return "";
  }

  /** Index courses with the same chronological fields as course-browser. */
  function buildCourseIndex(courses, semesters) {
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

    var byCode = {};
    (courses || []).forEach(function (course) {
      if (!course || !course.code) return;
      var code = String(course.code).toUpperCase();
      var studyPeriod = String(course.studyPeriod);
      var meta = periodMetaByKey[course.semesterId + "|" + studyPeriod] || {};
      byCode[code] = {
        course: course,
        yearOfStudy: course.yearOfStudy,
        semesterId: course.semesterId,
        semesterLabel: semesterLabelById[course.semesterId] || course.semesterId || "",
        semesterOrder:
          semesterOrderById[course.semesterId] != null
            ? semesterOrderById[course.semesterId]
            : 999,
        studyPeriod: studyPeriod,
        quarterLabel: meta.quarterLabel || "",
        weeksLabel: meta.weeksLabel || "",
        segment: course.subjectSegment || "",
        role: course.role || ""
      };
    });
    return byCode;
  }

  /**
   * One browser row per book×course link so filters/sort/group follow the
   * programme timeline (same axes as Browse courses).
   */
  function buildEntries(booksMap, courseIndex) {
    var entries = [];

    Object.keys(booksMap || {}).forEach(function (id) {
      var book = booksMap[id];
      if (!book || !book.title) return;

      var usedIn = Array.isArray(book.usedIn) ? book.usedIn : [];
      var codes = uniqueStrings(
        usedIn.map(function (row) {
          return row && row.courseCode ? String(row.courseCode).toUpperCase() : "";
        })
      );

      function categoriesForCode(code) {
        return uniqueStrings(
          usedIn
            .filter(function (row) {
              return row && String(row.courseCode || "").toUpperCase() === code;
            })
            .map(function (row) {
              return row.category || "";
            })
        );
      }

      if (!codes.length) {
        entries.push({
          id: id,
          book: book,
          courseCode: "",
          courseLabel: "Not linked to a course",
          categories: uniqueStrings(
            usedIn.map(function (row) {
              return row && row.category ? row.category : "";
            })
          ),
          yearOfStudy: 999,
          semesterId: "",
          semesterLabel: "",
          semesterOrder: 999,
          studyPeriod: "",
          quarterLabel: "",
          weeksLabel: "",
          segment: "",
          role: ""
        });
        return;
      }

      codes.forEach(function (code) {
        var indexed = courseIndex[code];
        var titleFromUsed =
          (
            usedIn.find(function (row) {
              return row && String(row.courseCode || "").toUpperCase() === code;
            }) || {}
          ).courseTitle || code;
        var courseLabel = indexed
          ? code + " " + (indexed.course.title || titleFromUsed)
          : code + " " + titleFromUsed;

        if (indexed) {
          entries.push({
            id: id,
            book: book,
            courseCode: code,
            courseLabel: courseLabel,
            categories: categoriesForCode(code),
            yearOfStudy: indexed.yearOfStudy,
            semesterId: indexed.semesterId,
            semesterLabel: indexed.semesterLabel,
            semesterOrder: indexed.semesterOrder,
            studyPeriod: indexed.studyPeriod,
            quarterLabel: indexed.quarterLabel,
            weeksLabel: indexed.weeksLabel,
            segment: indexed.segment,
            role: indexed.role
          });
        } else {
          entries.push({
            id: id,
            book: book,
            courseCode: code,
            courseLabel: courseLabel,
            categories: categoriesForCode(code),
            yearOfStudy: 999,
            semesterId: "",
            semesterLabel: "",
            semesterOrder: 999,
            studyPeriod: "",
            quarterLabel: "",
            weeksLabel: "",
            segment: "",
            role: ""
          });
        }
      });
    });

    return entries;
  }

  function entrySortComparator(a, b) {
    if (a.yearOfStudy !== b.yearOfStudy) return a.yearOfStudy - b.yearOfStudy;
    if (a.semesterOrder !== b.semesterOrder) return a.semesterOrder - b.semesterOrder;
    var spDiff =
      studyPeriodSortValue(a.studyPeriod) - studyPeriodSortValue(b.studyPeriod);
    if (spDiff !== 0) return spDiff;
    var codeCmp = (a.courseCode || "").localeCompare(b.courseCode || "");
    if (codeCmp !== 0) return codeCmp;
    return (a.book.title || "").localeCompare(b.book.title || "");
  }

  function buildFacetDefinitions(semesterIdsInOrder, semesterLabelById) {
    return [
      {
        id: "year",
        label: "Year",
        order: ["1", "2"],
        getValue: function (e) {
          return e.yearOfStudy === 999 ? "" : String(e.yearOfStudy);
        },
        getLabel: function (v) {
          return "Year " + v;
        }
      },
      {
        id: "semester",
        label: "Semester",
        order: semesterIdsInOrder,
        getValue: function (e) {
          return e.semesterId;
        },
        getLabel: function (v) {
          return semesterLabelById[v] || v;
        }
      },
      {
        id: "studyPeriod",
        label: "Study period",
        order: ["1", "2", "3", "4", "3-4"],
        getValue: function (e) {
          return e.studyPeriod;
        },
        getLabel: studyPeriodLabel
      },
      {
        id: "quarter",
        label: "Quarter",
        order: ["Q1", "Q2", "Q3", "Q4", "Q3–Q4"],
        getValue: function (e) {
          return e.quarterLabel;
        },
        getLabel: function (v) {
          return v;
        }
      },
      {
        id: "segment",
        label: "Subject segment",
        order: [],
        getValue: function (e) {
          return e.segment;
        },
        getLabel: segmentLabel
      },
      {
        id: "role",
        label: "Role",
        order: ["compulsory", "elective-option", "optional-non-degree", "thesis"],
        getValue: function (e) {
          return e.role;
        },
        getLabel: function (v) {
          return D().formatStatus(v);
        }
      }
    ];
  }

  function bookCardHtml(entry) {
    var book = entry.book;
    var esc = D().escapeHtml.bind(D());
    var id = book.id || entry.id;
    var href = D().resolvePageLink(
      "literature/" + encodeURIComponent(id) + ".html"
    );
    var cover = literatureCoverUrl(book);
    var title = book.title || "Untitled";
    var author = book.authorDisplay || (book.authors || []).join(", ");
    var category = entry.categories[0] || "";
    var coverInner = cover
      ? '<img class="literature-book__cover" src="' +
        esc(cover) +
        '" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;var w=this.parentElement;this.remove();if(w)w.classList.add(\'is-fallback\');" />'
      : "";

    return (
      '<a href="' +
      esc(href) +
      '" class="literature-book literature-book--link">' +
      (category
        ? '<p class="literature-book__caption">' + esc(category) + "</p>"
        : "") +
      '<div class="literature-book__cover-wrap' +
      (cover ? "" : " is-fallback") +
      '">' +
      coverInner +
      '<div class="literature-book__fallback" aria-hidden="true"><i class="fa-solid fa-book"></i></div>' +
      "</div>" +
      '<div class="literature-book__meta">' +
      "<h4>" +
      esc(title) +
      "</h4>" +
      (author ? '<p class="literature-book__byline">' + esc(author) + "</p>" : "") +
      (book.isbn
        ? '<p class="literature-book__isbn">' + esc(book.isbn) + "</p>"
        : "") +
      (entry.courseLabel
        ? '<p class="browser-book__courses">' + esc(entry.courseLabel) + "</p>"
        : "") +
      "</div></a>"
    );
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
          "<legend>" +
          D().escapeHtml(facet.label) +
          "</legend>" +
          '<div class="browser-facet__options">' +
          options
            .map(function (opt) {
              return (
                '<label class="browser-facet__option">' +
                '<input type="checkbox" data-facet="' +
                D().escapeHtml(facet.id) +
                '" value="' +
                D().escapeHtml(opt.value) +
                '">' +
                "<span>" +
                D().escapeHtml(opt.label) +
                "</span>" +
                '<span class="browser-facet__count">' +
                opt.count +
                "</span>" +
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
        "Showing <strong>" +
        filtered.length +
        "</strong> of " +
        entries.length +
        " book placements.";
    }

    groupsHost.setAttribute("aria-busy", "false");

    if (!filtered.length) {
      groupsHost.innerHTML =
        '<div class="empty-state"><p>No books match the selected filters.</p></div>';
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
        var heading =
          e.yearOfStudy === 999
            ? D().escapeHtml(e.courseLabel || "Unscheduled")
            : D().metaBadgeGroup([
                D().metaBadge("year", e.yearOfStudy),
                D().metaBadge("semester", e.semesterLabel),
                D().metaBadge("studyPeriod", e.studyPeriod),
                D().metaBadge("quarter", e.quarterLabel),
                D().metaBadge("week", e.weeksLabel)
              ]);

        return (
          '<div class="browser-group">' +
          '<h3 class="browser-group__heading">' +
          heading +
          "</h3>" +
          '<div class="browser-book-grid" role="list">' +
          group.items
            .map(function (entry) {
              return (
                '<div class="browser-book-grid__item" role="listitem">' +
                bookCardHtml(entry) +
                "</div>"
              );
            })
            .join("") +
          "</div></div>"
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

    var literatureData = await D().loadJson("data/literature.json");
    var coursesData = await D().loadJson("data/courses.json");
    var semestersData = await D().loadJson("data/semesters.json");
    var booksMap = (literatureData && literatureData.books) || {};
    var courses = (coursesData && coursesData.courses) || [];
    var semesters = (semestersData && semestersData.semesters) || [];

    var courseIndex = buildCourseIndex(courses, semesters);
    var entries = buildEntries(booksMap, courseIndex).sort(entrySortComparator);

    if (!entries.length) {
      groupsHost.innerHTML =
        '<div class="empty-state"><p>Literature catalogue unavailable.</p></div>';
      groupsHost.setAttribute("aria-busy", "false");
      return;
    }

    var semesterLabelById = {};
    var semesterIdsInOrder = [];
    semesters.forEach(function (semester) {
      semesterLabelById[semester.id] = semester.label;
      semesterIdsInOrder.push(semester.id);
    });

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
