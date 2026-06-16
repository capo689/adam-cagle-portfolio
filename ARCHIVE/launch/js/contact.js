/* Contact popover: close the <details.bar__contact> on outside-click or Esc.
   Opening/toggling is native <details>; this just handles dismissal. */
(function () {
  function closeAll(except) {
    document.querySelectorAll("details.bar__contact[open]").forEach((d) => {
      if (d !== except) d.removeAttribute("open");
    });
  }
  document.addEventListener("click", (e) => {
    const inside = e.target.closest("details.bar__contact");
    closeAll(inside);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll(null);
  });
})();
