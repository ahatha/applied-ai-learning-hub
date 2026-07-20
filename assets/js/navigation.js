/**
 * Accessible sticky navigation with mobile menu behaviour.
 */
(function () {
  "use strict";

  function markCurrentNav() {
    var path = window.location.pathname.replace(/\\/g, "/");
    var file = path.split("/").pop() || "index.html";
    if (file === "" || file === "/") {
      file = "index.html";
    }

    document.querySelectorAll("[data-nav]").forEach(function (link) {
      var target = link.getAttribute("data-nav");
      var href = link.getAttribute("href") || "";
      var hrefFile = href.split("?")[0].split("/").pop();
      var match =
        target === "index.html" &&
        (file === "index.html" || file === "" || path.indexOf("/courses/") === -1);

      if (file === "index.html" && (hrefFile === "index.html" || target === "index.html")) {
        match = true;
      } else if (path.indexOf("/courses/") !== -1 || path.indexOf("/projects/") !== -1) {
        match = false;
      }

      if (match) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function initMobileNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) {
      return;
    }

    function setOpen(isOpen) {
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      nav.classList.toggle("is-open", isOpen);
      document.body.classList.toggle("nav-open", isOpen);
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) {
        return;
      }
      var target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!nav.contains(target) && !toggle.contains(target)) {
        setOpen(false);
      }
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    markCurrentNav();
    initMobileNav();
  });
})();
