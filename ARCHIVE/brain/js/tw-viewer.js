/* tw-viewer.js — open a paper inside a floating in-site box (iframe), no nav away.
   Works for the local white papers and the external field notes (both allow
   framing). Idempotent for SPA re-init. */
(function () {
  function build() {
    let m = document.querySelector(".tw-modal");
    if (m) return m;
    m = document.createElement("div");
    m.className = "tw-modal";
    m.setAttribute("aria-hidden", "true");
    m.innerHTML =
      '<div class="tw-modal-box">' +
        '<div class="tw-modal-bar">' +
          '<span class="tw-modal-title"></span>' +
          '<a class="tw-modal-open" target="_blank" rel="noopener noreferrer" title="Open in new tab">&#8599;</a>' +
          '<button class="tw-modal-close" type="button" aria-label="Close">&#215;</button>' +
        "</div>" +
        '<div class="tw-modal-stage"><iframe class="tw-modal-frame" title="Paper" loading="lazy"></iframe></div>' +
      "</div>";
    document.body.appendChild(m);
    const frame = m.querySelector(".tw-modal-frame");
    const titleEl = m.querySelector(".tw-modal-title");
    const openEl = m.querySelector(".tw-modal-open");
    m.open = function (url, title) {
      titleEl.textContent = title || "";
      openEl.href = url;
      frame.src = url;
      m.classList.add("is-open");
      m.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("twm-lock");
    };
    m.close = function () {
      m.classList.remove("is-open");
      m.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("twm-lock");
      setTimeout(() => { if (!m.classList.contains("is-open")) frame.src = "about:blank"; }, 300);
    };
    m.querySelector(".tw-modal-close").addEventListener("click", m.close);
    m.addEventListener("click", (e) => { if (e.target === m) m.close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && m.classList.contains("is-open")) m.close(); });
    return m;
  }

  function init() {
    const grid = document.querySelector(".tw-grid");
    const hasSkill = document.querySelector("[data-skill-view]");
    if (!grid && !hasSkill) return;
    const m = build();

    if (grid && !grid.__twvBound) {
      grid.__twvBound = true;
      grid.addEventListener("click", (e) => {
        const card = e.target.closest(".tw-card");
        if (!card) return;
        const url = card.getAttribute("data-url") || card.getAttribute("href");
        if (!url) return;
        e.preventDefault();
        m.open(url, card.getAttribute("data-title") || "");
      });
    }

    // generic: any [data-skill-view] (or [data-tw-view]) element with data-url
    if (!document.__twvSkillBound) {
      document.__twvSkillBound = true;
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-skill-view],[data-tw-view]");
        if (!btn) return;
        const url = btn.getAttribute("data-url") || btn.getAttribute("href");
        if (!url) return;
        e.preventDefault();
        build().open(url, btn.getAttribute("data-title") || "");
      });
    }
  }

  window.TWViewer = { init };
  if (document.querySelector(".tw-grid") || document.querySelector("[data-skill-view]")) init();
})();
