(function () {
  function defaultLessons(homeHref, courseCode) {
    return [
      { id: "home", href: homeHref, label: courseCode },
      { id: "lesson1", href: "lesson1.html", label: "Lesson 1" },
      { id: "lesson2", href: "lesson2.html", label: "Lesson 2" },
      { id: "lesson3", href: "lesson3.html", label: "Lesson 3" }
    ];
  }

  function renderNav() {
    var host = document.getElementById("lesson-nav");
    if (!host) return;

    var active = host.getAttribute("data-active") || "lesson1";
    var homeHref = host.getAttribute("data-home-href") || "../index.html";
    var courseCode = host.getAttribute("data-course") || "Course";
    var lessons;

    try {
      lessons = host.hasAttribute("data-lessons")
        ? JSON.parse(host.getAttribute("data-lessons"))
        : defaultLessons(homeHref, courseCode);
    } catch (e) {
      lessons = defaultLessons(homeHref, courseCode);
    }

    var html = '<div class="lesson-subnav__inner">';

    lessons.forEach(function (item) {
      var cls = item.id === active ? "active" : "";
      if (item.id === "home") {
        cls = (cls + " lesson-subnav__home").trim();
      }
      html += '<a class="' + cls + '" href="' + item.href + '">' + item.label + "</a>";
    });

    html += "</div>";
    host.innerHTML = html;
    host.classList.add("lesson-subnav");
  }

  document.addEventListener("DOMContentLoaded", renderNav);
})();
