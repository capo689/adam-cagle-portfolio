/* Bear lineup at the foot of the Copywriting page — all 11 gummy bears in a
   row, shuffled fresh on every load. Idempotent so the SPA can re-run it. */
(function () {
  const COUNT = 11;
  function init() {
    document.querySelectorAll("[data-bear-lineup]").forEach((el) => {
      if (el.dataset.filled === "1") return;
      el.dataset.filled = "1";
      const nums = [];
      for (let i = 1; i <= COUNT; i++) nums.push(i);
      for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
      nums.forEach((n) => {
        const img = document.createElement("img");
        img.src = `/img/cd/bears/bear${n}.png`;
        img.alt = ""; img.setAttribute("aria-hidden", "true");
        img.loading = "lazy"; img.decoding = "async";
        el.appendChild(img);
      });
    });
  }
  window.CWBears = { init };
  if (document.querySelector("[data-bear-lineup]")) init();
})();
