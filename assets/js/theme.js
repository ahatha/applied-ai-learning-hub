/**
 * Theme + typeface preferences: system/manual theme, font pack trial, localStorage.
 * Include a tiny blocking snippet in <head> to prevent flash (theme + font).
 */
(function () {
  "use strict";

  var THEME_KEY = "aailh-theme";
  var FONT_KEY = "aailh-font";
  var FONT_IDS = ["plex", "literata", "lora", "newsreader"];
  var FONT_OPTIONS = [
    { id: "plex", label: "Classic (Plex)" },
    { id: "literata", label: "Literata" },
    { id: "lora", label: "Lora" },
    { id: "newsreader", label: "Newsreader" }
  ];
  var FONT_STYLESHEETS = {
    plex:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap",
    literata:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600;7..72,700&family=Source+Sans+3:wght@400;500;600;700&display=swap",
    lora:
      "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Lora:wght@400;500;600;700&display=swap",
    newsreader:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600;6..72,700&display=swap"
  };

  /**
   * @returns {"light"|"dark"|null}
   */
  function getStoredTheme() {
    try {
      var value = localStorage.getItem(THEME_KEY);
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
   * @returns {string}
   */
  function getStoredFont() {
    try {
      var value = localStorage.getItem(FONT_KEY);
      return FONT_IDS.indexOf(value) !== -1 ? value : "plex";
    } catch (error) {
      return "plex";
    }
  }

  /**
   * @param {string} fontId
   */
  function ensureFontStylesheet(fontId) {
    var href = FONT_STYLESHEETS[fontId] || FONT_STYLESHEETS.plex;
    var link = document.getElementById("aailh-font-stylesheet");
    if (!link) {
      link = document.createElement("link");
      link.id = "aailh-font-stylesheet";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) {
      link.setAttribute("href", href);
    }
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
        localStorage.setItem(THEME_KEY, theme);
      } catch (error) {
        /* localStorage unavailable */
      }
    }
  }

  /**
   * @param {string} fontId
   * @param {boolean} [persist]
   */
  function applyFont(fontId, persist) {
    var id = FONT_IDS.indexOf(fontId) !== -1 ? fontId : "plex";
    document.documentElement.setAttribute("data-font", id);
    ensureFontStylesheet(id);
    var select = document.getElementById("font-select");
    if (select && select.value !== id) {
      select.value = id;
    }
    if (persist) {
      try {
        localStorage.setItem(FONT_KEY, id);
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

  function initFontSelect() {
    var toggle = document.getElementById("theme-toggle");
    if (!toggle || !toggle.parentNode) {
      return;
    }
    if (document.getElementById("font-select")) {
      return;
    }

    var wrap = document.createElement("div");
    wrap.className = "header-controls";

    var select = document.createElement("select");
    select.id = "font-select";
    select.className = "font-select";
    select.setAttribute("aria-label", "Choose typeface");
    select.setAttribute("title", "Choose typeface");

    FONT_OPTIONS.forEach(function (option) {
      var el = document.createElement("option");
      el.value = option.id;
      el.textContent = option.label;
      select.appendChild(el);
    });

    select.value = getStoredFont();
    select.addEventListener("change", function () {
      applyFont(select.value, true);
    });

    toggle.parentNode.insertBefore(wrap, toggle);
    wrap.appendChild(select);
    wrap.appendChild(toggle);
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
  applyFont(getStoredFont(), false);

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(getPreferredTheme(), false);
    applyFont(getStoredFont(), false);
    initFontSelect();
    initThemeToggle();
    watchSystemPreference();
  });

  window.AailhTheme = {
    applyTheme: applyTheme,
    getPreferredTheme: getPreferredTheme,
    applyFont: applyFont,
    getStoredFont: getStoredFont
  };
})();
