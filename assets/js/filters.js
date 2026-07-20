/**
 * Filtering and sorting helpers for catalogue pages.
 */
(function () {
  "use strict";

  /**
   * @template T
   * @param {T[]} items
   * @param {(item: T) => boolean} predicate
   * @returns {T[]}
   */
  function filterItems(items, predicate) {
    return items.filter(predicate);
  }

  /**
   * Case-insensitive includes check.
   * @param {unknown} haystack
   * @param {string} needle
   * @returns {boolean}
   */
  function includesText(haystack, needle) {
    if (!needle) {
      return true;
    }
    return String(haystack || "")
      .toLowerCase()
      .includes(needle.toLowerCase());
  }

  /**
   * @param {Record<string, unknown>} item
   * @param {string} query
   * @param {string[]} fields
   * @returns {boolean}
   */
  function matchesQuery(item, query, fields) {
    if (!query) {
      return true;
    }
    return fields.some(function (field) {
      var value = item[field];
      if (Array.isArray(value)) {
        return value.some(function (entry) {
          return includesText(entry, query);
        });
      }
      return includesText(value, query);
    });
  }

  /**
   * @template T
   * @param {T[]} items
   * @param {(a: T, b: T) => number} compare
   * @returns {T[]}
   */
  function sortItems(items, compare) {
    return items.slice().sort(compare);
  }

  /**
   * Populate a select with unique sorted values.
   * @param {HTMLSelectElement|null} select
   * @param {string[]} values
   * @param {string} allLabel
   */
  function fillSelect(select, values, allLabel) {
    if (!select) {
      return;
    }
    var unique = Array.from(new Set(values.filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b);
    });
    select.innerHTML = "";
    var all = document.createElement("option");
    all.value = "";
    all.textContent = allLabel;
    select.appendChild(all);
    unique.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  window.AailhFilters = {
    filterItems: filterItems,
    includesText: includesText,
    matchesQuery: matchesQuery,
    sortItems: sortItems,
    fillSelect: fillSelect
  };
})();
