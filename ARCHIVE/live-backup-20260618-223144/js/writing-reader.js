/* Writing Samples — open a sample in an in-site reader overlay instead of
   navigating away to the old standalone page. Fetches the sample, lifts out
   the prose, and renders it in the brain's editorial style. Idempotent so the
   SPA can re-run it; all state hangs off the overlay element. */
(function () {
  function buildReader() {
    let wr = document.querySelector(".wr");
    if (wr) return wr;

    wr = document.createElement("div");
    wr.className = "wr";
    wr.setAttribute("aria-hidden", "true");
    wr.innerHTML =
      '<button class="wr__close" type="button" aria-label="Close">&#215;</button>' +
      '<button class="wr__arrow wr__prev" type="button" aria-label="Previous sample">&#8249;</button>' +
      '<div class="wr__scroll">' +
        '<article class="wr__doc">' +
          '<p class="wr__eyebrow"></p>' +
          '<h1 class="wr__title"></h1>' +
          '<p class="wr__sub"></p>' +
          '<p class="wr__deck"></p>' +
          '<div class="wr__rule"></div>' +
          '<div class="wr__body"></div>' +
          '<p class="wr__end">&#8226; &#8226; &#8226;</p>' +
        "</article>" +
      "</div>" +
      '<button class="wr__arrow wr__next" type="button" aria-label="Next sample">&#8250;</button>';
    document.body.appendChild(wr);

    const scroll = wr.querySelector(".wr__scroll");
    wr.__list = [];
    wr.__i = 0;
    wr.__cache = {};

    function text(doc, sel) { const el = doc.querySelector(sel); return el ? el.textContent.trim() : ""; }

    wr.show = async function (n) {
      const list = wr.__list;
      if (!list.length) return;
      wr.__i = (n + list.length) % list.length;
      const item = list[wr.__i];
      wr.classList.add("is-loading");
      let data = wr.__cache[item.href];
      if (!data) {
        try {
          const res = await fetch(item.href, { credentials: "same-origin" });
          const doc = new DOMParser().parseFromString(await res.text(), "text/html");
          const body = Array.from(doc.querySelectorAll(".folio-body")).map((b) => b.innerHTML).join("\n");
          data = {
            title: text(doc, ".sh-title") || item.title,
            sub: text(doc, ".sh-subtitle") || item.sub,
            deck: text(doc, ".sh-deck"),
            body: body || "<p>Sample unavailable.</p>",
          };
          wr.__cache[item.href] = data;
        } catch (e) {
          data = { title: item.title, sub: item.sub, deck: "", body: "<p>Sorry, this sample could not be loaded.</p>" };
        }
      }
      wr.querySelector(".wr__eyebrow").textContent = item.eyebrow || "Writing Sample";
      wr.querySelector(".wr__title").textContent = data.title;
      wr.querySelector(".wr__sub").textContent = data.sub;
      const deckEl = wr.querySelector(".wr__deck");
      deckEl.textContent = data.deck; deckEl.style.display = data.deck ? "" : "none";
      wr.querySelector(".wr__body").innerHTML = data.body;
      wr.classList.remove("is-loading");
      scroll.scrollTop = 0;
    };
    wr.open = function (href) {
      const idx = wr.__list.findIndex((x) => x.href === href);
      wr.show(idx < 0 ? 0 : idx);
      wr.classList.add("is-open");
      wr.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("wr-lock");
    };
    wr.close = function () {
      wr.classList.remove("is-open");
      wr.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("wr-lock");
    };

    wr.querySelector(".wr__close").addEventListener("click", wr.close);
    wr.querySelector(".wr__prev").addEventListener("click", (e) => { e.stopPropagation(); wr.show(wr.__i - 1); });
    wr.querySelector(".wr__next").addEventListener("click", (e) => { e.stopPropagation(); wr.show(wr.__i + 1); });
    wr.addEventListener("click", (e) => { if (e.target === wr || e.target === scroll) wr.close(); });
    document.addEventListener("keydown", (e) => {
      if (!wr.classList.contains("is-open")) return;
      if (e.key === "Escape") wr.close();
      else if (e.key === "ArrowRight") wr.show(wr.__i + 1);
      else if (e.key === "ArrowLeft") wr.show(wr.__i - 1);
    });
    return wr;
  }

  function init() {
    const cards = document.querySelectorAll(".sample-card");
    if (!cards.length) return;
    const wr = buildReader();

    wr.__list = Array.from(cards).map((c) => ({
      href: c.getAttribute("href"),
      eyebrow: (c.querySelector(".sc-eyebrow") || {}).textContent || "",
      title: (c.querySelector(".sc-title") || {}).textContent || "",
      sub: (c.querySelector(".sc-subtitle") || {}).textContent || "",
    }));

    cards.forEach((c) => {
      if (c.__wrBound) return;
      c.__wrBound = true;
      c.addEventListener("click", (e) => {
        e.preventDefault();
        wr.open(c.getAttribute("href"));
      });
    });
  }

  window.WritingReader = { init };
  if (document.querySelector(".sample-card")) init();
})();
