(function () {
  const cards = Array.from(document.querySelectorAll(".video-card"));

  cards.forEach((card) => {
    const video = card.querySelector("video");
    const preview = card.querySelector(".video-preview");

    preview.addEventListener("click", () => {
      cards.forEach((otherCard) => {
        const otherVideo = otherCard.querySelector("video");
        if (otherVideo !== video && !otherVideo.paused) otherVideo.pause();
      });

      preview.classList.add("is-hidden");
      video.play().catch(() => {
        preview.classList.remove("is-hidden");
      });
    });

    video.addEventListener("ended", () => preview.classList.remove("is-hidden"));
  });
})();
