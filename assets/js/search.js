/**
 * Client-side site search across JSON data files.
 */
(function () {
  "use strict";

  /**
   * @param {string} text
   * @param {string} query
   * @returns {string}
   */
  function highlight(text, query) {
    var escapeHtml = window.AailhData.escapeHtml;
    var safe = escapeHtml(text);
    if (!query) {
      return safe;
    }
    var pattern = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return safe.replace(new RegExp("(" + pattern + ")", "ig"), "<mark>$1</mark>");
  }

  /**
   * @returns {Promise<Array<{type:string,title:string,summary:string,url:string,meta:string}>>}
   */
  async function collectRecords() {
    var loadJson = window.AailhData.loadJson;
    var resolvePageLink = window.AailhData.resolvePageLink;
    var records = [];

    var courses = await loadJson("data/courses.json");
    if (courses && Array.isArray(courses.courses)) {
      courses.courses.forEach(function (course) {
        records.push({
          type: "Course",
          title: course.title,
          summary: course.summary || "",
          url: window.AailhData.courseHubUrl(course.code || course.id),
          meta: [course.code, course.myStatus, course.role].filter(Boolean).join(" · "),
          searchText: [course.title, course.code, course.summary, course.role, course.level].join(" ")
        });
      });
    }

    var projects = await loadJson("data/projects.json");
    if (projects && Array.isArray(projects.projects)) {
      projects.projects.forEach(function (project) {
        records.push({
          type: "Project",
          title: project.title,
          summary: project.summary || "",
          url: resolvePageLink(project.caseStudyUrl || "projects.html"),
          meta: [project.status, project.category].filter(Boolean).join(" · "),
          searchText: [project.title, project.summary, project.category, (project.skills || []).join(" ")].join(" ")
        });
      });
    }

    var posts = await loadJson("data/blog.json");
    if (posts && Array.isArray(posts.posts)) {
      posts.posts.forEach(function (post) {
        records.push({
          type: "Blog",
          title: post.title,
          summary: post.summary || "",
          url: resolvePageLink(post.url || "blog.html"),
          meta: [post.category, post.published].filter(Boolean).join(" · "),
          searchText: [post.title, post.summary, post.category, (post.tags || []).join(" ")].join(" ")
        });
      });
    }

    var skills = await loadJson("data/skills.json");
    if (skills && Array.isArray(skills.groups)) {
      skills.groups.forEach(function (group) {
        (group.skills || []).forEach(function (skill) {
          records.push({
            type: "Skill",
            title: skill.name,
            summary: group.title + " — " + skill.level,
            url: resolvePageLink("about.html#skills"),
            meta: skill.level,
            searchText: [skill.name, skill.level, group.title].join(" ")
          });
        });
      });
    }

    var resources = await loadJson("data/course-resources.json");
    if (resources && Array.isArray(resources.resources)) {
      resources.resources.forEach(function (resource) {
        records.push({
          type: "Resource",
          title: resource.title,
          summary: resource.description || "",
          url: resource.url || resolvePageLink("resources.html"),
          meta: [(resource.courseIds || []).join(", "), resource.provider].filter(Boolean).join(" · "),
          searchText: [resource.title, resource.description, (resource.courseIds || []).join(" "), resource.provider].join(" ")
        });
      });
    }

    return records;
  }

  async function initSearchPage() {
    var form = document.getElementById("site-search-form");
    var input = document.getElementById("site-search-input");
    var clearBtn = document.getElementById("site-search-clear");
    var results = document.getElementById("site-search-results");
    var meta = document.getElementById("site-search-meta");
    if (!form || !input || !results) {
      return;
    }

    var records = await collectRecords();

    function render(query) {
      var q = query.trim();
      var matches = records.filter(function (record) {
        return window.AailhFilters.includesText(record.searchText, q);
      });

      if (meta) {
        meta.textContent = q
          ? matches.length + " result" + (matches.length === 1 ? "" : "s") + " for “" + q + "”"
          : "Enter a search term to look across courses, projects, posts, skills, and resources.";
      }

      if (!q) {
        results.innerHTML = '<div class="empty-state"><p>Start typing to search the learning hub.</p></div>';
        return;
      }

      if (matches.length === 0) {
        results.innerHTML =
          '<div class="empty-state"><p>No matches found. Try a broader term such as “Python”, “roadmap”, or “clustering”.</p></div>';
        return;
      }

      results.innerHTML =
        '<div class="card-grid">' +
        matches
          .map(function (item) {
            var external = /^https?:\/\//i.test(item.url);
            return (
              '<article class="card search-hit">' +
              '<div class="card__meta"><span class="badge">' +
              window.AailhData.escapeHtml(item.type) +
              "</span></div>" +
              "<h3>" +
              highlight(item.title, q) +
              "</h3>" +
              "<p>" +
              highlight(item.summary, q) +
              "</p>" +
              (item.meta ? '<p class="card__meta">' + window.AailhData.escapeHtml(item.meta) + "</p>" : "") +
              '<div class="card__actions"><a href="' +
              window.AailhData.escapeHtml(item.url) +
              '"' +
              (external ? ' rel="noopener noreferrer" target="_blank"' : "") +
              ">Open</a></div></article>"
            );
          })
          .join("") +
        "</div>";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      render(input.value);
    });

    input.addEventListener("input", function () {
      render(input.value);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        input.focus();
        render("");
      });
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (initial) {
      input.value = initial;
      render(initial);
    } else {
      render("");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSearchPage();
  });
})();
