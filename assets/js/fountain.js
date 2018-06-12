// Minimal Fountain (https://fountain.io) -> HTML renderer for the screenplay page.
// Supports: title page, scene headings, action, character/dialogue/parentheticals,
// transitions, centered text, *italics*, **bold**, _underline_.
(function (root) {
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/(^|[^\w])_(.+?)_(?=[^\w]|$)/g, "$1<u>$2</u>");
  }
  const SCENE = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[. ]/i;
  const TRANSITION = /^(FADE (IN|OUT)[:.]?|CUT TO BLACK[.:]?|[A-Z ]+ TO:)$/;
  const CENTERED = /^(TO BE CONTINUED|THE END)\.*$/;

  function isUpper(line) {
    const bare = line.replace(/\(.*?\)/g, "").trim();
    return bare.length > 0 && bare === bare.toUpperCase() && /[A-Z]/.test(bare);
  }

  function parseTitlePage(blocks) {
    const first = blocks[0] || [];
    if (!first.length || !first.every((l) => /^[A-Za-z ]+:/.test(l) || /^\s/.test(l))) return null;
    blocks.shift();
    const fields = {};
    first.forEach((l) => {
      const m = l.match(/^([A-Za-z ]+):\s*(.*)$/);
      if (m) fields[m[1].trim().toLowerCase()] = m[2];
    });
    return fields;
  }

  function fountainToHtml(text) {
    const blocks = text
      .replace(/\r\n?/g, "\n")
      .split(/\n{2,}/)
      .map((b) => b.split("\n").filter((l) => l.trim() !== ""))
      .filter((b) => b.length);
    const tp = parseTitlePage(blocks);
    let out = "";
    if (tp) {
      out += '<div class="sp-title-page">';
      if (tp.title) out += '<h1 class="sp-title">' + inline(tp.title) + "</h1>";
      if (tp.credit) out += '<p class="sp-credit">' + inline(tp.credit) + "</p>";
      if (tp.author) out += '<p class="sp-author">' + inline(tp.author) + "</p>";
      if (tp["draft date"]) out += '<p class="sp-date">' + inline(tp["draft date"]) + "</p>";
      out += "</div>";
    }
    blocks.forEach((b) => {
      const first = b[0].trim();
      if (SCENE.test(first)) {
        out += '<h3 class="sp-scene">' + inline(first) + "</h3>";
      } else if (CENTERED.test(first)) {
        out += '<p class="sp-center">' + inline(first) + "</p>";
      } else if (b.length === 1 && TRANSITION.test(first)) {
        out += '<p class="sp-transition">' + inline(first) + "</p>";
      } else if (b.length > 1 && isUpper(first) && !/[a-z]{2,}/.test(first.replace(/\(.*?\)/g, ""))) {
        out += '<div class="sp-dialogue"><p class="sp-character">' + inline(first) + "</p>";
        b.slice(1).forEach((l) => {
          const t = l.trim();
          out += t.startsWith("(")
            ? '<p class="sp-paren">' + inline(t) + "</p>"
            : '<p class="sp-line">' + inline(t) + "</p>";
        });
        out += "</div>";
      } else {
        out += '<p class="sp-action">' + b.map((l) => inline(l.trim())).join("<br>") + "</p>";
      }
    });
    return out;
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { fountainToHtml };
  else root.fountainToHtml = fountainToHtml;
})(typeof window !== "undefined" ? window : this);
