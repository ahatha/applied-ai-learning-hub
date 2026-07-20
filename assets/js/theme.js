/**
 * Theme handling: system preference, manual override, localStorage.
 * Include a tiny blocking snippet in <head> to prevent flash (see site-chrome comments).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "aailh-theme";

  /**
   * @returns {"light"|"dark"|null}
   */
  function getStoredTheme() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * @returns {"light"|"dark"}
   */
  function getPreferredTheme() {
    var stored = getStoredTheme();
    if (stored) {
      return stored;
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  /**
   * @param {"light"|"dark"} theme
   * @param {boolean} [persist]
   */
  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
      var next = theme === "dark" ? "light" : "dark";
      toggle.setAttribute("aria-label", "Switch to " + next + " mode");
      toggle.setAttribute("title", "Switch to " + next + " mode");
    }
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (error) {
        /* localStorage unavailable */
      }
    }
  }

  function initThemeToggle() {
    var toggle = document.getElementById("theme-toggle");
    if (!toggle) {
      return;
    }
    toggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(current === "dark" ? "light" : "dark", true);
    });
  }

  function watchSystemPreference() {
    if (!window.matchMedia) {
      return;
    }
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    var handler = function () {
      if (!getStoredTheme()) {
        applyTheme(getPreferredTheme(), false);
      }
    };
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
    } else if (typeof media.addListener === "function") {
      media.addListener(handler);
    }
  }

  applyTheme(getPreferredTheme(), false);
  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(getPreferredTheme(), false);
    initThemeToggle();
    watchSystemPreference();
  });

  window.AailhTheme = {
    applyTheme: applyTheme,
    getPreferredTheme: getPreferredTheme
  };
})();
