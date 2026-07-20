/**
 * Page-specific rendering for the Applied AI Learning Hub.
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  function F() {
    return window.AailhFilters;
  }

  /**
   * @param {HTMLElement|null} el
   * @param {string} html
   */
  function setHtml(el, html) {
    if (el) {
      el.innerHTML = html;
    }
  }

  /**
   * @param {object[]} courses
   * @param {string[]} ids
   * @returns {object[]}
   */
  function pickCourses(courses, ids) {
    var map = D().indexById(courses);
    return (ids || [])
      .map(function (id) {
        return map[id];
      })
      .filter(Boolean);
  }

  /**
   * @param {object} project
   * @returns {string}
   */
  function projectCard(project) {
    var escapeHtml = D().escapeHtml;
    var resolvePageLink = D().resolvePageLink;
    var links = [];
    if (project.caseStudyUrl) {
      links.push('<a href="' + escapeHtml(resolvePageLink(project.caseStudyUrl)) + '">Case study</a>');
    }
    if (project.repoUrl) {
      links.push(
        '<a href="' +
          escapeHtml(project.repoUrl) +
          '" rel="noopener noreferrer" target="_blank">Repository</a>'
      );
    }
    if (project.demoUrl) {
      links.push(
        '<a href="' +
          escapeHtml(project.demoUrl) +
          '" rel="noopener noreferrer" target="_blank">Live demo</a>'
      );
    }

    return (
      '<article class="card">' +
      '<div class="card__meta">' +
      D().statusBadge(project.status) +
      '<span class="badge">' +
      escapeHtml(project.category || "Project") +
      "</span>" +
      (project.privacySafe
        ? '<span class="badge badge--completed" title="Reviewed for public-safe content"><span class="sr-only">Privacy: </span>Privacy-safe</span>'
        : "") +
      "</div>" +
      "<h3>" +
      escapeHtml(project.title) +
      "</h3>" +
      "<p>" +
      escapeHtml(project.summary || "") +
      "</p>" +
      D().tagList(project.skills || []) +
      (links.length ? '<div class="card__actions">' + links.join("") + "</div>" : "") +
      "</article>"
    );
  }

  /**
   * @param {object} course
   * @returns {string}
   */
  function courseCard(course) {
    var escapeHtml = D().escapeHtml;
    var ects = course.ects == null ? "—" : course.ects + " ECTS";
    var period =
      course.studyPeriod == null ? "—" : "Study period " + course.studyPeriod;
    var hub = D().courseHubUrl(course.code || course.id);
    var verify =
      course.officialCourseUrl
        ? '<a href="' +
          D().escapeHtml(course.officialCourseUrl) +
          '" rel="noopener noreferrer" target="_blank">Verify on LTU</a>'
        : "";

    return (
      '<article class="card" data-course-id="' +
      escapeHtml(course.id) +
      '">' +
      '<div class="card__meta">' +
      D().statusBadge(course.myStatus) +
      D().statusBadge(course.scheduleConfidence) +
      '<span class="badge">' +
      escapeHtml(D().formatStatus(course.role || course.category || "Course")) +
      "</span></div>" +
      "<h3>" +
      escapeHtml(course.title) +
      "</h3>" +
      "<p>" +
      escapeHtml(course.summary || "") +
      "</p>" +
      '<dl class="meta-list meta-list--flush">' +
      "<div><dt>Code</dt><dd>" +
      escapeHtml(course.code || "—") +
      "</dd></div>" +
      "<div><dt>Level</dt><dd>" +
      escapeHtml(course.level || "—") +
      "</dd></div>" +
      "<div><dt>Period</dt><dd>" +
      escapeHtml(period) +
      "</dd></div>" +
      "<div><dt>Extent</dt><dd>" +
      escapeHtml(ects) +
      "</dd></div>" +
      "</dl>" +
      '<div class="card__actions"><a href="' +
      escapeHtml(hub) +
      '">Open course hub</a>' +
      verify +
      "</div></article>"
    );
  }

  /**
   * @param {string} title
   * @param {string} intro
   * @param {object[]} courses
   * @returns {string}
   */
  function courseSection(title, intro, courses) {
    if (!courses || courses.length === 0) {
      return "";
    }
    return (
      '<section class="catalogue-section"><h2 class="section-title">' +
      D().escapeHtml(title) +
      "</h2><p>" +
      D().escapeHtml(intro) +
      '</p><div class="card-grid">' +
      courses.map(courseCard).join("") +
      "</div></section>"
    );
  }

  /**
   * @param {object} post
   * @returns {string}
   */
  function postCard(post) {
    var escapeHtml = D().escapeHtml;
    var resolvePageLink = D().resolvePageLink;
    return (
      '<article class="card">' +
      '<div class="card__meta"><span class="badge">' +
      escapeHtml(post.category || "Note") +
      "</span><span>" +
      escapeHtml(post.published || "") +
      "</span></div>" +
      "<h3>" +
      escapeHtml(post.title) +
      "</h3>" +
      "<p>" +
      escapeHtml(post.summary || "") +
      "</p>" +
      '<div class="card__actions"><a href="' +
      escapeHtml(resolvePageLink(post.url || "blog.html")) +
      '">Read note · ' +
      escapeHtml(post.readingTime || "") +
      "</a></div></article>"
    );
  }

  async function renderHome() {
    var semesterEl = document.getElementById("home-semester");
    var focusCoursesEl = document.getElementById("home-focus-courses");
    var projectsEl = document.getElementById("featured-projects");
    var postsEl = document.getElementById("latest-posts");
    if (!semesterEl && !focusCoursesEl && !projectsEl && !postsEl) {
      return;
    }

    var semestersData = await D().loadJson("data/semesters.json");
    var coursesData = await D().loadJson("data/courses.json");
    var courses = coursesData && coursesData.courses ? coursesData.courses : [];
    var homepageId =
      (semestersData && semestersData.meta && semestersData.meta.homepageSemesterId) ||
      "autumn-2026";
    var semester =
      semestersData && semestersData.semesters
        ? semestersData.semesters.find(function (item) {
            return item.id === homepageId;
          })
        : null;

    if (semesterEl && semester) {
      setHtml(
        semesterEl,
        '<div class="semester-panel">' +
          '<div class="card__meta">' +
          D().statusBadge(semester.journeyStatus) +
          D().statusBadge(semester.scheduleConfidence) +
          '<span class="badge">Year ' +
          D().escapeHtml(String(semester.yearOfStudy)) +
          "</span></div>" +
          "<h2>" +
          D().escapeHtml(semester.displayLabel || semester.label) +
          "</h2>" +
          "<p>" +
          D().escapeHtml(
            semester.personalFocus ||
              "Semester focus will be updated as learning progresses."
          ) +
          "</p>" +
          "<p>Academic year " +
          D().escapeHtml(semester.academicYear) +
          " · Study periods " +
          D().escapeHtml((semester.studyPeriods || []).join(" & ")) +
          " · " +
          D().escapeHtml(D().formatStatus(semester.verificationStatus)) +
          "</p></div>"
      );
    }

    if (focusCoursesEl && semester) {
      var focusIds = (semester.periodMap && semester.periodMap["1"]) || [];
      var focusCourses = pickCourses(courses, focusIds);
      if (focusCourses.length === 0) {
        setHtml(
          focusCoursesEl,
          '<div class="empty-state"><p>No upcoming study-period courses found.</p></div>'
        );
      } else {
        setHtml(
          focusCoursesEl,
          '<div class="card-grid">' + focusCourses.map(courseCard).join("") + "</div>"
        );
      }
    }

    if (projectsEl) {
      var projectsDataHome = await D().loadJson("data/projects.json");
      var featured = (projectsDataHome && projectsDataHome.projects
        ? projectsDataHome.projects
        : []
      )
        .filter(function (p) {
          return p.featured;
        })
        .slice(0, 3);
      if (featured.length === 0) {
        setHtml(projectsEl, '<div class="empty-state"><p>Featured projects will appear here soon.</p></div>');
      } else {
        setHtml(projectsEl, '<div class="card-grid">' + featured.map(projectCard).join("") + "</div>");
      }
    }

    if (postsEl) {
      var blogData = await D().loadJson("data/blog.json");
      var posts = (blogData && blogData.posts ? blogData.posts : []).slice(0, 3);
      if (posts.length === 0) {
        setHtml(postsEl, '<div class="empty-state"><p>Learning notes will appear here as they are published.</p></div>');
      } else {
        setHtml(postsEl, '<div class="card-grid">' + posts.map(postCard).join("") + "</div>");
      }
    }
  }

  async function renderCoursesPage() {
    var list = document.getElementById("courses-catalogue");
    if (!list) {
      return;
    }

    var coursesData = await D().loadJson("data/courses.json");
    var semestersData = await D().loadJson("data/semesters.json");
    var programmeData = await D().loadJson("data/programme.json");
    var courses = coursesData && coursesData.courses ? coursesData.courses : [];
    var homepageId =
      (semestersData && semestersData.meta && semestersData.meta.homepageSemesterId) ||
      "autumn-2026";
    var semester =
      semestersData && semestersData.semesters
        ? semestersData.semesters.find(function (item) {
            return item.id === homepageId;
          })
        : null;

    var totals = programmeData && programmeData.totals ? programmeData.totals : {};
    var totalsEl = document.getElementById("courses-totals");
    if (totalsEl) {
      setHtml(
        totalsEl,
        '<dl class="fact-strip">' +
          "<div><dt>Compulsory</dt><dd>" +
          D().escapeHtml(String(totals.compulsoryEcts || 75)) +
          " ECTS</dd></div>" +
          "<div><dt>Electives required</dt><dd>" +
          D().escapeHtml(String(totals.electiveRequirementEcts || 15)) +
          " ECTS</dd></div>" +
          "<div><dt>Thesis</dt><dd>" +
          D().escapeHtml(String(totals.thesisEcts || 30)) +
          " ECTS</dd></div>" +
          "<div><dt>Degree total</dt><dd>" +
          D().escapeHtml(String(totals.degreeEcts || 120)) +
          " ECTS</dd></div></dl>"
      );
    }

    var html = "";
    if (semester) {
      var period1 = semester.periodMap ? semester.periodMap["1"] || [] : [];
      var period2 = semester.periodMap ? semester.periodMap["2"] || [] : [];
      html +=
        '<section class="catalogue-section"><h2 class="section-title">' +
        D().escapeHtml(semester.displayLabel || "Upcoming semester") +
        "</h2><p>Schedule confidence: " +
        D().escapeHtml(semester.scheduleConfidence) +
        ". Study period 1 focus courses are listed first. Optional Swedish is shown separately and is not part of the degree total.</p>";
      html +=
        '<h3>Study period 1</h3><div class="card-grid">' +
        pickCourses(courses, period1).map(courseCard).join("") +
        "</div>";
      if (period2.length) {
        html +=
          '<h3>Study period 2</h3><div class="card-grid">' +
          pickCourses(courses, period2).map(courseCard).join("") +
          "</div>";
      }
      html += "</section>";
    }

    var compulsory = courses.filter(function (c) {
      return c.role === "compulsory";
    });
    var electives = courses.filter(function (c) {
      return c.role === "elective-option";
    });
    var thesis = courses.filter(function (c) {
      return c.role === "thesis";
    });
    var optional = courses.filter(function (c) {
      return c.role === "optional-non-degree";
    });

    html += courseSection(
      "Compulsory courses",
      "75 ECTS of compulsory coursework across the programme.",
      compulsory
    );
    html += courseSection(
      "Elective options",
      "Alternatives toward the 15 ECTS elective requirement (normally two courses). Not all will be taken. Selection status: not selected.",
      electives
    );
    html += courseSection(
      "Master thesis",
      "30 ECTS thesis component. Topic not selected. Entry requirements apply.",
      thesis
    );
    html += courseSection(
      "Optional non-degree course",
      "Outside the 120 ECTS degree. Not selected.",
      optional
    );

    setHtml(list, html || '<div class="empty-state"><p>Course catalogue could not be loaded.</p></div>');
  }

  async function renderProgrammePage() {
    var host = document.getElementById("programme-overview");
    if (!host) {
      return;
    }
    var programme = await D().loadJson("data/programme.json");
    var sources = await D().loadJson("data/sources.json");
    var semesters = await D().loadJson("data/semesters.json");
    if (!programme) {
      setHtml(host, '<div class="empty-state"><p>Programme data could not be loaded.</p></div>');
      return;
    }
    var source =
      sources && sources.sources
        ? sources.sources.find(function (item) {
            return item.id === programme.sourceId;
          })
        : null;
    var totals = programme.totals || {};
    var semesterHtml =
      semesters && semesters.semesters
        ? '<div class="card-grid">' +
          semesters.semesters
            .map(function (semester) {
              return (
                '<article class="card"><div class="card__meta">' +
                D().statusBadge(semester.journeyStatus) +
                D().statusBadge(semester.scheduleConfidence) +
                "</div><h3>" +
                D().escapeHtml(semester.label) +
                "</h3><p>Year " +
                D().escapeHtml(String(semester.yearOfStudy)) +
                " · " +
                D().escapeHtml(semester.academicYear) +
                "</p><p>" +
                D().escapeHtml(D().formatStatus(semester.verificationStatus)) +
                "</p>" +
                (semester.notes ? "<p>" + D().escapeHtml(semester.notes) + "</p>" : "") +
                "</article>"
              );
            })
            .join("") +
          "</div>"
        : "";

    var delivery = programme.delivery || {};
    var admission = programme.admissionCycle || {};
    var officialLinks = Array.isArray(programme.officialLinks) ? programme.officialLinks : [];
    var distance = programme.distanceStudy || {};
    var exams = programme.examinations || {};
    var thesisDistance = programme.thesisAtDistance || {};

    function proseBlock(block) {
      if (!block || !block.title) {
        return "";
      }
      return (
        "<section class=\"catalogue-section\"><h2>" +
        D().escapeHtml(block.title) +
        "</h2>" +
        (block.paragraphs || [])
          .map(function (paragraph) {
            return "<p>" + D().escapeHtml(paragraph) + "</p>";
          })
          .join("") +
        (block.caveat ? "<p><em>" + D().escapeHtml(block.caveat) + "</em></p>" : "") +
        "</section>"
      );
    }

    var linksHtml =
      '<section class="catalogue-section"><h2>Official LTU links</h2><ul>' +
      officialLinks
        .map(function (link) {
          return (
            "<li><a href=\"" +
            D().escapeHtml(link.url) +
            '" rel="noopener noreferrer" target="_blank">' +
            D().escapeHtml(link.label) +
            "</a>" +
            (link.note ? " — " + D().escapeHtml(link.note) : "") +
            " · Verified " +
            D().escapeHtml(link.lastVerified || "—") +
            "</li>"
          );
        })
        .join("") +
      "</ul></section>";

    setHtml(
      host,
      '<dl class="meta-list">' +
        "<div><dt>Programme</dt><dd>" +
        D().escapeHtml(programme.name) +
        "</dd></div>" +
        "<div><dt>Programme code</dt><dd>" +
        D().escapeHtml(programme.programmeCode || "—") +
        "</dd></div>" +
        "<div><dt>Institution</dt><dd>" +
        D().escapeHtml(programme.institution) +
        "</dd></div>" +
        "<div><dt>Enrollment</dt><dd>" +
        D().escapeHtml(programme.enrollmentSemester) +
        "</dd></div>" +
        "<div><dt>Start</dt><dd>" +
        D().escapeHtml(programme.startDate || programme.programmeStart) +
        "</dd></div>" +
        "<div><dt>End</dt><dd>" +
        D().escapeHtml(programme.endDate || "—") +
        "</dd></div>" +
        "<div><dt>Duration</dt><dd>" +
        D().escapeHtml(String(programme.durationYears || 2)) +
        " years</dd></div>" +
        "<div><dt>Delivery</dt><dd>" +
        D().escapeHtml(delivery.mode || "—") +
        "</dd></div>" +
        "<div><dt>Study pace</dt><dd>" +
        D().escapeHtml(delivery.studyPace || "—") +
        "</dd></div>" +
        "<div><dt>Teaching time</dt><dd>" +
        D().escapeHtml(delivery.instructionalTime || "—") +
        "</dd></div>" +
        "<div><dt>Language</dt><dd>" +
        D().escapeHtml(delivery.language || "—") +
        "</dd></div>" +
        "<div><dt>Location</dt><dd>" +
        D().escapeHtml(delivery.location || "—") +
        "</dd></div>" +
        "<div><dt>Compulsory gatherings (first semester)</dt><dd>" +
        D().escapeHtml(String(delivery.compulsoryGatheringsFirstSemester)) +
        "</dd></div>" +
        "<div><dt>Gatherings note</dt><dd>" +
        D().escapeHtml(delivery.gatheringNote || "—") +
        "</dd></div>" +
        "<div><dt>Compulsory</dt><dd>" +
        D().escapeHtml(String(totals.compulsoryEcts)) +
        " ECTS</dd></div>" +
        "<div><dt>Electives</dt><dd>" +
        D().escapeHtml(String(totals.electiveRequirementEcts)) +
        " ECTS</dd></div>" +
        "<div><dt>Thesis</dt><dd>" +
        D().escapeHtml(String(totals.thesisEcts)) +
        " ECTS</dd></div>" +
        "<div><dt>Degree total</dt><dd>" +
        D().escapeHtml(String(totals.degreeEcts)) +
        " ECTS</dd></div></dl>" +
        '<section class="catalogue-section"><h2>Admission-cycle information</h2>' +
        "<p>" +
        D().escapeHtml(admission.cycleLabel || "Admission-cycle facts for this intake.") +
        "</p>" +
        '<dl class="meta-list">' +
        "<div><dt>Application code</dt><dd>" +
        D().escapeHtml(String(admission.applicationCode || "—")) +
        "</dd></div>" +
        "<div><dt>Number of places</dt><dd>" +
        D().escapeHtml(String(admission.numberOfPlaces || "—")) +
        "</dd></div></dl>" +
        "<p><em>" +
        D().escapeHtml(admission.note || "") +
        "</em></p></section>" +
        linksHtml +
        proseBlock(distance) +
        proseBlock(exams) +
        proseBlock(thesisDistance) +
        "<h2>Semester overview</h2>" +
        semesterHtml +
        (source
          ? "<h2>Source</h2><p>" +
            D().escapeHtml(source.sourceTitle) +
            " · " +
            D().escapeHtml(source.sourceReference) +
            " · Decision " +
            D().escapeHtml(source.sourceDate) +
            " · Verified " +
            D().escapeHtml(source.verifiedDate) +
            "</p>"
          : "")
    );
  }

  async function renderProjectsPage() {
    var list = document.getElementById("projects-list");
    if (!list) {
      return;
    }

    var data = await D().loadJson("data/projects.json");
    var projects = data && Array.isArray(data.projects) ? data.projects : [];
    var search = document.getElementById("project-search");
    var status = document.getElementById("project-status");
    var category = document.getElementById("project-category");
    var meta = document.getElementById("projects-meta");

    F().fillSelect(
      status,
      projects.map(function (p) {
        return p.status;
      }),
      "All statuses"
    );
    F().fillSelect(
      category,
      projects.map(function (p) {
        return p.category;
      }),
      "All categories"
    );

    function apply() {
      var query = search ? search.value.trim() : "";
      var filtered = projects.filter(function (project) {
        return (
          (!status || !status.value || project.status === status.value) &&
          (!category || !category.value || project.category === category.value) &&
          F().matchesQuery(project, query, ["title", "summary", "category", "skills", "methods"])
        );
      });

      if (meta) {
        meta.textContent =
          filtered.length + " project" + (filtered.length === 1 ? "" : "s") + " shown";
      }

      if (filtered.length === 0) {
        setHtml(list, '<div class="empty-state"><p>No projects match the current filters.</p></div>');
        return;
      }
      setHtml(list, '<div class="card-grid">' + filtered.map(projectCard).join("") + "</div>");
    }

    [search, status, category].forEach(function (el) {
      if (!el) {
        return;
      }
      el.addEventListener("input", apply);
      el.addEventListener("change", apply);
    });

    apply();
  }

  async function renderBlogPage() {
    var list = document.getElementById("blog-list");
    if (!list) {
      return;
    }
    var data = await D().loadJson("data/blog.json");
    var posts = data && Array.isArray(data.posts) ? data.posts : [];
    if (posts.length === 0) {
      setHtml(list, '<div class="empty-state"><p>No public learning notes have been published yet.</p></div>');
      return;
    }
    setHtml(list, '<div class="card-grid">' + posts.map(postCard).join("") + "</div>");
  }

  async function renderSkills() {
    var host = document.getElementById("skills-list");
    if (!host) {
      return;
    }
    var data = await D().loadJson("data/skills.json");
    if (!data || !data.groups) {
      setHtml(host, '<div class="empty-state"><p>Skills data could not be loaded.</p></div>');
      return;
    }
    setHtml(
      host,
      data.groups
        .map(function (group) {
          return (
            '<section class="skill-group" aria-labelledby="skill-' +
            D().escapeHtml(group.id) +
            '"><h3 id="skill-' +
            D().escapeHtml(group.id) +
            '">' +
            D().escapeHtml(group.title) +
            '</h3><ul class="skill-list">' +
            (group.skills || [])
              .map(function (skill) {
                return (
                  '<li class="skill-item"><span>' +
                  D().escapeHtml(skill.name) +
                  "</span>" +
                  D().statusBadge(String(skill.level).toLowerCase().replace(/\s+/g, "-")) +
                  "</li>"
                );
              })
              .join("") +
            "</ul></section>"
          );
        })
        .join("")
    );
  }

  async function renderRoadmap() {
    var host = document.getElementById("roadmap-list");
    if (!host) {
      return;
    }
    var data = await D().loadJson("data/roadmap.json");
    if (!data || !data.stages) {
      setHtml(host, '<div class="empty-state"><p>Roadmap data could not be loaded.</p></div>');
      return;
    }
    setHtml(
      host,
      '<div class="roadmap">' +
        data.stages
          .map(function (stage) {
            return (
              '<section class="roadmap-stage"><h3>' +
              D().escapeHtml(stage.title) +
              "</h3><p>" +
              D().escapeHtml(stage.summary) +
              '</p><ul class="roadmap-items">' +
              (stage.items || [])
                .map(function (item) {
                  return (
                    "<li><span>" +
                    D().escapeHtml(item.name) +
                    "</span>" +
                    D().statusBadge(item.status) +
                    "</li>"
                  );
                })
                .join("") +
              "</ul></section>"
            );
          })
          .join("") +
        "</div>"
    );
  }

  async function renderTimeline() {
    var host = document.getElementById("timeline-list");
    if (!host) {
      return;
    }
    var data = await D().loadJson("data/timeline.json");
    if (!data || !data.milestones) {
      setHtml(host, '<div class="empty-state"><p>Timeline data could not be loaded.</p></div>');
      return;
    }
    setHtml(
      host,
      '<ol class="timeline">' +
        data.milestones
          .map(function (item) {
            return (
              "<li><span class=\"timeline__date\">" +
              D().escapeHtml(item.date) +
              "</span><strong>" +
              D().escapeHtml(item.title) +
              "</strong><p>" +
              D().escapeHtml(item.description) +
              "</p>" +
              D().statusBadge(item.status) +
              "</li>"
            );
          })
          .join("") +
        "</ol>"
    );
  }

  async function renderResources() {
    var host = document.getElementById("resources-list");
    if (!host) {
      return;
    }
    var data = await D().loadJson("data/course-resources.json");
    var resources = data && Array.isArray(data.resources) ? data.resources : [];
    if (resources.length === 0) {
      setHtml(
        host,
        '<div class="empty-state"><p>Course-linked resources will appear here as they are curated.</p></div>'
      );
      return;
    }
    setHtml(
      host,
      '<p class="lead">Resources are attached to courses rather than kept as a generic library.</p><div class="card-grid">' +
        resources
          .map(function (resource) {
            var link = resource.url
              ? '<a href="' +
                D().escapeHtml(resource.url) +
                '" rel="noopener noreferrer" target="_blank">Open resource</a>'
              : "<span>Link to be verified</span>";
            var courses = (resource.courseIds || []).join(", ");
            return (
              '<article class="card"><div class="card__meta">' +
              D().statusBadge(String(resource.status || "").toLowerCase().replace(/\s+/g, "-")) +
              '<span class="badge">' +
              D().escapeHtml(resource.recommendedStage || "") +
              "</span></div><h3>" +
              D().escapeHtml(resource.title) +
              "</h3><p>" +
              D().escapeHtml(resource.description) +
              "</p><p>Courses: " +
              D().escapeHtml(courses) +
              '</p><div class="card__actions">' +
              link +
              "</div></article>"
            );
          })
          .join("") +
        "</div>"
    );
  }

  function initFooterYear() {
    var yearEl = document.getElementById("footer-year");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  function initContactPlaceholder() {
    var form = document.getElementById("contact-placeholder-form");
    if (!form) {
      return;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initFooterYear();
    initContactPlaceholder();
    renderHome();
    renderCoursesPage();
    renderProgrammePage();
    renderProjectsPage();
    renderBlogPage();
    renderSkills();
    renderRoadmap();
    renderTimeline();
    renderResources();
  });
})();
