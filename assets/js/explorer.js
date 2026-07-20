/**
 * Programme explorer — built only from programme.json, semesters.json, courses.json, sources.json.
 * No hardcoded programme hierarchy.
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  /** @type {object|null} */
  var state = {
    programme: null,
    semesters: [],
    coursesById: {},
    source: null,
    selected: null,
    tree: null
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

  /**
   * Build explorer tree from canonical JSON only.
   * @returns {object}
   */
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
          verificationStatus: semester.verificationStatus,
          academicYear: semester.academicYear,
          children: []
        };
      }
      var yearNode = years[y];
      if (semester.scheduleConfidence === "confirmed") {
        yearNode.scheduleConfidence = "confirmed";
      }
      yearNode.verificationStatus = semester.verificationStatus;
      yearNode.academicYear = yearNode.academicYear || semester.academicYear;

      var periodNodes = [];
      var periodMap = semester.periodMap || {};
      Object.keys(periodMap).forEach(function (periodKey) {
        var courseIds = periodMap[periodKey] || [];
        var electiveIds =
          (semester.electivePeriodMap && semester.electivePeriodMap[periodKey]) || [];
        var children = [];

        courseIds.forEach(function (id) {
          var course = coursesById[id];
          if (course) {
            children.push(courseNode(course));
          }
        });

        if (periodKey === "1" && semester.optionalCourseIds) {
          semester.optionalCourseIds.forEach(function (id) {
            var course = coursesById[id];
            if (course) {
              children.push(courseNode(course));
            }
          });
        }

        electiveIds.forEach(function (id) {
          var course = coursesById[id];
          if (course) {
            children.push(courseNode(course));
          }
        });

        periodNodes.push({
          id: semester.id + "-period-" + periodKey,
          type: "period",
          name: periodKey === "3-4" ? "Study periods 3–4" : "Study period " + periodKey,
          periodKey: periodKey,
          semesterId: semester.id,
          scheduleConfidence: semester.scheduleConfidence,
          verificationStatus: semester.verificationStatus,
          children: children
        });
      });

      yearNode.children.push({
        id: semester.id,
        type: "semester",
        name: semester.label,
        displayLabel: semester.displayLabel || semester.label,
        journeyStatus: semester.journeyStatus,
        scheduleConfidence: semester.scheduleConfidence,
        verificationStatus: semester.verificationStatus,
        academicYear: semester.academicYear,
        personalFocus: semester.personalFocus || "",
        notes: semester.notes || "",
        children: periodNodes
      });
    });

    return {
      id: "programme",
      type: "program",
      name: programme.shortName || programme.name,
      title: programme.name,
      programme: programme,
      children: Object.keys(years)
        .sort()
        .map(function (key) {
          return years[key];
        })
    };
  }

  function courseNode(course) {
    return {
      id: "course-" + course.code,
      type: "course",
      name: course.code,
      title: course.title,
      course: course
    };
  }

  function legendHtml() {
    return (
      '<div class="explorer-legend" aria-label="Legend">' +
      "<p><strong>Legend</strong></p>" +
      '<ul class="explorer-legend__list">' +
      '<li><span class="legend-swatch role-compulsory"></span> Compulsory</li>' +
      '<li><span class="legend-swatch role-elective"></span> Elective option</li>' +
      '<li><span class="legend-swatch role-optional"></span> Optional (non-degree)</li>' +
      '<li><span class="legend-swatch role-thesis"></span> Thesis</li>' +
      "</ul></div>"
    );
  }

  function findPath(node, targetId, path) {
    var next = (path || []).concat([node]);
    if (node.id === targetId) {
      return next;
    }
    var children = node.children || [];
    for (var i = 0; i < children.length; i += 1) {
      var found = findPath(children[i], targetId, next);
      if (found) {
        return found;
      }
    }
    return null;
  }

  function renderBreadcrumbs(path) {
    var host = document.getElementById("explorer-breadcrumbs");
    if (!host) {
      return;
    }
    if (!path || path.length === 0) {
      setHtml(host, "");
      return;
    }
    setHtml(
      host,
      '<nav aria-label="Explorer"><ol class="breadcrumb explorer-breadcrumb">' +
        path
          .map(function (node, index) {
            var label = node.title || node.displayLabel || node.name;
            if (index === path.length - 1) {
              return '<li aria-current="page">' + D().escapeHtml(label) + "</li>";
            }
            return (
              "<li><button type=\"button\" class=\"breadcrumb-btn\" data-select-id=\"" +
              D().escapeHtml(node.id) +
              '">' +
              D().escapeHtml(label) +
              "</button></li>"
            );
          })
          .join("") +
        "</ol></nav>"
    );
  }

  function detailsHtml(node) {
    if (!node) {
      return '<div class="empty-state"><p>Select a programme, year, semester, study period, or course to view details.</p></div>';
    }

    if (node.type === "program") {
      var p = node.programme || state.programme;
      var totals = p.totals || {};
      return (
        '<div class="details-card">' +
        '<p class="zone-label">Official LTU information</p>' +
        "<h2>" +
        D().escapeHtml(p.name) +
        "</h2>" +
        "<p>" +
        D().escapeHtml(p.institution) +
        " · " +
        D().escapeHtml(p.startDate) +
        " – " +
        D().escapeHtml(p.endDate) +
        "</p>" +
        '<dl class="meta-list">' +
        "<div><dt>Total</dt><dd>" +
        D().escapeHtml(String(totals.degreeEcts)) +
        " ECTS</dd></div>" +
        "<div><dt>Compulsory</dt><dd>" +
        D().escapeHtml(String(totals.compulsoryEcts)) +
        " ECTS</dd></div>" +
        "<div><dt>Electives</dt><dd>" +
        D().escapeHtml(String(totals.electiveRequirementEcts)) +
        " ECTS</dd></div>" +
        "<div><dt>Thesis</dt><dd>" +
        D().escapeHtml(String(totals.thesisEcts)) +
        " ECTS</dd></div></dl>" +
        "<p>Electives are alternatives toward 15 ECTS (normally two courses). Optional Swedish is outside the degree.</p></div>"
      );
    }

    if (node.type === "year") {
      return (
        '<div class="details-card">' +
        '<p class="zone-label">Official LTU information</p>' +
        "<h2>" +
        D().escapeHtml(node.name) +
        "</h2>" +
        "<p>Academic year context: " +
        D().escapeHtml(node.academicYear || "—") +
        "</p><div class=\"card__meta\">" +
        D().statusBadge(node.scheduleConfidence) +
        "</div><p>" +
        D().escapeHtml(D().formatStatus(node.verificationStatus)) +
        "</p></div>"
      );
    }

    if (node.type === "semester") {
      return (
        '<div class="details-card">' +
        '<p class="zone-label">Official LTU information</p>' +
        "<h2>" +
        D().escapeHtml(node.displayLabel || node.name) +
        "</h2>" +
        '<div class="card__meta">' +
        D().statusBadge(node.journeyStatus) +
        D().statusBadge(node.scheduleConfidence) +
        "</div><p>Academic year " +
        D().escapeHtml(node.academicYear) +
        "</p>" +
        (node.personalFocus
          ? '<p class="zone-label">My personal note</p><p>' +
            D().escapeHtml(node.personalFocus) +
            "</p>"
          : "") +
        (node.notes ? "<p>" + D().escapeHtml(node.notes) + "</p>" : "") +
        "</div>"
      );
    }

    if (node.type === "period") {
      var list =
        (node.children || [])
          .map(function (child) {
            var c = child.course;
            return (
              "<li><strong>" +
              D().escapeHtml(child.name) +
              "</strong> — " +
              D().escapeHtml(c ? c.title : child.title || "") +
              (c && c.role === "elective-option" ? " <em>(elective option)</em>" : "") +
              "</li>"
            );
          })
          .join("") || "<li>No courses listed.</li>";
      return (
        '<div class="details-card">' +
        '<p class="zone-label">Official LTU information</p>' +
        "<h2>" +
        D().escapeHtml(node.name) +
        "</h2>" +
        '<div class="card__meta">' +
        D().statusBadge(node.scheduleConfidence) +
        "</div><ul>" +
        list +
        "</ul>" +
        "<p>Elective options shown here are alternatives, not a personal enrolment list.</p></div>"
      );
    }

    if (node.type === "course" && node.course) {
      var course = node.course;
      var periodLabel =
        course.studyPeriod == null ? "—" : "Study period " + course.studyPeriod;
      var officialLink = course.officialCourseUrl
        ? '<a class="btn btn--secondary" href="' +
          D().escapeHtml(course.officialCourseUrl) +
          '" rel="noopener noreferrer" target="_blank">View official LTU course page</a>'
        : "";
      var syllabusLink =
        course.officialSyllabusUrl
          ? '<a class="btn btn--ghost" href="' +
            D().escapeHtml(course.officialSyllabusUrl) +
            '" rel="noopener noreferrer" target="_blank">View official syllabus</a>'
          : "";
      var contacts = Array.isArray(course.publicContacts) ? course.publicContacts : [];
      var contactsHtml = contacts.length
        ? '<p class="callout">Course contacts may change. Verify through the current official LTU course page.</p><ul>' +
          contacts
            .map(function (contact) {
              return (
                "<li><a href=\"" +
                D().escapeHtml(contact.profileUrl) +
                '" rel="noopener noreferrer" target="_blank">' +
                D().escapeHtml(contact.name) +
                "</a> · " +
                D().escapeHtml(contact.role || "Listed course contact") +
                "</li>"
              );
            })
            .join("") +
          "</ul>"
        : "<p>No public profile contacts listed for this course yet.</p>";

      return (
        '<div class="details-card ' +
        roleClass(course.role) +
        '">' +
        '<p class="zone-label">Official LTU information</p>' +
        "<h2>" +
        D().escapeHtml(course.title) +
        "</h2>" +
        '<div class="card__meta">' +
        D().statusBadge(course.myStatus) +
        D().statusBadge(course.scheduleConfidence) +
        '<span class="badge">' +
        D().escapeHtml(D().formatStatus(course.role)) +
        "</span></div>" +
        '<dl class="meta-list">' +
        "<div><dt>Code</dt><dd>" +
        D().escapeHtml(course.code) +
        "</dd></div>" +
        "<div><dt>ECTS</dt><dd>" +
        D().escapeHtml(String(course.ects)) +
        "</dd></div>" +
        "<div><dt>Level</dt><dd>" +
        D().escapeHtml(course.level) +
        "</dd></div>" +
        "<div><dt>Schedule</dt><dd>" +
        D().escapeHtml(periodLabel) +
        " · " +
        D().escapeHtml(course.academicYear || "") +
        "</dd></div>" +
        (course.role === "elective-option"
          ? "<div><dt>Selection</dt><dd>" +
            D().escapeHtml(D().formatStatus(course.selectionStatus || "not-selected")) +
            "</dd></div>"
          : "") +
        (course.role === "optional-non-degree"
          ? "<div><dt>Degree</dt><dd>Outside the 120 ECTS total</dd></div>"
          : "") +
        "</dl>" +
        '<div class="hero__actions">' +
        '<a class="btn btn--primary" href="' +
        D().escapeHtml(D().courseHubUrl(course.code)) +
        '">Open course hub</a>' +
        officialLink +
        syllabusLink +
        "</div>" +
        "<h3>Listed course contacts</h3>" +
        contactsHtml +
        "</div>"
      );
    }

    return '<div class="empty-state"><p>No details available for this selection.</p></div>';
  }

  function renderDetails() {
    setHtml(document.getElementById("explorer-details"), detailsHtml(state.selected));
    setHtml(document.getElementById("explorer-details-mobile"), detailsHtml(state.selected));
  }

  function selectNode(node) {
    state.selected = node;
    var path = findPath(state.tree, node.id) || [state.tree];
    renderBreadcrumbs(path);
    renderTree();
    renderAccordion();
    renderDetails();
  }

  function renderTreeNode(node, depth) {
    var selected = state.selected && state.selected.id === node.id;
    var label = node.title || node.displayLabel || node.name;
    var extra = "";
    if (node.type === "course" && node.course) {
      extra = roleClass(node.course.role);
      label = node.course.code + " · " + node.course.title;
    }
    var children = node.children || [];
    var hasChildren = children.length > 0;
    var html =
      '<li class="explorer-node ' +
      extra +
      (selected ? " is-selected" : "") +
      '" style="--depth:' +
      depth +
      '">' +
      '<button type="button" class="explorer-node__btn" data-select-id="' +
      D().escapeHtml(node.id) +
      '" aria-current="' +
      (selected ? "true" : "false") +
      '"><span class="explorer-node__label">' +
      D().escapeHtml(label) +
      "</span>" +
      (node.scheduleConfidence
        ? D().statusBadge(node.scheduleConfidence)
        : node.course
          ? D().statusBadge(node.course.myStatus)
          : "") +
      "</button>";
    if (hasChildren) {
      html +=
        '<ul class="explorer-node__children" role="group">' +
        children
          .map(function (child) {
            return renderTreeNode(child, depth + 1);
          })
          .join("") +
        "</ul>";
    }
    html += "</li>";
    return html;
  }

  function renderTree() {
    var host = document.getElementById("explorer-tree");
    if (!host || !state.tree) {
      return;
    }
    setHtml(
      host,
      '<ul class="explorer-tree" role="list" aria-label="Programme structure">' +
        renderTreeNode(state.tree, 0) +
        "</ul>" +
        legendHtml()
    );
  }

  function renderAccordion() {
    var host = document.getElementById("explorer-accordion");
    if (!host || !state.tree) {
      return;
    }
    var years = state.tree.children || [];
    setHtml(
      host,
      years
        .map(function (year) {
          return (
            '<details class="explorer-acc" data-node-id="' +
            D().escapeHtml(year.id) +
            '"><summary>' +
            D().escapeHtml(year.name) +
            " " +
            D().statusBadge(year.scheduleConfidence) +
            "</summary>" +
            (year.children || [])
              .map(function (semester) {
                return (
                  '<details class="explorer-acc explorer-acc--nested" data-node-id="' +
                  D().escapeHtml(semester.id) +
                  '"><summary>' +
                  D().escapeHtml(semester.name) +
                  " " +
                  D().statusBadge(semester.journeyStatus) +
                  "</summary>" +
                  (semester.children || [])
                    .map(function (period) {
                      return (
                        '<div class="explorer-acc-period"><button type="button" class="explorer-node__btn" data-select-id="' +
                        D().escapeHtml(period.id) +
                        '">' +
                        D().escapeHtml(period.name) +
                        "</button><ul>" +
                        (period.children || [])
                          .map(function (courseNodeItem) {
                            var c = courseNodeItem.course;
                            return (
                              "<li><button type=\"button\" class=\"explorer-node__btn " +
                              roleClass(c.role) +
                              '" data-select-id="' +
                              D().escapeHtml(courseNodeItem.id) +
                              '">' +
                              D().escapeHtml(c.code + " · " + c.title) +
                              " " +
                              D().statusBadge(c.myStatus) +
                              "</button></li>"
                            );
                          })
                          .join("") +
                        "</ul></div>"
                      );
                    })
                    .join("") +
                  "</details>"
                );
              })
              .join("") +
            "</details>"
          );
        })
        .join("") +
        legendHtml()
    );
  }

  function findNodeById(node, id) {
    if (!node) {
      return null;
    }
    if (node.id === id) {
      return node;
    }
    var children = node.children || [];
    for (var i = 0; i < children.length; i += 1) {
      var found = findNodeById(children[i], id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  function bindEvents() {
    var root = document.getElementById("programme-explorer");
    if (!root) {
      return;
    }
    root.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      var btn = target.closest("[data-select-id]");
      if (!btn) {
        return;
      }
      var id = btn.getAttribute("data-select-id");
      var node = findNodeById(state.tree, id);
      if (node) {
        selectNode(node);
      }
    });

    root.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        selectNode(state.tree);
        return;
      }
      var target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if ((event.key === "Enter" || event.key === " ") && target.matches("[data-select-id]")) {
        event.preventDefault();
        var id = target.getAttribute("data-select-id");
        var node = findNodeById(state.tree, id);
        if (node) {
          selectNode(node);
        }
      }
    });
  }

  async function initExplorer() {
    var root = document.getElementById("programme-explorer");
    if (!root) {
      return;
    }

    var programme = await D().loadJson("data/programme.json");
    var semestersData = await D().loadJson("data/semesters.json");
    var coursesData = await D().loadJson("data/courses.json");
    var sourcesData = await D().loadJson("data/sources.json");

    if (!programme || !semestersData || !coursesData) {
      setHtml(
        root,
        '<div class="empty-state"><p>Programme explorer could not load canonical JSON data.</p></div>'
      );
      return;
    }

    state.programme = programme;
    state.semesters = semestersData.semesters || [];
    state.coursesById = D().indexById(coursesData.courses || []);
    state.source =
      sourcesData && sourcesData.sources
        ? sourcesData.sources.find(function (item) {
            return item.id === programme.sourceId;
          })
        : null;
    state.tree = buildTree(programme, state.semesters, state.coursesById);
    state.selected = state.tree;

    bindEvents();
    selectNode(state.tree);

    var count = (coursesData.courses || []).length;
    var meta = document.getElementById("explorer-meta");
    if (meta) {
      meta.textContent =
        count +
        " programme items loaded from JSON · Year 1 confirmed · Year 2 planned · electives are alternatives";
    }
  }

  document.addEventListener("DOMContentLoaded", initExplorer);
})();
