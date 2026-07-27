/*  doubts.js
    Fetches doubts_log.md, extracts the section matching this lecture,
    and renders it into #doubts-placeholder.

    doubts_log.md format:
    ## lec1
    **Q:** your question here
    **A:** answer (optional — leave blank or omit if unanswered)

    ## lec2
    ...
*/

(function () {
  const placeholder = document.getElementById("doubts-placeholder");
  if (!placeholder) return;

  // derive lecture key from current filename: "lec3.html" → "lec3"
  const lecKey = location.pathname
    .split("/")
    .pop()
    .replace(/\.html$/, "")
    .toLowerCase();

  fetch("doubts_log.md")
    .then((r) => {
      if (!r.ok) throw new Error("doubts_log.md not found");
      return r.text();
    })
    .then((md) => {
      const entries = parseDoubts(md, lecKey);
      render(placeholder, entries, lecKey);
    })
    .catch(() => {
      // silently do nothing if file missing or no network — don't break the page
    });

  /* ── parser ─────────────────────────────────────────────────────── */

  function parseDoubts(md, key) {
    // split on ## headings, find ours
    const sections = md.split(/^## /m).slice(1); // drop content before first ##
    for (const section of sections) {
      const lines = section.split("\n");
      const heading = lines[0].trim().toLowerCase();
      if (heading !== key) continue;

      const body = lines.slice(1).join("\n").trim();
      if (!body) return [];

      // split into individual Q/A blocks — each starts with **Q:**
      const blocks = body
        .split(/(?=\*\*Q:\*\*)/)
        .map((b) => b.trim())
        .filter(Boolean);

      return blocks.map((block) => {
        const qMatch = block.match(/\*\*Q:\*\*\s*([\s\S]*?)(?=\*\*A:\*\*|$)/);
        const aMatch = block.match(/\*\*A:\*\*\s*([\s\S]*?)$/);
        return {
          q: qMatch ? qMatch[1].trim() : "",
          a: aMatch ? aMatch[1].trim() : "",
        };
      }).filter((e) => e.q);
    }
    return [];
  }

  /* ── renderer ────────────────────────────────────────────────────── */

  function render(el, entries, key) {
    // section label
    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = "doubts log";

    if (entries.length === 0) {
      el.appendChild(label);
      const empty = document.createElement("p");
      empty.style.color = "var(--muted)";
      empty.style.fontFamily = "'IBM Plex Mono', monospace";
      empty.style.fontSize = "13px";
      empty.textContent = "no doubts logged for this lecture yet.";
      el.appendChild(empty);
      return;
    }

    el.appendChild(label);

    entries.forEach((entry, i) => {
      const card = document.createElement("div");
      card.className = "callout";
      card.style.marginBottom = "12px";

      // question
      const qLine = document.createElement("p");
      qLine.style.marginBottom = entry.a ? "8px" : "0";
      const qLabel = document.createElement("strong");
      qLabel.textContent = `Q${i + 1}. `;
      qLine.appendChild(qLabel);
      qLine.appendChild(document.createTextNode(entry.q));
      card.appendChild(qLine);

      // answer (if present)
      if (entry.a) {
        const aLine = document.createElement("p");
        aLine.style.marginBottom = "0";
        aLine.style.borderTop = "1px solid var(--border)";
        aLine.style.paddingTop = "8px";
        aLine.style.marginTop = "4px";
        const aLabel = document.createElement("strong");
        aLabel.style.color = "var(--accent3)";
        aLabel.textContent = "A: ";
        aLine.appendChild(aLabel);
        aLine.appendChild(document.createTextNode(entry.a));
        card.appendChild(aLine);
      } else {
        const pending = document.createElement("span");
        pending.className = "tag tag-bad";
        pending.style.marginTop = "8px";
        pending.style.display = "inline-block";
        pending.textContent = "unanswered";
        card.appendChild(pending);
      }

      el.appendChild(card);
    });
  }
})();
