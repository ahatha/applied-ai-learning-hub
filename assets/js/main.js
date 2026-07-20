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
        '<a href="' + escapeHtml(project.demoUrl) + '" rel="noopener noreferrer" target="_blank">Live demo</a>'
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
    var resolvePageLink = D().resolvePageLink;
    var ects = course.ects == null ? "To be confirmed" : course.ects + " ECTS";
    var notes =
      course.publicNotesUrl
        ? '<a href="' + escapeHtml(resolvePageLink(course.publicNotesUrl)) + '">Public notes</a>'
        : "";
    var official =
      course.officialUrl
        ? '<a href="' +
          escapeHtml(course.officialUrl) +
          '" rel="noopener noreferrer" target="_blank">Official syllabus</a>'
        : '<span>Official syllabus: to be added</span>';

    return (
      '<article class="card" data-course-id="' +
      escapeHtml(course.id) +
      '">' +
      '<div class="card__meta">' +
      D().statusBadge(course.status) +
      '<span class="badge">' +
      escapeHtml(course.category || "Course") +
      "</span>" +
      "</div>" +
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
      "<div><dt>Period</dt><dd>" +
      escapeHtml(course.semester || "—") +
      "</dd></div>" +
      "<div><dt>Year</dt><dd>" +
      escapeHtml(course.academicYear || "—") +
      "</dd></div>" +
      "<div><dt>Extent</dt><dd>" +
      escapeHtml(ects) +
      "</dd></div>" +
      "</dl>" +
      D().tagList(course.skills || []) +
      '<div class="card__actions">' +
      notes +
      official +
      "</div>" +
      '<p class="card__meta">Updated ' +
      escapeHtml(course.lastUpdated || "—") +
      "</p>" +
      "</article>"
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
    var areasEl = document.getElementById("featured-areas");
    var projectsEl = document.getElementById("featured-projects");
    var postsEl = document.getElementById("latest-posts");
    if (!areasEl && !projectsEl && !postsEl) {
      return;
    }

    if (areasEl) {
      var areasData = await D().loadJson("data/learning-areas.json");
      if (!areasData || !areasData.areas) {
        setHtml(areasEl, '<div class="empty-state"><p>Learning areas will appear here once data is available.</p></div>');
      } else {
        setHtml(
          areasEl,
          '<div class="card-grid">' +
            areasData.areas
              .map(function (area) {
                return (
                  '<article class="card"><div class="card__meta">' +
                  D().statusBadge(area.status) +
                  "</div><h3>" +
                  D().escapeHtml(area.title) +
                  "</h3><p>" +
                  D().escapeHtml(area.summary) +
                  "</p></article>"
                );
              })
              .join("") +
            "</div>"
        );
      }
    }

    if (projectsEl) {
      var projectsData = await D().loadJson("data/projects.json");
      var featured = (projectsData && projectsData.projects ? projectsData.projects : [])
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
    var list = document.getElementById("courses-list");
    if (!list) {
      return;
    }

    var data = await D().loadJson("data/courses.json");
    var courses = data && Array.isArray(data.courses) ? data.courses : [];
    var search = document.getElementById("course-search");
    var year = document.getElementById("course-year");
    var semester = document.getElementById("course-semester");
    var status = document.getElementById("course-status");
    var category = document.getElementById("course-category");
    var sort = document.getElementById("course-sort");
    var meta = document.getElementById("courses-meta");

    F().fillSelect(
      year,
      courses.map(function (c) {
        return c.academicYear;
      }),
      "All years"
    );
    F().fillSelect(
      semester,
      courses.map(function (c) {
        return c.semester;
      }),
      "All semesters"
    );
    F().fillSelect(
      status,
      courses.map(function (c) {
        return c.status;
      }),
      "All statuses"
    );
    F().fillSelect(
      category,
      courses.map(function (c) {
        return c.category;
      }),
      "All subjects"
    );

    function apply() {
      var query = search ? search.value.trim() : "";
      var filtered = courses.filter(function (course) {
        return (
          (!year || !year.value || course.academicYear === year.value) &&
          (!semester || !semester.value || course.semester === semester.value) &&
          (!status || !status.value || course.status === status.value) &&
          (!category || !category.value || course.category === category.value) &&
          F().matchesQuery(course, query, ["title", "code", "summary", "category", "skills"])
        );
      });

      var sortValue = sort ? sort.value : "order";
      filtered = F().sortItems(filtered, function (a, b) {
        if (sortValue === "title") {
          return a.title.localeCompare(b.title);
        }
        if (sortValue === "status") {
          return String(a.status).localeCompare(String(b.status));
        }
        if (sortValue === "ects") {
          return (a.ects || 0) - (b.ects || 0);
        }
        if (sortValue === "updated") {
          return String(b.lastUpdated || "").localeCompare(String(a.lastUpdated || ""));
        }
        return (a.order || 0) - (b.order || 0);
      });

      if (meta) {
        meta.textContent = filtered.length + " course" + (filtered.length === 1 ? "" : "s") + " shown";
      }

      if (filtered.length === 0) {
        setHtml(list, '<div class="empty-state"><p>No courses match the current filters.</p></div>');
        return;
      }
      setHtml(list, '<div class="card-grid">' + filtered.map(courseCard).join("") + "</div>");
    }

    [search, year, semester, status, category, sort].forEach(function (el) {
      if (!el) {
        return;
      }
      el.addEventListener("input", apply);
      el.addEventListener("change", apply);
    });

    apply();
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
        meta.textContent = filtered.length + " project" + (filtered.length === 1 ? "" : "s") + " shown";
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
    var data = await D().loadJson("data/resources.json");
    var resources = data && Array.isArray(data.resources) ? data.resources : [];
    if (resources.length === 0) {
      setHtml(host, '<div class="empty-state"><p>Resources will appear here after curation.</p></div>');
      return;
    }
    setHtml(
      host,
      '<div class="card-grid">' +
        resources
          .map(function (resource) {
            var link = resource.url
              ? '<a href="' +
                D().escapeHtml(resource.url) +
                '" rel="noopener noreferrer" target="_blank">Open resource</a>'
              : "<span>Link to be verified</span>";
            return (
              '<article class="card"><div class="card__meta">' +
              D().statusBadge(resource.status) +
              '<span class="badge">' +
              D().escapeHtml(resource.category) +
              "</span></div><h3>" +
              D().escapeHtml(resource.title) +
              "</h3><p>" +
              D().escapeHtml(resource.description) +
              "</p><p><strong>" +
              D().escapeHtml(resource.provider) +
              "</strong> · " +
              D().escapeHtml(resource.cost) +
              " · " +
              D().escapeHtml(resource.difficulty) +
              "</p><p>" +
              D().escapeHtml(resource.personalNote || "") +
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
    renderProjectsPage();
    renderBlogPage();
    renderSkills();
    renderRoadmap();
    renderTimeline();
    renderResources();
  });
})();
