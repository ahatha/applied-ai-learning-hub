/**
 * Shared footer year and light homepage programme summary refresh from JSON.
 */
(function () {
  "use strict";

  function D() {
    return window.AailhData;
  }

  function formatDisplayDate(iso) {
    if (!iso) {
      return "";
    }
    var parts = String(iso).split("-");
    if (parts.length !== 3) {
      return iso;
    }
    var months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    var month = months[Number(parts[1]) - 1] || parts[1];
    return Number(parts[2]) + " " + month + " " + parts[0];
  }

  async function refreshProgrammeSummary() {
    var dates = document.getElementById("programme-dates");
    var composition = document.getElementById("programme-composition");
    if (!dates && !composition) {
      return;
    }
    if (!window.AailhData) {
      return;
    }

    var programme = await D().loadJson("data/programme.json");
    if (!programme) {
      return;
    }

    var delivery = programme.delivery || {};
    if (dates) {
      dates.textContent =
        formatDisplayDate(programme.startDate) +
        " – " +
        formatDisplayDate(programme.endDate) +
        " · Distance, full-time, daytime · " +
        (delivery.language || "English");
    }

    if (composition && programme.totals) {
      var t = programme.totals;
      composition.innerHTML =
        '<div class="ects-row__item"><strong>' +
        D().escapeHtml(String(t.degreeEcts)) +
        "</strong><span>ECTS total</span></div>" +
        '<div class="ects-row__item"><strong>' +
        D().escapeHtml(String(t.compulsoryEcts)) +
        "</strong><span>compulsory</span></div>" +
        '<div class="ects-row__item"><strong>' +
        D().escapeHtml(String(t.electiveRequirementEcts)) +
        "</strong><span>elective</span></div>" +
        '<div class="ects-row__item"><strong>' +
        D().escapeHtml(String(t.thesisEcts)) +
        "</strong><span>thesis</span></div>";
    }
  }

  document.addEventListener("DOMContentLoaded", refreshProgrammeSummary);
})();
