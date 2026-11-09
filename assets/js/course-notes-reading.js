(function () {
  var READINGS = {
    "theory-1": {
      title: "Reading for Theory 1",
      chapters: [
        {
          read: "Read Chapter <strong>Logical Agents (7)</strong> of the course book",
          understand: [
            "Differences between propositional and first-order logic",
            "What is CNF in the propositional logic, exemplify construction",
            "Definition of model, predicates",
            "Total number of models for given numbers of propositions",
            "Exemplify conversion of propositional logic sentences to clausal form"
          ]
        },
        {
          read: "Read Chapter <strong>First-Order Logic (8)</strong> of the course book",
          understand: [
            "Differences between propositional and first-order logic",
            "Exemplify statements in the First Order Logic",
            "Syntax of FOL statements",
            "Validity of FOL statements"
          ]
        }
      ]
    },
    "theory-2": {
      title: "Reading for Theory 2",
      chapters: [
        {
          read: "Read Chapter <strong>Knowledge Representation (12)</strong> of the course book",
          understand: [
            "representing Events, Time, Physical objects, Beliefs",
            "ontology - different types",
            "methods of construction of ontologies",
            "reification",
            "subcategory, inheritance",
            "taxonomy",
            "exhaustive decomposition",
            "partition",
            "logical minimization",
            "measure",
            "things and stuff",
            "event calculus",
            "liquid event",
            "representing time intervals",
            "fluents and objects",
            "mental events and mental objects",
            "semantic networks",
            "description logic",
            "default logic",
            "truth maintenance"
          ]
        }
      ]
    }
  };

  function listHtml(items) {
    return (
      "<ul>" +
      items
        .map(function (item) {
          return "<li>" + item + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function blockHtml(key, data) {
    var chapters = data.chapters
      .map(function (chapter) {
        return (
          '<div class="reading-block__chapter">' +
          '<p class="reading-block__read">' +
          chapter.read +
          "</p>" +
          '<p class="reading-block__understand-label">Understand:</p>' +
          listHtml(chapter.understand) +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="reading-rail__head">' +
      '<p class="reading-rail__eyebrow"><i class="fa-solid fa-book" aria-hidden="true"></i> Course book</p>' +
      "<h2>Reading</h2>" +
      "</div>" +
      '<section class="reading-block" aria-labelledby="lesson-reading-title">' +
      '<h3 id="lesson-reading-title">' +
      data.title +
      "</h3>" +
      chapters +
      "</section>"
    );
  }

  function renderReading() {
    var host = document.getElementById("lesson-reading");
    if (!host) return;

    var key = host.getAttribute("data-reading") || "";
    var data = READINGS[key];
    if (!data) return;

    host.classList.add("reading-rail", "reading-rail--lesson");
    host.setAttribute("aria-label", data.title);
    host.innerHTML = blockHtml(key, data);

    var layout = host.closest(".layout");
    if (layout) layout.classList.add("layout--with-reading");
  }

  document.addEventListener("DOMContentLoaded", renderReading);
})();
