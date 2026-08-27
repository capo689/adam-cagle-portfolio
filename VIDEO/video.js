(function () {
  const videos = Array.from(document.querySelectorAll(".film video"));

  videos.forEach((video) => {
    video.addEventListener("play", () => {
      videos.forEach((other) => {
        if (other !== video && !other.paused) other.pause();
      });
    });
  });
})();
